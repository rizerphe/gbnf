"use client";

import Link from "next/link";
import { Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex flex-col items-center">
      <div className="container px-4 flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="GBNF Creator Logo"
            width={24}
            height={24}
          />
          <span className="font-bold">GBNF Creator</span>
        </Link>
        <div className="px-4 flex items-center justify-end">
          <div className="flex items-center space-x-4">
            <Link
              href="https://github.com/rizerphe/gbnf"
              target="_blank"
              rel="noreferrer"
            >
              <Button
                variant="outline"
                size="icon"
                className="flex border-border/50 hover:border-foreground/20"
              >
                <Github className="h-4 w-4" />
                <span className="sr-only">GitHub</span>
              </Button>
            </Link>
            <Button asChild className="flex px-4">
              <Link href="/gbnf">Open Creator</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
