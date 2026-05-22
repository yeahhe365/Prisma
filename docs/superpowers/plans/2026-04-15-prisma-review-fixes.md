# Prisma Review Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore first-run usability, align env handling with docs, prevent silent attachment loss on OpenAI-compatible models, and bring the repo back to a clean TypeScript typecheck.

**Architecture:** Keep behavior changes small and local. Add a lightweight pure-function test layer around config/env and attachment handling, then wire those helpers into the existing app flow and update the SDK-facing types to match current packages.

**Tech Stack:** React 19, TypeScript, Vite 6, Vitest, OpenAI SDK 6.x, @google/genai 1.x

---

### Task 1: Add a regression test harness

**Files:**

- Modify: `package.json`
- Create: `tests/config.test.ts`
- Create: `tests/contentBuilder.test.ts`

- [ ] **Step 1: Write the failing tests**
- [ ] **Step 2: Run tests to verify they fail**
- [ ] **Step 3: Add the minimal test script/dependency support**
- [ ] **Step 4: Re-run targeted tests**

### Task 2: Fix startup defaults and env key compatibility

**Files:**

- Modify: `hooks/useAppLogic.ts`
- Modify: `api.ts`
- Modify: `vite-env.d.ts`
- Modify: `README.md`
- Test: `tests/config.test.ts`

- [ ] **Step 1: Write failing assertions for initial model and env fallback**
- [ ] **Step 2: Run the targeted test to verify failure**
- [ ] **Step 3: Implement the minimal helper and wiring changes**
- [ ] **Step 4: Re-run the targeted test and confirm pass**

### Task 3: Fix OpenAI-compatible attachment behavior

**Files:**

- Modify: `services/deepThink/contentBuilder.ts`
- Modify: `components/ChatInput.tsx`
- Modify: `App.tsx`
- Modify: `hooks/useAppLogic.ts`
- Test: `tests/contentBuilder.test.ts`

- [ ] **Step 1: Write failing assertions for text/code inline behavior and unsupported attachment detection**
- [ ] **Step 2: Run the targeted test to verify failure**
- [ ] **Step 3: Implement attachment conversion plus UI-side blocking/message surfacing for unsupported files**
- [ ] **Step 4: Re-run the targeted test and confirm pass**

### Task 4: Restore typecheck cleanliness

**Files:**

- Modify: `api.ts`
- Modify: `services/deepThink/openaiClient.ts`
- Modify: `services/deepThink/expert.ts`
- Modify: `services/deepThink/manager.ts`
- Modify: `services/deepThink/synthesis.ts`
- Modify: `services/deepThink/contentBuilder.ts`
- Modify: `components/Sidebar.tsx`

- [ ] **Step 1: Run `npx tsc --noEmit` and capture the current failures**
- [ ] **Step 2: Update SDK-facing types and narrowings to current package APIs**
- [ ] **Step 3: Re-run `npx tsc --noEmit` until clean**

### Task 5: Final verification

**Files:**

- Modify: `package.json` (if needed from Task 1)

- [ ] **Step 1: Run targeted tests**
- [ ] **Step 2: Run `npx tsc --noEmit`**
- [ ] **Step 3: Run `npm run lint`**
- [ ] **Step 4: Run `npm run build`**
