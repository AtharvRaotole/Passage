"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface GracePeriodExtensionModalProps {
  extensionsUsed: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function GracePeriodExtensionModal({
  extensionsUsed,
  onConfirm,
  onCancel,
}: GracePeriodExtensionModalProps) {
  const maxExtensions = 2;
  const remainingExtensions = maxExtensions - extensionsUsed;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="bg-white max-w-md w-full border-gray-200 shadow-xl">
        <CardHeader>
          <CardTitle className="text-gray-900 text-xl">Request Grace Period Extension</CardTitle>
          <CardDescription className="text-gray-600">
            Extend the grace period by 24 hours
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <p className="text-sm text-blue-900 mb-2">
              <strong>Extension Details:</strong>
            </p>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Extends grace period by 24 hours</li>
              <li>• Remaining extensions: {remainingExtensions} of {maxExtensions}</li>
              <li>• This gives you more time to verify the information</li>
            </ul>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded p-4">
            <p className="text-sm text-gray-700">
              Use this option if you need additional time to verify the death verification
              through appropriate channels. Each extension adds 24 hours to the grace period.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex space-x-3">
          <Button
            onClick={onCancel}
            variant="outline"
            className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={remainingExtensions === 0}
            className="flex-1 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300"
          >
            Request Extension ({remainingExtensions} remaining)
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

