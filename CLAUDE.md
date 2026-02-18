# CLAUDE.md — Pinchy

## What is Pinchy?

Pinchy is an **enterprise AI agent platform** built on top of [OpenClaw](https://github.com/openclaw/openclaw). OpenClaw is the most powerful open-source AI agent runtime — but it's designed for individual power users. Pinchy adds the enterprise layer: permissions, audit trails, user management, and governance.

**Status: Pre-MVP.** This repo currently contains only project scaffolding (README, license, contributing guide). No application code has been written yet. Everything described below is the target architecture — not existing code.

### The Problem Pinchy Solves

Companies want AI agents but face a trilemma:
- **Cloud platforms** (Dust, Glean, Copilot Studio) → data leaves your servers. Non-starter for EU regulated industries.
- **Workflow builders** (n8n, Dify) → chain steps visually, but not autonomous agents.
- **Frameworks** (CrewAI, LangChain) → libraries, not platforms. No UI, no permissions, no deployment.
- **OpenClaw** → best agent runtime, but no multi-user, no RBAC, no audit trail.

### Target Architecture (NOT YET IMPLEMENTED)

```
┌─────────────────────────────────────────┐
│              Pinchy Platform             │
│                                         │
│  ┌──────────┐  ┌──────────┐  ┌───────┐ │
│  │ Web UI   │  │ REST API │  │ Admin │ │
│  └────┬─────┘  └────┬─────┘  └───┬───┘ │
│       │              │            │     │
│  ┌────┴──────────────┴────────────┴───┐ │
│  │         Permission Layer           │ │
│  │  (RBAC, Scoped Tools, Audit Log)   │ │
│  └────────────────┬───────────────────┘ │
│                   │                     │
│  ┌────────────────┴───────────────────┐ │
│  │        OpenClaw Runtime            │ │
│  │  (Agents, Sessions, Channels,      │ │
│  │   Plugins, MCP, Memory)            │ │
│  └────────────────────────────────────┘ │
│                                         │
│  🔌 Plugin Architecture                │
│  🔐 Role-Based Access Control          │
│  📋 Audit Trail (every agent action)   │
│  🔀 Cross-Channel Workflows            │
│  🏠 Self-Hosted & Offline-Capable      │
│  🤖 Model Agnostic (OpenAI, Anthropic, │
│     Ollama, local models)              │
└─────────────────────────────────────────┘
```

### Core Concepts (planned)

- **Plugin Architecture**: Agents get scoped tools (e.g., "Create Jira Ticket"), not raw shell access
- **RBAC**: Who can use which agent, what each agent can do — per team, per role
- **Audit Trail**: Every agent action logged — who, what, when. Compliance-ready
- **Cross-Channel Workflows**: Input on email, output on Slack. Properly routed and permissioned
- **Self-Hosted**: Your server, your data, your models. Works without internet
- **Docker Compose Deployment**: Single `docker compose up` to run everything

## Tech Stack (planned)

- **Runtime**: OpenClaw (Node.js/TypeScript)
- **Backend API**: Node.js + TypeScript
- **Frontend**: TBD (likely Astro or Next.js)
- **Database**: SQLite (dev) / PostgreSQL (production)
- **Auth**: TBD
- **Deployment**: Docker Compose
- **License**: AGPL-3.0

## Project Structure

```
pinchy/
├── CLAUDE.md          ← You are here
├── README.md          ← Public-facing project description
├── CONTRIBUTING.md    ← Contribution guidelines
├── CHANGELOG.md       ← Version history
├── LICENSE            ← AGPL-3.0
├── CODE_OF_CONDUCT.md
├── SECURITY.md
└── (source code coming soon)
```

## Development Guidelines

### Code Style
- TypeScript strict mode
- Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`
- One feature/fix per PR, small and focused
- **Test-Driven Development (TDD)**: Write the failing test first, then the implementation. No exceptions.
- Tests for all new features
- Update docs when behavior changes

### Architecture Principles
- **OpenClaw is the runtime** — don't reinvent what OpenClaw already does. Wrap it, extend it, govern it.
- **Plugin-first** — every integration should be a plugin, not hardcoded
- **Offline-first** — must work without internet (local models via Ollama)
- **API-first** — every UI action maps to a REST endpoint
- **Self-hosted** — no phone-home, no telemetry unless opt-in

### Key Decisions
- **AGPL-3.0 License**: Prevents proprietary cloud forks without giving back
- **Build-in-public**: Progress shared via blog + LinkedIn
- **OpenClaw dependency**: Pinchy is NOT a fork — it's a layer on top. OpenClaw stays upstream.

## Origin Story

Pinchy was born when an AI agent accidentally sent its entire internal reasoning process as a WhatsApp message to a friend — instead of a simple "Sure, let's grab lunch!" That moment proved: AI agents without proper guardrails are a liability, not an asset.

## Who's Behind This

**Clemens Helm** — Software developer, 20+ years experience, daily OpenClaw power user. Building Pinchy to solve the problems he hit running AI agents in his own business (Helmcraft GmbH).

- Website: [heypinchy.com](https://heypinchy.com)
- LinkedIn: [clemenshelm](https://linkedin.com/in/clemenshelm)
- GitHub: [heypinchy/pinchy](https://github.com/heypinchy/pinchy)

## Related Resources

- **Pinchy Website**: [heypinchy.com](https://heypinchy.com) — Astro site, hosted on AWS S3 + CloudFront. Source: `/Users/clemenshelm/projects/heypinchy/`
- **Clemens' Website**: [clemenshelm.com](https://clemenshelm.com) — Pinchy project page with origin story. Source: `/Users/clemenshelm/Projects/avenir/clemenshelm-com/`
- **OpenClaw Docs**: [docs.openclaw.ai](https://docs.openclaw.ai) — essential reading for understanding the runtime
- **OpenClaw Discord**: Active community, Clemens is a member. Useful for upstream questions.
- **Pinchy Brand & Voice**: English, "We" perspective, Basecamp-inspired tone. Lobster humor welcome. See `heypinchy.com` for examples.

## Competitor Landscape

Know these when making architectural decisions:

| Category | Players | Why Pinchy is different |
|----------|---------|----------------------|
| Cloud SaaS | Dust, Glean, StackAI | Data leaves company. Pinchy = self-hosted. |
| Workflow builders | n8n, Dify | Visual step chains, not autonomous agents. |
| Vendor lock-in | MS Copilot Studio, Google AgentSpace | Single-model, proprietary. Pinchy = model-agnostic. |
| Frameworks | CrewAI, LangChain, AutoGen | Libraries, not platforms. No UI/permissions/deploy. |
| OpenClaw | OpenClaw | Best runtime, but no enterprise governance layer. |

## Useful Commands

```bash
# Nothing to run yet — project is pre-MVP
# Future:
# npm install
# npm run dev
# npm test
# docker compose up
```

## Context for AI Assistants

When working on this project:
1. **Nothing is implemented yet** — all architecture descriptions are plans, not code
2. **OpenClaw is the foundation** — familiarize yourself with [OpenClaw docs](https://docs.openclaw.ai) before making architectural decisions
3. **Keep it simple** — prefer boring, proven technology over clever abstractions
4. **Test everything** — no PR without tests
5. **Think enterprise** — every feature must work for a team of 50, not just one developer
6. **Don't reinvent OpenClaw** — if OpenClaw already does it, use it. Pinchy wraps, extends, and governs — it doesn't replace.
7. **"Sell before you build"** — the website describes features as vision. Don't reference the website as documentation of existing functionality.
8. **AGPL matters** — any code suggestion must be compatible with AGPL-3.0. No proprietary dependencies.
9. **Pinchy's key differentiator is agent permissions/control** — not just multi-user, but granular agent permissions, RBAC, audit trail. This is the core value prop.
10. **Build in Public** — assume all code, decisions, and progress will be shared publicly. No secrets in commits.
