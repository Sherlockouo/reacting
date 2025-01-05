// app/page.tsx
"use client";

import Link from "next/link";
import { Button, Card, Input } from "@nextui-org/react";

export default function Home() {
  const handleSubscribe = () => {
    // 这里可以处理订阅逻辑，比如提交到后端
    alert("Thanks for subscribing!");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-100 to-blue-50">
      {/* 主容器 */}
      <Card className="w-[90%] max-w-[600px] p-6 shadow-md">
        <h1 className="text-3xl font-bold mb-4 text-center">
          Welcome to My Chat App
        </h1>

        <p className="text-gray-700 text-center mb-6 leading-relaxed">
          A modern chat platform powered by ChatGPT. Experience real-time AI
          assistance, generate creative content, and stay up to date with the
          latest news. Feel free to explore the chat or subscribe to our RSS
          feeds for automatic updates.
        </p>

        {/* 去 Chat 页面按钮 */}
        <div className="flex justify-center gap-1 items-center">
          <Link href="/chat">
            <Button color="primary" variant="flat">
              Go to Chat
            </Button>
          </Link>
          <Link href="/talk">
            <Button color="primary" variant="flat">
              Go to Talk
            </Button>
          </Link>
        </div>

        {/* 间隔 */}
        <div className="my-8 border-t border-gray-300" />

        {/* 订阅 RSS / 邮件等 Widget */}
        <div>
          <h2 className="text-xl font-semibold mb-2 text-center">
            Stay Updated
          </h2>
          <p className="text-center text-gray-600 mb-4">
            Subscribe to our RSS feeds or newsletter to never miss out.
          </p>

          {/* 假设这是个输入邮箱的订阅框，可以改成 RSS 或任意形式 */}
          <div className="flex flex-col sm:flex-row items-center gap-2 justify-center mb-4">
            <Input
              placeholder="Enter your email"
              type="email"
              className="flex-1"
            />
            <Button color="success" onClick={handleSubscribe}>
              Subscribe
            </Button>
          </div>

          <p className="text-sm text-gray-500 text-center">
            We respect your privacy. No spam, guaranteed!
          </p>
        </div>

        {/* 间隔 */}
        <div className="my-8 border-t border-gray-300" />

        {/* RSS 订阅示例 */}
        <div>
          <h2 className="text-xl font-semibold mb-2 text-center">
            Latest News
          </h2>
          <p className="text-gray-600 text-center mb-4">
            Check out the most recent updates from our RSS feed.
          </p>

          <ul className="space-y-2 text-left list-disc list-inside pl-2">
            <li>
              <a href="#" className="text-blue-600 hover:underline">
                1. ChatGPT 研究：如何更好地利用大型语言模型
              </a>
            </li>
            <li>
              <a href="#" className="text-blue-600 hover:underline">
                2. 人工智能的未来：下一站 GPT-4
              </a>
            </li>
            <li>
              <a href="#" className="text-blue-600 hover:underline">
                3. 实践指南：在日常工作中应用对话式AI
              </a>
            </li>
            {/* 可根据需要动态渲染更多条目 */}
          </ul>
        </div>
      </Card>
    </div>
  );
}
