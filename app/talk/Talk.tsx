/* eslint-disable react/display-name */
"use client";

import cn from "classnames";

import { memo, ReactNode, RefObject, useEffect, useRef, useState } from "react";
import { useLiveAPIContext } from "@/contexts/LiveAPIContext";
import { UseMediaStreamResult } from "@/hooks/use-media-stream-mux";
import { useScreenCapture } from "@/hooks/use-screen-capture";
import { useWebcam } from "@/hooks/use-webcam";
import { AudioRecorder } from "@/lib/audio-recorder";
import { Button } from "@nextui-org/react";
import { MdOutlineSettingsVoice } from "react-icons/md";
import { FaPause, FaPlay } from "react-icons/fa";
import { AudioSpectrumVisualizer } from "@/components/AudioVisualizer";

export type ControlTrayProps = {
  videoRef: RefObject<HTMLVideoElement | null>;
  children?: ReactNode;
  supportsVideo: boolean;
  onVideoStreamChange?: (stream: MediaStream | null) => void;
};

type MediaStreamButtonProps = {
  isStreaming: boolean;
  onIcon: string;
  offIcon: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  start: () => Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stop: () => any;
};

/**
 * Button used for triggering webcam or screen-capture
 */
const MediaStreamButton = memo(
  ({ isStreaming, onIcon, offIcon, start, stop }: MediaStreamButtonProps) =>
    isStreaming ? (
      <Button color="success" className="action-Button" onPress={stop}>
        <span className="material-symbols-outlined">{onIcon}</span>
      </Button>
    ) : (
      <Button color="warning" className="action-Button" onPress={start}>
        <span className="material-symbols-outlined">{offIcon}</span>
      </Button>
    ),
);

function ControlTray({
  videoRef,
  children,
  onVideoStreamChange = () => {},
  supportsVideo,
}: ControlTrayProps) {
  const videoStreams = [useWebcam(), useScreenCapture()];
  const [activeVideoStream, setActiveVideoStream] =
    useState<MediaStream | null>(null);
  const [webcam, screenCapture] = videoStreams;
  const [inVolume, setInVolume] = useState(0);
  const [audioRecorder] = useState(() => new AudioRecorder());
  const [muted, setMuted] = useState(false);
  const renderCanvasRef = useRef<HTMLCanvasElement>(null);
  const connectButtonRef = useRef<HTMLButtonElement>(null);

  const { client, connected, connect, disconnect, geminiAudioNode } =
    useLiveAPIContext();

  useEffect(() => {
    if (!connected && connectButtonRef.current) {
      connectButtonRef.current.focus();
    }
  }, [connected]);
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--volume",
      `${Math.max(5, Math.min(inVolume * 200, 8))}px`,
    );
  }, [inVolume]);

  useEffect(() => {
    const onData = (base64: string) => {
      client.sendRealtimeInput([
        {
          mimeType: "audio/pcm;rate=16000",
          data: base64,
        },
      ]);
    };
    if (connected && !muted && audioRecorder) {
      audioRecorder.on("data", onData).on("volume", setInVolume).start();
    } else {
      audioRecorder.stop();
    }
    return () => {
      audioRecorder.off("data", onData).off("volume", setInVolume);
    };
  }, [connected, client, muted, audioRecorder]);

  useEffect(() => {
    if (!videoRef.current) {
      return;
    }
    videoRef.current.srcObject = activeVideoStream;

    let timeoutId = -1;

    function sendVideoFrame() {
      const video = videoRef.current;
      const canvas = renderCanvasRef.current;

      if (!video || !canvas) {
        return;
      }

      const ctx = canvas.getContext("2d")!;
      canvas.width = video.videoWidth * 0.25;
      canvas.height = video.videoHeight * 0.25;
      if (canvas.width + canvas.height > 0) {
        if (!videoRef.current) {
          return;
        }
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL("image/jpeg", 1.0);
        const data = base64.slice(base64.indexOf(",") + 1, Infinity);
        client.sendRealtimeInput([{ mimeType: "image/jpeg", data }]);
      }
      if (connected) {
        timeoutId = window.setTimeout(sendVideoFrame, 1000 / 0.5);
      }
    }
    if (connected && activeVideoStream !== null) {
      requestAnimationFrame(sendVideoFrame);
    }
    return () => {
      clearTimeout(timeoutId);
    };
  }, [connected, activeVideoStream, client, videoRef]);

  //handler for swapping from one video-stream to the next
  const changeStreams = (next?: UseMediaStreamResult) => async () => {
    if (next) {
      const mediaStream = await next.start();
      setActiveVideoStream(mediaStream);
      onVideoStreamChange(mediaStream);
    } else {
      setActiveVideoStream(null);
      onVideoStreamChange(null);
    }

    videoStreams.filter((msr) => msr !== next).forEach((msr) => msr.stop());
  };

  return (
    <section className="control-tray flex flex-col gap-4">
      <div className="flex">
        <canvas style={{ display: "none" }} ref={renderCanvasRef} />
        <nav
          className={cn("actions-nav flex items-center", {
            disabled: !connected,
          })}
        >
          <Button
            color={muted ? "danger" : "success"}
            className={cn("action-Button mic-Button")}
            onPress={() => setMuted(!muted)}
            isIconOnly
          >
            <MdOutlineSettingsVoice className="text-lg" />
          </Button>

          {supportsVideo && (
            <div className="flex gap-2 p-4">
              <MediaStreamButton
                isStreaming={screenCapture.isStreaming}
                start={changeStreams(screenCapture)}
                stop={changeStreams()}
                onIcon="cancel_presentation"
                offIcon="present_to_all"
              />
              <MediaStreamButton
                isStreaming={webcam.isStreaming}
                start={changeStreams(webcam)}
                stop={changeStreams()}
                onIcon="videocam_off"
                offIcon="videocam"
              />
            </div>
          )}
          {children}
        </nav>

        <div
          className={cn("connection-container flex  gap-2 items-center", {
            connected,
          })}
        >
          <div className="connection-Button-container">
            <Button
              color={connected ? "success" : "danger"}
              ref={connectButtonRef}
              className={cn("action-Button connect-toggle", { connected })}
              onPress={connected ? disconnect : connect}
              isIconOnly
            >
              {connected ? <FaPause /> : <FaPlay />}
            </Button>
          </div>
          <span className="text-indicator">👈 Click to talk to gemini !!</span>
        </div>
      </div>
      <div className="flex justify-center items-center">
        <AudioSpectrumVisualizer audioNode={geminiAudioNode} />
      </div>
    </section>
  );
}

export default memo(ControlTray);
