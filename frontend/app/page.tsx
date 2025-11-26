"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LiveCounters } from "@/components/landing/LiveCounters";
import { Testimonials } from "@/components/landing/Testimonials";
import { BeforeAfter } from "@/components/landing/BeforeAfter";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center space-y-6 mb-16">
          <h1 className="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00ff00] to-[#00cc00] font-mono">
            CHARON
          </h1>
          <p className="text-2xl text-gray-400 max-w-2xl mx-auto">
            Your digital safety net. Set it up once, protect forever.
          </p>
          <div className="flex gap-4 justify-center mt-8">
            <Link href="/onboarding">
              <Button className="bg-[#00ff00] text-black hover:bg-[#00cc00] font-mono font-bold text-lg px-8 py-6">
                Start Setup
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button
                variant="outline"
                className="border-[#00ff00]/30 text-[#00ff00] hover:bg-[#00ff00]/10 font-mono text-lg px-8 py-6"
              >
                Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* Live Counters */}
        <LiveCounters />

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 my-16">
          <Card className="bg-[#1a1a1a]/50 border-[#00ff00]/20 backdrop-blur-sm">
            <CardContent className="pt-6 text-center">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-mono font-bold text-[#00ff00] mb-2">Encrypted</h3>
              <p className="text-sm text-gray-400 font-mono">
                All data secured with Lit Protocol threshold cryptography
              </p>
            </CardContent>
          </Card>
          <Card className="bg-[#1a1a1a]/50 border-[#00ff00]/20 backdrop-blur-sm">
            <CardContent className="pt-6 text-center">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-mono font-bold text-[#00ff00] mb-2">Fast Setup</h3>
              <p className="text-sm text-gray-400 font-mono">
                Complete onboarding in under 10 minutes
              </p>
            </CardContent>
          </Card>
          <Card className="bg-[#1a1a1a]/50 border-[#00ff00]/20 backdrop-blur-sm">
            <CardContent className="pt-6 text-center">
              <div className="text-4xl mb-4">🛡️</div>
              <h3 className="text-xl font-mono font-bold text-[#00ff00] mb-2">Protected</h3>
              <p className="text-sm text-gray-400 font-mono">
                Guardian system with multi-signature verification
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Before/After Comparison */}
        <BeforeAfter />

        {/* Testimonials */}
        <Testimonials />

        {/* CTA Section */}
        <Card className="bg-[#1a1a1a]/50 border-[#00ff00]/20 backdrop-blur-sm mt-16">
          <CardContent className="pt-6 text-center py-12">
            <h2 className="text-3xl font-bold text-[#00ff00] mb-4 font-mono">
              Ready to Protect Your Legacy?
            </h2>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              Join thousands of users who have automated their digital estate management.
              Set up takes less than 10 minutes.
            </p>
            <Link href="/onboarding">
              <Button className="bg-[#00ff00] text-black hover:bg-[#00cc00] font-mono font-bold text-lg px-12 py-6">
                Get Started Now
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
