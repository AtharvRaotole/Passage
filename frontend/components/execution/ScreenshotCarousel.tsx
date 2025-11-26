"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Screenshot {
  url: string;
  blurred_url: string;
  base64?: string;
  filename: string;
  timestamp: string;
  step_name: string;
}

interface ScreenshotCarouselProps {
  screenshots: Screenshot[];
}

export function ScreenshotCarousel({ screenshots }: ScreenshotCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (screenshots.length === 0) {
    return (
      <Card className="bg-[#1a1a1a] border-[#00ff00]/20">
        <CardHeader>
          <CardTitle className="text-[#00ff00] font-mono">SCREENSHOTS</CardTitle>
          <CardDescription className="text-gray-400 font-mono">
            Agent screenshots will appear here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-500 font-mono">
            No screenshots captured yet
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentScreenshot = screenshots[currentIndex];
  const imageUrl = currentScreenshot.base64 
    ? `data:image/png;base64,${currentScreenshot.base64}`
    : currentScreenshot.blurred_url;

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? screenshots.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === screenshots.length - 1 ? 0 : prev + 1));
  };

  return (
    <Card className="bg-[#1a1a1a] border-[#00ff00]/20">
      <CardHeader>
        <CardTitle className="text-[#00ff00] font-mono">SCREENSHOTS</CardTitle>
        <CardDescription className="text-gray-400 font-mono">
          {currentIndex + 1} of {screenshots.length} - {currentScreenshot.step_name}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <img
            src={imageUrl}
            alt={`Screenshot from ${currentScreenshot.step_name}`}
            className="w-full h-auto rounded border border-[#00ff00]/20"
          />
          {screenshots.length > 1 && (
            <>
              <Button
                variant="outline"
                size="icon"
                onClick={goToPrevious}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={goToNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {screenshots.map((screenshot, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`flex-shrink-0 w-20 h-20 rounded border-2 overflow-hidden ${
                index === currentIndex
                  ? "border-[#00ff00]"
                  : "border-gray-600 opacity-50 hover:opacity-75"
              }`}
            >
              <img
                src={screenshot.base64 ? `data:image/png;base64,${screenshot.base64}` : screenshot.blurred_url}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
        <div className="text-xs text-gray-400 font-mono">
          <div>Step: {currentScreenshot.step_name}</div>
          <div>Time: {new Date(currentScreenshot.timestamp).toLocaleTimeString()}</div>
        </div>
      </CardContent>
    </Card>
  );
}

