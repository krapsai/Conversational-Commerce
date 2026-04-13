# Agent Service

This folder contains the Python multi-agent backend for the storefront.

## Stack

- FastAPI
- LangGraph
- LangChain primitives
- OpenAI-compatible chat completions via Qwen API (`https://qwenapi.sbs/v1`)
- PostgreSQL for agent runtime state
- Kafka CDC consumer for mirroring catalog and commerce changes from the real DB

The storefront needs this service running on `AGENT_SERVICE_URL`.
If `AGENT_DATABASE_URL` is empty, the service falls back to `REAL_DATABASE_URL`.

## LLM configuration

Configure the agent service through the root `.env` or `agent_service/.env`:

```powershell
OPENAI_API_KEY=YOUR_QWEN_API_KEY
OPENAI_BASE_URL=https://qwenapi.sbs/v1
OPENAI_MODEL=qwen3.6-plus
```

The integration uses the OpenAI-compatible `/chat/completions` API exposed by `qwenapi.sbs`.

## Run locally

1. Start infrastructure from the repo root:

```powershell
docker compose up -d postgres agent-postgres kafka kafka-connect
```

2. Register the Debezium connector:

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri http://localhost:8083/connectors `
  -ContentType "application/json" `
  -InFile "..\\infra\\debezium\\real-db-source.json"
```

3. Install Python dependencies:

```powershell
py -3 -m pip install -r requirements.txt
```

4. Run the API server:

```powershell
py -3 -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

5. Run the CDC mirror consumer in a second terminal:

```powershell
py -3 -m app.cdc.consumer
```
