# Visual Consistency Guide - SnapCase App

**Project**: SnapCase Custom Phone Case Platform  
**Version**: v1.0  
**Last Updated**: December 2024  
**Owner**: Ethan Trifari  

## 🎯 Visual Consistency with SnapCase.ai Homepage

This guide ensures the Next.js app (`app.snapcase.ai`) maintains visual harmony with the main SnapCase.ai homepage for a seamless user experience.

## 🎨 Brand Visual Identity

### Primary Brand Elements
- **Snap Violet**: Primary brand color (`var(--snap-violet)`)
- **Clean Typography**: `var(--font-display)` for headings, `var(--font-body)` for body text
- **Modern Layout**: Generous white space from the `--space-*` scale with subtle `var(--shadow-md)` accents
- **Premium Feel**: High-quality imagery, smooth animations

### Visual Hierarchy
1. **Primary CTA**: Bold, prominent "Design Online" buttons
2. **Secondary Actions**: Subtle, supporting elements
3. **Content**: Clear, readable typography with proper spacing
4. **Navigation**: Clean, minimal header with brand consistency

## 🔗 Cross-Domain Consistency

### Navigation Consistency
```css
/* Match SnapCase.ai header styling */
.header {
  background: color-mix(in srgb, var(--snap-white) 95%, transparent);
  backdrop-filter: blur(calc(var(--space-1) * 2.5));
  border-bottom: calc(var(--space-1) / 4) solid var(--snap-cloud-border);
  padding: var(--space-4) 0;
}

.brand-logo {
  font-family: var(--font-display);
  font-weight: var(--font-bold);
  font-size: var(--text-2xl);
  color: var(--snap-violet);
  text-decoration: none;
}

.cta-button {
  background: var(--snap-violet);
  color: var(--snap-white);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-lg);
  font-weight: var(--font-semibold);
  min-height: var(--control-height);
  transition: all 0.2s ease;
}
```

### Color Palette Alignment
```css
:root {
  /* Exact match with SnapCase.ai */
  --brand-primary: var(--snap-violet);
  --brand-primary-light: var(--snap-violet-light);
  --brand-primary-dark: var(--snap-violet-dark);
  --brand-primary-tint: var(--snap-violet-50);
  
  /* Neutral grays matching homepage */
  --gray-50: var(--snap-gray-50);
  --gray-100: var(--snap-gray-100);
  --gray-200: var(--snap-cloud-border);
  --gray-300: var(--snap-gray-300);
  --gray-400: var(--snap-gray-400);
  --gray-500: var(--snap-gray-500);
  --gray-600: var(--snap-gray-600);
  --gray-700: var(--snap-gray-700);
  --gray-800: var(--snap-gray-800);
  --gray-900: var(--snap-gray-900);
  --neutral-surface: var(--snap-cloud);
}
```

### Typography Consistency
```css
/* Match SnapCase.ai typography */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');

.heading-primary {
  font-family: var(--font-display);
  font-weight: var(--font-bold);
  font-size: var(--text-4xl); /* Closest token to the 2.5rem homepage hero */
  line-height: 1.2;
  color: var(--snap-gray-900);
}

.heading-secondary {
  font-family: var(--font-display);
  font-weight: var(--font-semibold);
  font-size: var(--text-3xl);
  line-height: 1.3;
  color: var(--snap-gray-900);
}

.body-text {
  font-family: var(--font-body);
  font-weight: var(--font-normal);
  font-size: var(--text-base);
  line-height: 1.6;
  color: var(--snap-gray-600);
}
```

## 🎭 Animation & Interaction Consistency

### Smooth Transitions
```css
/* Match SnapCase.ai animation style */
.transition-smooth {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.hover-lift {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.hover-lift:hover {
  transform: translateY(calc(-0.5 * var(--space-1)));
  box-shadow: var(--shadow-lg);
}
```

### Button Interactions
```css
/* Match SnapCase.ai button behavior */
.btn-primary {
  background: var(--snap-violet);
  color: var(--snap-white);
  border: none;
  border-radius: var(--radius-lg);
  padding: var(--space-3) var(--space-6);
  font-weight: var(--font-semibold);
  font-size: var(--text-base);
  min-height: var(--control-height);
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-sm);
}

.btn-primary:hover {
  background: var(--snap-violet-dark);
  transform: translateY(calc(-0.5 * var(--space-1)));
  box-shadow: var(--shadow-lg);
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: var(--shadow-sm);
}
```

## 📱 Layout Consistency

