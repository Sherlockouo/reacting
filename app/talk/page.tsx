// app/talk/page.tsx
"use client";

import { useRef, useState } from "react";
import ControlTray from "./Talk";
import { Altair } from "@/components/altair/Altair";
import cn from "classnames";

export default function TalkPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  // either the screen capture, the video or null, if null we hide it
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);

  return (
    <div className="flex flex-col gap-4 h-screen justify-center items-center">
      <div className="main-app-area flex">
        <Altair />
        <video
          className={cn("rounded-md stream", {
            hidden: !videoRef.current || !videoStream,
          })}
          ref={videoRef}
          autoPlay
          playsInline
        />
      </div>
      <div className="flex">
        {videoRef && (
          <ControlTray
            videoRef={videoRef}
            supportsVideo={true}
            onVideoStreamChange={setVideoStream}
          >
            {/* put your own buttons here */}
          </ControlTray>
        )}
      </div>
    </div>
  );
}
