"use client";

import { useState, useEffect, useCallback } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { ScreenshotCarousel } from "@/components/execution/ScreenshotCarousel";
import { TaskProgress } from "@/components/execution/TaskProgress";
import { ExecutionGraph } from "@/components/execution/ExecutionGraph";
import { LiveLogs } from "@/components/execution/LiveLogs";

interface ExecutionStep {
  step: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  timestamp: string;
  error?: string;
}

interface Screenshot {
  url: string;
  blurred_url: string;
  base64?: string;
  filename: string;
  timestamp: string;
  step_name: string;
}

export default function ExecutionDashboardPage() {
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [steps, setSteps] = useState<ExecutionStep[]>([]);
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [executionStatus, setExecutionStatus] = useState<"idle" | "running" | "completed" | "failed">("idle");
  const { toast } = useToast();

  const handleMessage = useCallback((message: any) => {
    const { type, data, timestamp } = message;

    switch (type) {
      case "execution_started":
        setExecutionStatus("running");
        setSteps([{
          step: "Execution Started",
          status: "completed",
          timestamp: timestamp
        }]);
        addLog(`[${new Date(timestamp).toLocaleTimeString()}] Execution started: ${data.task_description}`);
        toast({
          title: "Execution Started",
          description: "Agent execution has begun",
        });
        break;

      case "step":
        setSteps((prev) => {
          const existing = prev.findIndex(s => s.step === data.step);
          const newStep: ExecutionStep = {
            step: data.step,
            status: data.status === "completed" ? "completed" : 
                   data.status === "failed" ? "failed" : 
                   data.status === "in_progress" ? "in_progress" : "pending",
            timestamp: timestamp,
            error: data.error
          };

          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = newStep;
            return updated;
          } else {
            return [...prev, newStep];
          }
        });
        addLog(`[${new Date(timestamp).toLocaleTimeString()}] ${data.step}: ${data.status}`);
        break;

      case "screenshot":
        setScreenshots((prev) => [...prev, data]);
        addLog(`[${new Date(timestamp).toLocaleTimeString()}] Screenshot captured: ${data.step_name}`);
        break;

      case "execution_completed":
        setExecutionStatus(data.success ? "completed" : "failed");
        addLog(`[${new Date(timestamp).toLocaleTimeString()}] Execution ${data.success ? "completed" : "failed"}`);
        toast({
          title: data.success ? "Execution Completed" : "Execution Failed",
          description: data.success ? data.output : data.error,
          variant: data.success ? "default" : "destructive",
        });
        break;

      case "error":
        addLog(`[${new Date(timestamp).toLocaleTimeString()}] ERROR: ${data.error}`);
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
        break;

      case "retry":
        addLog(`[${new Date(timestamp).toLocaleTimeString()}] Retry attempt ${data.attempt}/${data.max_retries}`);
        break;

      default:
        addLog(`[${new Date(timestamp).toLocaleTimeString()}] ${type}: ${JSON.stringify(data)}`);
    }
  }, [toast]);

  const addLog = (log: string) => {
    setLogs((prev) => [...prev, log].slice(-100)); // Keep last 100 logs
  };

  const { isConnected, disconnect } = useWebSocket({
    executionId,
    onMessage: handleMessage,
    onError: (error) => {
      console.error("WebSocket error:", error);
      toast({
        title: "Connection Error",
        description: "Lost connection to execution server",
        variant: "destructive",
      });
    },
    onOpen: () => {
      addLog("Connected to execution server");
    },
    onClose: () => {
      addLog("Disconnected from execution server");
    },
    enabled: !!executionId && !isPaused,
  });

  const handlePause = () => {
    setIsPaused(true);
    disconnect();
    toast({
      title: "Execution Paused",
      description: "Execution has been paused",
    });
  };

  const handleResume = () => {
    setIsPaused(false);
    // Reconnect will happen automatically via useWebSocket
  };

  // Start execution (this would typically be triggered by a button or automatically)
  const startExecution = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_description: "Navigate to example.com and perform actions",
          session_data: {},
        }),
      });

      const data = await response.json();
      // Use execution ID from response or generate one
      const execId = data.execution_id || `exec_${Date.now()}`;
      setExecutionId(execId);
      
      // Extract execution ID from output if present
      if (!data.execution_id && data.output) {
        const match = data.output.match(/ID: ([a-f0-9-]+)/i);
        if (match) {
          setExecutionId(match[1]);
        }
      }
    } catch (error) {
      console.error("Error starting execution:", error);
      toast({
        title: "Error",
        description: "Failed to start execution",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#00ff00] font-mono mb-2">
              EXECUTION DASHBOARD
            </h1>
            <p className="text-gray-400 font-mono">
              Real-time agent execution monitoring
            </p>
          </div>
          <div className="flex gap-4">
            {executionStatus === "idle" && (
              <Button
                onClick={startExecution}
                className="bg-[#00ff00] text-black hover:bg-[#00cc00] font-mono"
              >
                Start Execution
              </Button>
            )}
            {executionStatus === "running" && !isPaused && (
              <Button
                onClick={handlePause}
                variant="destructive"
                className="font-mono"
              >
                ⏸ Pause Execution
              </Button>
            )}
            {isPaused && (
              <Button
                onClick={handleResume}
                className="bg-[#00ff00] text-black hover:bg-[#00cc00] font-mono"
              >
                ▶ Resume Execution
              </Button>
            )}
            <div className={`px-4 py-2 rounded font-mono ${
              isConnected ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
            }`}>
              {isConnected ? "● CONNECTED" : "○ DISCONNECTED"}
            </div>
          </div>
        </div>

        {/* Execution Graph */}
        <ExecutionGraph steps={steps} executionStatus={executionStatus} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Task Progress */}
            <TaskProgress steps={steps} executionStatus={executionStatus} />

            {/* Screenshot Carousel */}
            <ScreenshotCarousel screenshots={screenshots} />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Live Logs */}
            <LiveLogs logs={logs} />
          </div>
        </div>
      </div>
    </div>
  );
}

