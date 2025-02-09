"use client";
import { Handle, Position, NodeResizeControl } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { Grip } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChangeEvent, ReactNode, useEffect, useRef, useState } from "react";

interface NodeData {
  label: string;
  properties: Record<string, string | number | boolean>;
  onPropertyChange?: (key: string, value: string | number | boolean) => void;
  name?: string;
}

interface NodeProps {
  data: NodeData;
  id: string;
  selected?: boolean;
}

interface BaseNodeProps extends NodeProps {
  color: string;
  borderColor: string;
  ringColor: string;
  children?: ReactNode;
}

const baseNodeStyles =
  "px-4 py-2 rounded-lg border shadow-sm size-full min-w-[100px] min-h-[30px]";

function NodeWrapper({
  children,
  id,
}: {
  children: ReactNode;
  id: string;
  isConnectable?: boolean;
}) {
  // Determine valid connection types based on node type
  const canBeSource = id === "start" || !["end"].includes(id);
  const canBeTarget = id === "end" || !["start"].includes(id);

  const emitEvent = (type: string) => {
    const event = new CustomEvent(type, { detail: { id } });
    window.dispatchEvent(event);
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        {canBeSource && (
          <Handle
            type="source"
            position={Position.Right}
            isConnectable={canBeSource}
            style={{
              width: "12px",
              height: "12px",
              right: "-6px",
              background: "#666",
              border: "2px solid #333",
            }}
          />
        )}
        {canBeTarget && (
          <Handle
            type="target"
            position={Position.Left}
            isConnectable={canBeTarget}
            style={{
              width: "12px",
              height: "12px",
              left: "-6px",
              background: "#666",
              border: "2px solid #333",
            }}
          />
        )}
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onSelect={() => emitEvent("toggleLoop")}>
          Toggle Self-Connection
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={() => emitEvent("disconnectIncoming")}>
          Disconnect All Incoming
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => emitEvent("disconnectOutgoing")}>
          Disconnect All Outgoing
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          className="text-red-500 dark:text-red-400"
          onSelect={() => emitEvent("deleteNode")}
        >
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function NodeContent({
  label,
  name,
  isEditing,
  onStartEdit,
  onEndEdit,
  onNameChange,
  children,
}: {
  label: string;
  name: string | null;
  isEditing: boolean;
  onStartEdit: () => void;
  onEndEdit: (newName: string | null) => void;
  onNameChange: (e: ChangeEvent<HTMLInputElement>) => void;
  children?: ReactNode;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  return (
    <div className="flex flex-col gap-2">
      <div
        className="text-sm font-medium"
        onDoubleClick={(e) => {
          e.stopPropagation();
          onStartEdit();
        }}
      >
        {isEditing ? (
          <input
            ref={inputRef}
            className="w-full bg-transparent border-none p-0 focus:outline-none focus:ring-0"
            value={name || ""}
            onChange={onNameChange}
            onBlur={() => onEndEdit(name)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onEndEdit(name);
              } else if (e.key === "Escape") {
                onEndEdit(null);
              }
            }}
          />
        ) : (
          <>
            <div className="font-medium">{name || label}</div>
            {name && (
              <div className="text-xs text-muted-foreground">{label}</div>
            )}
          </>
        )}
      </div>
      {children && <div className="flex flex-col gap-1">{children}</div>}
    </div>
  );
}

function StartNode({ selected }: NodeProps) {
  return (
    <NodeWrapper id="start">
      <div
        className={cn(
          "h-3 w-3 rounded-full border bg-green-950 border-green-800",
          {
            "ring-2 ring-green-500": selected,
          }
        )}
      />
    </NodeWrapper>
  );
}

function EndNode({ selected }: NodeProps) {
  return (
    <NodeWrapper id="end">
      <div
        className={cn("h-3 w-3 rounded-full border bg-red-950 border-red-800", {
          "ring-2 ring-red-500": selected,
        })}
      />
    </NodeWrapper>
  );
}

