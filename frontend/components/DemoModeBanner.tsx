"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function DemoModeBanner() {
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    // Load demo mode from localStorage
    const saved = localStorage.getItem("demoMode");
    if (saved === "true") {
      setDemoMode(true);
    }
  }, []);

  const toggleDemoMode = () => {
    const newMode = !demoMode;
    setDemoMode(newMode);
    localStorage.setItem("demoMode", newMode.toString());
    
    // Reload to apply changes
    if (newMode) {
      window.location.reload();
    }
  };

  if (!demoMode) return null;

  return (
    <Card className="bg-yellow-900/30 border-yellow-500/50 mb-4">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🎭</div>
            <div>
              <p className="font-mono font-bold text-yellow-400">
                DEMO MODE ACTIVE
              </p>
              <p className="text-sm text-yellow-300 font-mono">
                No real accounts will be affected. All actions are logged but not executed.
              </p>
            </div>
          </div>
          <Button
            onClick={toggleDemoMode}
            variant="outline"
            className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-900/20 font-mono"
          >
            Exit Demo Mode
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

