# MVP Step 1: OpenClaw Gateway in Docker Compose

**Datum:** 2026-02-18
**Status:** Genehmigt
**Ziel:** Ein lauffähiger AI Agent mit Web-Chat-UI, deploybar via `docker compose up`

## Kontext

Pinchy ist Pre-MVP. Kein Code existiert. OpenClaw ist die Runtime-Grundlage. Schritt 1 bringt den OpenClaw Gateway in einen Docker-Container, sodass ein funktionierender Agent mit Web-Chat im Browser erreichbar ist.

## Entscheidungen

- **Ansatz A gewählt**: OpenClaw Gateway direkt nutzen statt eigenes UI zu bauen. Grund: Schnellster Weg zu einem lauffähigen Agent. Nichts wird weggeworfen — der Gateway bleibt die permanente Grundlage.
- **Kein eigener Node.js-Prozess**: OpenClaw wird direkt als Docker CMD gestartet, kein Wrapper-Script. YAGNI.
- **Kein Pinchy API Server in Schritt 1**: Kommt in Schritt 2.
- **Kein eigenes UI in Schritt 1**: OpenClaw's eingebautes WebChat reicht als temporäre Oberfläche.

## Projektstruktur

```
pinchy/
├── docker-compose.yml
├── Dockerfile
├── config/
│   └── openclaw.json
└── docs/plans/
```

## Dockerfile

```dockerfile
FROM node:22-slim
RUN npm install -g openclaw@latest
COPY config/openclaw.json /root/.openclaw/openclaw.json
EXPOSE 18789
CMD ["openclaw", "gateway", "--port", "18789"]
```

## Docker Compose

```yaml
services:
  pinchy:
    build: .
    ports:
      - "18789:18789"
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
```

Start: `ANTHROPIC_API_KEY=sk-... docker compose up`

## Agent-Konfiguration

```json
{
  "agent": {
    "model": "anthropic/claude-sonnet-4-20250514"
  }
}
```

Das Modell ist über die Umgebungsvariable konfigurierbar. Der API-Key wird ausschliesslich via Environment übergeben, nie in Config-Dateien.

## Erfolgskriterien

1. `docker compose up` startet ohne Fehler
2. `http://localhost:18789` zeigt OpenClaw WebChat
3. Agent antwortet auf Nachrichten

## Architektur-Übergang zu Schritt 2

```
Schritt 1 (jetzt):          Schritt 2 (danach):
┌──────────────┐             ┌──────────────┐
│ OpenClaw     │             │ Pinchy UI    │
│ WebChat      │             └──────┬───────┘
└──────┬───────┘                    │
       │                     ┌──────┴───────┐
       │                     │ Pinchy API   │
       │                     │ (Auth, RBAC) │
       │                     └──────┬───────┘
┌──────┴───────┐             ┌──────┴───────┐
│ OpenClaw     │             │ OpenClaw     │
│ Gateway      │             │ Gateway      │
└──────────────┘             └──────────────┘
```

Der Gateway aus Schritt 1 bleibt unverändert. Schritt 2 fügt den Pinchy API Server und das eigene Web UI als neue Docker-Services hinzu.
