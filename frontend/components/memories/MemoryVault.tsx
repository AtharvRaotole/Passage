"use client";

import { useState, useCallback, useRef } from "react";
import { useAccount } from "wagmi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { encryptMemory, uploadToIPFS } from "@/utils/memoryStorage";

interface Memory {
  id: string;
  type: "photo" | "video" | "letter" | "audio";
  file: File | null;
  preview?: string;
  title: string;
  description: string;
  date: string;
  encrypted: boolean;
  ipfsHash?: string;
  uploaded: boolean;
}

export function MemoryVault() {
  const { address } = useAccount();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [uploading, setUploading] = useState(false);
  const [newMemory, setNewMemory] = useState<Partial<Memory>>({
    type: "photo",
    title: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const type = file.type.startsWith("image/")
      ? "photo"
      : file.type.startsWith("video/")
      ? "video"
      : file.type.startsWith("audio/")
      ? "audio"
      : "letter";

    // Create preview for images
    let preview: string | undefined;
    if (type === "photo") {
      const reader = new FileReader();
      reader.onload = (e) => {
        setNewMemory((prev) => ({ ...prev, file, preview: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    } else {
      setNewMemory((prev) => ({ ...prev, file }));
    }
  }, []);

  const handleAddMemory = useCallback(async () => {
    if (!address || !newMemory.file || !newMemory.title) {
      alert("Please fill in all required fields");
      return;
    }

    const memory: Memory = {
      id: `memory_${Date.now()}`,
      type: newMemory.type as any,
      file: newMemory.file!,
      preview: newMemory.preview,
      title: newMemory.title,
      description: newMemory.description || "",
      date: newMemory.date || new Date().toISOString().split("T")[0],
      encrypted: false,
      uploaded: false,
    };

    setMemories((prev) => [...prev, memory]);
    setNewMemory({
      type: "photo",
      title: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    alert("Memory added to vault. Encrypt and upload to save permanently.");
  }, [address, newMemory, toast]);

  const handleEncryptAndUpload = useCallback(async (memoryId: string) => {
    if (!address) return;

    setUploading(true);
    try {
      const memory = memories.find((m) => m.id === memoryId);
      if (!memory || !memory.file) return;

      // Encrypt the file
      const encryptedData = await encryptMemory(memory.file, address);
      
      // Upload to IPFS
      const ipfsHash = await uploadToIPFS(encryptedData);

      // Update memory
      setMemories((prev) =>
        prev.map((m) =>
          m.id === memoryId
            ? { ...m, encrypted: true, ipfsHash, uploaded: true }
            : m
        )
      );

      alert(`Memory encrypted and uploaded to IPFS: ${ipfsHash.slice(0, 10)}...`);
    } catch (error: any) {
      alert(`Error: ${error.message || "Failed to encrypt and upload memory"}`);
    } finally {
      setUploading(false);
    }
  }, [address, memories, toast]);

  return (
    <div className="space-y-6">
      {/* Upload Form */}
      <Card className="bg-[#1a1a1a] border-[#00ff00]/20">
        <CardHeader>
          <CardTitle className="text-[#00ff00] font-mono">Add Memory</CardTitle>
          <CardDescription className="text-gray-400 font-mono">
            Upload photos, videos, letters, or audio recordings. All memories are encrypted and stored on IPFS.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[#00ff00] font-mono">Type</Label>
              <select
                value={newMemory.type}
                onChange={(e) => setNewMemory({ ...newMemory, type: e.target.value as any })}
                className="w-full bg-[#0a0a0a] border border-[#00ff00]/30 text-[#00ff00] font-mono p-2 rounded"
              >
                <option value="photo">Photo</option>
                <option value="video">Video</option>
                <option value="letter">Letter</option>
                <option value="audio">Audio</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-[#00ff00] font-mono">Date</Label>
              <Input
                type="date"
                value={newMemory.date}
                onChange={(e) => setNewMemory({ ...newMemory, date: e.target.value })}
                className="bg-[#0a0a0a] border-[#00ff00]/30 text-[#00ff00] font-mono"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-[#00ff00] font-mono">Title *</Label>
            <Input
              value={newMemory.title}
              onChange={(e) => setNewMemory({ ...newMemory, title: e.target.value })}
              placeholder="e.g., Family Vacation 2024"
              className="bg-[#0a0a0a] border-[#00ff00]/30 text-[#00ff00] font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[#00ff00] font-mono">Description</Label>
            <Textarea
              value={newMemory.description}
              onChange={(e) => setNewMemory({ ...newMemory, description: e.target.value })}
              placeholder="Tell the story behind this memory..."
              className="bg-[#0a0a0a] border-[#00ff00]/30 text-[#00ff00] font-mono min-h-[100px]"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[#00ff00] font-mono">File *</Label>
            <Input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              accept="image/*,video/*,audio/*,.txt,.pdf"
              className="bg-[#0a0a0a] border-[#00ff00]/30 text-[#00ff00] font-mono"
            />
            {newMemory.preview && (
              <img
                src={newMemory.preview}
                alt="Preview"
                className="mt-2 max-w-xs rounded border border-[#00ff00]/20"
              />
            )}
          </div>
          <Button
            onClick={handleAddMemory}
            disabled={!newMemory.file || !newMemory.title}
            className="w-full bg-[#00ff00] text-black hover:bg-[#00cc00] font-mono"
          >
            Add to Vault
          </Button>
        </CardContent>
      </Card>

      {/* Memories Grid */}
      <div>
        <h2 className="text-2xl font-mono font-bold text-[#00ff00] mb-4">
          Your Memories ({memories.length})
        </h2>
        {memories.length === 0 ? (
          <Card className="bg-[#1a1a1a] border-[#00ff00]/20">
            <CardContent className="pt-6 text-center py-12">
              <p className="text-gray-400 font-mono">No memories yet. Add your first memory above.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {memories.map((memory) => (
              <Card key={memory.id} className="bg-[#1a1a1a] border-[#00ff00]/20">
                <CardContent className="pt-6">
                  {memory.preview && (
                    <img
                      src={memory.preview}
                      alt={memory.title}
                      className="w-full h-48 object-cover rounded mb-4"
                    />
                  )}
                  <h3 className="font-mono font-bold text-[#00ff00] mb-2">{memory.title}</h3>
                  <p className="text-sm text-gray-400 font-mono mb-2">{memory.description}</p>
                  <p className="text-xs text-gray-500 font-mono mb-4">{memory.date}</p>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-mono ${
                      memory.uploaded ? "text-green-400" : "text-yellow-400"
                    }`}>
                      {memory.uploaded ? "✓ Uploaded" : "Pending"}
                    </span>
                    {!memory.uploaded && (
                      <Button
                        onClick={() => handleEncryptAndUpload(memory.id)}
                        disabled={uploading}
                        size="sm"
                        className="bg-[#00ff00] text-black hover:bg-[#00cc00] font-mono text-xs"
                      >
                        {uploading ? "Uploading..." : "Encrypt & Upload"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

