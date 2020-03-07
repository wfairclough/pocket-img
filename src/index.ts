import bodyParser from 'body-parser';
import express from 'express';
import Jimp from 'jimp';
import morgan from 'morgan';
import { basename, join } from 'path';
import { resolve } from 'url';

const BASE_URL = process.env.BASE_URL || (() => { throw new Error('Must set BASE_URL env variable') })()

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
    const { mediaURL, quality } = req.body;
    console.log(`Got Media: ${mediaURL}`);

    const newImage = await Jimp.read(mediaURL).then(image => image.quality(quality || 25))

    const filename = basename(mediaURL)
    const filepath = join('public', filename)

    await newImage.writeAsync(filepath);

    console.log(filepath)

    res.json({
      photoURL: resolve(BASE_URL, filename),
    });
  },
)

app.listen(3000)
