import { useCallback, useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

export function useFullscreen() {
  const shouldShowPrompt = useIsMobile();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPrompt, setShowPrompt] = useState(
    shouldShowPrompt && !document.fullscreenElement
  );

  useEffect(() => {
    const controller = new AbortController();
    document.addEventListener(
      "fullscreenchange",
      () => {
        setIsFullscreen(!!document.fullscreenElement);
      },
      { signal: controller.signal }
    );
    return () => controller.abort();
  });

  useEffect(() => {
    setShowPrompt(shouldShowPrompt && !document.fullscreenElement);
  }, [shouldShowPrompt]);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error("Error toggling fullscreen:", error);
    }
    setShowPrompt(false);
  }, []);

  const dismissPrompt = useCallback(() => {
    setShowPrompt(false);
  }, []);

  return { isFullscreen, toggleFullscreen, showPrompt, dismissPrompt };
}
