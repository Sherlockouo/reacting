"use client";

import React from "react";

type ChatMessageProps = {
  role: string;
  content: string;
};

export default function MessageItem({ role, content }: ChatMessageProps) {
  return (
    <div className={`mb-2 ${role === "user" ? "text-right" : "text-left"}`}>
      <span
        className={`inline-block m-2 px-4 py-2 rounded ${
          role === "user" ? "bg-blue-500 text-white" : "bg-gray-300 text-black"
        }`}
      >
        {content}
      </span>
    </div>
  );
}
