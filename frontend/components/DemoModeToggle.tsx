"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function DemoModeToggle() {
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    // Load demo mode from localStorage
    const saved = localStorage.getItem("demoMode");
    setDemoMode(saved === "true");
  }, []);

  const toggleDemoMode = () => {
    const newMode = !demoMode;
    setDemoMode(newMode);
    localStorage.setItem("demoMode", newMode.toString());
    
    // Show confirmation
    if (newMode) {
      alert("Demo Mode Enabled!\n\n- Timers are 100x faster (72 hours → 43 minutes)\n- All actions use mock sites\n- No real accounts will be affected\n\nReloading page...");
      window.location.reload();
    } else {
      alert("Demo Mode Disabled. Reloading page...");
      window.location.reload();
    }
  };

  return (
    <Card className="bg-[#1a1a1a] border-[#00ff00]/20">
      <CardHeader>
        <CardTitle className="text-[#00ff00] font-mono">DEMO MODE</CardTitle>
        <CardDescription className="text-gray-400 font-mono">
          Safe testing environment for demonstrations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-gray-400 font-mono">
            When enabled:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-300 font-mono ml-4">
            <li>Timers are 100x faster (72 hours → 43 minutes)</li>
            <li>All actions use mock sites (mock-facebook.com, mock-bank.com, etc.)</li>
            <li>No real accounts will be affected</li>
            <li>Uses testnet contracts</li>
            <li>Perfect for hackathon demos</li>
          </ul>
        </div>
        <Button
          onClick={toggleDemoMode}
          className={`w-full font-mono font-bold ${
            demoMode
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "bg-[#00ff00] text-black hover:bg-[#00cc00]"
          }`}
        >
          {demoMode ? "Disable Demo Mode" : "Enable Demo Mode"}
        </Button>
        {demoMode && (
          <div className="p-3 bg-yellow-900/20 rounded border border-yellow-500/30">
            <p className="text-xs text-yellow-400 font-mono">
              ⚠️ Demo Mode is currently active. All actions are safe and logged.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

