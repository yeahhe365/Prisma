# Prisma

<p align="center">
  <a href="./README.md">中文</a> | <a href="./README.en.md">English</a>
</p>

A visual multi-agent deep reasoning engine for user-configured Gemini API and OpenAI-compatible API models.

## Overview

A visual multi-agent deep reasoning engine with dynamic planning, reasoning visualization, and multi-session management. Prisma does not ship model presets; create the Gemini or OpenAI-compatible models you want to use in settings.

## Features

- Multi-agent collaborative reasoning.
- Visual task planning and reasoning traces.
- Supports user-created Gemini API and OpenAI-compatible model configurations.
- Modern React 19 + TypeScript + Vite project.

## Quick Start

- Run `npm install`.
- Run `npm run dev`.
- Open Settings -> Model Management and add at least one Gemini API or OpenAI-compatible API model.

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

The Docker image builds the static `dist/` bundle and serves it with a small Node runtime. Docker builds enable the local API proxy: the browser calls same-origin `/custom-api`, and the container makes the actual Gemini/OpenAI-compatible API request to avoid browser-side CORS limits.

Common model API hosts are allowed by default. To use a custom gateway or local model service, add allowed hosts:

```bash
PRISMA_PROXY_ALLOWED_HOSTS=api.example.com,host.docker.internal docker compose up --build
```

The proxy switch is injected only by the Dockerfile. Cloudflare Pages can keep using the existing pure-static `npm run build` flow, with direct browser API requests and no `/custom-api` runtime service.

Cloudflare Pages reads the root `.node-version`; this repository pins Node.js 22 so Pages, GitHub Actions, and Docker builds use the same major runtime.

## Configuration

- Create and manage model-specific API keys, base URLs, and providers for Gemini or OpenAI-compatible services.

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
