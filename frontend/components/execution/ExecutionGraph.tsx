"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle, Loader2, XCircle, ArrowRight } from "lucide-react";

interface ExecutionStep {
  step: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  timestamp: string;
  error?: string;
}

interface ExecutionGraphProps {
  steps: ExecutionStep[];
  executionStatus: "idle" | "running" | "completed" | "failed";
}

export function ExecutionGraph({ steps, executionStatus }: ExecutionGraphProps) {
  // Define the execution flow nodes
  const nodes = [
    { id: "oracle", label: "Oracle Query", type: "oracle" },
    { id: "decryption", label: "Decrypt Credentials", type: "decryption" },
    { id: "agent1", label: "Agent 1 (Facebook)", type: "agent" },
    { id: "agent2", label: "Agent 2 (Gmail)", type: "agent" },
  ];

  const getNodeStatus = (nodeId: string): "pending" | "in_progress" | "completed" | "failed" => {
    // Map steps to nodes (simplified mapping)
    if (nodeId === "oracle" && steps.some(s => s.step.includes("Oracle"))) {
      const step = steps.find(s => s.step.includes("Oracle"));
      return step?.status || "pending";
    }
    if (nodeId === "decryption" && steps.some(s => s.step.includes("Decrypt"))) {
      const step = steps.find(s => s.step.includes("Decrypt"));
      return step?.status || "pending";
    }
    if (nodeId === "agent1" && steps.some(s => s.step.includes("Facebook"))) {
      const step = steps.find(s => s.step.includes("Facebook"));
      return step?.status || "pending";
    }
    if (nodeId === "agent2" && steps.some(s => s.step.includes("Gmail"))) {
      const step = steps.find(s => s.step.includes("Gmail"));
      return step?.status || "pending";
    }
    
    // Default: show first node as in_progress if running
    if (nodeId === "oracle" && executionStatus === "running") {
      return "in_progress";
    }
    
    return "pending";
  };

  const getNodeIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-6 w-6 text-green-400" />;
      case "in_progress":
        return <Loader2 className="h-6 w-6 text-[#00ff00] animate-spin" />;
      case "failed":
        return <XCircle className="h-6 w-6 text-red-400" />;
      default:
        return <Circle className="h-6 w-6 text-gray-500" />;
    }
  };

  const getNodeColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 border-green-500/50";
      case "in_progress":
        return "bg-[#00ff00]/20 border-[#00ff00]/50";
      case "failed":
        return "bg-red-500/20 border-red-500/50";
      default:
        return "bg-gray-800/50 border-gray-700";
    }
  };

  return (
    <Card className="bg-[#1a1a1a] border-[#00ff00]/20">
      <CardHeader>
        <CardTitle className="text-[#00ff00] font-mono">EXECUTION FLOW</CardTitle>
        <CardDescription className="text-gray-400 font-mono">
          Visual representation of agent execution pipeline
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center gap-4 overflow-x-auto pb-4">
          {nodes.map((node, index) => {
            const status = getNodeStatus(node.id);
            return (
              <div key={node.id} className="flex items-center gap-4">
                <div
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 min-w-[150px] ${getNodeColor(status)}`}
                >
                  {getNodeIcon(status)}
                  <span className="text-xs font-mono text-gray-300 text-center">
                    {node.label}
                  </span>
                </div>
                {index < nodes.length - 1 && (
                  <ArrowRight className="h-6 w-6 text-gray-600 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

