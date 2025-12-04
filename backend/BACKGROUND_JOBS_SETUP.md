# Background Jobs System - Setup Guide

This document explains how to set up and use the background job system for improved UX.

## Architecture Overview

The system uses **Celery** with **Redis** as the message broker to handle heavy operations in the background:

1. **FastAPI endpoints** return `202 Accepted` immediately
2. **Celery workers** process tasks asynchronously
3. **WebSocket** provides real-time updates to the frontend
4. **Status Center** shows optimistic UI updates

## Backend Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

This installs:
- `celery==5.3.4` - Task queue
- `redis==5.0.1` - Message broker

### 2. Start Redis

**macOS (using Homebrew):**
```bash
brew install redis
brew services start redis
```

**Docker:**
```bash
docker run -d -p 6379:6379 redis:latest
```

**Linux:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

### 3. Configure Environment Variables

Add to your `.env` file:

```env
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

### 4. Start Celery Worker

In a separate terminal:

```bash
cd backend
celery -A core.celery_app worker --loglevel=info
```

Or for development with auto-reload:

```bash
celery -A core.celery_app worker --loglevel=info --reload
```

### 5. Start FastAPI Server

```bash
cd backend
uvicorn main:app --reload
```

## API Endpoints

### Execute AI Task (Background)

**POST** `/execute`

Returns `202 Accepted` immediately and queues the task.

**Request:**
```json
{
  "task_description": "Navigate to example.com and check balance",
  "session_data": {
    "url": "https://example.com",
    "cookies": [],
    "localStorage": {}
  }
}
```

**Response (202 Accepted):**
```json
{
  "success": true,
  "message": "Task queued for execution",
  "execution_id": "uuid-here",
  "task_id": "celery-task-id",
  "status_url": "/api/tasks/{execution_id}/status"
}
```

### Check Task Status

**GET** `/api/tasks/{execution_id}/status`

Returns current task status.

**Response:**
```json
{
  "execution_id": "uuid-here",
  "task_id": "celery-task-id",
  "status": "processing",  // pending, processing, completed, failed
  "celery_state": "STARTED",
  "websocket_url": "/ws/execution/{execution_id}"
}
```

### WebSocket Connection

**WS** `/ws/execution/{execution_id}`

Connect to receive real-time updates:

```javascript
const ws = new WebSocket(`ws://localhost:8000/ws/execution/${executionId}`);

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log(message);
  // {
  //   type: "task_started" | "step" | "screenshot" | "execution_completed" | "error",
  //   data: {...},
  //   timestamp: "2024-01-01T00:00:00"
  // }
};
```

## Frontend Usage

### Status Center

The `StatusCenter` component automatically appears when there are active background tasks.

**Example:**
```tsx
import { useStatusCenterContext } from "@/components/StatusCenterProvider";

function MyComponent() {
  const { addStatus, updateStatus, dismissStatus } = useStatusCenterContext();

  const handleSave = async () => {
    // Add optimistic status
    const statusId = addStatus({
      type: "sync",
      title: "Saving Will",
      description: "Syncing to secure vault...",
      status: "syncing",
    });

    try {
      // Make API call
      await saveWill();
      
      // Update status
      updateStatus(statusId, {
        status: "completed",
        description: "Saved successfully",
      });
      
      // Auto-dismiss after 3 seconds
      setTimeout(() => dismissStatus(statusId), 3000);
    } catch (error) {
      updateStatus(statusId, {
        status: "failed",
        description: "Save failed",
      });
    }
  };
}
```

### Optimistic Blockchain Transactions

```tsx
import { useStatusCenterContext } from "@/components/StatusCenterProvider";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";

function MyComponent() {
  const { addStatus, updateStatus, dismissStatus } = useStatusCenterContext();
  const { writeContract, data: hash } = useWriteContract();
  const { isConfirming, isSuccess, isError } = useWaitForTransactionReceipt({ hash });

  const handleTransaction = () => {
    // Show optimistic status immediately
    const statusId = addStatus({
      type: "blockchain",
      title: "Sending Transaction",
      description: "Broadcasting to blockchain...",
      status: "pending",
    });

    writeContract({...});

    // Track status updates
    useEffect(() => {
      if (isConfirming) {
        updateStatus(statusId, { status: "processing" });
      } else if (isSuccess) {
        updateStatus(statusId, { status: "completed" });
        setTimeout(() => dismissStatus(statusId), 3000);
      } else if (isError) {
        updateStatus(statusId, { status: "failed" });
      }
    }, [isConfirming, isSuccess, isError]);
  };
}
```

## Testing

### Test Celery Worker

```bash
# In Python shell
from services.tasks import execute_ai_task
result = execute_ai_task.delay(
    task_description="Test task",
    session_data=None,
    execution_id="test-123"
)
print(result.id)
```

### Test API Endpoint

```bash
curl -X POST http://localhost:8000/execute \
  -H "Content-Type: application/json" \
  -d '{
    "task_description": "Test task",
    "session_data": null
  }'
```

## Monitoring

### Celery Flower (Optional)

Install and run Flower for task monitoring:

```bash
pip install flower
celery -A core.celery_app flower
```

Access at: http://localhost:5555

### Redis CLI

```bash
redis-cli
> KEYS *
> GET celery-task-meta-{task-id}
```

## Production Considerations

1. **Use Redis Cluster** for high availability
2. **Use Database** instead of in-memory dict for task_id mapping
3. **Add retry logic** for failed tasks
4. **Monitor worker health** with health checks
5. **Scale workers** horizontally based on load
6. **Set appropriate timeouts** for tasks
7. **Use task priorities** for important operations

## Troubleshooting

### Worker not processing tasks

1. Check Redis is running: `redis-cli ping`
2. Check worker logs for errors
3. Verify Celery app configuration

### WebSocket not receiving updates

1. Check WebSocket connection is established
2. Verify `execution_id` matches between API and WebSocket
3. Check backend logs for WebSocket errors

### Tasks stuck in PENDING

1. Check worker is running
2. Verify Redis connection
3. Check worker logs for errors

