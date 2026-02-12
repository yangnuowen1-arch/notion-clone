"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { useSettings } from "@/hooks/use-settings";
import { Label } from "@/components/ui/label";
import { ModeToggle } from "@/components/mode-toggle";

export const SettingsModal = () => {
  const settings = useSettings();
return (
  <Dialog open={settings.isOpen} onOpenChange={settings.onClose}>
    <DialogContent>
      <DialogHeader className="border-b pb-3">
        <DialogTitle className="text-lg font-medium">
          My settings
        </DialogTitle>
        <DialogDescription>
          Update how Jotion looks and feels for you.
        </DialogDescription>
      </DialogHeader>
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-y-1">
          <Label>
            Appearance
          </Label>
          <span className="text-xs text-muted-foreground">
            Customize the appearance of the app
          </span>
        </div>
        <ModeToggle />
      </div>
    </DialogContent>
  </Dialog>
);
  
}