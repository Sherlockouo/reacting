"use client";

import MarkdownPreview from "@uiw/react-markdown-preview";
import { useTheme } from "next-themes";

type ChatMessageProps = {
  role: string;
  content: string;
};

export default function MessageItem({ role, content }: ChatMessageProps) {
  const { theme } = useTheme();
  // 当没有自定义主题时，这里通常返回 "light" 或 "dark"

  // 可以根据当前主题进行颜色判断
  const isDark = theme === "dark";

  const bubbleBg =
    role === "user"
      ? isDark
        ? "#0072F5"
        : "#0072F5" // 用户气泡示例（同一蓝色，仅示例）
      : isDark
        ? "#444444"
        : "#000000"; // AI 气泡示例

  const textColor = isDark ? "#fff" : "#000";

  return (
    <div className={`mb-2 ${role === "user" ? "text-right" : "text-left"}`}>
      <span
        className="inline-block m-2 px-4 py-2 rounded"
        style={{
          backgroundColor: bubbleBg,
          color: textColor,
        }}
      >
        <MarkdownPreview
          style={{
            backgroundColor: "transparent",
            borderRadius: "6px",
            padding: "10px",
          }}
          source={content}
        />
      </span>
    </div>
  );
}
