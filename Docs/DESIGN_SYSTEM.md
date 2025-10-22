# Design System - SnapCase App

**Project**: SnapCase Custom Phone Case Platform  
**Version**: v1.0  
**Last Updated**: December 2024  
**Owner**: Ethan Trifari  

## 🎨 Design System Overview

This design system ensures the Next.js app (`app.snapcase.ai`) maintains visual consistency with the SnapCase.ai homepage and delivers a sleek, modern user experience.

## 🎯 Design Principles

### 1. **Modern & Sleek**
- Clean, minimal interface with generous white space
- Subtle shadows and smooth transitions
- Premium feel that matches SnapCase.ai homepage

### 2. **Brand Consistency**
- Visual harmony with main SnapCase.ai site
- Consistent typography, colors, and spacing
- Seamless user experience across domains

### 3. **Mobile-First**
- Touch-friendly interface design
- Responsive layouts that work on all devices
- Optimized for mobile design workflow

## 🎨 Visual Design System

### Color Palette

```css
:root {
  /* Primary Colors */
  --snap-violet: #7C3AED;        /* Primary brand color */
  --snap-violet-light: #A78BFA;  /* Light variant */
  --snap-violet-dark: #5B21B6;   /* Dark variant */
  
  /* Neutral Colors */
  --snap-white: #FFFFFF;
  --snap-gray-50: #F9FAFB;
  --snap-gray-100: #F3F4F6;
  --snap-gray-200: #E5E7EB;
  --snap-gray-300: #D1D5DB;
  --snap-gray-400: #9CA3AF;
  --snap-gray-500: #6B7280;
  --snap-gray-600: #4B5563;
  --snap-gray-700: #374151;
  --snap-gray-800: #1F2937;
  --snap-gray-900: #111827;
  
  /* Accent Colors */
  --snap-success: #10B981;
  --snap-warning: #F59E0B;
  --snap-error: #EF4444;
  --snap-info: #3B82F6;
  
  /* Focus & Interactive */
  --snap-focus: #7C3AED;
  --snap-focus-ring: rgba(124, 58, 237, 0.2);
}
```

### Typography

```css
/* Font Families */
--font-display: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Font Sizes */
--text-xs: 0.75rem;      /* 12px */
--text-sm: 0.875rem;     /* 14px */
--text-base: 1rem;       /* 16px */
--text-lg: 1.125rem;     /* 18px */
--text-xl: 1.25rem;      /* 20px */
--text-2xl: 1.5rem;      /* 24px */
--text-3xl: 1.875rem;    /* 30px */
--text-4xl: 2.25rem;     /* 36px */
--text-5xl: 3rem;        /* 48px */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Spacing System

```css
:root {
  --space-1: 0.25rem;    /* 4px */
  --space-2: 0.5rem;     /* 8px */
  --space-3: 0.75rem;    /* 12px */
  --space-4: 1rem;       /* 16px */
  --space-5: 1.25rem;    /* 20px */
  --space-6: 1.5rem;     /* 24px */
  --space-8: 2rem;       /* 32px */
  --space-10: 2.5rem;    /* 40px */
  --space-12: 3rem;      /* 48px */
  --space-16: 4rem;      /* 64px */
  --space-20: 5rem;      /* 80px */
  --space-24: 6rem;      /* 96px */
}
```

### Border Radius

```css
:root {
  --radius-sm: 0.375rem;   /* 6px */
  --radius-md: 0.5rem;     /* 8px */
  --radius-lg: 0.75rem;    /* 12px */
  --radius-xl: 1rem;       /* 16px */
  --radius-2xl: 1.5rem;    /* 24px */
  --radius-full: 9999px;
}
```

### Shadows

```css
:root {
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  --shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}
```

## 🧩 Component Design System

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: var(--snap-violet);
  color: var(--snap-white);
  border: none;
  border-radius: var(--radius-xl);
  padding: var(--space-3) var(--space-6);
  font-weight: var(--font-semibold);
  font-size: var(--text-base);
  min-height: 48px;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-sm);
}

.btn-primary:hover {
  background: var(--snap-violet-dark);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-primary:focus {
  outline: 2px solid var(--snap-focus-ring);
  outline-offset: 2px;
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: var(--snap-violet);
  border: 2px solid var(--snap-violet);
  border-radius: var(--radius-xl);
  padding: var(--space-3) var(--space-6);
  font-weight: var(--font-semibold);
  font-size: var(--text-base);
  min-height: 48px;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: var(--snap-violet);
  color: var(--snap-white);
}
```

### Cards

```css
.card {
  background: var(--snap-white);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  padding: var(--space-6);
  border: 1px solid var(--snap-gray-200);
  transition: all 0.2s ease;
}

.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

.card-header {
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--snap-gray-200);
  margin-bottom: var(--space-4);
}

.card-title {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--snap-gray-900);
}
```

### Form Elements

