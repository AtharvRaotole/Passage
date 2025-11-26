"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react";

interface ExecutionStep {
  step: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  timestamp: string;
  error?: string;
}

interface TaskProgressProps {
  steps: ExecutionStep[];
  executionStatus: "idle" | "running" | "completed" | "failed";
}

export function TaskProgress({ steps, executionStatus }: TaskProgressProps) {
  const completedSteps = steps.filter(s => s.status === "completed").length;
  const totalSteps = steps.length || 1;
  const progress = (completedSteps / totalSteps) * 100;

  const getStatusIcon = (status: ExecutionStep["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-400" />;
      case "in_progress":
        return <Loader2 className="h-5 w-5 text-[#00ff00] animate-spin" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-400" />;
      default:
        return <Circle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: ExecutionStep["status"]) => {
    switch (status) {
      case "completed":
        return "✓";
      case "in_progress":
        return "⏳";
      case "failed":
        return "✗";
      default:
        return "○";
    }
  };

  return (
    <Card className="bg-[#1a1a1a] border-[#00ff00]/20">
      <CardHeader>
        <CardTitle className="text-[#00ff00] font-mono">TASK PROGRESS</CardTitle>
        <CardDescription className="text-gray-400 font-mono">
          {completedSteps} of {totalSteps} steps completed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={progress} className="h-2" />
        
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {steps.length === 0 ? (
            <div className="text-gray-500 font-mono text-sm py-4 text-center">
              Waiting for execution to start...
            </div>
          ) : (
            steps.map((step, index) => (
              <div
                key={index}
                className={`p-3 rounded border ${
                  step.status === "completed"
                    ? "bg-green-500/10 border-green-500/20"
                    : step.status === "in_progress"
                    ? "bg-[#00ff00]/10 border-[#00ff00]/20"
                    : step.status === "failed"
                    ? "bg-red-500/10 border-red-500/20"
                    : "bg-gray-800/50 border-gray-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(step.status)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-gray-200">
                        {getStatusText(step.status)} {step.step}
                      </span>
                    </div>
                    {step.error && (
                      <div className="text-xs text-red-400 font-mono mt-1">
                        Error: {step.error}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 font-mono mt-1">
                      {new Date(step.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

