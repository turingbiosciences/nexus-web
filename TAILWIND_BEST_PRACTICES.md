# Tailwind CSS Best Practices

This document outlines the Tailwind CSS best practices implemented in this project for easier maintenance.

## Design System Architecture

### 1. Centralized Design Tokens (`globals.css`)

All design tokens are centralized in CSS custom properties (variables) in `src/app/globals.css`:

```css
:root {
  /* Brand colors */
  --color-primary: #2563eb;
  --color-primary-hover: #1d4ed8;

  /* Semantic colors */
  --color-success: #10b981;
  --color-error: #ef4444;

  /* Layout */
  --max-width-container: 80rem;
  --spacing-page: 2rem;

  /* Border radius */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
}
```

**Benefits:**

- Single source of truth for design values
- Easy theme updates (just change values in one place)
- Consistent design across the application
- Easy to implement dark mode

### 2. Component Utility Classes (`@layer components`)

Common UI patterns are extracted into reusable utility classes:

#### Container

```css
.container-page {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8;
}
```

Use: `<div className="container-page">`

#### Card

```css
.card {
  @apply bg-white rounded-lg shadow-sm border;
}
```

Use: `<div className="card p-6">`

#### Alerts

```css
.alert-error {
  @apply alert bg-red-50 border-red-200;
}
```

Use: `<div className="alert-error">Error message</div>`

Available: `alert-error`, `alert-success`, `alert-info`, `alert-warning`

#### Buttons

```css
.btn-primary {
  @apply btn bg-blue-600 hover:bg-blue-700 text-white;
}
```

Use: `<button className="btn-primary px-4 py-2">Click me</button>`

#### Stat Cards

```css
.stat-card {
  @apply rounded-lg p-4;
}
```

Use: `<div className="stat-card bg-blue-50">...</div>`

## Best Practices

### ✅ DO: Use Component Classes for Repeated Patterns

**Before:**

```tsx
<div className="bg-white rounded-lg shadow-sm border p-6">{/* content */}</div>
```

**After:**

```tsx
<div className="card p-6">{/* content */}</div>
```

### ✅ DO: Use Design Tokens for Consistent Values

**Before:**

```tsx
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{/* content */}</div>
```

**After:**

```tsx
<div className="container-page">{/* content */}</div>
```

### ✅ DO: Combine Utility Classes with Component Classes

```tsx
<button className="btn-primary px-6 py-3">Sign In</button>
```

### ❌ DON'T: Repeat Long Class Strings

**Avoid:**

```tsx
<div className="bg-red-50 border border-red-200 rounded-lg p-4">
<div className="bg-red-50 border border-red-200 rounded-lg p-4">
<div className="bg-red-50 border border-red-200 rounded-lg p-4">
```

**Use:**

```tsx
<div className="alert-error">
<div className="alert-error">
<div className="alert-error">
```

## Maintenance Benefits

1. **Easier Updates**: Change a design token once, updates everywhere
2. **Consistency**: Component classes ensure consistent styling
3. **Reduced Duplication**: Less repetitive code
4. **Better Readability**: Semantic class names are easier to understand
5. **Smaller Bundle**: Tailwind's purge removes unused utilities
6. **Type Safety**: Works seamlessly with Tailwind's IntelliSense

## Adding New Component Classes

When you find yourself repeating the same Tailwind classes 3+ times, extract them:

1. Open `src/app/globals.css`
2. Add to the `@layer components` section:

```css
@layer components {
  .your-component-name {
    @apply your tailwind classes here;
  }
}
```

3. Use the new class in your components

## Theme Customization

To customize the theme:

1. Update design tokens in `:root` in `globals.css`
2. All components using those tokens will automatically update

Example - Changing primary color:

```css
:root {
  --color-primary: #7c3aed; /* Change from blue to purple */
  --color-primary-hover: #6d28d9;
}
```

## Dark Mode Support

Dark mode is pre-configured. To add dark mode styles:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
    /* Add more dark mode overrides */
  }
}
```

## Resources

- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
- [Tailwind CSS Best Practices](https://tailwindcss.com/docs/reusing-styles)
- [CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)
