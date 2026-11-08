import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "AppForge · 一句话生成可运行的应用",
  description:
    "输入一句话需求，多路并行生成可交互的单文件应用，实时预览、打分择优、版本迭代并持久化保存。",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