### Container Widths
```css
/* Match SnapCase.ai layout structure */
.container {
  max-width: min(100%, calc(var(--space-16) * 20));
  margin: 0 auto;
  padding: 0 var(--space-4);
}

.section-padding {
  padding: var(--space-16) 0;
}

@media (max-width: 768px) {
  .container {
    padding: 0 var(--space-4);
  }
  
  .section-padding {
    padding: var(--space-8) 0;
  }
}
```

### Grid System
```css
/* Match SnapCase.ai grid structure */
.grid {
  display: grid;
  gap: var(--space-8);
}

.grid-2 {
  grid-template-columns: repeat(2, 1fr);
}

.grid-3 {
  grid-template-columns: repeat(3, 1fr);
}

@media (max-width: 768px) {
  .grid-2,
  .grid-3 {
    grid-template-columns: 1fr;
  }
}
```

## 🎨 Component Consistency

### Card Design
```css
/* Match SnapCase.ai card styling */
.card {
  background: var(--snap-white);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  box-shadow: var(--shadow-md);
  border: calc(var(--space-1) / 4) solid var(--snap-cloud-border);
  transition: all 0.2s ease;
}

.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(calc(-0.5 * var(--space-1)));
}
```

### Form Elements
```css
/* Match SnapCase.ai form styling */
.form-input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: calc(var(--space-1) / 2) solid var(--snap-cloud-border);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  transition: all 0.2s ease;
  background: var(--snap-white);
  min-height: var(--control-height);
}

.form-input:focus {
  outline: none;
  border-color: var(--snap-violet);
  box-shadow: 0 0 0 calc(var(--space-1) * 0.75) var(--snap-focus-ring);
}
```

## 🎯 Page-Specific Consistency

### Design Page
- **Layout**: Match SnapCase.ai product page layout
- **Device Picker**: Clean, grid-based device selection
- **Editor**: Full-screen, focused design experience
- **CTA**: Prominent "Continue" button matching homepage style

### Checkout Page
- **Layout**: Clean, single-column checkout flow
- **Summary Card**: Match SnapCase.ai product card styling
- **Form**: Consistent form styling with homepage
- **Payment**: Seamless Stripe integration with brand colors

### Thank You Page
- **Layout**: Centered, celebratory design
- **Typography**: Match SnapCase.ai success page styling
- **Actions**: Consistent button styling and spacing

## 📋 Visual Consistency Checklist

### ✅ Brand Elements
- [ ] Snap Violet (`var(--snap-violet)`) used consistently
- [ ] Headings set in `var(--font-display)`
- [ ] Body copy set in `var(--font-body)`
- [ ] Spacing pulled from the `--space-*` scale
- [ ] Shadows and radii use design tokens (`var(--shadow-*)`, `var(--radius-*)`)

### ✅ Layout Consistency
- [ ] Container widths match homepage
- [ ] Grid system consistent
- [ ] Section padding matches
- [ ] Responsive breakpoints aligned

### ✅ Component Consistency
- [ ] Button styling matches homepage
- [ ] Card design consistent
- [ ] Form elements match
- [ ] Navigation styling aligned

### ✅ Animation Consistency
- [ ] Transition timing matches
- [ ] Hover effects consistent
- [ ] Loading states match
- [ ] Micro-interactions aligned

### ✅ Cross-Domain Experience
- [ ] Seamless transition from homepage
- [ ] Consistent navigation
- [ ] Matching footer styling
- [ ] Brand consistency maintained

## 🎨 Implementation Strategy

### 1. **CSS Variables**
```css
/* Define all brand values as CSS variables */
:root {
  --brand-primary: var(--snap-violet);
  --brand-primary-light: var(--snap-violet-light);
  --brand-primary-dark: var(--snap-violet-dark);
  --brand-neutral-surface: var(--snap-cloud);
  --brand-neutral-border: var(--snap-cloud-border);
  /* ... map additional homepage aliases to existing design tokens */
}
```

### 2. **Component Library**
- Create reusable components using design system
- Ensure all components match SnapCase.ai styling
- Test components across different pages

### 3. **Visual Testing**
- Compare app.snapcase.ai with snapcase.ai
- Ensure visual harmony across domains
- Test on different devices and browsers

### 4. **Performance Optimization**
- Optimize images and fonts
- Minimize CSS bundle size
- Ensure fast loading times

---

**Document Owner**: Ethan Trifari  
**Design Lead**: AI Assistant  
**Last Updated**: December 2024
