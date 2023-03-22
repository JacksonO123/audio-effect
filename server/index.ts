import fs from 'fs';
// @ts-ignore
import { AudioContext } from 'web-audio-api';
import express from 'express';
import cors from 'cors';
const context = new AudioContext();
const app = express();
const port = process.env.PORT || 8080;

type ResType = {
  pcmData: number[];
  sampleRate: number;
  duration: number;
  length: number;
};

const decodeSoundFile = async (soundFileName: string) => {
  let pcmData: number[] = [];
  let sampleRate: number = 0;
  let duration: number = 0;
  let length: number = 0;

  const buf = fs.readFileSync(soundFileName);
  return new Promise<ResType>((resolve) => {
    context.decodeAudioData(buf, (audioBuffer: any) => {
      pcmData = Object.values(audioBuffer.getChannelData(0));
      sampleRate = audioBuffer.sampleRate;
      duration = audioBuffer.duration;
      length = audioBuffer.length;
      resolve({
        pcmData,
        sampleRate,
        duration,
        length
      });
    });
  });
};

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cors());

app.post('/get-audio-data', async (req, res) => {
  type BodyType = {
    filename: string;
  };
  const body = req.body as BodyType;
  const path = `audio/${body.filename}`;
  type AudioData = ResType & { max: number };
  const info = (await decodeSoundFile(path)) as AudioData;
  const max = info.pcmData.reduce((prev, curr) => (curr > prev ? curr : prev), 0);
  info.max = max;
  res.end(JSON.stringify(info));
});

app.get('/get-audio-file/:filename', (req, res) => {
  type ParamsType = {
    filename: string;
  };
  const params = req.params as ParamsType;
  res.contentType('application/mp3');
  res.end(fs.readFileSync(`audio/${params.filename}`));
});

app.get('/get-filenames', (req, res) => {
  const filenames = fs.readdirSync('audio');
  const data = {
    filenames
  };
  res.contentType('application/json');
  res.end(JSON.stringify(data));
});

app.post('/add-song', (req, res) => {
  type ReqBodyType = {
    name: string;
    data: string;
  };
  const data = req.body as ReqBodyType;
  const ext = data.name.split('.')[1];
  if (!ext || ext !== 'mp3') {
    res.end();
  }
  fs.writeFileSync(`audio/${data.name}`, data.data);
  res.end();
});

app.get('*', (req, res) => {
  res.end('404 amongus');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
