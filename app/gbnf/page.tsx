"use client";

import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { GBNFEditor } from "@/components/gbnf/editor";
import { GBNFSidebar } from "@/components/gbnf/sidebar";
import { useRef } from "react";
import { GBNFNodeTypes } from "@/components/gbnf/nodes";
import Image from "next/image";
import Link from "next/link";

interface AddNodeRef {
  addNode: (type: keyof typeof GBNFNodeTypes) => void;
}

function GBNFEditorPage() {
  const addNodeRef = useRef<AddNodeRef>({
    addNode: () => {},
  });

  return (
    <>
      <GBNFSidebar addNodeRef={addNodeRef} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b">
          <div className="flex items-center gap-2 px-3">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Link href="/" className="flex gap-2 items-center">
              <Image
                src="/logo.png"
                alt="GBNF Editor Logo"
                width={20}
                height={20}
              />
              <span className="text-sm font-bold">GBNF Editor</span>
            </Link>
          </div>
        </header>
        <GBNFEditor addNodeRef={addNodeRef} />
      </SidebarInset>
    </>
  );
}

export default function Page() {
  return (
    <SidebarProvider defaultOpen>
      <GBNFEditorPage />
    </SidebarProvider>
  );
}
