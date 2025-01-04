// components/ChatPanel.tsx
"use client";

import { useState } from "react";
import { useChatStore } from "@/store/useChatStore";
import { Card, Button, Textarea } from "@nextui-org/react";
import MessageItem from "./MessageItem";
import ModelSwitcher from "./ModelSwitcher";
import { MdOutlineSettingsVoice } from "react-icons/md";

export default function ChatPanel() {
  const [input, setInput] = useState("");
  const [voiceOn, setVoiceOn] = useState(false);

  const {
    sessions,
    currentSessionId,
    addMessage,
    clearSessionMessages,
    selectedModel,
  } = useChatStore();

  const currentSession = sessions.find((s) => s.id === currentSessionId);

  // 如果没有选中 Session，提示用户创建/选择
  if (!currentSession) {
    return <div className="flex-1 p-4">No session selected.</div>;
  }

  const handleSend = async () => {
    if (!input.trim()) return;

    const userContent = input.trim();
    setInput("");

    // 1. 先将用户消息添加到状态
    addMessage(currentSession.id, "user", userContent);

    // 2. 向后端接口发起请求，流式获取 AI 消息
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: selectedModel,
          messages: currentSession.messages.concat({
            role: "user",
            content: userContent,
          }),
        }),
      });

      if (!response.body) return;
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      // 先添加一条空的 assistant 消息，用来接收后续流式内容
      addMessage(currentSession.id, "assistant", "");

      // 流式读取
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (!value) continue;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const jsonStr = trimmed.replace("data:", "").trim();
          if (jsonStr === "[DONE]") {
            done = true;
            break;
          }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              // 将流回来的内容添加到之前的最后一条 assistant 消息上
              // （这里可以重新写一个专门的 store 函数更好）
              addMessageContent(currentSession.id, content);
            }
          } catch (err) {
            console.error("Error parsing JSON stream chunk:", err);
          }
        }
      }
    } catch (err) {
      console.error("Error while sending message:", err);
    }
  };

  // 针对流式返回时追加文本，我们可以单独实现一个函数
  // 这里为了简洁，临时写在组件里，也可提取到 store
  function addMessageContent(sessionId: string, contentChunk: string) {
    useChatStore.setState((state) => {
      const sessions = state.sessions.map((session) => {
        if (session.id === sessionId) {
          const lastMsgIndex = session.messages.length - 1;
          const lastMsg = session.messages[lastMsgIndex];
          // 如果最后一条是 assistant，则拼接
          if (lastMsg && lastMsg.role === "assistant") {
            const updatedMsg = {
              ...lastMsg,
              content: lastMsg.content + contentChunk,
            };
            const updatedMsgs = [...session.messages];
            updatedMsgs[lastMsgIndex] = updatedMsg;
            return { ...session, messages: updatedMsgs };
          }
        }
        return session;
      });
      return { sessions };
    });
  }

  const handleClear = () => {
    clearSessionMessages(currentSession.id);
  };

  return (
    <div className="flex-1 flex flex-col justify-center p-1">
      {/* 消息列表 */}
      <Card className="w-full my-2 h-[70vh] overflow-y-auto ">
        {currentSession.messages.map((msg, idx) => {
          return (
            <MessageItem key={idx} role={msg.role} content={msg.content} />
          );
        })}
      </Card>

      {/* 输入框区 */}
      <Card className="p-4">
        <Textarea
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          minRows={3}
          maxRows={3}
          className="mb-4"
        />
        <div className="flex justify-end gap-4 items-center">
          <ModelSwitcher />
          <Button
            isIconOnly
            color={voiceOn ? "success" : "default"}
            onPress={() => setVoiceOn(!voiceOn)}
          >
            <MdOutlineSettingsVoice />
          </Button>
          <Button onPress={handleSend}>Send</Button>
          <Button color="danger" onPress={handleClear}>
            Clear
          </Button>
        </div>
      </Card>
    </div>
  );
}
