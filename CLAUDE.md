# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Vue 3 + TypeScript frontend application for data management with user authentication and CRUD operations. Built with Vite and using Pinia for state management.

**Tech Stack**: Vue 3.5.18, TypeScript, Vite 7.0.6, Pinia, Vue Router, Vitest

## Essential Commands

Development workflow:
```bash
npm run dev          # Start development server (http://localhost:5173)
npm run type-check   # TypeScript type checking
npm run lint         # ESLint with auto-fix
npm run format       # Prettier code formatting
npm run build        # Production build with type checking
npm run test:unit    # Run unit tests with Vitest
```

Always run `npm run type-check` and `npm run lint` before committing changes.

## Architecture & Key Patterns

### Vue 3 Composition API
- All components use `<script setup lang="ts">` syntax
- Reactive state with `ref()` and `reactive()`
- Composables pattern for reusable logic

### Authentication System
- JWT tokens stored in localStorage with expiry tracking
- Global route guards in `src/router/index.ts`
- Routes marked with `meta: { requiresAuth: true }`
- Auth store handles login/logout: `src/stores/auth.ts`

### API Integration
- Centralized API configuration: `src/config/api.ts`
- Helper functions: `getApiUrl()`, `getAuthHeaders()`
- Consistent error handling with user-friendly messages
- All API calls use async/await pattern

### State Management (Pinia)
- Auth store: `src/stores/auth.ts` - user session, login/logout
- Counter store: `src/stores/counter.ts` - example store
- Type-safe with TypeScript interfaces

### Type System
- `src/types/models.ts` - Data model interfaces (User, Model, Record types)
- `src/types/auth.ts` - Authentication interfaces
- Path alias: `@/` maps to `src/`

## Application Domain

This is a **dynamic data management system** where:

1. **Models** define data structures with various field types (text, number, boolean, date, email)
2. **Records** are instances of these models with actual data
3. **Users** have different permissions (admin, can create models, model-specific permissions)
4. **Admin functions** include user management, system logs, performance monitoring

### Key Views
- `LoginView` - Authentication
- `ModelsView` - Model management and creation
- `RecordsView` - Data record CRUD operations
- `UserAdminView` - User and permission management
- Various admin panels for logs and monitoring

### Field Types Supported
Text (single/multi-line), Decimal, Long, Boolean, Date, DateTime, Email with validation

## Code Conventions

### Component Structure
```vue
<template>
  <!-- Template with semantic HTML -->
</template>

<script setup lang="ts">
// Imports
// Reactive state with ref()
// Functions (async/await for API)
// Lifecycle hooks
</script>

<style scoped>
/* Component-specific styles */
</style>
```

### Naming Conventions
- Components: PascalCase (`UserAdminView.vue`)
- Variables/functions: camelCase (`editUserData`)
- Routes: kebab-case (`/user-admin`)
- Types: PascalCase with descriptive suffixes (`UpdateUserRequest`)

### Error Handling Pattern
```typescript
try {
  // API call
} catch (err) {
  errorRef.value = err instanceof Error ? err.message : 'Generic error message'
  console.error('Context:', err)
}
```

## Development Notes

### Form Validation
- HTML validation attributes (`pattern`, `required`)
- JavaScript validation functions for complex rules
- Real-time error display with reactive error refs

### Routing
Protected routes require authentication. Add new routes to `src/router/index.ts` with appropriate `meta.requiresAuth` flag.

### API Requests
Use the helper functions from `src/config/api.ts`:
- `getApiUrl(endpoint)` for consistent base URL
- `getAuthHeaders()` for authenticated requests

### Docker Development
Application runs in nginx container with API proxy to backend:8080. Static files served from nginx with rate limiting configured.