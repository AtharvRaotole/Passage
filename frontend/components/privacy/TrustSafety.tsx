"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CryptographicProof } from "./CryptographicProof";
import { LitNodeMap } from "./LitNodeMap";
import { SecurityVerification } from "./SecurityVerification";
import { SecurityReport } from "./SecurityReport";

interface TrustSafetyProps {
  userAddress?: string;
}

export function TrustSafety({ userAddress }: TrustSafetyProps) {
  const [activeSection, setActiveSection] = useState<"proof" | "nodes" | "verify" | "report">("proof");

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex gap-4 border-b border-[#00ff00]/20">
        <Button
          variant={activeSection === "proof" ? "default" : "ghost"}
          onClick={() => setActiveSection("proof")}
          className={`font-mono ${
            activeSection === "proof"
              ? "bg-[#00ff00] text-black"
              : "text-gray-400 hover:text-[#00ff00]"
          }`}
        >
          Cryptographic Proof
        </Button>
        <Button
          variant={activeSection === "nodes" ? "default" : "ghost"}
          onClick={() => setActiveSection("nodes")}
          className={`font-mono ${
            activeSection === "nodes"
              ? "bg-[#00ff00] text-black"
              : "text-gray-400 hover:text-[#00ff00]"
          }`}
        >
          Lit Protocol Nodes
        </Button>
        <Button
          variant={activeSection === "verify" ? "default" : "ghost"}
          onClick={() => setActiveSection("verify")}
          className={`font-mono ${
            activeSection === "verify"
              ? "bg-[#00ff00] text-black"
              : "text-gray-400 hover:text-[#00ff00]"
          }`}
        >
          Verify Security
        </Button>
        <Button
          variant={activeSection === "report" ? "default" : "ghost"}
          onClick={() => setActiveSection("report")}
          className={`font-mono ${
            activeSection === "report"
              ? "bg-[#00ff00] text-black"
              : "text-gray-400 hover:text-[#00ff00]"
          }`}
        >
          Security Report
        </Button>
      </div>

      {/* Content */}
      {activeSection === "proof" && <CryptographicProof userAddress={userAddress} />}
      {activeSection === "nodes" && <LitNodeMap />}
      {activeSection === "verify" && <SecurityVerification />}
      {activeSection === "report" && <SecurityReport userAddress={userAddress} />}
    </div>
  );
}

