import { EventEmitter } from "eventemitter3";
import { audioContext } from "./utils";
import AudioRecordingWorklet from "./worklets/audio-processing";
import VolMeterWorket from "./worklets/vol-meter";
import { createWorketFromSrc } from "./audioworklet-registry";

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export class AudioRecorder extends EventEmitter {
  stream: MediaStream | undefined = undefined;
  audioContext: AudioContext | undefined;
  source: MediaStreamAudioSourceNode | undefined;
  recording: boolean = false;
  recordingWorklet: AudioWorkletNode | undefined;
  vuWorklet: AudioWorkletNode | undefined;

  private starting: Promise<MediaStream> | null = null;

  constructor(public sampleRate = 16000) {
    super();
  }

  async start(): Promise<MediaStream> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Could not request user media");
    }
    if (this.stream) {
      return this.stream;
    }

    if (this.starting) {
      // 如果已经在启动中，等待其完成
      return this.starting;
    }

    this.starting = new Promise<MediaStream>(async (resolve, reject) => {
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        this.audioContext = await audioContext({ sampleRate: this.sampleRate });
        this.source = this.audioContext.createMediaStreamSource(this.stream);

        const workletName = "audio-recorder-worklet";
        const src = createWorketFromSrc(workletName, AudioRecordingWorklet);

        await this.audioContext.audioWorklet.addModule(src);
        this.recordingWorklet = new AudioWorkletNode(
          this.audioContext,
          workletName,
        );

        this.recordingWorklet.port.onmessage = async (ev: MessageEvent) => {
          // worklet 处理录音浮点数和消息转换后的 buffer
          const arrayBuffer = ev.data.data.int16arrayBuffer;

          if (arrayBuffer) {
            const arrayBufferString = arrayBufferToBase64(arrayBuffer);
            this.emit("data", arrayBufferString);
          }
        };
        this.source.connect(this.recordingWorklet);

        // vu meter worklet
        const vuWorkletName = "vu-meter";
        await this.audioContext.audioWorklet.addModule(
          createWorketFromSrc(vuWorkletName, VolMeterWorket),
        );
        this.vuWorklet = new AudioWorkletNode(this.audioContext, vuWorkletName);
        this.vuWorklet.port.onmessage = (ev: MessageEvent) => {
          this.emit("volume", ev.data.volume);
        };

        this.source.connect(this.vuWorklet);
        this.recording = true;
        resolve(this.stream);
      } catch (error) {
        console.error("AudioRecorder start error:", error);
        reject(error);
        // 清理状态
        this.stream = undefined;
        this.recordingWorklet = undefined;
        this.vuWorklet = undefined;
      } finally {
        this.starting = null;
      }
    });

    return this.starting;
  }

  stop(): void {
    // 可能在 start 还没完成时调用 stop
    const handleStop = () => {
      this.source?.disconnect();
      this.stream?.getTracks().forEach((track) => track.stop());
      this.stream = undefined;
      this.recordingWorklet?.disconnect();
      this.vuWorklet?.disconnect();
      this.recordingWorklet = undefined;
      this.vuWorklet = undefined;
      this.recording = false;
    };

    if (this.starting) {
      this.starting
        .then(() => {
          handleStop();
        })
        .catch(() => {
          // 如果 start 失败，也确保清理
          handleStop();
        });
      return;
    }

    handleStop();
  }
}
