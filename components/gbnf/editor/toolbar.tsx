import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import { useEditor } from "./context/editor-context";
import { ExportButton } from "./export-dialog";
import { FullscreenButton } from "./fullscreen-dialog";
import { GrammarListButton } from "./grammar-list";

interface ToolbarProps {
  isMobile: boolean;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).format(date);
}

export function Toolbar({ isMobile }: ToolbarProps) {
  const {
    currentName,
    isEditingName,
    nodes,
    currentId,
    setCurrentName,
    setIsEditingName,
    handleDelete,
    resetState,
  } = useEditor();

  const canDelete = nodes.length > 2;
  const createdAt = currentId ? new Date().getTime() : Date.now();

  return (
    <div className="flex items-center justify-between border-b p-2">
      <div className="flex items-center gap-2">
        {isEditingName ? (
          <Input
            className="h-8 w-[300px] bg-transparent"
            value={currentName || ""}
            onChange={(e) => setCurrentName(e.target.value || null)}
            onBlur={() => setIsEditingName(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setIsEditingName(false);
              if (e.key === "Escape") {
                setIsEditingName(false);
                e.preventDefault();
              }
            }}
            placeholder={`Untitled - ${formatDate(new Date(createdAt))}`}
            autoFocus
          />
        ) : (
          <span
            className={cn(
              "cursor-pointer select-none",
              !currentName && "text-muted-foreground"
            )}
            onClick={() => setIsEditingName(true)}
          >
            {currentName || `Untitled - ${formatDate(new Date(createdAt))}`}
          </span>
        )}
        {canDelete && (
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground hover:text-red-500"
            onClick={() => currentId && handleDelete(currentId)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex gap-2">
        <FullscreenButton isMobile={isMobile} />
        <Button size="sm" variant="outline" onClick={resetState}>
          New
          {!isMobile && (
            <span className="ml-2 text-xs text-muted-foreground">⌘N / ⌘M</span>
          )}
        </Button>
        <GrammarListButton isMobile={isMobile} />
        <ExportButton isMobile={isMobile} />
      </div>
    </div>
  );
}
