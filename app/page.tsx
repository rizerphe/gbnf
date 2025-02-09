import type { Metadata } from "next";
import Link from "next/link";
import {
  FileCode,
  GitBranch,
  GitMerge,
  GitPullRequest,
  Braces,
  Code2,
  AlertTriangle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "GBNF Creator - Visual Grammar Editor for LLMs",
  description:
    "A fast, visual editor for creating simple GBNF grammars to constrain LLM outputs",
};

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-col items-center flex-1">
        <div className="container px-4 py-16 flex flex-col-reverse items-center lg:grid lg:grid-cols-2 gap-8">
          <div className="container min-h-[calc(100vh-64rem)] flex-col items-start justify-center">
            <div className="relative z-20 flex-grow flex flex-col items-center justify-center">
              <h2 className="hidden lg:block text-3xl font-semibold mb-2">
                GBNF Creator
              </h2>
              <p className="hidden lg:block text-muted-foreground mb-6">
                A fast visual editor for making GBNF grammars, which help ensure
                LLMs output text in specific formats. Think of it like regex,
                but for guiding LLMs, or like function calling, but less
                restrictive.
              </p>

              <div className="mb-6 p-4 border border-yellow-500/20 rounded-lg bg-yellow-500/10">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="text-yellow-500 mt-0.5" size={32} />
                  <div className="w-full">
                    <p className="text-sm text-yellow-500">
                      Early Development Notice
                    </p>
                    <p className="text-xs text-yellow-500/80 mt-1">
                      This is an <b>experimental tool for iterating quickly</b>,
                      primarily for developers exploring LLMs. Only supports
                      regular grammars, which covers many common scenarios but
                      far from all GBNF features.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mb-6 p-4 border border-yellow-500/20 rounded-lg bg-yellow-500/10">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="text-yellow-500 mt-0.5" size={32} />
                  <div className="w-full">
                    <p className="text-sm text-yellow-500">
                      I wouldn&apos;t recommend GBNF for production use (yet)
                    </p>
                    <p className="text-xs text-yellow-500/80 mt-1">
                      <b>Barely anyone support GBNF.</b> Consider function
                      calling for production use cases, just because more
                      services support it.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    icon: GitBranch,
                    title: "Quick Iteration",
                    description:
                      "Create and modify grammars in seconds, not minutes",
                  },
                  {
                    icon: GitMerge,
                    title: "Node-Based",
                    description:
                      "Visual flow editor with drag-and-drop simplicity",
                  },
                  {
                    icon: GitPullRequest,
                    title: "Mobile Ready",
                    description:
                      "Works on mobile devices (sometimes; webdev is difficult ok?)",
                  },
                  {
                    icon: Braces,
                    title: "GBNF Export",
                    description:
                      "Export to llama.cpp and fireworks.ai compatible format yay",
                  },
                  {
                    icon: Code2,
                    title: "AI-Built",
                    description:
                      "Mostly built in a single chat with Claude, in cursor - blame the jank on it :)",
                  },
                  {
                    icon: FileCode,
                    title: "Open Source",
                    description:
                      "MIT licensed! As if anyone is actually going to use it though :3",
                  },
                ].map((feature, i) => (
                  <Card
                    key={i}
                    className="p-4 bg-background/80 backdrop-blur-sm border-border/50 hover:border-foreground/20 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <feature.icon className="h-8 w-8 text-foreground/80" />
                      <div className="flex flex-col w-full">
                        <p className="font-medium text-sm">{feature.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
            <div className="relative z-20 mt-auto pt-8">
              <p className="text-sm text-muted-foreground">
                Learn more about GBNF in the{" "}
                <Link
                  href="https://github.com/ggerganov/llama.cpp/blob/master/grammars/README.md"
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-4 hover:text-foreground"
                >
                  llama.cpp documentation
                </Link>{" "}
                or at the{" "}
                <Link
                  href="https://docs.fireworks.ai/structured-responses/structured-output-grammar-based"
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-4 hover:text-foreground"
                >
                  Fireworks AI docs
                </Link>
                .
              </p>
            </div>
          </div>
          <div className="lg:p-8 flex flex-col justify-center items-center">
            <div className="mx-auto flex w-full flex-col justify-center gap-12 sm:w-[350px] px-4 sm:px-0">
              <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">
                  GBNF Creator
                </h1>
                <p className="text-sm text-muted-foreground">
                  A fast, visual editor for creating GBNF grammars. Built for
                  developers experimenting with LLMs who need quick iteration on
                  output constraints.
                </p>
              </div>
              <div className="grid gap-6">
                <Link href="/gbnf">
                  <button className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                    Open Editor
                  </button>
                </Link>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Resources
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 text-center text-sm">
                  <Link
                    href="https://github.com/rizerphe/gbnf"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 items-center justify-center rounded-md border border-border/50 bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    View on GitHub
                  </Link>
                  <Link
                    href="https://docs.fireworks.ai/structured-responses/structured-output-grammar-based"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 items-center justify-center rounded-md border border-border/50 bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    Learn from Fireworks
                  </Link>
                  <Link
                    href="https://github.com/ggerganov/llama.cpp/blob/master/grammars/README.md"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-300 underline"
                  >
                    Or learn the same from llama.cpp
                  </Link>
                </div>
              </div>
              <p className="hidden lg:block text-xs text-center text-muted-foreground">
                Built with Claude 3.5 Sonnet. Thanks Claude! 🤖
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
