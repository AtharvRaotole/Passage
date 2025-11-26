"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface Stats {
  totalValueProtected: number; // in USD
  estatesAutomated: number;
  timeSaved: number; // in hours
  benefitsClaimed: number; // in USD
  carbonSaved: number; // in kg CO2
}

export function AdminStats() {
  const [stats, setStats] = useState<Stats>({
    totalValueProtected: 0,
    estatesAutomated: 0,
    timeSaved: 0,
    benefitsClaimed: 0,
    carbonSaved: 0,
  });

  const [loading, setLoading] = useState(true);

  // Simulate real-time updates
  useEffect(() => {
    // Initial load with realistic values
    setStats({
      totalValueProtected: 124500000, // $124.5M
      estatesAutomated: 2847,
      timeSaved: 45620,
      benefitsClaimed: 18700000, // $18.7M
      carbonSaved: 12450, // kg CO2
    });
    setLoading(false);

    // Update stats every 5 seconds (simulated growth)
    const interval = setInterval(() => {
      setStats((prev) => ({
        totalValueProtected: prev.totalValueProtected + Math.random() * 50000,
        estatesAutomated: prev.estatesAutomated + Math.floor(Math.random() * 3),
        timeSaved: prev.timeSaved + Math.random() * 10,
        benefitsClaimed: prev.benefitsClaimed + Math.random() * 5000,
        carbonSaved: prev.carbonSaved + Math.random() * 2,
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    return `$${value.toLocaleString()}`;
  };

  const formatNumber = (value: number) => {
    return Math.floor(value).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Value Protected */}
        <Card className="bg-[#1a1a1a] border-[#00ff00]/20">
          <CardHeader>
            <CardTitle className="text-[#00ff00] font-mono text-lg">Total Value Protected</CardTitle>
            <CardDescription className="text-gray-400 font-mono text-xs">
              Combined value of all estates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-mono font-bold text-[#00ff00] mb-2">
              {loading ? "..." : formatCurrency(stats.totalValueProtected)}
            </div>
            <div className="text-xs text-gray-400 font-mono">
              <span className="text-green-400">↑</span> +12.4% this month
            </div>
          </CardContent>
        </Card>

        {/* Estates Automated */}
        <Card className="bg-[#1a1a1a] border-[#00ff00]/20">
          <CardHeader>
            <CardTitle className="text-[#00ff00] font-mono text-lg">Estates Automated</CardTitle>
            <CardDescription className="text-gray-400 font-mono text-xs">
              Active digital estates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-mono font-bold text-[#00ff00] mb-2">
              {loading ? "..." : formatNumber(stats.estatesAutomated)}
            </div>
            <div className="text-xs text-gray-400 font-mono">
              <span className="text-green-400">↑</span> +{Math.floor(Math.random() * 5 + 10)} today
            </div>
          </CardContent>
        </Card>

        {/* Time Saved */}
        <Card className="bg-[#1a1a1a] border-[#00ff00]/20">
          <CardHeader>
            <CardTitle className="text-[#00ff00] font-mono text-lg">Time Saved</CardTitle>
            <CardDescription className="text-gray-400 font-mono text-xs">
              Hours of manual work automated
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-mono font-bold text-[#00ff00] mb-2">
              {loading ? "..." : formatNumber(stats.timeSaved)}
            </div>
            <div className="text-xs text-gray-400 font-mono">
              <span className="text-green-400">↑</span> +{Math.floor(Math.random() * 20 + 50)} hours today
            </div>
          </CardContent>
        </Card>

        {/* Benefits Claimed */}
        <Card className="bg-[#1a1a1a] border-[#00ff00]/20">
          <CardHeader>
            <CardTitle className="text-[#00ff00] font-mono text-lg">Benefits Claimed</CardTitle>
            <CardDescription className="text-gray-400 font-mono text-xs">
              Unclaimed assets recovered
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-mono font-bold text-[#00ff00] mb-2">
              {loading ? "..." : formatCurrency(stats.benefitsClaimed)}
            </div>
            <div className="text-xs text-gray-400 font-mono">
              <span className="text-green-400">↑</span> +8.2% this week
            </div>
          </CardContent>
        </Card>

        {/* Carbon Saved */}
        <Card className="bg-[#1a1a1a] border-[#00ff00]/20">
          <CardHeader>
            <CardTitle className="text-[#00ff00] font-mono text-lg">Carbon Saved</CardTitle>
            <CardDescription className="text-gray-400 font-mono text-xs">
              🌱 No physical mail required
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-mono font-bold text-[#00ff00] mb-2">
              {loading ? "..." : `${formatNumber(stats.carbonSaved)} kg`}
            </div>
            <div className="text-xs text-gray-400 font-mono">
              <span className="text-green-400">🌱</span> Equivalent to {Math.floor(stats.carbonSaved / 20)} trees planted
            </div>
          </CardContent>
        </Card>

        {/* Success Rate */}
        <Card className="bg-[#1a1a1a] border-[#00ff00]/20">
          <CardHeader>
            <CardTitle className="text-[#00ff00] font-mono text-lg">Success Rate</CardTitle>
            <CardDescription className="text-gray-400 font-mono text-xs">
              Successful estate executions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-mono font-bold text-[#00ff00] mb-2">
              98.7%
            </div>
            <div className="mt-2">
              <Progress value={98.7} className="h-2" />
            </div>
            <div className="text-xs text-gray-400 font-mono mt-2">
              {Math.floor(stats.estatesAutomated * 0.987)} successful executions
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Growth Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-[#1a1a1a] border-[#00ff00]/20">
          <CardHeader>
            <CardTitle className="text-[#00ff00] font-mono">Monthly Growth</CardTitle>
            <CardDescription className="text-gray-400 font-mono">
              Estates automated over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { month: "Jan", value: 1200 },
                { month: "Feb", value: 1450 },
                { month: "Mar", value: 1780 },
                { month: "Apr", value: 2100 },
                { month: "May", value: 2450 },
                { month: "Jun", value: 2847 },
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-4">
                  <span className="text-xs font-mono text-gray-400 w-12">{item.month}</span>
                  <div className="flex-1 bg-[#0a0a0a] rounded h-6 relative overflow-hidden">
                    <div
                      className="bg-[#00ff00] h-full rounded"
                      style={{ width: `${(item.value / 3000) * 100}%` }}
                    />
                    <span className="absolute left-2 top-0.5 text-xs font-mono text-black font-bold">
                      {item.value.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-[#00ff00]/20">
          <CardHeader>
            <CardTitle className="text-[#00ff00] font-mono">Value Distribution</CardTitle>
            <CardDescription className="text-gray-400 font-mono">
              Breakdown by estate size
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: "$1M+", count: 124, percentage: 45 },
                { label: "$500K-$1M", count: 342, percentage: 30 },
                { label: "$100K-$500K", count: 892, percentage: 20 },
                { label: "<$100K", count: 1489, percentage: 5 },
              ].map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-mono text-[#00ff00]">{item.label}</span>
                    <span className="text-sm font-mono text-gray-400">{item.count} estates</span>
                  </div>
                  <Progress value={item.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Activity Feed */}
      <Card className="bg-[#1a1a1a] border-[#00ff00]/20">
        <CardHeader>
          <CardTitle className="text-[#00ff00] font-mono">Real-Time Activity</CardTitle>
          <CardDescription className="text-gray-400 font-mono">
            Live updates from the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {[
              { time: "2s ago", event: "Estate #2847 registered", value: "$450K" },
              { time: "15s ago", event: "Benefits claimed", value: "$12.5K" },
              { time: "1m ago", event: "Estate #2846 automated", value: "$1.2M" },
              { time: "2m ago", event: "Memory book generated", value: "IPFS" },
              { time: "3m ago", event: "Estate #2845 registered", value: "$890K" },
            ].map((activity, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-[#0a0a0a] rounded border border-[#00ff00]/10"
              >
                <div>
                  <p className="text-sm font-mono text-[#00ff00]">{activity.event}</p>
                  <p className="text-xs font-mono text-gray-500">{activity.time}</p>
                </div>
                <span className="text-sm font-mono text-gray-300">{activity.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

