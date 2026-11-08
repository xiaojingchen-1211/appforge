"use client";

import { useState } from "react";

/**
 * 生成结果预览。
 * sandbox 放开 same-origin 是为了让生成的应用能真正使用 localStorage 持久化数据；
 * 页面上不存放任何密钥，模型调用全部在服务端完成。
 */
export function PreviewFrame({ html, title }: { html: string; title?: string }) {
  return (
    <iframe
      className="frame"
      title={title ? `${title} 预览` : "生成应用预览"}
      srcDoc={html}
      sandbox="allow-scripts allow-forms allow-modals allow-popups allow-same-origin"
    />
  );
}
