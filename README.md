# Prisma

<p align="center">
  <a href="./README.md">中文</a> | <a href="./README.en.md">English</a>
</p>

<div align="center">

  <p>
    <strong>面向 Gemini 与 OpenAI 兼容模型的可视化深度多智能体推理引擎</strong>
  </p>

  <p>
    <a href="https://prisma-8yz.pages.dev/" target="_blank">
      <img src="https://img.shields.io/badge/Online_Demo-Live-success?style=for-the-badge&logo=cloudflare&logoColor=white" alt="Online Demo">
    </a>
    <a href="https://ai.studio/apps/drive/1JWPILJ3NT10NR4eOeGiqBi6OZuRaEszO?fullscreenApplet=true" target="_blank">
      <img src="https://img.shields.io/badge/AI_Studio-Build-orange?style=for-the-badge&logo=google&logoColor=white" alt="AI Studio Build">
    </a>
    <a href="./LICENSE" target="_blank">
      <img src="https://img.shields.io/badge/license-MIT-blue?style=for-the-badge" alt="License">
    </a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React">
    <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
    <img src="https://img.shields.io/badge/Gemini_SDK-1.34+-8E75B2?style=flat-square&logo=google&logoColor=white" alt="Gemini SDK">
    <img src="https://img.shields.io/badge/Vite-6.0-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite">
  </p>

</div>

---

## 📖 项目简介

**Prisma** 是一款探索多模型推理极限的实验性应用。它不仅仅是一个聊天机器人，更是一个**可视化的思维实验室**。

它引入了 **"深度多智能体推理 (Deep Multi-Agent Reasoning)"** 架构，将复杂的用户问题动态分解为子任务，分派给专门的 AI 专家角色并行处理。用户可以实时观看 AI 如何通过 **Manager（规划） -> Experts（执行） -> Synthesis（综合）** 的工作流来解决复杂问题。

## 🔗 在线体验

无需部署，直接体验 Prisma 的强大推理能力：

