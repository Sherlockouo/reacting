import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

type Props = {
  /** AudioNode 代表当前音源节点 */
  audioNode?: AudioNode | null;

  /** 竖条的颜色 */
  barColor?: string;

  /** 组件的宽度 */
  width?: number;

  /** 组件的高度 */
  height?: number;
};

/**
 * AudioSpectrumVisualizer：使用 Framer Motion 渲染六个细长的竖条，代表不同频段的音频强度。
 */
export function AudioVisualizer({
  audioNode,
  barColor = "#00ccff",
  width = 600,
  height = 200,
}: Props) {
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationIdRef = useRef<number | null>(null);

  // 存储六个频段的音量等级（0 到 1）
  const [levels, setLevels] = useState<number[]>([0, 0, 0, 0, 0, 0]);

  useEffect(() => {
    if (!audioNode) {
      console.log("audio node is null");
      return;
    }

    // 创建 AnalyserNode 并连接到 audioNode
    const context =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (audioNode as any).context || (audioNode as any).audioContext;
    const analyser = context.createAnalyser();
    analyser.fftSize = 256; // 调整 fftSize 以平衡频率分辨率和性能
    audioNode.connect(analyser);

    analyserRef.current = analyser;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const renderFrame = () => {
      analyser.getByteFrequencyData(dataArray);

      const sampleRate = 24000; // 通常为 44100 Hz
      const fftSize = analyser.fftSize; // 通常为 2048
      const frequencyBinCount = analyser.frequencyBinCount; // 通常为 fftSize / 2
      const frequencyResolution = sampleRate / fftSize; // 每个bin代表的频率范围

      // 定义标准频段
      const frequencyBands = [
        { name: "Bass", low: 20, high: 250 },
        { name: "Low Mid", low: 250, high: 500 },
        { name: "Mid", low: 500, high: 2000 },
        { name: "High Mid", low: 2000, high: 4000 },
        { name: "Presence", low: 4000, high: 6000 },
        { name: "Brilliance", low: 6000, high: 20000 },
      ];

      const newLevels: number[] = [];

      frequencyBands.forEach((band) => {
        // 计算每个频段对应的bin索引
        const startBin = Math.floor(band.low / frequencyResolution);
        const endBin = Math.min(
          Math.floor(band.high / frequencyResolution),
          frequencyBinCount - 1,
        );

        // 提取该频段的频率数据
        const segment = dataArray.slice(startBin, endBin + 1);

        // 计算该频段的最大值（或其他统计值，如平均值）
        const max = Math.max(...segment);

        // 归一化到 0 到 1
        newLevels.push(max / 255);
      });

      console.log("Frequency Bands", newLevels);

      setLevels(newLevels);

      animationIdRef.current = requestAnimationFrame(renderFrame);
    };

    renderFrame();

    // 组件卸载时清理
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      audioNode.disconnect(analyser);
      analyser.disconnect();
    };
  }, [audioNode]);

  // Framer Motion 的过渡配置，调整参数以实现更丝滑的动画
  const transition = {
    type: "spring",
    damping: 20, // 阻尼系数，数值越大动画越稳定
    stiffness: 300, // 刚度，数值越大动画越快速
    mass: 1, // 质量，影响动画的惯性
  };

  return (
    <div
      style={{
        width: width,
        height: height,
      }}
      className="flex items-end justify-center gap-[2px]"
    >
      {levels.map((level, i) => {
        // 计算每个竖条的高度百分比
        const barHeight = `${level * 100}%`;

        return (
          <motion.div
            key={i}
            style={{
              width: "10px", // 更细的竖条
              backgroundColor: barColor,
              borderRadius: "3px",
              // margin: "0 1px", // 更小的间距
            }}
            animate={{
              height: barHeight,
            }}
            transition={transition}
          />
        );
      })}
    </div>
  );
}
