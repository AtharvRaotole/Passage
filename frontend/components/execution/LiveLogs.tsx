"use client";

import { useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface LiveLogsProps {
  logs: string[];
}

export function LiveLogs({ logs }: LiveLogsProps) {
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <Card className="bg-[#1a1a1a] border-[#00ff00]/20">
      <CardHeader>
        <CardTitle className="text-[#00ff00] font-mono">LIVE LOGS</CardTitle>
        <CardDescription className="text-gray-400 font-mono">
          Real-time execution logs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-black rounded p-4 h-96 overflow-y-auto font-mono text-sm">
          {logs.length === 0 ? (
            <div className="text-gray-500">No logs yet...</div>
          ) : (
            logs.map((log, index) => (
              <div
                key={index}
                className={`mb-1 ${
                  log.includes("ERROR") || log.includes("Error")
                    ? "text-red-400"
                    : log.includes("completed") || log.includes("✓")
                    ? "text-green-400"
                    : "text-gray-300"
                }`}
              >
                {log}
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      </CardContent>
    </Card>
  );
}

