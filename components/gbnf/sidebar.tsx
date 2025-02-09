"use client";

import { GalleryVerticalEnd } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { GBNFNodeTypes } from "./nodes";
import { RefObject, DragEvent, ComponentProps } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

export const NODE_TYPES = [
  {
    id: "stringNode",
    label: "String Match",
    description: "Match a specific string",
    color: "bg-blue-950/50 border-blue-900/50 hover:bg-blue-900/50",
  },
  {
    id: "charSetNode",
    label: "Character Set",
    description: "Match a set of characters",
    color: "bg-orange-950/50 border-orange-900/50 hover:bg-orange-900/50",
  },
  {
    id: "letterNode",
    label: "Letter",
    description: "Match any letter (a-zA-Z)",
    color: "bg-emerald-950/50 border-emerald-900/50 hover:bg-emerald-900/50",
  },
  {
    id: "digitNode",
    label: "Digit",
    description: "Match any digit (0-9)",
    color: "bg-purple-950/50 border-purple-900/50 hover:bg-purple-900/50",
  },
  {
    id: "nonNewlineNode",
    label: "Non-Newline",
    description: "Match any character except newline",
    color: "bg-pink-950/50 border-pink-900/50 hover:bg-pink-900/50",
  },
  {
    id: "identifierNode",
    label: "Identifier",
    description: "Match programming language identifiers",
    color: "bg-cyan-950/50 border-cyan-900/50 hover:bg-cyan-900/50",
  },
  {
    id: "timeNode",
    label: "Time Duration",
    description: "Match time durations (e.g. 24h, 7d)",
    color: "bg-amber-950/50 border-amber-900/50 hover:bg-amber-900/50",
  },
  {
    id: "routerNode",
    label: "Router",
    description: "Empty node for routing",
    color: "bg-zinc-950/50 border-zinc-900/50 hover:bg-zinc-900/50",
  },
] as const;

export function GBNFSidebar({
  addNodeRef,
  ...props
}: ComponentProps<typeof Sidebar> & {
  addNodeRef: RefObject<{
    addNode: (type: keyof typeof GBNFNodeTypes) => void;
  }>;
}) {
  const isMobile = useIsMobile();
  const sidebar = useSidebar();

  const onDragStart = (event: DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
  };

  const handleNodeAdd = (nodeType: string) => {
    addNodeRef.current.addNode(nodeType as keyof typeof GBNFNodeTypes);
    if (isMobile) {
      sidebar?.setOpenMobile?.(false);
    }
  };

  if (!sidebar) return null;

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="flex aspect-square h-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <GalleryVerticalEnd className="h-4 w-4" />
          </div>
          <div className="flex flex-col gap-0.5 leading-none">
            <span className="font-semibold">GBNF Creator</span>
            <span className="text-sm text-muted-foreground">
              Drag or click nodes to add
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <div className="flex flex-col gap-2 p-4">
          {NODE_TYPES.map((type) => (
            <div
              key={type.id}
              className={`flex cursor-pointer flex-col gap-1 rounded-lg border px-4 py-3 ${type.color}`}
              draggable
              onDragStart={(e) => onDragStart(e, type.id)}
              onClick={() => handleNodeAdd(type.id)}
            >
              <div className="font-medium">{type.label}</div>
              <div className="text-sm text-muted-foreground">
                {type.description}
              </div>
            </div>
          ))}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
