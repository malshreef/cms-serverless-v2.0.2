# Contributing to S7abt CMS

Thank you for your interest in contributing to S7abt CMS! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Testing](#testing)
- [Documentation](#documentation)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment. Please:

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/s7abt-dubai.git
   cd s7abt-dubai
   ```
3. **Add the upstream remote**:
   ```bash
   git remote add upstream https://github.com/original-owner/s7abt-dubai.git
   ```

## Development Setup

### Prerequisites

- Node.js 20.x or later
- npm or yarn
- AWS CLI configured with credentials
- AWS SAM CLI
- MySQL 5.6+ (local or remote)

### Environment Setup

1. **Install dependencies for each component**:

   ```bash
   # Public API
   cd s7abt-api-backend && npm install

   # Admin Backend
   cd ../s7abt-admin/backend && npm install

   # Admin Frontend
   cd ../frontend && npm install

   # Public Website
   cd ../../s7abt-website-v2/s7abt-frontend-v2 && npm install
   ```

2. **Configure environment variables**:

   Copy the example files and fill in your values:
   ```bash
   cp s7abt-admin/frontend/.env.example s7abt-admin/frontend/.env
   cp s7abt-website-v2/s7abt-frontend-v2/.env.example s7abt-website-v2/s7abt-frontend-v2/.env.local
   ```

3. **Set up the database**:

   Create a MySQL database and configure the connection in AWS Secrets Manager or local environment.

### Running Locally

**Admin Panel**:
```bash
cd s7abt-admin/frontend
npm run dev
# Opens at http://localhost:5173
```

**Public Website**:
```bash
cd s7abt-website-v2/s7abt-frontend-v2
npm run dev
# Opens at http://localhost:3000
```

**Lambda Functions** (using SAM local):
```bash
cd s7abt-api-backend
sam local start-api
```

## How to Contribute

### Reporting Bugs

Before creating a bug report, please check existing issues to avoid duplicates.

When filing a bug report, include:

- **Clear title** describing the issue
- **Steps to reproduce** the behavior
- **Expected behavior** vs actual behavior
- **Screenshots** if applicable
- **Environment details** (OS, browser, Node version)
- **Error messages** or logs

### Suggesting Features

Feature requests are welcome! Please provide:

- **Clear description** of the feature
- **Use case** explaining why it's needed
- **Proposed solution** if you have one
- **Alternatives** you've considered

### Contributing Code

1. **Check existing issues** for something to work on, or create a new issue
2. **Comment on the issue** to let others know you're working on it
3. **Create a feature branch** from `main`
4. **Make your changes** following our coding standards
5. **Write/update tests** as needed
6. **Submit a pull request**

## Pull Request Process

### Before Submitting

- [ ] Code follows the project's coding standards
- [ ] All tests pass locally
- [ ] New code includes appropriate tests
- [ ] Documentation is updated if needed
- [ ] Commit messages follow our guidelines
- [ ] Branch is up to date with `main`

### PR Title Format

Use a clear, descriptive title:
```
feat: Add user avatar upload functionality
fix: Resolve article pagination issue
docs: Update API documentation
refactor: Simplify authentication flow
```

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## How Has This Been Tested?
Describe testing performed

## Screenshots (if applicable)

## Checklist
- [ ] My code follows the project style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code where necessary
- [ ] I have updated documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix/feature works
```

### Review Process

1. Maintainers will review your PR
2. Address any requested changes
3. Once approved, your PR will be merged

## Coding Standards

### TypeScript/JavaScript

- Use TypeScript for new code where possible
- Use ES6+ features
- Use `const` by default, `let` when reassignment is needed
- Avoid `var`
- Use meaningful variable and function names
- Keep functions small and focused

### React Components

```tsx
// Preferred: Functional components with TypeScript
interface Props {
  title: string;
  onClick: () => void;
}

export function MyComponent({ title, onClick }: Props) {
  return (
    <button onClick={onClick}>
      {title}
    </button>
  );
}
```

### CSS/Tailwind

- Use Tailwind CSS utility classes
- Extract repeated patterns into components
- Follow mobile-first responsive design

### Lambda Functions

```javascript
// Use consistent response format
const response = require('./shared/response');

exports.handler = async (event) => {
  try {
    // Business logic
    return response.success(data);
  } catch (error) {
    console.error('Error:', error);
    return response.error(error.message, 500);
  }
};
```

### File Naming

- React components: `PascalCase.tsx` (e.g., `ArticleCard.tsx`)
- Utilities/helpers: `camelCase.ts` (e.g., `formatDate.ts`)
- Lambda handlers: `camelCase.js` (e.g., `list.js`, `get.js`)

## Commit Message Guidelines

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples
```
feat(admin): add bulk article delete functionality

fix(api): resolve UTF-8 encoding issue in article titles

docs(readme): update installation instructions

refactor(auth): simplify JWT validation logic
```

## Testing

### Running Tests

```bash
# Frontend tests
cd s7abt-admin/frontend
npm test

# API tests (if available)
cd s7abt-api-backend
npm test
```

### Writing Tests

- Write tests for new features
- Update tests when modifying existing features
- Aim for meaningful coverage, not just high percentages
- Test edge cases and error conditions

### Manual Testing Checklist

Before submitting, manually verify:

- [ ] Feature works in Chrome, Firefox, Safari
- [ ] Responsive design works on mobile
- [ ] RTL (Arabic) layout displays correctly
- [ ] No console errors or warnings
- [ ] API responses are correct

## Documentation

### When to Update Documentation

- Adding new features
- Changing existing behavior
- Adding new environment variables
- Modifying API endpoints
- Updating dependencies

### Documentation Locations

| Type | Location |
|------|----------|
| Architecture | `ARCHITECTURE.md` |
| Deployment | `DEPLOYMENT.md` |
| API Reference | Code comments + README |
| Admin Testing | `s7abt-admin/TESTING_PLAN.md` |

## Questions?

If you have questions, feel free to:

- Open a GitHub issue with the `question` label
- Check existing documentation
- Review closed issues for similar questions

---

Thank you for contributing to S7abt CMS!
