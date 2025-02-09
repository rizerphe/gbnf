import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useEditor } from "./context/editor-context";

interface ExportButtonProps {
  isMobile: boolean;
}

export function ExportButton({ isMobile }: ExportButtonProps) {
  const { gbnfContent, handleCopy, handleDownload, exportDialogOpen, setExportDialogOpen, handleExport } = useEditor();

  return (
    <>
      <Button size="sm" variant="outline" onClick={handleExport}>
        Export GBNF
        {!isMobile && (
          <span className="ml-2 text-xs text-muted-foreground">⌘E</span>
        )}
      </Button>

      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogTitle className="hidden">Export</DialogTitle>
        <DialogContent className="max-w-full h-[calc(100dvh-4rem)] flex flex-col gap-4">
          <div className="flex-1 relative">
            <textarea
              className="w-full h-full resize-none p-4 font-mono bg-muted/50 rounded-md"
              value={gbnfContent}
              readOnly
            />
          </div>
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCopy}>
                Copy to Clipboard
              </Button>
              <Button variant="outline" onClick={handleDownload}>
                Download
              </Button>
            </div>
            <Button variant="ghost" onClick={() => setExportDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
