# Contributing to TubeTime

Thank you for your interest in contributing to TubeTime! This document provides guidelines and instructions for contributing.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/tubetime.git`
3. Create a feature branch: `git checkout -b feature/your-feature`
4. Make your changes
5. Test your changes thoroughly
6. Commit with a descriptive message
7. Push to your fork
8. Open a Pull Request

## Development Setup

See [MANUAL_SETUP.md](MANUAL_SETUP.md) for detailed setup instructions.

### Quick Setup

```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Setup database
cd backend
sqlite3 tubetime.db < drizzle/0000_good_carmella_unuscione.sql
npx tsx seed.js

# Run servers
npm start          # Terminal 1 (backend)
npm run dev        # Terminal 2 (frontend)
```

## Code Style

- Use consistent indentation (2 spaces)
- Follow existing naming conventions
- Add comments for complex logic
- Keep functions focused and small

## Pull Request Guidelines

- Describe what your PR does
- Reference any related issues
- Include screenshots for UI changes
- Ensure all tests pass
- Keep commits atomic and well-described

## Reporting Issues

When reporting issues, please include:
- Steps to reproduce
- Expected vs actual behavior
- Browser/OS information
- Console errors if applicable

## Questions?

Open an issue with the "question" label.
