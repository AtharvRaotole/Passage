"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface UnclaimedAsset {
  source: string;
  property_type: string;
  holder_name: string;
  estimated_value?: number | string | null;
  state?: string;
  claim_id?: string;
  insurance_company?: string;
  policy_number?: string;
  bond_type?: string;
  serial_number?: string;
  face_value?: number | string;
  maturity_date?: string;
  note?: string;
}

interface RecoverySearchResult {
  success: boolean;
  execution_id: string;
  total_assets: UnclaimedAsset[];
  total_estimated_value: number;
  claim_forms: string[];
  sources: Record<string, any>;
}

export function RecoveryDashboard() {
  const { address } = useAccount();
  const [searchForm, setSearchForm] = useState({
    name: "",
    ssn: "",
    last_address: "",
  });
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<RecoverySearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedAssets, setSelectedAssets] = useState<Set<number>>(new Set());
  const [beneficiaryData, setBeneficiaryData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    relationship: "",
    ssn: "",
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      setError("Please connect your wallet");
      return;
    }

    setIsSearching(true);
    setError(null);
    setSearchResults(null);
    setSelectedAssets(new Set());

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}/api/recovery/search`,
        {
          name: searchForm.name,
          ssn: searchForm.ssn || undefined,
          last_address: searchForm.last_address || undefined,
          sources: ["all"],
        }
      );

      setSearchResults(response.data);
    } catch (err: any) {
      console.error("Recovery search error:", err);
      setError(err.response?.data?.detail || "Failed to search for unclaimed property");
    } finally {
      setIsSearching(false);
    }
  };

  const toggleAssetSelection = (index: number) => {
    const newSelected = new Set(selectedAssets);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedAssets(newSelected);
  };

  const handleApproveClaims = async () => {
    if (selectedAssets.size === 0) {
      setError("Please select at least one asset to claim");
      return;
    }

    if (!beneficiaryData.name || !beneficiaryData.address) {
      setError("Please fill in beneficiary information (name and address required)");
      return;
    }

    try {
      // For each selected asset, pre-fill claim forms if available
      const selectedAssetIndices = Array.from(selectedAssets);
      const selectedAssetsList = selectedAssetIndices.map(
        (idx) => searchResults?.total_assets[idx]
      );

      // In a real implementation, this would:
      // 1. Pre-fill claim forms with beneficiary data
      // 2. Generate claim packages
      // 3. Allow beneficiaries to review and submit

      alert(
        `Approved ${selectedAssets.size} asset(s) for claiming. Claim forms will be prepared with beneficiary information.`
      );

      // Reset selections
      setSelectedAssets(new Set());
    } catch (err: any) {
      setError(err.message || "Failed to approve claims");
    }
  };

  const formatCurrency = (value: number | string | null | undefined): string => {
    if (value === null || value === undefined) return "Unknown";
    if (typeof value === "string") {
      // Try to extract number from string
      const numMatch = value.match(/[\d,]+\.?\d*/);
      if (numMatch) {
        const num = parseFloat(numMatch[0].replace(/,/g, ""));
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(num);
      }
      return value;
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <Card className="bg-[#1a1a1a] border-[#00ff00]/20">
        <CardHeader>
          <CardTitle className="text-[#00ff00] font-mono">
            UNCLAIMED PROPERTY SEARCH
          </CardTitle>
          <CardDescription className="text-gray-400 font-mono">
            Search for unclaimed assets across MissingMoney.com, NAIC Life Insurance, and Treasury Hunt
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[#00ff00] font-mono">
                DECEASED NAME *
              </Label>
              <Input
                id="name"
                type="text"
                value={searchForm.name}
                onChange={(e) =>
                  setSearchForm({ ...searchForm, name: e.target.value })
                }
                required
                className="bg-[#0a0a0a] border-[#00ff00]/30 text-white font-mono"
                placeholder="Full name of the deceased"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ssn" className="text-[#00ff00] font-mono">
                SOCIAL SECURITY NUMBER (OPTIONAL)
              </Label>
              <Input
                id="ssn"
                type="text"
                value={searchForm.ssn}
                onChange={(e) =>
                  setSearchForm({ ...searchForm, ssn: e.target.value })
                }
                className="bg-[#0a0a0a] border-[#00ff00]/30 text-white font-mono"
                placeholder="XXX-XX-XXXX"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_address" className="text-[#00ff00] font-mono">
                LAST KNOWN ADDRESS (OPTIONAL)
              </Label>
              <Input
                id="last_address"
                type="text"
                value={searchForm.last_address}
                onChange={(e) =>
                  setSearchForm({ ...searchForm, last_address: e.target.value })
                }
                className="bg-[#0a0a0a] border-[#00ff00]/30 text-white font-mono"
                placeholder="Street address, City, State ZIP"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-900/20 border border-red-500/50 rounded text-red-400 font-mono text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isSearching || !address}
              className="w-full bg-[#00ff00] text-black hover:bg-[#00cc00] font-mono font-bold"
            >
              {isSearching ? "SEARCHING..." : "SEARCH FOR UNCLAIMED PROPERTY"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults && (
        <>
          <Card className="bg-[#1a1a1a] border-[#00ff00]/20">
            <CardHeader>
              <CardTitle className="text-[#00ff00] font-mono">
                DISCOVERED ASSETS
              </CardTitle>
              <CardDescription className="text-gray-400 font-mono">
                Total Estimated Value:{" "}
                {formatCurrency(searchResults.total_estimated_value)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {searchResults.total_assets.length === 0 ? (
                <div className="text-gray-400 text-center py-8 font-mono">
                  No unclaimed assets found. This could mean:
                  <ul className="list-disc list-inside mt-4 text-left space-y-2">
                    <li>No assets are currently unclaimed</li>
                    <li>The search needs additional information</li>
                    <li>Assets may be held under a different name variation</li>
                  </ul>
                </div>
              ) : (
                <div className="space-y-4">
                  {searchResults.total_assets.map((asset, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded border ${
                        selectedAssets.has(index)
                          ? "border-[#00ff00] bg-[#00ff00]/10"
                          : "border-[#00ff00]/20 bg-[#0a0a0a]"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <input
                              type="checkbox"
                              checked={selectedAssets.has(index)}
                              onChange={() => toggleAssetSelection(index)}
                              className="w-4 h-4 text-[#00ff00] bg-[#0a0a0a] border-[#00ff00]/30 rounded focus:ring-[#00ff00]"
                            />
                            <h3 className="text-lg font-mono font-bold text-[#00ff00]">
                              {asset.property_type}
                            </h3>
                            <span className="text-xs text-gray-400 font-mono px-2 py-1 bg-[#1a1a1a] rounded">
                              {asset.source}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mt-3 text-sm font-mono">
                            <div>
                              <span className="text-gray-400">Holder:</span>
                              <span className="text-white ml-2">
                                {asset.holder_name}
                              </span>
                            </div>
                            {asset.estimated_value !== null &&
                              asset.estimated_value !== undefined && (
                                <div>
                                  <span className="text-gray-400">
                                    Estimated Value:
                                  </span>
                                  <span className="text-[#00ff00] ml-2 font-bold">
                                    {formatCurrency(asset.estimated_value)}
                                  </span>
                                </div>
                              )}
                            {asset.state && (
                              <div>
                                <span className="text-gray-400">State:</span>
                                <span className="text-white ml-2">
                                  {asset.state}
                                </span>
                              </div>
                            )}
                            {asset.claim_id && (
                              <div>
                                <span className="text-gray-400">Claim ID:</span>
                                <span className="text-white ml-2 font-mono text-xs">
                                  {asset.claim_id}
                                </span>
                              </div>
                            )}
                            {asset.insurance_company && (
                              <div>
                                <span className="text-gray-400">
                                  Insurance Company:
                                </span>
                                <span className="text-white ml-2">
                                  {asset.insurance_company}
                                </span>
                              </div>
                            )}
                            {asset.policy_number && (
                              <div>
                                <span className="text-gray-400">
                                  Policy Number:
                                </span>
                                <span className="text-white ml-2 font-mono text-xs">
                                  {asset.policy_number}
                                </span>
                              </div>
                            )}
                            {asset.bond_type && (
                              <div>
                                <span className="text-gray-400">Bond Type:</span>
                                <span className="text-white ml-2">
                                  {asset.bond_type}
                                </span>
                              </div>
                            )}
                            {asset.serial_number && (
                              <div>
                                <span className="text-gray-400">
                                  Serial Number:
                                </span>
                                <span className="text-white ml-2 font-mono text-xs">
                                  {asset.serial_number}
                                </span>
                              </div>
                            )}
                            {asset.maturity_date && (
                              <div>
                                <span className="text-gray-400">
                                  Maturity Date:
                                </span>
                                <span className="text-white ml-2">
                                  {asset.maturity_date}
                                </span>
                              </div>
                            )}
                          </div>
                          {asset.note && (
                            <div className="mt-2 text-xs text-yellow-400 font-mono">
                              Note: {asset.note}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Beneficiary Information Form */}
          {searchResults.total_assets.length > 0 && (
            <Card className="bg-[#1a1a1a] border-[#00ff00]/20">
              <CardHeader>
                <CardTitle className="text-[#00ff00] font-mono">
                  BENEFICIARY INFORMATION
                </CardTitle>
                <CardDescription className="text-gray-400 font-mono">
                  Provide beneficiary details to pre-fill claim forms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[#00ff00] font-mono">
                      BENEFICIARY NAME *
                    </Label>
                    <Input
                      value={beneficiaryData.name}
                      onChange={(e) =>
                        setBeneficiaryData({
                          ...beneficiaryData,
                          name: e.target.value,
                        })
                      }
                      required
                      className="bg-[#0a0a0a] border-[#00ff00]/30 text-white font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[#00ff00] font-mono">
                      RELATIONSHIP TO DECEASED *
                    </Label>
                    <Input
                      value={beneficiaryData.relationship}
                      onChange={(e) =>
                        setBeneficiaryData({
                          ...beneficiaryData,
                          relationship: e.target.value,
                        })
                      }
                      required
                      className="bg-[#0a0a0a] border-[#00ff00]/30 text-white font-mono"
                      placeholder="e.g., Spouse, Child, Executor"
                    />
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label className="text-[#00ff00] font-mono">ADDRESS *</Label>
                    <Input
                      value={beneficiaryData.address}
                      onChange={(e) =>
                        setBeneficiaryData({
                          ...beneficiaryData,
                          address: e.target.value,
                        })
                      }
                      required
                      className="bg-[#0a0a0a] border-[#00ff00]/30 text-white font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[#00ff00] font-mono">PHONE</Label>
                    <Input
                      type="tel"
                      value={beneficiaryData.phone}
                      onChange={(e) =>
                        setBeneficiaryData({
                          ...beneficiaryData,
                          phone: e.target.value,
                        })
                      }
                      className="bg-[#0a0a0a] border-[#00ff00]/30 text-white font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[#00ff00] font-mono">EMAIL</Label>
                    <Input
                      type="email"
                      value={beneficiaryData.email}
                      onChange={(e) =>
                        setBeneficiaryData({
                          ...beneficiaryData,
                          email: e.target.value,
                        })
                      }
                      className="bg-[#0a0a0a] border-[#00ff00]/30 text-white font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[#00ff00] font-mono">
                      SSN (IF REQUIRED)
                    </Label>
                    <Input
                      value={beneficiaryData.ssn}
                      onChange={(e) =>
                        setBeneficiaryData({
                          ...beneficiaryData,
                          ssn: e.target.value,
                        })
                      }
                      className="bg-[#0a0a0a] border-[#00ff00]/30 text-white font-mono"
                      placeholder="XXX-XX-XXXX"
                    />
                  </div>
                </div>

                <div className="mt-6 flex gap-4">
                  <Button
                    onClick={handleApproveClaims}
                    disabled={selectedAssets.size === 0}
                    className="flex-1 bg-[#00ff00] text-black hover:bg-[#00cc00] font-mono font-bold"
                  >
                    APPROVE & PREPARE CLAIMS ({selectedAssets.size} SELECTED)
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Claim Forms */}
          {searchResults.claim_forms.length > 0 && (
            <Card className="bg-[#1a1a1a] border-[#00ff00]/20">
              <CardHeader>
                <CardTitle className="text-[#00ff00] font-mono">
                  DOWNLOADED CLAIM FORMS
                </CardTitle>
                <CardDescription className="text-gray-400 font-mono">
                  {searchResults.claim_forms.length} form(s) available
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {searchResults.claim_forms.map((form, index) => (
                    <div
                      key={index}
                      className="p-3 bg-[#0a0a0a] border border-[#00ff00]/20 rounded font-mono text-sm"
                    >
                      <a
                        href={`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}/api/recovery/claim-forms/${searchResults.execution_id}/${form.split("/").pop()}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#00ff00] hover:underline"
                      >
                        {form.split("/").pop()}
                      </a>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