```css
.form-input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 2px solid var(--snap-gray-300);
  border-radius: var(--radius-lg);
  font-size: var(--text-base);
  transition: all 0.2s ease;
  background: var(--snap-white);
}

.form-input:focus {
  outline: none;
  border-color: var(--snap-violet);
  box-shadow: 0 0 0 3px var(--snap-focus-ring);
}

.form-label {
  display: block;
  font-weight: var(--font-medium);
  color: var(--snap-gray-700);
  margin-bottom: var(--space-2);
  font-size: var(--text-sm);
}
```

### Navigation

```css
.nav {
  background: var(--snap-white);
  border-bottom: 1px solid var(--snap-gray-200);
  padding: var(--space-4) 0;
  position: sticky;
  top: 0;
  z-index: 50;
  backdrop-filter: blur(10px);
}

.nav-brand {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--snap-violet);
  text-decoration: none;
}

.nav-cta {
  background: var(--snap-violet);
  color: var(--snap-white);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  text-decoration: none;
  font-weight: var(--font-semibold);
  transition: all 0.2s ease;
}
```

## 📱 Layout System

### Container

```css
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-4);
}

.container-sm {
  max-width: 640px;
}

.container-lg {
  max-width: 1400px;
}
```

### Grid System

```css
.grid {
  display: grid;
  gap: var(--space-6);
}

.grid-2 {
  grid-template-columns: repeat(2, 1fr);
}

.grid-3 {
  grid-template-columns: repeat(3, 1fr);
}

.grid-4 {
  grid-template-columns: repeat(4, 1fr);
}

@media (max-width: 768px) {
  .grid-2,
  .grid-3,
  .grid-4 {
    grid-template-columns: 1fr;
  }
}
```

### Flexbox Utilities

```css
.flex {
  display: flex;
}

.flex-col {
  flex-direction: column;
}

.items-center {
  align-items: center;
}

.justify-center {
  justify-content: center;
}

.justify-between {
  justify-content: space-between;
}

.gap-4 {
  gap: var(--space-4);
}

.gap-6 {
  gap: var(--space-6);
}
```

## 🎭 Animation & Transitions

### Standard Transitions

```css
:root {
  --transition-fast: 0.15s ease;
  --transition-normal: 0.2s ease;
  --transition-slow: 0.3s ease;
}

.transition {
  transition: all var(--transition-normal);
}

.transition-fast {
  transition: all var(--transition-fast);
}

.transition-slow {
  transition: all var(--transition-slow);
}
```

### Hover Effects

```css
.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.hover-scale:hover {
  transform: scale(1.05);
}

.hover-fade:hover {
  opacity: 0.8;
}
```

## 🎨 Page-Specific Styles

### Design Page

```css
.design-layout {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: var(--space-8);
  min-height: calc(100vh - 80px);
}

.device-picker {
  background: var(--snap-white);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  box-shadow: var(--shadow-md);
  height: fit-content;
  position: sticky;
  top: 100px;
}

.editor-container {
  background: var(--snap-white);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  padding: var(--space-6);
}

@media (max-width: 1024px) {
  .design-layout {
    grid-template-columns: 1fr;
  }
  
  .device-picker {
    position: static;
  }
}
```

### Checkout Page

```css
.checkout-layout {
  max-width: 800px;
  margin: 0 auto;
  padding: var(--space-8) var(--space-4);
}

.order-summary {
  background: var(--snap-gray-50);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  margin-bottom: var(--space-8);
}

.payment-section {
  background: var(--snap-white);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  box-shadow: var(--shadow-md);
}
```

## 🎯 Implementation Guidelines

### 1. **Use CSS Variables**
- All design tokens should use CSS variables for consistency
- Easy to update globally and maintain brand consistency

### 2. **Mobile-First Approach**
- Start with mobile designs and scale up
- Use responsive breakpoints consistently

### 3. **Component Reusability**
- Create reusable components using the design system
- Maintain consistency across all pages

### 4. **Performance Considerations**
- Use efficient CSS selectors
- Minimize CSS bundle size
- Leverage CSS-in-JS or CSS modules for component isolation

### 5. **Accessibility**
- Ensure sufficient color contrast
- Provide focus indicators
- Support keyboard navigation

## 📋 Design System Checklist

### ✅ Implementation Requirements
- [ ] CSS variables defined for all design tokens
- [ ] Typography system implemented
- [ ] Color palette applied consistently
- [ ] Component library built with design system
- [ ] Responsive layouts implemented
- [ ] Animation and transitions added
- [ ] Accessibility requirements met
- [ ] Performance optimized

### ✅ Quality Assurance
- [ ] Visual consistency with SnapCase.ai homepage
- [ ] Cross-browser compatibility
- [ ] Mobile responsiveness
- [ ] Performance benchmarks met
- [ ] Accessibility standards (WCAG AA)

---

**Document Owner**: Ethan Trifari  
**Design Lead**: AI Assistant  
**Last Updated**: December 2024
