import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useFullscreen } from "@/hooks/use-fullscreen";
import { Maximize2, Minimize2 } from "lucide-react";

interface FullscreenButtonProps {
  isMobile: boolean;
}

export function FullscreenButton({ isMobile }: FullscreenButtonProps) {
  const { isFullscreen, toggleFullscreen, showPrompt, dismissPrompt } = useFullscreen();

  if (!isMobile) return null;

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={toggleFullscreen}
        className="flex items-center gap-2"
      >
        {isFullscreen ? (
          <Minimize2 className="h-4 w-4" />
        ) : (
          <Maximize2 className="h-4 w-4" />
        )}
      </Button>

      <Dialog open={showPrompt} onOpenChange={dismissPrompt}>
        <DialogTitle className="hidden">Fullscreen Mode</DialogTitle>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col gap-4">
            <div className="text-lg font-semibold">Enable Fullscreen?</div>
            <div className="text-sm text-muted-foreground">
              For the best mobile experience, we recommend using fullscreen mode.
              This will help prevent unwanted scrolling and viewport issues.
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={dismissPrompt}>
                Cancel
              </Button>
              <Button onClick={() => {
                dismissPrompt();
                toggleFullscreen();
              }}>
                Go Fullscreen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
