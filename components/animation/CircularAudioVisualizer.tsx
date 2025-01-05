import React, { useEffect, useRef } from "react";

type CircularAudioVisualizerProps = {
  audioNode?: AudioNode | null;
  barCount?: number;
  radius?: number;
  maxBarHeight?: number;
  minBarHeight?: number;
  className?: string;
  barColor?: string;
};

export function CircularAudioVisualizer({
  audioNode,
  barCount = 64,
  radius = 100,
  maxBarHeight = 50,
  minBarHeight = 2,
  className,
  barColor = "#ff66cc",
}: CircularAudioVisualizerProps) {
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentHeightsRef = useRef<number[]>([]); // 保存当前柱子的高度
  const smoothFactor = 0.4; // 平滑因子，调整高度变化的速度

  useEffect(() => {
    if (!audioNode) return;

    const ctx = audioNode.context as AudioContext;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    audioNode.connect(analyser);
    analyserRef.current = analyser;

    // 初始化当前高度数组
    if (currentHeightsRef.current.length !== barCount) {
      currentHeightsRef.current = new Array(barCount).fill(minBarHeight);
    }

    const dataArray = new Uint8Array(analyser.fftSize);
    const canvas = canvasRef.current!;
    const canvasCtx = canvas.getContext("2d")!;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const animate = () => {
      analyser.getByteTimeDomainData(dataArray);

      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

      const segmentSize = Math.floor(dataArray.length / barCount);

      for (let i = 0; i < barCount; i++) {
        let sum = 0;
        const start = i * segmentSize;
        const end = i === barCount - 1 ? dataArray.length : start + segmentSize;
        for (let j = start; j < end; j++) {
          sum += Math.abs(dataArray[j] - 128);
        }
        const avg = sum / (end - start);
        const level = Math.pow(avg / 128, 0.5);

        const targetBarHeight =
          minBarHeight + level * (maxBarHeight - minBarHeight);

        // 平滑过渡到目标高度
        currentHeightsRef.current[i] +=
          (targetBarHeight - currentHeightsRef.current[i]) * smoothFactor;

        const barHeight = currentHeightsRef.current[i];
        const angle = (i / barCount) * 360;
        const rad = (angle * Math.PI) / 180;
        const x = centerX + radius * Math.cos(rad);
        const y = centerY + radius * Math.sin(rad);

        canvasCtx.save();
        canvasCtx.translate(x, y);
        canvasCtx.rotate(rad - Math.PI / 2);
        canvasCtx.fillStyle = barColor;
        canvasCtx.shadowColor = "rgba(255, 102, 204, 0.5)";
        canvasCtx.shadowBlur = 5;
        canvasCtx.beginPath();
        canvasCtx.rect(-1, 0, 3, barHeight);
        canvasCtx.fill();
        canvasCtx.restore();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      analyser.disconnect();
    };
  }, [audioNode, barCount, radius, maxBarHeight, minBarHeight, barColor]);

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: `${radius * 2 + maxBarHeight * 2}px`,
        height: `${radius * 2 + maxBarHeight * 2}px`,
        overflow: "hidden",
      }}
    >
      <canvas
        ref={canvasRef}
        width={radius * 2 + maxBarHeight * 2}
        height={radius * 2 + maxBarHeight * 2}
      ></canvas>
    </div>
  );
}