function BaseNode({
  data,
  selected,
  id,
  color,
  borderColor,
  ringColor,
  children,
}: BaseNodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingName, setEditingName] = useState<string | null>(
    data.name || null
  );

  useEffect(() => {
    setEditingName(data.name || null);
  }, [data.name]);

  return (
    <NodeWrapper id={id}>
      <div
        className={cn(baseNodeStyles, `${color} ${borderColor} relative`, {
          [`ring-2 ${ringColor}`]: selected,
        })}
      >
        {selected && (
          <NodeResizeControl
            style={{ background: "transparent", border: "none" }}
            position="bottom-right"
            minWidth={100}
            minHeight={30}
          >
            <div className="absolute right-1 bottom-1 text-muted-foreground hover:text-foreground">
              <Grip size={12} />
            </div>
          </NodeResizeControl>
        )}
        <div className="h-full flex flex-col">
          <NodeContent
            label={data.label}
            name={editingName}
            isEditing={isEditing}
            onStartEdit={() => {
              setIsEditing(true);
              setEditingName(data.name || null);
            }}
            onEndEdit={(newName) => {
              setIsEditing(false);
              data.onPropertyChange?.("name", newName || "");
            }}
            onNameChange={(e) => setEditingName(e.target.value || null)}
          >
            {children}
          </NodeContent>
        </div>
      </div>
    </NodeWrapper>
  );
}

function StringNode({ data, selected, id }: NodeProps) {
  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/\t/g, "\\t");
    data.onPropertyChange?.("value", value);
  };

  return (
    <BaseNode
      data={data}
      selected={selected}
      id={id}
      color="bg-blue-950/50"
      borderColor="border-blue-900/50"
      ringColor="ring-blue-500"
    >
      <div className="flex-1">
        <Textarea
          className="w-full h-full min-h-[80px] bg-blue-900/30 border-blue-800/50 resize-none"
          placeholder="String to match"
          value={(data.properties.value as string | undefined)
            ?.replace(/\\n/g, "\n")
            .replace(/\\r/g, "\r")
            .replace(/\\t/g, "\t")
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, "\\")}
          onChange={handleChange}
        />
      </div>
    </BaseNode>
  );
}

function CharSetNode({ data, selected, id }: NodeProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    data.onPropertyChange?.("pattern", e.target.value);
  };

  return (
    <BaseNode
      data={data}
      selected={selected}
      id={id}
      color="bg-orange-950/50"
      borderColor="border-orange-900/50"
      ringColor="ring-orange-500"
    >
      <Input
        className="h-7 bg-orange-900/30 border-orange-800/50"
        placeholder="[a-zA-Z0-9]"
        value={(data.properties.pattern as string) || ""}
        onChange={handleChange}
      />
    </BaseNode>
  );
}

function LetterNode(props: NodeProps) {
  return (
    <BaseNode
      {...props}
      color="bg-emerald-950/50"
      borderColor="border-emerald-900/50"
      ringColor="ring-emerald-500"
    />
  );
}

function DigitNode(props: NodeProps) {
  return (
    <BaseNode
      {...props}
      color="bg-purple-950/50"
      borderColor="border-purple-900/50"
      ringColor="ring-purple-500"
    />
  );
}

function NonNewlineNode(props: NodeProps) {
  return (
    <BaseNode
      {...props}
      color="bg-pink-950/50"
      borderColor="border-pink-900/50"
      ringColor="ring-pink-500"
    />
  );
}

function IdentifierNode(props: NodeProps) {
  return (
    <BaseNode
      {...props}
      color="bg-cyan-950/50"
      borderColor="border-cyan-900/50"
      ringColor="ring-cyan-500"
    />
  );
}

function TimeNode(props: NodeProps) {
  return (
    <BaseNode
      {...props}
      color="bg-amber-950/50"
      borderColor="border-amber-900/50"
      ringColor="ring-amber-500"
    />
  );
}

function RouterNode({ selected, id }: NodeProps) {
  return (
    <NodeWrapper id={id}>
      <div
        className={cn(
          "h-3 w-3 rounded-full border bg-zinc-950 border-zinc-800",
          {
            "ring-2 ring-zinc-500": selected,
          }
        )}
      />
    </NodeWrapper>
  );
}

export const GBNFNodeTypes = {
  startNode: StartNode,
  endNode: EndNode,
  stringNode: StringNode,
  charSetNode: CharSetNode,
  letterNode: LetterNode,
  digitNode: DigitNode,
  nonNewlineNode: NonNewlineNode,
  identifierNode: IdentifierNode,
  timeNode: TimeNode,
  routerNode: RouterNode,
};
