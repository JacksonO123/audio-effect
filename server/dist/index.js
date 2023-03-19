"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
// @ts-ignore
const web_audio_api_1 = require("web-audio-api");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const context = new web_audio_api_1.AudioContext();
const app = (0, express_1.default)();
const port = process.env.PORT || 8080;
const decodeSoundFile = async (soundFileName) => {
    let pcmData = [];
    let sampleRate = 0;
    let duration = 0;
    let length = 0;
    const buf = fs_1.default.readFileSync(soundFileName);
    return new Promise((resolve) => {
        context.decodeAudioData(buf, (audioBuffer) => {
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
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
app.use((0, cors_1.default)());
app.post('/get-audio-data', async (req, res) => {
    const body = req.body;
    const path = `audio/${body.filename}`;
    const info = (await decodeSoundFile(path));
    const max = info.pcmData.reduce((prev, curr) => (curr > prev ? curr : prev), 0);
    info.max = max;
    res.end(JSON.stringify(info));
});
app.get('/get-audio-file/:filename', (req, res) => {
    const params = req.params;
    res.contentType('application/mp3');
    res.end(fs_1.default.readFileSync(`audio/${params.filename}`));
});
app.get('*', (req, res) => {
    res.end('404 page not found');
});
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