| 平台                 | 入口                                                                                                    | 说明                                                                     |
| :------------------- | :------------------------------------------------------------------------------------------------------ | :----------------------------------------------------------------------- |
| **Google AI Studio** | [🚀 **立即运行**](https://ai.studio/apps/drive/1JWPILJ3NT10NR4eOeGiqBi6OZuRaEszO?fullscreenApplet=true) | **推荐**。直接登录 Google 账号即可免费使用，无需配置 API Key，开箱即用。 |
| **Web 演示版**       | [🌐 **访问网页**](https://prisma-8yz.pages.dev/)                                                        | 纯前端版本，**需要填写您自己的 Google API Key** 才能运行。               |

---

## ✨ 核心特性

### 🧠 深度多智能体架构 (Deep Reasoning)

- **动态规划 (Manager Agent)**：根据用户的问题，智能分析并决定需要哪些领域的“专家”介入。
- **并行专家池 (Expert Pool)**：系统会自动生成专门的 AI 角色（如“逻辑学家”、“代码架构师”、“历史研究员”），它们并行工作，互不干扰。
- **递归优化 (Recursive Refinement)**：
  - **自省循环**：Manager 会审查专家的输出。如果发现逻辑漏洞或信息缺失，会自动驳回并启动下一轮修正。**当前实现最多进行 2 轮专家执行（初始轮 + 1 轮复审修正）**。
  - **最终综合**：将分散的专家意见汇聚成一篇逻辑严密、内容详实的最终回复。

### 👁️ 全链路可视化

- **思维流 (Process Flow)**：通过动态节点图展示当前的推理状态（Analyzing -> Working -> Reviewing -> Synthesizing）。
- **透明化思考**：你可以点开每一个“专家卡片”，查看其私有的 **Internal Monologue (内部独白)** 和 **Draft Output (草稿)**。
- **实时计时器**：精确追踪每个环节的耗时，了解 AI 的时间分配。

### ⚙️ 精细化控制

- **思考预算 (Thinking Budget)**：
  - 支持为 **规划**、**执行**、**综合** 三个阶段分别设置思考深度（Minimal, Low, Medium, High）。
  - 这决定了模型在生成 Token 时分配给 "Thinking" 字段的配额。
- **模型管理**：不预置任何模型配置，启动后由用户自行添加 Gemini API 或 OpenAI 兼容 API 模型。

### 🛠️ 现代化工程体验

- **自定义 API 网关**：支持配置 Custom Base URL，方便国内用户通过反向代理连接。
- **Markdown & LaTeX**：完美渲染复杂的数学公式、代码块和图表。
- **本地优先**：聊天会话存储在浏览器 **IndexedDB** 中，轻量偏好设置存储在 `localStorage` 中，保护隐私。

### 📎 附件能力说明

- **Google 模型**：图片、PDF、音视频、文本/代码附件会以内联数据方式发送；对较大的文件，仍可能受上游接口限制。
- **OpenAI 兼容模型**：支持图片和文本/代码附件；**PDF、音频、视频附件会在发送前被拦截**，避免静默丢失。

---

## ⚙️ 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/yeahhe365/Prisma.git
cd Prisma
```

### 2. 安装依赖

```bash
npm install
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:3000` 后，先在「设置 -> 模型管理」中添加至少一个 Gemini API 或 OpenAI 兼容 API 模型。

### 4. 运行校验

```bash
npm test
npx tsc --noEmit
npm run lint
npm run build
```

### 5. 使用 Docker 部署

```bash
docker compose up --build
```

默认映射到 `http://localhost:8081`。如果本机端口已被占用，可以先设置 `PRISMA_DOCKER_PORT` 再启动。

或者：

```bash
docker build -t prisma .
docker run --rm -p 8081:80 prisma
```

Docker 镜像会在构建阶段生成静态 `dist/`，并由一个轻量 Node 运行时提供页面和本地 API 代理：浏览器只请求同源的 `/custom-api`，真正的 Gemini/OpenAI 兼容 API 请求由容器内的 Node 服务发出，用来避开浏览器侧 CORS 限制。默认允许常见模型 API 域名；如果要接入自定义网关或本地模型服务，可以追加允许域名：

```bash
PRISMA_PROXY_ALLOWED_HOSTS=api.example.com,host.docker.internal docker compose up --build
```

这个代理开关只在 Dockerfile 中注入。Cloudflare Pages 仍然走普通 `npm run build` 的纯前端直连模式，不需要 `/custom-api` 服务。

Cloudflare Pages 会读取仓库根目录的 `.node-version`，当前固定为 Node.js 22，以便和 GitHub Actions、Docker 构建环境保持一致。

---

## 🛠️ 技术栈

| 模块         | 技术选型                   | 说明                               |
| :----------- | :------------------------- | :--------------------------------- |
| **核心框架** | React 19                   | 使用最新的 React Hooks 和并发特性  |
| **构建工具** | Vite 6                     | 极速冷启动与热更新                 |
| **AI SDK**   | `@google/genai` + `openai` | 同时支持 Gemini 与 OpenAI 兼容接口 |
| **样式**     | Tailwind CSS               | 原子化 CSS，配合排版插件           |
| **数学渲染** | KaTeX + Remark Math        | 高性能 LaTeX 公式渲染              |
| **代码高亮** | React Syntax Highlighter   | VSCode 风格的代码块高亮            |
| **图标库**   | Lucide React               | 统一且美观的 SVG 图标集            |

---

## 📁 项目结构概览

```bash
Prisma/
├── components/
│   ├── sidebar/         # 侧边栏子组件与最近对话浮层
│   ├── settings/        # 配置面板 (Model, Thinking Levels, Github)
│   │   ├── ApiBaseUrlInput.tsx
│   │   ├── ApiConfigFields.tsx
│   │   ├── ApiKeyInput.tsx
│   │   ├── ApiProviderControl.tsx
│   │   ├── GithubSection.tsx
│   │   ├── LevelSelect.tsx
│   │   ├── ModelSection.tsx
│   │   ├── modelSettings.ts
│   │   ├── SettingsModal.tsx
│   │   └── ThinkingSection.tsx
│   ├── AttachmentRenderer.tsx # 附件渲染
│   ├── ChatArea.tsx     # 消息流渲染
│   ├── ChatInput.tsx    # 输入区域
│   ├── ChatMessage.tsx  # 单条消息组件
│   ├── ErrorBoundary.tsx # 错误边界
│   ├── Header.tsx       # 顶部导航栏
│   ├── LazyMarkdownRenderer.tsx # 懒加载 Markdown 渲染器
│   ├── Logo.tsx         # Logo 组件
│   ├── MarkdownRenderer.tsx # Markdown 渲染
│   ├── ProcessFlow.tsx  # 核心：推理流程可视化组件
│   ├── ProcessNode.tsx  # 流程节点组件
│   └── Sidebar.tsx      # 侧边栏（会话列表）
├── hooks/
│   ├── useDeepThink.ts  # 深度思考运行时与 React 状态桥接
│   ├── useDeepThinkState.ts # 深度思考状态管理
│   ├── useAppLogic.ts   # 应用状态编排
│   ├── useChatMessageActions.ts # 消息编辑/重试/分支动作
│   └── useChatSessions.ts # 聊天会话持久化
├── styles/
│   ├── markdown.css     # Markdown 与表格排版
│   ├── theme.css        # 主题 token 与基础布局
│   └── utilities.css    # 滚动条、动画与工具类
├── services/
│   ├── deepThink/       # AI 提示词与业务逻辑
│   │   ├── manager.ts   # 规划与审查
│   │   ├── expert.ts    # 专家生成流
│   │   ├── synthesis.ts # 最终综合流
│   │   ├── orchestrator.ts # 核心：多智能体编排逻辑
│   │   ├── contentBuilder.ts # 内容构建器
│   │   ├── openaiClient.ts   # OpenAI 兼容客户端
│   │   └── prompts.ts  # 提示词模板
│   ├── storage.ts       # 本地存储服务
│   └── utils/
│       └── retry.ts     # 重试与错误处理
├── api.ts               # SDK 初始化与拦截器
├── config.ts            # 模型参数与预算定义
├── types.ts             # TypeScript 类型定义
├── utils.ts             # 工具函数
├── App.tsx              # 应用主组件
├── index.tsx            # 应用入口
├── index.html           # HTML 模板
├── index.css            # Tailwind 入口
├── metadata.json        # 应用元数据
├── tests/               # Vitest 与 Testing Library 测试
├── docs/                # 设计与修复计划文档
├── vite.config.ts       # Vite 构建配置
└── tsconfig.json        # TypeScript 配置
```

---

## ❤️ 赞助与支持

如果您觉得 Prisma 提升了您对 AI 推理能力的认知，欢迎请开发者喝杯咖啡，支持项目的持续维护！☕

**赞赏通道（爱发电）：** [https://afdian.com/a/gemini-nexus](https://afdian.com/a/gemini-nexus)

<div align="center">
  <a href="https://afdian.com/a/gemini-nexus" target="_blank">
    <img src="https://github.com/user-attachments/assets/b833ac9b-ca8d-4ff6-b83c-f3b2b0094aa8" width="200" alt="afdian-yeahhe">
  </a>
  <p><b>扫描上方二维码或 <a href="https://afdian.com/a/gemini-nexus" target="_blank">点击此处</a> 前往爱发电支持我</b></p>
</div>

## 🤝 贡献

欢迎提交 Pull Request！无论是优化 Prompt 策略、改进 UI 交互还是修复 Bug，您的贡献都将帮助 Prisma 变得更聪明。

## 📄 许可证

MIT License

---

## 友链

- [Linux.do](https://linux.do/)：也称 L 站，是一个活跃的中文技术社区，围绕 AI、软件开发、资源分享与前沿资讯展开讨论；社区愿景是“新的理想型社区”，社区文化是“真诚、友善、团结、专业，共建你我引以为荣之社区”。
