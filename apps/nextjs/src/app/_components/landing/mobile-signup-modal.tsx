"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@sassy/ui/dialog";

import { MobileSignupForm } from "./mobile-signup-form";

interface MobileSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSignupModal({ isOpen, onClose }: MobileSignupModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="mx-4 max-w-md rounded-xl border-2 border-black bg-white p-6 shadow-[4px_4px_0px_#000] sm:mx-auto">
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl font-bold text-black">
            Reminder to install EngageKit on Chrome + Exclusive 50% discount!{" "}
            <div className="flex flex-row items-center justify-center text-6xl">
              🐱🐶
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="">
          <MobileSignupForm />
        </div>
      </DialogContent>
    </Dialog>
  );
}
