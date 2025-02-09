import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Trash2 } from "lucide-react";
import { DialogTitle } from "@/components/ui/dialog";
import { Fragment } from "react";
import { useEditor } from "./context/editor-context";

interface GrammarListButtonProps {
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

export function GrammarListButton({ isMobile }: GrammarListButtonProps) {
  const { savedGrammars, loadGrammar, handleDelete, resetState, commandOpen, setCommandOpen } = useEditor();

  // Process grammars into a map
  const grammarMap = new Map(
    Object.entries(
      savedGrammars.reduce((acc, grammar) => {
        const key =
          grammar.name ||
          `Untitled - ${new Date(grammar.createdAt).toLocaleString()}`;
        return {
          ...acc,
          [key]: [...(acc[key] || []), grammar],
        };
      }, {} as Record<string, typeof savedGrammars>)
    )
  );

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setCommandOpen(true)}>
        Open
        {!isMobile && (
          <span className="ml-2 text-xs text-muted-foreground">⌘K</span>
        )}
      </Button>

      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <DialogTitle className="sr-only">Grammar List</DialogTitle>
        <CommandInput placeholder="Search grammars..." />
        <CommandList>
          <CommandEmpty>No grammars found.</CommandEmpty>
          <CommandGroup heading="Actions">
            <CommandItem
              onSelect={() => {
                resetState();
                setCommandOpen(false);
              }}
            >
              New Grammar
              <span className="ml-auto text-xs text-muted-foreground">⌘N/⌘M</span>
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Recent">
            {Array.from(grammarMap.entries())
              .sort(([, a], [, b]) => b[0].createdAt - a[0].createdAt)
              .map(([name, grammars]) => (
                <Fragment key={name}>
                  {grammars.map((grammar) => (
                    <CommandItem
                      key={grammar.id}
                      onSelect={() => {
                        loadGrammar(grammar);
                        setCommandOpen(false);
                      }}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex-1">
                          <div className="flex flex-col gap-1">
                            <div>{name}</div>
                            {grammars.length > 1 && (
                              <div className="text-xs text-muted-foreground">
                                ID: {grammar.id.slice(0, 8)}
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(new Date(grammar.updatedAt))}
                          </span>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-red-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(grammar.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CommandItem>
                  ))}
                </Fragment>
              ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
