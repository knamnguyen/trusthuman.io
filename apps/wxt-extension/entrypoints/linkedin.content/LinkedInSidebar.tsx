import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sassy/ui/card";
import {
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@sassy/ui/sheet";

import { ToggleButton } from "./ToggleButton";

interface LinkedInSidebarProps {
  portalContainer: HTMLElement;
  onClose: () => void;
}

export function LinkedInSidebar({
  portalContainer,
  onClose,
}: LinkedInSidebarProps) {
  return (
    <SheetContent
      side="right"
      className="w-[25vw] max-w-[400px] min-w-[320px]"
      portalContainer={portalContainer}
    >
      {/* Close button attached to the left edge of sidebar */}
      <div className="absolute top-1/2 left-0 -translate-x-full -translate-y-1/2">
        <ToggleButton isOpen={true} onToggle={onClose} />
      </div>
      <SheetHeader>
        <div className="flex items-center gap-3">
          <div className="border-border bg-primary text-primary-foreground flex h-9 w-9 items-center justify-center rounded-md border-2 font-bold">
            E
          </div>
          <div>
            <SheetTitle>EngageKit</SheetTitle>
            <SheetDescription>LinkedIn engagement sidebar</SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto py-4">
        <div className="flex flex-col gap-4 px-4">
          <Card>
            <CardHeader>
              <CardTitle>Welcome to EngageKit</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                This is a proof of concept for the WXT-based LinkedIn sidebar
                using components from @sassy/ui with Tailwind CSS.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>POC Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-2">
                {[
                  "Shadow DOM isolation",
                  "WXT framework",
                  "@sassy/ui Sheet",
                  "Tailwind CSS v4",
                  "Slide animation",
                ].map((item) => (
                  <li
                    key={item}
                    className="text-muted-foreground flex items-center gap-2 text-sm"
                  >
                    <span className="text-green-500">✓</span> {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Future Features</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-1">
                {[
                  "Clerk authentication",
                  "tRPC integration",
                  "Comment generation",
                ].map((item) => (
                  <li key={item} className="text-muted-foreground text-sm">
                    • {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      <SheetFooter>
        <p className="text-muted-foreground w-full text-center text-xs">
          EngageKit WXT POC v0.0.1
        </p>
        <SheetClose asChild>
          <button className="sr-only">Close</button>
        </SheetClose>
      </SheetFooter>
    </SheetContent>
  );
}
