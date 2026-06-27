import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Passage Check-in",
  description: "Quick check-in for your Passage digital estate heartbeat.",
  appleWebApp: {
    capable: true,
    title: "Passage Check-in",
    statusBarStyle: "default",
  },
};

export default function PulseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
