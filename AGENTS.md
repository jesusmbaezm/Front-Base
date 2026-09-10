# AGENTS.md - Frontend Development Guide

## Overview
This is an Angular 20 application using standalone components, signals, and Angular Material. The project uses SSR (Server-Side Rendering) with Angular Universal.

## Build Commands

| Command | Description |
|---------|-------------|
| `npm start` or `ng serve` | Start development server (http://localhost:4200) |
| `npm run build` or `ng build` | Build for production |
| `npm run watch` | Build in watch mode for development |
| `npm run serve:ssr:demo-frontend` | Run SSR server |
| `npm test` or `ng test` | Run all tests with Karma |
| `ng test --include="**/login-form.spec.ts"` | Run single test file |
| `ng test --watch=false --browsers=ChromeHeadless` | Run tests once in CI |

## Project Structure

```
src/
├── app/
│   ├── bootstrap/           # App initialization (Material config)
│   ├── core/                # Singleton services, guards, interceptors
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── layout/          # Shell, sidebar, topbar
│   │   ├── security/       # Token storage, auth API
│   │   ├── session/         # Session management
│   │   └── models/          # TypeScript interfaces
│   ├── features/            # Feature modules (lazy-loaded)
│   │   └── [feature]/
│   │       └── presentation/
│   │           ├── pages/   # Page components
│   │           └── components/
│   └── shared/              # Shared components, pipes, directives
├── styles.scss              # Global styles
└── main.ts                  # Application bootstrap
```

## Code Style Guidelines

### TypeScript Configuration
- **Strict mode is enabled** in `tsconfig.json` - all strict checks must pass
- Use TypeScript types explicitly; avoid `any`
- Enable `noImplicitReturns`, `noFallthroughCasesInSwitch`

### Component Patterns
- Use **standalone components** (Angular 15+ style)
- Always use `ChangeDetectionStrategy.OnPush`
- Use **signals** for component state (`signal()`, `computed()`, `effect()`)
- Use **inject()** function for dependency injection instead of constructor injection

### Naming Conventions
- **Files**: kebab-case (e.g., `login-form.ts`, `session-timeout-dialog.ts`)
- **Classes**: PascalCase (e.g., `LoginForm`, `SessionService`)
- **Components**: suffix with type (e.g., `LoginForm`, `DashboardPage`)
- **Services**: suffix with `Service` (e.g., `SessionService`)
- **Guards**: suffix with `Guard` (e.g., `AuthGuard`)
- **Directives**: prefix with `has` (e.g., `HasPermissionDirective`)
- **CSS/SCSS classes**: BEM or kebab-case

### Imports
- Group imports in this order:
  1. Angular core imports (`@angular/core`, `@angular/common`, etc.)
  2. Angular modules (`@angular/forms`, `@angular/router`)
  3. Third-party libraries (`@angular/material`, etc.)
  4. Relative imports (core, features, shared)
- Use **barrel exports** (`index.ts`) for clean import paths

### Formatting
- **Prettier** is configured with:
  - `printWidth: 100`
  - `singleQuote: true`
- **EditorConfig**: 2-space indentation, UTF-8 charset
- **Always** run Prettier before committing

### Templates
- Use control flow `@if`, `@for`, `@switch` (Angular 17+ syntax)
- Avoid `*ngIf`, `*ngFor`, `*ngSwitch`
- Use signal inputs when available (`@Input()` with signals)

### Error Handling
- Use `try/catch` with proper error typing
- Log errors with context: `console.log('[ServiceName] methodName()', data)`
- Display user-friendly error messages in UI

## Testing

### Framework
- **Karma** test runner with **Jasmine** framework
- Tests co-located with components: `[component].spec.ts`

### Running Tests
```bash
# All tests
npm test

# Single file
ng test --include="**/login-form.spec.ts"

# With coverage
ng test --code-coverage

# Single test (add to spec file)
fit('should...', () => {});  // f = focus
xit('should...', () => {});  // x = skip
```

### Test Best Practices
- Use `TestBed.configureTestingModule()` for component tests
- Mock services with `jasmine.createSpyObj()` or `provideMock()`
- Use `ComponentFixture` for testing component behavior
- Follow AAA pattern: Arrange, Act, Assert

## Linting & Pre-commit
- No ESLint configured - use TypeScript strict mode and Prettier
- Run Prettier: `npx prettier --write .`
- Check with: `npx prettier --check .`

## Dependencies
- **Angular 20** - Framework
- **Angular Material** - UI components
- **RxJS 7.x** - Reactive programming (signals preferred for new code)
- **SCSS** - Styling
