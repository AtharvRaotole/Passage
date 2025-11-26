"use client";

import { Card, CardContent } from "@/components/ui/card";

interface Testimonial {
  name: string;
  role: string;
  quote: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    name: "Sarah Chen",
    role: "Tech Executive",
    quote: "Project Charon gave me peace of mind knowing my crypto assets and digital accounts are protected. The automatic memory book feature is incredible - my family will have everything they need.",
    rating: 5,
  },
  {
    name: "Michael Rodriguez",
    role: "Retiree",
    quote: "As someone who's not tech-savvy, I was worried about setting this up. But the onboarding was so easy - under 10 minutes! Now I know my estate is in good hands.",
    rating: 5,
  },
  {
    name: "Emily Watson",
    role: "Digital Nomad",
    quote: "I travel constantly and have accounts all over the world. Charon automatically found and protected everything. The multi-chain crypto vault is a game-changer.",
    rating: 5,
  },
  {
    name: "David Kim",
    role: "Lawyer",
    quote: "I recommend Charon to all my estate planning clients. The security documentation is comprehensive, and the automated execution saves families months of paperwork.",
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <div className="my-16 space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-[#00ff00] mb-2 font-mono">
          Trusted by Thousands
        </h2>
        <p className="text-gray-400">
          See what our users are saying
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {testimonials.map((testimonial, index) => (
          <Card
            key={index}
            className="bg-[#1a1a1a]/50 border-[#00ff00]/20 backdrop-blur-sm"
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-1 mb-3">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <span key={i} className="text-yellow-400">★</span>
                ))}
              </div>
              <p className="text-gray-300 mb-4 italic">"{testimonial.quote}"</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono font-bold text-[#00ff00]">{testimonial.name}</p>
                  <p className="text-xs text-gray-400 font-mono">{testimonial.role}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

