"use client";

import { Card, CardContent } from "@/components/ui/card";

export function BeforeAfter() {
  return (
    <div className="my-16 space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-[#00ff00] mb-2 font-mono">
          Before vs. After Project Charon
        </h2>
        <p className="text-gray-400">
          See the transformation
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Before */}
        <Card className="bg-red-900/20 border-red-500/50">
          <CardContent className="pt-6">
            <h3 className="text-2xl font-mono font-bold text-red-400 mb-6">❌ BEFORE</h3>
            <ul className="space-y-3">
              {[
                "Months of manual paperwork",
                "Lost accounts and assets",
                "Family confusion and stress",
                "Legal fees: $5,000-$15,000",
                "Physical mail required",
                "No crypto asset protection",
                "Memories lost forever",
                "6-12 month probate process",
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-red-400 font-mono">✗</span>
                  <span className="text-gray-300 font-mono text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* After */}
        <Card className="bg-green-900/20 border-green-500/50">
          <CardContent className="pt-6">
            <h3 className="text-2xl font-mono font-bold text-green-400 mb-6">✅ AFTER</h3>
            <ul className="space-y-3">
              {[
                "10-minute automated setup",
                "All accounts automatically found",
                "Clear instructions for family",
                "Legal fees: $0 (automated)",
                "100% digital, zero paper",
                "Multi-chain crypto protection",
                "Beautiful memory books preserved",
                "Instant execution on verification",
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-green-400 font-mono">✓</span>
                  <span className="text-gray-300 font-mono text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Impact Summary */}
      <Card className="bg-[#1a1a1a]/50 border-[#00ff00]/20 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-mono font-bold text-[#00ff00] mb-1">90%</div>
              <div className="text-xs text-gray-400 font-mono">Time Saved</div>
            </div>
            <div>
              <div className="text-3xl font-mono font-bold text-[#00ff00] mb-1">$15K</div>
              <div className="text-xs text-gray-400 font-mono">Avg. Legal Fees Saved</div>
            </div>
            <div>
              <div className="text-3xl font-mono font-bold text-[#00ff00] mb-1">100%</div>
              <div className="text-xs text-gray-400 font-mono">Digital Process</div>
            </div>
            <div>
              <div className="text-3xl font-mono font-bold text-[#00ff00] mb-1">0</div>
              <div className="text-xs text-gray-400 font-mono">Paper Waste</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

