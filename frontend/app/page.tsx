"use client";

import Link from "next/link";
import { ArrowRight, Shield, Clock, Lock, Users, Zap, CheckCircle2 } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold tracking-tight">
            Passage
          </Link>
          <div className="flex items-center gap-8">
            <Link href="#features" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors">
              How it works
            </Link>
            <Link href="/dashboard" className="text-sm font-medium bg-neutral-900 text-white px-4 py-2 rounded-full hover:bg-neutral-800 transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-fade-in">
            <span className="inline-block px-3 py-1 text-xs font-medium bg-neutral-100 text-neutral-600 rounded-full mb-6">
              Secure Digital Estate Planning
            </span>
          </div>
          
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight text-neutral-900 mb-6 animate-fade-in-delay-1">
            Protect what matters
            <br />
            <span className="text-neutral-400">most to you.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-neutral-500 max-w-2xl mx-auto mb-10 animate-fade-in-delay-2">
            Passage secures your digital assets and ensures your wishes are honored. 
            Simple setup, complete peace of mind.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-delay-3">
            <Link 
              href="/onboarding" 
              className="inline-flex items-center justify-center gap-2 bg-neutral-900 text-white px-8 py-4 rounded-full text-base font-medium hover:bg-neutral-800 transition-all hover:gap-3"
            >
              Start protecting your legacy
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              href="#how-it-works" 
              className="inline-flex items-center justify-center px-8 py-4 rounded-full text-base font-medium border border-neutral-200 hover:bg-neutral-50 transition-colors"
            >
              Learn more
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-12 border-y border-neutral-100 bg-neutral-50/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-wrap justify-center items-center gap-12 text-neutral-400 text-sm">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Bank-level encryption</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              <span>Decentralized storage</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>Multi-signature verification</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span>Automated execution</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-medium text-neutral-900 mb-4">
              Everything you need
            </h2>
            <p className="text-neutral-500 max-w-xl mx-auto">
              A complete solution for securing and transferring your digital life.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: "Secure Vault",
                description: "Store credentials, keys, and sensitive information with military-grade encryption."
              },
              {
                icon: Clock,
                title: "Dead Man's Switch",
                description: "Automatic activation ensures your wishes are carried out when needed."
              },
              {
                icon: Users,
                title: "Guardian Network",
                description: "Trusted contacts verify and authorize access to your digital estate."
              },
            ].map((feature, index) => (
              <div 
                key={index}
                className="group p-8 rounded-2xl border border-neutral-100 hover:border-neutral-200 hover:shadow-lg transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center mb-6 group-hover:bg-neutral-900 group-hover:text-white transition-colors">
                  <feature.icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-neutral-500 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6 bg-neutral-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-medium text-neutral-900 mb-4">
              Simple setup, lasting protection
            </h2>
            <p className="text-neutral-500 max-w-xl mx-auto">
              Get started in minutes. Your digital legacy secured for life.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Connect", description: "Link your wallet and verify your identity" },
              { step: "02", title: "Configure", description: "Set up guardians and define your wishes" },
              { step: "03", title: "Secure", description: "Encrypt and store your digital assets" },
              { step: "04", title: "Relax", description: "Your legacy is protected automatically" },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-light text-neutral-200 mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-neutral-500 text-sm">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-serif text-3xl md:text-4xl font-medium text-neutral-900 mb-6">
                Why choose Passage?
              </h2>
              <div className="space-y-5">
                {[
                  "No lawyers or paperwork required",
                  "Works with crypto and traditional accounts",
                  "Privacy-first, zero-knowledge design",
                  "Automated execution with smart contracts",
                  "Beautiful memory preservation",
                ].map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-neutral-900 mt-0.5 flex-shrink-0" />
                    <span className="text-neutral-600">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-neutral-100 to-neutral-50 rounded-3xl p-12 text-center">
              <div className="text-6xl font-light text-neutral-900 mb-2">10 min</div>
              <div className="text-neutral-500">Average setup time</div>
              <div className="mt-8 pt-8 border-t border-neutral-200 grid grid-cols-2 gap-8">
                <div>
                  <div className="text-3xl font-light text-neutral-900">100%</div>
                  <div className="text-sm text-neutral-500">Digital process</div>
                </div>
                <div>
                  <div className="text-3xl font-light text-neutral-900">$0</div>
                  <div className="text-sm text-neutral-500">Legal fees</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-neutral-900 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-medium mb-6">
            Ready to secure your legacy?
          </h2>
          <p className="text-neutral-400 mb-10 text-lg">
            Join thousands who have already protected their digital assets and memories.
          </p>
          <Link 
            href="/onboarding" 
            className="inline-flex items-center justify-center gap-2 bg-white text-neutral-900 px-8 py-4 rounded-full text-base font-medium hover:bg-neutral-100 transition-all hover:gap-3"
          >
            Get started for free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-neutral-100">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-sm text-neutral-500">
              © 2024 Passage. All rights reserved.
            </div>
            <div className="flex gap-8">
              <Link href="/privacy" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">
                Privacy
              </Link>
              <Link href="#" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">
                Terms
              </Link>
              <Link href="#" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
