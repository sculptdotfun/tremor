# Seismo App

A modern Next.js application with TypeScript, Tailwind CSS, and Turbopack.

## Tech Stack

- **Framework:** Next.js 15 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **Build Tool:** Turbopack
- **Package Manager:** pnpm
- **Code Quality:** ESLint, Prettier, Husky, lint-staged

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Installation

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Available Scripts

```bash
pnpm dev        # Start development server with Turbopack
pnpm build      # Build for production
pnpm start      # Start production server
pnpm lint       # Run ESLint
pnpm format     # Format code with Prettier
pnpm typecheck  # Run TypeScript type checking
```

## Project Structure

```
seismo-app/
├── app/           # Next.js App Router
├── components/    # React components
├── lib/           # Utility functions
├── public/        # Static assets
├── .husky/        # Git hooks
└── .vscode/       # VS Code settings
```

## Features

- ⚡ **Turbopack** - Lightning fast builds
- 🎨 **Tailwind CSS 4** - Latest utility-first CSS framework
- 📝 **TypeScript** - Type-safe development
- 🔧 **ESLint & Prettier** - Code quality and formatting
- 🪝 **Husky & lint-staged** - Pre-commit hooks
- 📦 **pnpm** - Fast, disk space efficient package manager
