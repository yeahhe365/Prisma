
#  Prisma (v1.0.0)

<div align="center">

  <p>
    <strong>基于 Gemini 3 的可视化深度多智能体推理引擎</strong>
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

**Prisma** 是一款探索 **Google Gemini 3.0** 推理极限的实验性应用。它不仅仅是一个聊天机器人，更是一个**可视化的思维实验室**。

它引入了 **"深度多智能体推理 (Deep Multi-Agent Reasoning)"** 架构，将复杂的用户问题动态分解为子任务，分派给专门的 AI 专家角色并行处理。用户可以实时观看 AI 如何通过 **Manager（规划） -> Experts（执行） -> Synthesis（综合）** 的工作流来解决复杂问题。

## 🔗 在线体验

无需部署，直接体验 Prisma 的强大推理能力：

| 平台 | 入口 | 说明 |
| :--- | :--- | :--- |
| **Google AI Studio** | [🚀 **立即运行**](https://ai.studio/apps/drive/1JWPILJ3NT10NR4eOeGiqBi6OZuRaEszO?fullscreenApplet=true) | **推荐**。直接登录 Google 账号即可免费使用，无需配置 API Key，开箱即用。 |
| **Web 演示版** | [🌐 **访问网页**](https://prisma-8yz.pages.dev/) | 纯前端版本，**需要填写您自己的 Google API Key** 才能运行。 |

---

## ✨ 核心特性

### 🧠 深度多智能体架构 (Deep Reasoning)
*   **动态规划 (Manager Agent)**：根据用户的问题，智能分析并决定需要哪些领域的“专家”介入。
*   **并行专家池 (Expert Pool)**：系统会自动生成专门的 AI 角色（如“逻辑学家”、“代码架构师”、“历史研究员”），它们并行工作，互不干扰。
*   **递归优化 (Recursive Refinement)**：
    *   **自省循环**：Manager 会审查专家的输出。如果发现逻辑漏洞或信息缺失，会自动驳回并启动下一轮修正（支持最多 3 轮迭代）。
    *   **最终综合**：将分散的专家意见汇聚成一篇逻辑严密、内容详实的最终回复。

### 👁️ 全链路可视化
*   **思维流 (Process Flow)**：通过动态节点图展示当前的推理状态（Analyzing -> Working -> Reviewing -> Synthesizing）。
*   **透明化思考**：你可以点开每一个“专家卡片”，查看其私有的 **Internal Monologue (内部独白)** 和 **Draft Output (草稿)**。
*   **实时计时器**：精确追踪每个环节的耗时，了解 AI 的时间分配。

### ⚙️ 精细化控制
*   **思考预算 (Thinking Budget)**：
    *   支持为 **规划**、**执行**、**综合** 三个阶段分别设置思考深度（Minimal, Low, Medium, High）。
    *   这决定了模型在生成 Token 时分配给 "Thinking" 字段的配额。
*   **模型切换**：无缝切换 `Gemini 3 Flash` (速度优先) 和 `Gemini 3 Pro` (深度优先)。

### 🛠️ 现代化工程体验
*   **自定义 API 网关**：支持配置 Custom Base URL，方便国内用户通过反向代理连接。
*   **Markdown & LaTeX**：完美渲染复杂的数学公式、代码块和图表。
*   **本地优先**：所有会话历史存储在浏览器 LocalStorage 中，保护隐私。

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

### 3. 配置环境
在项目根目录创建 `.env.local` 文件并填入你的 API Key：
```env
GEMINI_API_KEY=your_api_key_here
```

### 4. 启动开发服务器
```bash
npm run dev
```
访问 `http://localhost:3000` 即可开始推理。

---

## 🛠️ 技术栈

| 模块 | 技术选型 | 说明 |
| :--- | :--- | :--- |
| **核心框架** | React 19 | 使用最新的 React Hooks 和并发特性 |
| **构建工具** | Vite 6 | 极速冷启动与热更新 |
| **AI SDK** | `@google/genai` (v1.34+) | Google 官方最新 SDK，支持 Thinking Config |
| **样式** | Tailwind CSS | 原子化 CSS，配合排版插件 |
| **数学渲染** | KaTeX + Remark Math | 高性能 LaTeX 公式渲染 |
| **代码高亮** | React Syntax Highlighter | VSCode 风格的代码块高亮 |
| **图标库** | Lucide React | 统一且美观的 SVG 图标集 |

---

## 📁 项目结构概览

```bash
prisma/
├── components/
│   ├── settings/       # 配置面板 (API, Thinking Levels)
│   ├── ChatArea.tsx    # 消息流渲染
│   ├── ProcessFlow.tsx # 核心：推理流程可视化组件
│   ├── ExpertCard.tsx  # 核心：专家状态卡片
│   └── ...
├── hooks/
│   ├── useDeepThink.ts # 核心：多智能体编排逻辑 (Manager -> Expert -> Synthesis)
│   ├── useAppLogic.ts  # 全局状态管理
│   └── ...
├── services/
│   ├── deepThink/      # AI 提示词与业务逻辑
│   │   ├── manager.ts  # 规划与审查
│   │   ├── expert.ts   # 专家生成流
│   │   └── synthesis.ts# 最终综合流
│   └── utils/          # 重试与错误处理
├── api.ts              # SDK 初始化与拦截器
└── config.ts           # 模型参数与预算定义
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
```
