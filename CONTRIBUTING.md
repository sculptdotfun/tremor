# Contributing to TREMOR.LIVE

Thank you for your interest in contributing to TREMOR.LIVE! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Submitting Changes](#submitting-changes)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md) to ensure a welcoming environment for all contributors.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/tremor-live.git
   cd tremor-live
   ```
3. **Add the upstream remote**:
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/tremor-live.git
   ```

## Development Setup

### Prerequisites

- Node.js 18+ (use `nvm` or `fnm` for version management)
- pnpm (`npm install -g pnpm`)
- A Convex account (free tier available at [convex.dev](https://convex.dev))

### Installation

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   Then edit `.env.local` with your Convex credentials.

3. **Initialize Convex**:
   ```bash
   pnpm convex dev
   ```

4. **Start the development server**:
   ```bash
   pnpm dev
   ```

5. **Open your browser** at [http://localhost:3000](http://localhost:3000)

## Making Changes

### Branch Naming

Create a new branch for your feature or fix:

- Features: `feature/your-feature-name`
- Bug fixes: `fix/issue-description`
- Documentation: `docs/what-you-updated`
- Refactoring: `refactor/what-you-refactored`

```bash
git checkout -b feature/your-feature-name
```

### Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

Examples:
```
feat: add real-time social intelligence feature
fix: resolve sorting issue in X sources display
docs: update README with new environment variables
```

## Submitting Changes

### Before Submitting

1. **Update your branch** with the latest upstream changes:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run quality checks**:
   ```bash
   pnpm lint
   pnpm typecheck
   pnpm format:check
   ```

3. **Test your changes** thoroughly:
   - Verify the app works in development mode
   - Check different time windows (5m, 1h, 24h)
   - Test on both desktop and mobile views
   - Ensure Convex functions work correctly

### Pull Request Process

1. **Push your branch** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create a Pull Request** on GitHub:
   - Use a clear, descriptive title
   - Reference any related issues
   - Describe what changes you made and why
   - Include screenshots for UI changes
   - List any breaking changes

3. **PR Requirements**:
   - All checks must pass
   - Code review approval required
   - Maintain test coverage
   - Update documentation as needed

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Avoid `any` types (use `unknown` or proper types)
- Define interfaces for data structures
- Use meaningful variable and function names

### React

- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use proper prop types

### Styling

- Use Tailwind CSS classes
- Follow the existing design system
- Maintain responsive design
- Test on multiple screen sizes

### Performance

- Optimize for real-time updates
- Minimize re-renders with proper memoization
- Use lazy loading where appropriate
- Keep bundle size minimal

## Testing

While we don't have a full test suite yet, please:

- Manually test all changes
- Verify no regressions in existing features
- Test edge cases and error states
- Check performance impact

Future contributions to add testing infrastructure are welcome!

## Documentation

- Update README.md if you change setup steps
- Document new environment variables
- Add JSDoc comments for complex functions
- Update inline comments for clarity
- Include examples for new features

## Getting Help

- **Issues**: Check existing issues or create a new one
- **Discussions**: Use GitHub Discussions for questions
- **Discord**: Join our community (link in README)

## Recognition

Contributors will be recognized in:
- The project README
- Release notes
- Our website (coming soon)

Thank you for contributing to TREMOR.LIVE! Your efforts help make real-time market intelligence accessible to everyone.