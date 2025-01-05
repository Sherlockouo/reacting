import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

type CircularAudioVisualizerProps = {
  audioNode?: AudioNode | null;
  barCount?: number;
  radius?: number;
  maxBarHeight?: number;
  minBarHeight?: number;
};

export function CircularAudioVisualizer({
  audioNode,
  barCount = 64,
  radius = 100,
  maxBarHeight = 50,
  minBarHeight = 2,
}: CircularAudioVisualizerProps) {
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  const [levels, setLevels] = useState<number[]>(() =>
    new Array(barCount).fill(0),
  );

  useEffect(() => {
    if (!audioNode) return;

    const ctx = audioNode.context as AudioContext;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    audioNode.connect(analyser);
    analyserRef.current = analyser;

    const dataArray = new Uint8Array(analyser.fftSize);

    const animate = () => {
      analyser.getByteTimeDomainData(dataArray);

      const segmentSize = Math.floor(dataArray.length / barCount);
      const newLevels = new Array(barCount).fill(0);

      for (let i = 0; i < barCount; i++) {
        const start = i * segmentSize;
        const end = i === barCount - 1 ? dataArray.length : start + segmentSize;
        const sum = dataArray
          .slice(start, end)
          .reduce((acc, val) => acc + Math.abs(val - 128), 0);
        const avg = sum / (end - start);
        newLevels[i] = Math.pow(avg / 128, 0.5); // 指数映射增强低幅值变化
      }

      setLevels(newLevels);

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      analyser.disconnect();
    };
  }, [audioNode, barCount]);

  const transition = {
    type: "spring",
    damping: 20,
    stiffness: 250,
    mass: 0.5,
  };

  return (
    <div
      className=""
      style={{
        position: "relative",
        width: `${radius * 2 + maxBarHeight * 2}px`,
        height: `${radius * 2 + maxBarHeight * 2}px`,
        margin: "0 auto",
        overflow: "hidden",
        // background: "radial-gradient(circle, #333, #555)",
      }}
    >
      {levels.map((level, i) => {
        const barHeight = minBarHeight + level * (maxBarHeight - minBarHeight);
        const angle = (i / barCount) * 360;
        const rad = (angle * Math.PI) / 180;
        const x = radius * Math.cos(rad);
        const y = radius * Math.sin(rad);

        return (
          <motion.div
            key={i}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: "3px",
              height: `${barHeight}px`,
              backgroundColor: "#ff66cc",
              transformOrigin: "center top",
              transform: `translate(${x}px, ${y}px) rotate(${angle - 90}deg)`,
              borderRadius: "1px",
            }}
            animate={{ height: barHeight }}
            transition={transition}
          />
        );
      })}
    </div>
  );
}
