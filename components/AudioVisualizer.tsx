// AudioSpectrumVisualizer.tsx
import React, { useEffect, useRef } from "react";

type Props = {
  /** 如果你想直接传 AnalyserNode，也可以。 */
  audioNode?: AudioNode | null;

  /** 柱状图颜色 */
  barColor?: string;
  width?: number;
  height?: number;
};

/**
 * 一个简单的频谱可视化组件：从 AudioNode 中获取音频数据并绘制。
 */
export function AudioSpectrumVisualizer({
  audioNode,
  barColor = "#00ccff",
  width = 600,
  height = 100,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!audioNode) return;
    // audioNode 必须隶属于同一个 AudioContext
    // 我们创建一个 AnalyserNode 并把 audioNode -> analyser -> destination (或不接destination)
    const context = audioNode.context;
    const analyser = context.createAnalyser();
    analyser.fftSize = 256;

    // 把输入节点连到 analyser
    audioNode.connect(analyser);

    analyserRef.current = analyser;
    draw();

    // 卸载时断开连接 & 停止动画
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      audioNode.disconnect(analyser);
      analyser.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioNode]);

  const draw = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const renderFrame = () => {
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 将画布的(0,0)移到中心点，以便做极坐标绘图
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // 基础半径，可做成跟随音量或固定值
      const baseRadius = Math.min(centerX, centerY) * 0.3;
      // 可调的缩放系数，用来控制振幅大小
      const scale = 0.5;

      // ★ 1) 绘制云朵/气泡形状
      ctx.beginPath();
      for (let i = 0; i < bufferLength; i++) {
        const angle = (i / bufferLength) * 2 * Math.PI;
        const value = dataArray[i];
        // 计算当前点的半径
        const radius = baseRadius + value * scale;

        // 极坐标 -> 笛卡尔
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();

      // ★ 2) 给云朵加填充
      //   这里可以用纯色，也可以用渐变
      const grad = ctx.createRadialGradient(
        centerX,
        centerY,
        baseRadius * 0.1,
        centerX,
        centerY,
        baseRadius * 1.8,
      );
      grad.addColorStop(0, "rgba(255, 255, 255, 0.8)");
      grad.addColorStop(1, barColor); // 你传进来的 barColor
      ctx.fillStyle = grad;

      // ★ 3) 阴影，让它更柔和
      ctx.shadowColor = barColor;
      ctx.shadowBlur = 20;

      ctx.fill();

      // ★ 如果还想有边线：
      // ctx.strokeStyle = "white";
      // ctx.lineWidth = 2;
      // ctx.stroke();

      // ★ 还原阴影设置
      ctx.shadowBlur = 0;
      ctx.shadowColor = "transparent";

      // 下一帧
      animationIdRef.current = requestAnimationFrame(renderFrame);
    };

    renderFrame();
  };

  return <canvas ref={canvasRef} width={width} height={height} />;
}
