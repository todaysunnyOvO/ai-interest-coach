## 🤖 AI Interest Coach (AI 兴趣教练)
这是一个基于 Modern.js 全栈框架构建的智能 AI 聊天应用。它不仅仅是一个简单的对话框，更是一个集成了流式响应 (Streaming)、思维链可视化 (Chain-of-Thought) 和 BFF 安全架构 的现代化全栈实践项目。

项目预设了“兴趣教练”的 AI 人设，旨在帮助用户发现、探索并深入发展他们的兴趣爱好。

##  ✨ 核心特性

- ⚡ 极致流式体验：基于 HTTP Streaming 技术，实现毫秒级首字响应与丝滑的“打字机”输出效果。

- 🧠 思维链可视化：适配现代推理模型（如 Doubao-pro/DeepSeek），自动解析并独立展示 AI 的隐性思考过程 (<think>标签解析)。

- 🔒 BFF 安全架构：通过 Modern.js 的 BFF (Backend for Frontend) 层转发请求，确保 API Key 等敏感信息物理隔离，绝不暴露在浏览器端。

- 💾 无感自动存档：基于 LocalStorage 实现纯前端的数据持久化，刷新页面或关闭浏览器后聊天记录不丢失。

- 🎨 现代化 UI：自适应高度输入框、Markdown 富文本渲染、自动跟随滚动等细节打磨。

##  🚀 快速开始

1. 克隆项目

  ```bash
  git clone https://github.com/你的用户名/你的仓库名.git
  cd 你的仓库名
  ```

2. 安装依赖

   推荐使用 `pnpm` 进行包管理：

   ```bash
   pnpm install
   ```

3. 配置环境变量

   在项目根目录创建一个 `.env` 文件（注意：不要将此文件提交到 Git），并填入你的火山引擎（或兼容 OpenAI 格式的）API 密钥：

   ```
   # .env
   VOLCENGINE_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
   # 可选：自定义模型 ID
   VOLCENGINE_MODEL_ID=doubao-pro-32k
   ```

4. 启动开发服务器

   ```bash
   pnpm run dev
   ```

   启动成功后，访问 `http://localhost:8080` 即可体验。

##  📂 项目结构

.
├── api/
│   └── chat.ts            # BFF层核心：处理流式转发、思维链整形、鉴权
├── src/
│   ├── components/
│   │   └── Chat/          # UI 组件 (Sidebar, ChatInput, ChatMessage)
│   ├── hooks/
│   │   └── useChat.ts     # 核心逻辑：状态管理、流读取、乐观更新
│   ├── utils/
│   │   └── storage.ts     # 数据层：LocalStorage 封装
│   └── routes/            # 页面路由入口
└── modern.config.ts       # 框架配置文件



