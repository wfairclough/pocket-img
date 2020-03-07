import { Storage } from '@google-cloud/storage';
import bodyParser from 'body-parser';
import express from 'express';
import Jimp from 'jimp';
import morgan from 'morgan';
import nanoid from 'nanoid';
import { extname } from 'path';

function envOrElse(name: string, defaultValue: string): string {
  const value = process.env[name]
  if (!value) {
    return defaultValue
  }
  return value;
}

function envOrThrow(name: string): string {
  const value = envOrElse(name, '')
  if (!value) {
    throw new Error(`Must set env variable ${name}`)
  }
  return value
}

const FIFTEEN_MINS = 15 * 60 * 1000;
const PROJECT_ID = envOrThrow('GCP_PROJECT_ID')
const PORT = parseInt(envOrElse('PORT', '3000'), 10)
const GCP_BUCKET = envOrThrow('GCP_BUCKET')
const GCP_BUCKET_REGION = envOrThrow('GCP_BUCKET_REGION')
const GCP_CREDENTIALS_B64 = envOrElse('GCP_CREDENTIALS_B64', '')
const GCP_CREDENTIALS_JSON = GCP_CREDENTIALS_B64 ? Buffer.from(GCP_CREDENTIALS_B64.trim(), 'base64').toString() : undefined
const GCP_CREDENTIALS = GCP_CREDENTIALS_JSON ? JSON.parse(GCP_CREDENTIALS_JSON) : undefined

const storage = new Storage({
  projectId: PROJECT_ID,
  credentials: GCP_CREDENTIALS,
});

const delay: (ms: number) => Promise<any> = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function writeDataToStorage(filename: string, mimeType: string, data: Buffer): Promise<string> {
  console.log(`Writing ${mimeType} '${filename}' to bucket: ${GCP_BUCKET}`)
  const bucket = storage.bucket(GCP_BUCKET)
  const file = bucket.file(filename)
  const stream = file.createWriteStream({
    metadata: mimeType ? { contentType: mimeType } : undefined,
  })

  const getPublicUrl = () => {
    return `https://storage.googleapis.com/${GCP_BUCKET}/${filename}`;
  };

  return new Promise<string>((resolve, reject) => {
    stream.on('finish', () => {
      console.log(`File written to storage`)
      function trySignedFile(retries: number = 1): Promise<string> {
        if (retries > 7) {
          return Promise.reject(new Error('Too many attempts to get signed url'));
        }
        return file.makePublic()
          .then(getPublicUrl)
          .catch(err => {
            console.error(err.message, err)
            return delay(retries * 500).then(() => trySignedFile(++retries))
          })
      };
      return trySignedFile().then(resolve).catch(reject);
    })

    stream.on('error', reject)

    stream.end(data)
  })
}

const app = express()

app.use(bodyParser.json())
app.use(express.static('public'))
app.use(morgan('short'))

app.get('/version', (req: express.Request, res: express.Response) => {
  res.contentType('application/json')
  res.send({ version: '1.0.0' })
})

app.post(
  '/smallify',
  async (req: express.Request, res: express.Response) => {
    try {
      const { mediaURL, quality, mimeType } = {
        quality: 25,
        mimeType: 'image/jpeg',
        ...req.body
      } as any;
      console.log(`Got Media: ${mediaURL}`)

      const ext = extname(mediaURL)
      const filename = nanoid(16) + (ext || '')
      const newImage = await Jimp.read(mediaURL).then(image => image.quality(quality || 25))

      const imgBuffer = await newImage.getBufferAsync(mimeType)
      console.log(`Compressed Image`);
      const url = await writeDataToStorage(filename, mimeType, imgBuffer)

      console.log(`New Photo Uploaded: ${url}`)

      res.json({
        photoURL: url,
      })
    } catch (err) {
      console.error(`pocket-img: Internal Server Error`, err)
      res.status(500).json({
        message: err.message,
        stack: err.stack,
      })
    }
  },
)

console.log(`Starting pocket-img on port ${PORT}`)
app.listen(PORT)
