"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface LitNode {
  id: string;
  location: string;
  country: string;
  region: string;
  coordinates: { lat: number; lng: number };
  status: "active" | "standby";
  uptime: number;
}

export function LitNodeMap() {
  const [nodes, setNodes] = useState<LitNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock Lit Protocol node data
    // In production, this would fetch from Lit Protocol's API
    const mockNodes: LitNode[] = [
      {
        id: "node-1",
        location: "US-East",
        country: "United States",
        region: "Virginia",
        coordinates: { lat: 38.9072, lng: -77.0369 },
        status: "active",
        uptime: 99.9,
      },
      {
        id: "node-2",
        location: "EU-West",
        country: "Ireland",
        region: "Dublin",
        coordinates: { lat: 53.3498, lng: -6.2603 },
        status: "active",
        uptime: 99.8,
      },
      {
        id: "node-3",
        location: "AP-Southeast",
        country: "Singapore",
        region: "Singapore",
        coordinates: { lat: 1.3521, lng: 103.8198 },
        status: "active",
        uptime: 99.7,
      },
      {
        id: "node-4",
        location: "US-West",
        country: "United States",
        region: "California",
        coordinates: { lat: 37.7749, lng: -122.4194 },
        status: "active",
        uptime: 99.6,
      },
      {
        id: "node-5",
        location: "EU-Central",
        country: "Germany",
        region: "Frankfurt",
        coordinates: { lat: 50.1109, lng: 8.6821 },
        status: "standby",
        uptime: 99.5,
      },
    ];

    setNodes(mockNodes);
    setLoading(false);
  }, []);

  return (
    <div className="space-y-6">
      <Card className="bg-[#1a1a1a] border-[#00ff00]/20">
        <CardHeader>
          <CardTitle className="text-[#00ff00] font-mono">Lit Protocol Node Network</CardTitle>
          <CardDescription className="text-gray-400 font-mono">
            Geographic distribution of Lit Protocol nodes handling your encryption
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Simple Map Visualization */}
          <div className="relative w-full h-96 bg-[#0a0a0a] rounded border border-[#00ff00]/20 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-400 font-mono mb-2">🌍</p>
                <p className="text-gray-500 font-mono text-sm">Interactive Map View</p>
                <p className="text-gray-600 font-mono text-xs mt-1">
                  (In production: Integration with Mapbox/Google Maps)
                </p>
              </div>
            </div>
            
            {/* Node markers (simplified visualization) */}
            {nodes.map((node, index) => (
              <div
                key={node.id}
                className="absolute"
                style={{
                  left: `${20 + (index * 15)}%`,
                  top: `${30 + (index % 2) * 30}%`,
                }}
              >
                <div className={`w-4 h-4 rounded-full ${
                  node.status === "active" ? "bg-[#00ff00]" : "bg-yellow-400"
                } animate-pulse`} />
                <div className="absolute top-5 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                  <p className="text-xs font-mono text-[#00ff00] bg-[#0a0a0a] px-2 py-1 rounded border border-[#00ff00]/20">
                    {node.location}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Node Details */}
          <div className="space-y-2">
            {nodes.map((node) => (
              <div
                key={node.id}
                className="p-3 bg-[#0a0a0a] rounded border border-[#00ff00]/10 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    node.status === "active" ? "bg-[#00ff00]" : "bg-yellow-400"
                  }`} />
                  <div>
                    <p className="font-mono text-[#00ff00] text-sm">{node.location}</p>
                    <p className="text-xs text-gray-400 font-mono">
                      {node.country}, {node.region}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono text-gray-300">{node.uptime}% uptime</p>
                  <p className="text-xs font-mono text-gray-500">
                    {node.status === "active" ? "Active" : "Standby"}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 bg-[#00ff00]/10 rounded border border-[#00ff00]/20">
            <p className="text-sm font-mono text-[#00ff00] mb-2">Network Resilience</p>
            <ul className="list-disc list-inside space-y-1 text-xs text-gray-400 font-mono ml-2">
              <li>Nodes distributed across 5+ geographic regions</li>
              <li>No single point of failure</li>
              <li>Automatic failover to standby nodes</li>
              <li>99.5%+ uptime SLA</li>
              <li>Compliance with regional data regulations</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

