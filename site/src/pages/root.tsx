import { createAsyncCall, onPageMount } from "@jacksonotto/lampjs";
import { Simulation, Vector3, Color, Cube } from "simulationjs";
import { baseServerUrl } from "../utils/server";
import "./root.css";

const Root = () => {
  const maxSize = 80;
  const minSize = 30;
  let canvas: Simulation | null = null;
  let cube: Cube | null = null;
  let audioData: ResType | null = null;
  let fps = 0;
  let inc = 0;
  let sampleToAverage = 0;
  const waveSmoothScale = 6;
  const filename = "test-audio.mp3";
  let canPlay = true;

  type ResType = {
    pcmData: number[];
    sampleRate: number;
    duration: number;
    length: number;
    max: number;
  };
  const getAudioData = createAsyncCall<ResType>(
    baseServerUrl + "get-audio-data",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filename,
      }),
    }
  );
  window.addEventListener("keypress", (e: KeyboardEvent) => {
    if (e.key === "Enter" && canPlay) {
      canPlay = false;
      getAudioData(async (data) => {
        if (data.data !== null) {
          audioData = data.data;
          fps = await sampleFrameRate();
          inc = audioData.sampleRate / fps;
          sampleToAverage = inc * waveSmoothScale;
          audio.play();
          animateCircle();
        }
      });
    }
  });

  const sampleFrameRate = (totalFrames = 30) => {
    return new Promise<number>((resolve) => {
      let framesSampled = 0;
      let diffs: number[] = [];

      let start = 0;
      const sampleTime = () => {
        const end = Date.now();
        const diff = end - start;
        diffs.push(diff);
        if (framesSampled < totalFrames) {
          framesSampled++;
          start = end;
          window.requestAnimationFrame(sampleTime);
        } else {
          const avg = diffs.reduce((prev, acc) => prev + acc, 0) / totalFrames;
          const fps = 1000 / avg;
          resolve(fps);
        }
      };

      const startSample = () => {
        start = Date.now();
        window.requestAnimationFrame(sampleTime);
      };

      window.requestAnimationFrame(startSample);
    });
  };

  const audio = new Audio(baseServerUrl + "get-audio-file/" + filename);

  let currentIndex = 0;
  const animateCircle = async () => {
    if (!cube || !audioData || !canvas) return;

    const pcmDataValue =
      audioData.pcmData
        .slice(
          Math.max(0, currentIndex - sampleToAverage),
          Math.min(currentIndex + sampleToAverage, audioData.length)
        )
        .map((v) => Math.abs(v))
        .reduce((prev, acc) => acc + prev, 0) / sampleToAverage;
    const ratio = Math.sqrt(pcmDataValue) / audioData.max;

    let newSize = maxSize * ratio;

    newSize = Math.max(newSize, minSize);
    cube.setHeight(newSize);
    cube.setWidth(newSize);
    cube.setDepth(newSize);

    currentIndex += inc;
    if (currentIndex < audioData.length) {
      window.requestAnimationFrame(animateCircle);
    } else {
      currentIndex = 0;
      canPlay = true;
    }
  };

  const rotateCube = async () => {
    if (!cube) return;
    await cube.rotate(new Vector3(360, 360, 0), 8);
    rotateCube();
  };

  onPageMount(() => {
    canvas = new Simulation("canvas");
    canvas.fitElement();
    canvas.setBgColor(new Color(0, 0, 0));

    cube = new Cube(
      new Vector3(0, 0, 0),
      minSize,
      minSize,
      minSize,
      new Color(79, 13, 153),
      new Vector3(0, 0, 0),
      true,
      true
    );
    canvas.add(cube);

    rotateCube();
  });

  return (
    <div class="root">
      <canvas id="canvas" />
      <div class="info">
        Press <code>Enter</code> to start
      </div>
    </div>
  );
};

export default Root;
