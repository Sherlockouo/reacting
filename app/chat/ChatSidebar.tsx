"use client";

import { useState } from "react";
import { useChatStore } from "@/store/useChatStore";
import { Button } from "@nextui-org/react";
import { AiTwotoneEdit } from "react-icons/ai";

export default function ChatSidebar() {
  const {
    sessions,
    currentSessionId,
    createSession,
    setCurrentSessionId,
    updateSessionTitle,
  } = useChatStore();

  // 用于记录当前正在编辑标题的 sessionId
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  // 用于记录当前编辑输入框的值
  const [tempTitle, setTempTitle] = useState<string>("");

  /**
   * 点击Session时的逻辑：
   *  - 如果正在编辑，则不切换Session
   *  - 如果没在编辑，则切换Session
   */
  const handleSessionClick = (sessionId: string) => {
    // 如果有 session 在编辑，且不是当前点击的，会先结束别的编辑
    if (editingSessionId && editingSessionId !== sessionId) {
      // 可以根据需求决定此时是否保存、放弃，或只自动退出
      finishEdit(editingSessionId, tempTitle);
    }
    if (editingSessionId !== sessionId) {
      // 未在编辑该 session，直接切换到该 session
      setCurrentSessionId(sessionId);
    }
  };

  /**
   * 点击 "三个点" 图标  =>  进入编辑状态
   */
  const handleEditIconClick = (sessionId: string, oldTitle: string) => {
    setEditingSessionId(sessionId);
    setTempTitle(oldTitle);
  };

  /**
   * 用户完成编辑（onBlur 或按 Enter）
   */
  const finishEdit = (sessionId: string, newTitle: string) => {
    // 去除首尾空格
    const trimmedTitle = newTitle.trim();
    if (trimmedTitle) {
      updateSessionTitle(sessionId, trimmedTitle);
    }
    setEditingSessionId(null);
    setTempTitle("");
  };

  return (
    <div className="p-2 w-64 bg-gray-700 flex flex-col">
      <Button onPress={createSession} className="mb-4">
        New Chat
      </Button>

      <div className="flex-1 overflow-y-auto space-y-2">
        {sessions.map((session) => {
          const isActive = session.id === currentSessionId;
          const isEditing = session.id === editingSessionId;

          return (
            <div
              key={session.id}
              className={`flex items-center p-2 rounded-md cursor-pointer ${
                isActive ? "bg-green-600" : "bg-gray-400"
              }`}
              onClick={() => handleSessionClick(session.id)}
            >
              {/* 左侧标题区域：如果在编辑，显示 input；否则显示 text */}
              {isEditing ? (
                <input
                  className="flex-1 border border-gray-300 p-1 mr-2 rounded focus:outline-none"
                  autoFocus
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  onBlur={() => finishEdit(session.id, tempTitle)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      finishEdit(session.id, tempTitle);
                    } else if (e.key === "Escape") {
                      // 按下 ESC 取消编辑，恢复原本的title
                      setEditingSessionId(null);
                      setTempTitle("");
                    }
                  }}
                />
              ) : (
                <span className="flex-1 whitespace-nowrap overflow-hidden overflow-ellipsis">
                  {session.title || "Unnamed Chat"}
                </span>
              )}

              {/* 右侧“三个点”图标，用于进入编辑模式 */}
              {/* 用onClick，不要阻止冒泡，就能在 handleSessionClick 里区分逻辑 */}
              <div
                className="ml-2 p-1 hover:bg-gray-100 rounded"
                onClick={(e) => {
                  // 防止点图标时，触发父级的 onClick 导致切换Session
                  e.stopPropagation();
                  handleEditIconClick(session.id, session.title || "");
                }}
              >
                <AiTwotoneEdit />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
