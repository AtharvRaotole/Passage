"use client";

import { useState, useEffect } from "react";

interface Counter {
  label: string;
  value: number;
  suffix: string;
  color: string;
}

export function LiveCounters() {
  const [counters, setCounters] = useState<Counter[]>([
    { label: "Estates Protected", value: 0, suffix: "", color: "text-[#00ff00]" },
    { label: "Value Protected", value: 0, suffix: "M", color: "text-[#00ff00]" },
    { label: "Time Saved", value: 0, suffix: "K hours", color: "text-[#00ff00]" },
  ]);

  useEffect(() => {
    // Initialize with realistic values
    setCounters([
      { label: "Estates Protected", value: 2847, suffix: "", color: "text-[#00ff00]" },
      { label: "Value Protected", value: 124, suffix: "M", color: "text-[#00ff00]" },
      { label: "Time Saved", value: 45, suffix: "K hours", color: "text-[#00ff00]" },
    ]);

    // Animate counters
    const interval = setInterval(() => {
      setCounters((prev) =>
        prev.map((counter) => ({
          ...counter,
          value: counter.value + (counter.label === "Estates Protected" ? 1 : 0.1),
        }))
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-12">
      {counters.map((counter, index) => (
        <div
          key={index}
          className="text-center p-6 bg-[#1a1a1a]/50 rounded-lg border border-[#00ff00]/20 backdrop-blur-sm"
        >
          <div className={`text-5xl font-mono font-bold ${counter.color} mb-2`}>
            {Math.floor(counter.value).toLocaleString()}
            {counter.suffix && <span className="text-3xl">{counter.suffix}</span>}
          </div>
          <div className="text-gray-400 font-mono text-sm">{counter.label}</div>
          <div className="text-xs text-gray-500 font-mono mt-1">
            <span className="text-green-400">●</span> Live
          </div>
        </div>
      ))}
    </div>
  );
}

