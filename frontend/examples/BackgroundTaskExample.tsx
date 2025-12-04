"use client";

/**
 * Example component showing how to use the background task system
 * with optimistic updates and WebSocket real-time updates
 */

import { useState } from "react";
import { useStatusCenterContext } from "@/components/StatusCenterProvider";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function BackgroundTaskExample() {
  const { addStatus, updateStatus, dismissStatus } = useStatusCenterContext();
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [taskDescription, setTaskDescription] = useState("");

  // Connect to WebSocket for real-time updates
  const { isConnected } = useWebSocket({
    executionId,
    onMessage: (message) => {
      const { type, data } = message;

      switch (type) {
        case "task_started":
          updateStatus(executionId!, {
            status: "processing",
            description: "AI agent is executing your task...",
          });
          break;

        case "step":
          updateStatus(executionId!, {
            status: "processing",
            description: `Step: ${data.step} - ${data.status}`,
            progress: data.progress,
          });
          break;

        case "execution_completed":
          if (data.success) {
            updateStatus(executionId!, {
              status: "completed",
              description: "Task completed successfully!",
            });
            // Auto-dismiss after 3 seconds
            setTimeout(() => dismissStatus(executionId!), 3000);
          } else {
            updateStatus(executionId!, {
              status: "failed",
              description: data.error || "Task failed",
            });
          }
          break;

        case "error":
          updateStatus(executionId!, {
            status: "failed",
            description: data.error || "An error occurred",
          });
          break;
      }
    },
    enabled: !!executionId,
  });

  const handleExecute = async () => {
    if (!taskDescription.trim()) return;

    // OPTIMISTIC UPDATE: Show status immediately
    const statusId = addStatus({
      type: "ai_task",
      title: "AI Task Execution",
      description: "Queuing task for background processing...",
      status: "pending",
    });

    try {
      // Call API endpoint - returns 202 Accepted immediately
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}/execute`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            task_description: taskDescription,
            session_data: null,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Update status with execution ID
      setExecutionId(data.execution_id);
      updateStatus(statusId, {
        executionId: data.execution_id,
        status: "processing",
        description: "Task queued, waiting for worker...",
      });

      // The WebSocket will handle further updates
    } catch (error: any) {
      console.error("Error executing task:", error);
      updateStatus(statusId, {
        status: "failed",
        description: error.message || "Failed to queue task",
      });
    }
  };

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-2xl font-bold">Background Task Example</h2>
      
      <div className="space-y-2">
        <Input
          value={taskDescription}
          onChange={(e) => setTaskDescription(e.target.value)}
          placeholder="Enter task description..."
          className="w-full"
        />
        <Button onClick={handleExecute} disabled={!taskDescription.trim()}>
          Execute Task
        </Button>
      </div>

      {executionId && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <p className="text-sm">
            <strong>Execution ID:</strong> {executionId}
          </p>
          <p className="text-sm">
            <strong>WebSocket:</strong>{" "}
            {isConnected ? "Connected" : "Connecting..."}
          </p>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-600">
        <p>
          <strong>How it works:</strong>
        </p>
        <ol className="list-decimal list-inside space-y-1 mt-2">
          <li>Click "Execute Task" - UI updates immediately (optimistic)</li>
          <li>API returns 202 Accepted with execution_id</li>
          <li>Task is queued in Celery/Redis</li>
          <li>WebSocket connects for real-time updates</li>
          <li>Status Center shows progress notifications</li>
          <li>Task completes in background worker</li>
          <li>Final status update via WebSocket</li>
        </ol>
      </div>
    </div>
  );
}

