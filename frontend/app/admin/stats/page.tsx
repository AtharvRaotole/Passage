"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminStats } from "@/components/admin/AdminStats";

export default function AdminStatsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#00ff00] p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-[#00ff00]/20 pb-4">
          <div>
            <h1 className="text-4xl font-mono font-bold text-[#00ff00]">ADMIN DASHBOARD</h1>
            <p className="text-gray-400 text-sm mt-2 font-mono">
              Real-time impact metrics and system statistics
            </p>
          </div>
        </div>

        <AdminStats />
      </div>
    </div>
  );
}

