import bodyParser from 'body-parser';
import express from 'express';
import Jimp from 'jimp';

const app = express()

app.use(bodyParser.json());

app.get('/version', (req: express.Request, res: express.Response) => {
  res.contentType('application/json')
  res.send({ version: '1.0.0' })
})

app.post(
  '/smallify',
  async (req: express.Request, res: express.Response) => {
    const { mediaURL } = req.body;
    console.log(`Got Media: ${mediaURL}`);

    const newImage = await Jimp.read(mediaURL).then(image => image.quality(25))

    const filepath = '/tmp/' + new Date().getTime() + '.jpg';
    await newImage.writeAsync(filepath);

    console.log(filepath);

    res.contentType('application/json');
    res.send({
      photoURL: filepath,
    });
  },
)

app.listen(3000)
