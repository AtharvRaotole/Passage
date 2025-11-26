"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Persona {
  id: string;
  name: string;
  description: string;
  icon: string;
  accounts: Array<{
    service: string;
    username: string;
    type: "oauth" | "manual";
    imported: boolean;
  }>;
  instructions: Array<{
    service: string;
    instruction: string;
  }>;
}

const PERSONAS: Persona[] = [
  {
    id: "tech-founder",
    name: "Tech Founder",
    description: "Has crypto, GitHub, AWS accounts",
    icon: "💻",
    accounts: [
      { service: "GitHub", username: "github.com", type: "oauth", imported: false },
      { service: "AWS", username: "aws.amazon.com", type: "oauth", imported: false },
      { service: "MetaMask", username: "Wallet", type: "manual", imported: false },
      { service: "Coinbase", username: "coinbase.com", type: "oauth", imported: false },
    ],
    instructions: [
      { service: "GitHub", instruction: "Transfer repository ownership to @tech-team" },
      { service: "AWS", instruction: "Cancel all EC2 instances and delete unused resources" },
      { service: "MetaMask", instruction: "Transfer all tokens to beneficiary wallet" },
      { service: "Coinbase", instruction: "Close account and transfer funds" },
    ],
  },
  {
    id: "retiree",
    name: "Retiree",
    description: "Has traditional bank, utilities, social media",
    icon: "👴",
    accounts: [
      { service: "Bank of America", username: "bankofamerica.com", type: "oauth", imported: false },
      { service: "Facebook", username: "facebook.com", type: "oauth", imported: false },
      { service: "Netflix", username: "netflix.com", type: "oauth", imported: false },
      { service: "Electric Company", username: "utility.com", type: "manual", imported: false },
    ],
    instructions: [
      { service: "Facebook", instruction: "Memorialize account" },
      { service: "Netflix", instruction: "Cancel subscription" },
      { service: "Bank of America", instruction: "Transfer funds to beneficiary account" },
      { service: "Electric Company", instruction: "Close account" },
    ],
  },
  {
    id: "digital-nomad",
    name: "Digital Nomad",
    description: "Has multiple banks, travel apps, international accounts",
    icon: "✈️",
    accounts: [
      { service: "Wise", username: "wise.com", type: "oauth", imported: false },
      { service: "Revolut", username: "revolut.com", type: "oauth", imported: false },
      { service: "Airbnb", username: "airbnb.com", type: "oauth", imported: false },
      { service: "Booking.com", username: "booking.com", type: "oauth", imported: false },
      { service: "Stripe", username: "stripe.com", type: "oauth", imported: false },
    ],
    instructions: [
      { service: "Wise", instruction: "Transfer all balances to beneficiary" },
      { service: "Revolut", instruction: "Close account and transfer funds" },
      { service: "Airbnb", instruction: "Cancel all upcoming bookings" },
      { service: "Stripe", instruction: "Transfer business account to beneficiary" },
    ],
  },
];

interface PersonaSelectorProps {
  onSelect: (persona: Persona) => void;
}

export function PersonaSelector({ onSelect }: PersonaSelectorProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-[#00ff00] mb-2 font-mono">
          Choose a starting template
        </h2>
        <p className="text-gray-400">
          We'll pre-fill common accounts and instructions. You can customize everything.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {PERSONAS.map((persona) => (
          <Card
            key={persona.id}
            className="bg-[#1a1a1a]/50 border-[#00ff00]/20 hover:border-[#00ff00]/40 transition-all cursor-pointer hover:scale-105"
            onClick={() => onSelect(persona)}
          >
            <CardHeader>
              <div className="text-4xl mb-2">{persona.icon}</div>
              <CardTitle className="text-[#00ff00] font-mono">{persona.name}</CardTitle>
              <CardDescription className="text-gray-400">
                {persona.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p className="text-gray-500 font-mono">
                  {persona.accounts.length} accounts
                </p>
                <p className="text-gray-500 font-mono">
                  {persona.instructions.length} instructions
                </p>
              </div>
              <Button className="w-full mt-4 bg-[#00ff00] text-black hover:bg-[#00cc00] font-mono">
                Use This Template
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center">
        <Button
          variant="outline"
          onClick={() => onSelect({
            id: "custom",
            name: "Start from Scratch",
            description: "Build your safety net from the ground up",
            icon: "🆕",
            accounts: [],
            instructions: [],
          })}
          className="border-[#00ff00]/30 text-[#00ff00] hover:bg-[#00ff00]/10 font-mono"
        >
          Start from Scratch
        </Button>
      </div>
    </div>
  );
}

