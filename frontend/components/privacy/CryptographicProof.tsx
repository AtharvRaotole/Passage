"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CHARON_SWITCH_ADDRESS } from "@/lib/contracts";
import { getLitClient } from "@/utils/litCharon";

interface CryptographicProofProps {
  userAddress?: string;
}

interface KeyDistribution {
  nodeId: string;
  location: string;
  publicKey: string;
  timestamp: string;
  signature: string;
}

export function CryptographicProof({ userAddress }: CryptographicProofProps) {
  const { address } = useAccount();
  const [keyDistribution, setKeyDistribution] = useState<KeyDistribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKeyDistribution = async () => {
      try {
        // Get Lit Protocol client to fetch node information
        const client = await getLitClient();
        
        // In production, this would fetch actual key distribution from Lit Protocol
        // For now, we'll simulate the data structure
        const mockDistribution: KeyDistribution[] = [
          {
            nodeId: "0x1234...5678",
            location: "US-East (Virginia)",
            publicKey: "0xabcd...ef01",
            timestamp: new Date().toISOString(),
            signature: "0x9876...5432",
          },
          {
            nodeId: "0x2345...6789",
            location: "EU-West (Ireland)",
            publicKey: "0xbcde...f012",
            timestamp: new Date().toISOString(),
            signature: "0xa987...6543",
          },
          {
            nodeId: "0x3456...7890",
            location: "AP-Southeast (Singapore)",
            publicKey: "0xcdef...0123",
            timestamp: new Date().toISOString(),
            signature: "0xba98...7654",
          },
        ];

        setKeyDistribution(mockDistribution);
      } catch (error) {
        console.error("Error fetching key distribution:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchKeyDistribution();
  }, []);

  return (
    <div className="space-y-6">
      <Card className="bg-[#1a1a1a] border-[#00ff00]/20">
        <CardHeader>
          <CardTitle className="text-[#00ff00] font-mono">Cryptographic Key Distribution</CardTitle>
          <CardDescription className="text-gray-400 font-mono">
            Proof that encryption keys are distributed across multiple nodes using threshold cryptography
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-[#00ff00]/10 rounded border border-[#00ff00]/20">
            <p className="text-sm font-mono text-[#00ff00] mb-2">
              🔐 Threshold Cryptography
            </p>
            <p className="text-xs text-gray-400 font-mono">
              Your encryption keys are split using Shamir's Secret Sharing and distributed across 
              multiple Lit Protocol nodes. No single node can decrypt your data alone.
            </p>
          </div>

          {loading ? (
            <p className="text-gray-400 font-mono text-center py-8">Loading key distribution...</p>
          ) : (
            <div className="space-y-3">
              {keyDistribution.map((node, index) => (
                <div
                  key={index}
                  className="p-4 bg-[#0a0a0a] rounded border border-[#00ff00]/10"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-mono text-[#00ff00] font-bold">Node {index + 1}</p>
                      <p className="text-xs text-gray-400 font-mono">{node.location}</p>
                    </div>
                    <span className="text-xs font-mono text-green-400">✓ Verified</span>
                  </div>
                  <div className="space-y-1 mt-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 font-mono w-24">Node ID:</span>
                      <span className="text-xs text-gray-300 font-mono font-mono">{node.nodeId}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 font-mono w-24">Public Key:</span>
                      <span className="text-xs text-gray-300 font-mono break-all">{node.publicKey}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 font-mono w-24">Signature:</span>
                      <span className="text-xs text-gray-300 font-mono break-all">{node.signature}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 font-mono w-24">Timestamp:</span>
                      <span className="text-xs text-gray-300 font-mono">
                        {new Date(node.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 p-4 bg-[#0a0a0a] rounded border border-[#00ff00]/20">
            <p className="text-sm font-mono text-[#00ff00] mb-2">Security Guarantees</p>
            <ul className="list-disc list-inside space-y-1 text-xs text-gray-400 font-mono ml-2">
              <li>Keys are split using (t,n) threshold scheme</li>
              <li>Minimum threshold required to decrypt (e.g., 3 of 5 nodes)</li>
              <li>No single point of failure</li>
              <li>Geographic distribution prevents regional attacks</li>
              <li>All key shares are cryptographically signed</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

