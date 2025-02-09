# GBNF Creator

A fast visual editor for making GBNF grammars, which help ensure LLMs output text in specific formats. Think of it like regex, but for guiding LLMs, or like function calling, but less restrictive.

## ⚠️ Early Development Notice

This is an **experimental tool for iterating quickly**, primarily for developers exploring LLMs. It only supports regular grammars, which covers many common scenarios but far from all GBNF features.

> **Note**: I wouldn't recommend GBNF for production use (yet). Barely anyone supports GBNF. Consider function calling for production use cases, just because more services support it.

## Features

- **Quick Iteration**: Create and modify grammars in seconds, not minutes
- **Node-Based**: Visual flow editor with drag-and-drop simplicity
- **Mobile Ready**: Works on mobile devices (sometimes; webdev is difficult ok?)
- **GBNF Export**: Export to llama.cpp and fireworks.ai compatible format
- **AI-Built**: Mostly built in a single chat with Claude, in cursor - blame the jank on it :)
- **Open Source**: MIT licensed! As if anyone is actually going to use it though :3

## Development

This is a Next.js project. To run it locally:

```bash
bun install
bun dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

## Learn More About GBNF

- [llama.cpp documentation](https://github.com/ggerganov/llama.cpp/blob/master/grammars/README.md)
- [Fireworks AI docs](https://docs.fireworks.ai/structured-responses/structured-output-grammar-based)
