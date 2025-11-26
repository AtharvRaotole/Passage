"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface GuardianConfirmationModalProps {
  userId: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function GuardianConfirmationModal({
  userId,
  onConfirm,
  onCancel,
}: GuardianConfirmationModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="bg-white max-w-md w-full border-gray-200 shadow-xl">
        <CardHeader>
          <CardTitle className="text-gray-900 text-xl">Confirm Death Verification</CardTitle>
          <CardDescription className="text-gray-600">
            This is a serious action that cannot be undone
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded p-4">
            <p className="text-sm text-red-900 font-semibold mb-2">
              ⚠️ Final Confirmation Required
            </p>
            <p className="text-sm text-red-800 leading-relaxed">
              By confirming, you are verifying that the user ({userId.slice(0, 6)}...{userId.slice(-4)}) 
              is deceased. This action will trigger the execution of their digital will.
            </p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded p-4">
            <p className="text-sm text-gray-700 leading-relaxed">
              <strong>This action cannot be undone.</strong> Please ensure you have:
            </p>
            <ul className="text-sm text-gray-600 mt-2 space-y-1 list-disc list-inside">
              <li>Verified the information through appropriate channels</li>
              <li>Confirmed with other guardians if possible</li>
              <li>Understood the consequences of this action</li>
            </ul>
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
            className="flex-1 bg-red-600 text-white hover:bg-red-700"
          >
            I Understand - Confirm
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

