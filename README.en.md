# Prisma

<p align="center">
  <a href="./README.md">中文</a> | <a href="./README.en.md">English</a>
</p>

A Gemini-powered visual multi-agent deep reasoning engine with dynamic planning, reasoning visualization, and multi-session management.

## Overview

A Gemini-powered visual multi-agent deep reasoning engine with dynamic planning, reasoning visualization, and multi-session management.

## Features

- Multi-agent collaborative reasoning.
- Visual task planning and reasoning traces.
- Supports Gemini API and OpenAI-compatible endpoints.
- Modern React 19 + TypeScript + Vite project.

## Quick Start

- Run `npm install`.
- Copy and configure environment variables.
- Run `npm run dev`.

## Docker Deployment

```bash
docker compose up --build
```

By default, this maps to `http://localhost:8081`. If that port is already in use, set `PRISMA_DOCKER_PORT` before starting.

Or:

```bash
docker build -t prisma .
docker run --rm -p 8081:80 prisma
```

The container builds the static `dist/` bundle and serves it with Nginx, while Cloudflare Pages can keep using the existing `npm run build` flow.

Cloudflare Pages reads the root `.node-version`; this repository pins Node.js 22 so Pages, GitHub Actions, and Docker builds use the same major runtime.

## Configuration

- Configure API keys and model settings for Gemini or OpenAI-compatible services.

## Tech Stack

- React
- TypeScript
- Vite
- Gemini API
- OpenAI-compatible API

## Project Structure

- `components`
- `services`
- `hooks`

## Contributing

Issues and pull requests are welcome. Before submitting changes, review the existing structure and keep contributions focused and verifiable.

---

## Related Community

- [Linux.do](https://linux.do/): an active Chinese tech community focused on AI, software development, resource sharing, and frontier technology discussions. Its vision is "a new ideal community", and its community culture emphasizes sincerity, friendliness, unity, and professionalism.

## License

License information is available in the repository `LICENSE` file.
