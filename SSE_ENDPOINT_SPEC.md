# SSE Endpoint Specification for Job Status Updates

This document describes the Server-Sent Events (SSE) endpoint required for real-time job status updates in the Nexus web application.

## Endpoint

```
GET /projects/{project_id}/jobs/{job_id}/stream
```

### Authentication

Since `EventSource` doesn't support custom headers, authentication is passed via query parameter:

```
GET /projects/{project_id}/jobs/{job_id}/stream?token={access_token}
```

> **Security Note**: The token parameter should be validated on every request. Consider using short-lived tokens or implementing token rotation for long-running SSE connections.

---

## Response Format

The endpoint must return SSE-formatted events with `Content-Type: text/event-stream`.

### Event Structure

```
event: {event_type}
data: {json_payload}

```

Note: Events are separated by double newlines.

### Event Types

| Event Type  | Description                                  |
| ----------- | -------------------------------------------- |
| `status`    | Job status changed (e.g., pending → running) |
| `progress`  | Progress percentage updated                  |
| `complete`  | Job finished (success or failure)            |
| `error`     | Error occurred                               |
| `heartbeat` | Keep-alive (sent every 15-30 seconds)        |

### JSON Payload

```json
{
  "type": "progress",
  "job_id": "uuid-string",
  "status": "running",
  "progress_percent": 45,
  "message": "Training XGBoost model...",
  "error": null,
  "timestamp": "2025-01-15T15:30:00Z"
}
```

### Status Values

| Status      | Description                   |
| ----------- | ----------------------------- |
| `pending`   | Job created, waiting to start |
| `queued`    | Job in queue                  |
| `running`   | Actively processing           |
| `completed` | Successfully finished         |
| `failed`    | Finished with error           |
| `cancelled` | User cancelled                |

---

## FastAPI Implementation Example

````python
from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import StreamingResponse
from typing import AsyncGenerator
import asyncio
import json
from datetime import datetime

app = FastAPI()

async def job_status_generator(
    project_id: str,
    job_id: str,
    token: str
) -> AsyncGenerator[str, None]:
    """Generate SSE events for job status updates."""

    # Validate token (implement your auth logic)
    # user = await validate_token(token)
    # if not user:
    #     yield f"event: error\ndata: {json.dumps({'error': 'Unauthorized'})}\n\n"
    #     return

    try:
        last_status = None
        last_progress = 0
        heartbeat_interval = 15  # seconds
        last_heartbeat = datetime.now()

        while True:
            # Get current job status from database
            job = await get_job_from_db(job_id)

            if not job:
                yield format_sse_event("error", {
                    "type": "error",
                    "job_id": job_id,
                    "error": "Job not found",
                    "timestamp": datetime.utcnow().isoformat()
                })
                break

            # Send update if status or progress changed
            if job.status != last_status or job.progress_percent != last_progress:
                event_type = "complete" if job.status in ["completed", "failed", "cancelled"] else "progress"

                yield format_sse_event(event_type, {
                    "type": event_type,
                    "job_id": job_id,
                    "status": job.status,
                    "progress_percent": job.progress_percent,
                    "message": job.message,
                    "error": job.error,
                    "timestamp": datetime.utcnow().isoformat()
                })

                last_status = job.status
                last_progress = job.progress_percent

                # Exit if job is complete
                if job.status in ["completed", "failed", "cancelled"]:
                    break

            # Send heartbeat to keep connection alive
            elif (datetime.now() - last_heartbeat).seconds >= heartbeat_interval:
                yield format_sse_event("heartbeat", {
                    "type": "heartbeat",
                    "job_id": job_id,
                    "timestamp": datetime.utcnow().isoformat()
                })
                last_heartbeat = datetime.now()

            # Poll interval - adjust based on your needs
            await asyncio.sleep(2)

    except asyncio.CancelledError:
        # Client disconnected
        pass
    except Exception as e:
        yield format_sse_event("error", {
            "type": "error",
            "job_id": job_id,
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        })


def format_sse_event(event_type: str, data: dict) -> str:
    """Format data as an SSE event."""
    return f"event: {event_type}\ndata: {json.dumps(data)}\n\n"


@app.get("/projects/{project_id}/jobs/{job_id}/stream")
async def stream_job_status(
    project_id: str,
    job_id: str,
    token: str = Query(..., description="Access token for authentication")
):
    """
    Stream job status updates via Server-Sent Events.

    The client should connect using EventSource:
    ```javascript
    const eventSource = new EventSource(`/projects/${projectId}/jobs/${jobId}/stream?token=${token}`);
    eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Job update:', data);
    };
    ```
    """
    return StreamingResponse(
        job_status_generator(project_id, job_id, token),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        }
    )
````

---

## Database Polling vs. Message Queue

The example above uses database polling. For better performance, consider:

### Option A: Redis Pub/Sub

```python
async def job_status_generator_redis(job_id: str, token: str):
    pubsub = redis.pubsub()
    await pubsub.subscribe(f"job:{job_id}:status")

    async for message in pubsub.listen():
        if message["type"] == "message":
            data = json.loads(message["data"])
            yield format_sse_event(data["type"], data)
            if data["status"] in ["completed", "failed"]:
                break
```

### Option B: PostgreSQL NOTIFY/LISTEN

```python
async def job_status_generator_pg(job_id: str, token: str):
    conn = await asyncpg.connect(DATABASE_URL)
    await conn.add_listener(f"job_{job_id}", handle_notification)
    # ...
```

---

## CORS Configuration

Ensure your FastAPI app allows SSE from the web frontend:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend-domain.com"],
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)
```

---

## Testing the Endpoint

### Using curl:

```bash
curl -N "http://localhost:8000/projects/123/jobs/456/stream?token=your_token"
```

### Using httpie:

```bash
http --stream GET "localhost:8000/projects/123/jobs/456/stream?token=your_token"
```
