# Visual Consistency Guide - SnapCase App

**Project**: SnapCase Custom Phone Case Platform  
**Version**: v1.0  
**Last Updated**: December 2024  
**Owner**: Ethan Trifari  

## 🎯 Visual Consistency with SnapCase.ai Homepage

This guide ensures the Next.js app (`app.snapcase.ai`) maintains visual harmony with the main SnapCase.ai homepage for a seamless user experience.

## 🎨 Brand Visual Identity

### Primary Brand Elements
- **Snap Violet**: Primary brand color (#7C3AED)
- **Clean Typography**: Poppins for headings, Inter for body text
- **Modern Layout**: Generous white space, subtle shadows
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
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  padding: 1rem 0;
}

.brand-logo {
  font-family: 'Poppins', sans-serif;
  font-weight: 700;
  font-size: 1.5rem;
  color: #7C3AED;
  text-decoration: none;
}

.cta-button {
  background: #7C3AED;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  font-weight: 600;
  transition: all 0.2s ease;
}
```

### Color Palette Alignment
```css
:root {
  /* Exact match with SnapCase.ai */
  --brand-primary: #7C3AED;
  --brand-primary-light: #A78BFA;
  --brand-primary-dark: #5B21B6;
  
  /* Neutral grays matching homepage */
  --gray-50: #F9FAFB;
  --gray-100: #F3F4F6;
  --gray-200: #E5E7EB;
  --gray-300: #D1D5DB;
  --gray-400: #9CA3AF;
  --gray-500: #6B7280;
  --gray-600: #4B5563;
  --gray-700: #374151;
  --gray-800: #1F2937;
  --gray-900: #111827;
}
```

### Typography Consistency
```css
/* Match SnapCase.ai typography */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');

.heading-primary {
  font-family: 'Poppins', sans-serif;
  font-weight: 700;
  font-size: 2.5rem;
  line-height: 1.2;
  color: #111827;
}

.heading-secondary {
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 1.875rem;
  line-height: 1.3;
  color: #111827;
}

.body-text {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 1rem;
  line-height: 1.6;
  color: #4B5563;
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
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}
```

### Button Interactions
```css
/* Match SnapCase.ai button behavior */
.btn-primary {
  background: #7C3AED;
  color: white;
  border: none;
  border-radius: 0.75rem;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.btn-primary:hover {
  background: #5B21B6;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
```

## 📱 Layout Consistency

### Container Widths
```css
/* Match SnapCase.ai layout structure */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.section-padding {
  padding: 4rem 0;
}

@media (max-width: 768px) {
  .container {
    padding: 0 1rem;
  }
  
  .section-padding {
    padding: 2rem 0;
  }
}
```

### Grid System
```css
/* Match SnapCase.ai grid structure */
.grid {
  display: grid;
  gap: 2rem;
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
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #E5E7EB;
  transition: all 0.2s ease;
}

.card:hover {
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}
```

### Form Elements
```css
/* Match SnapCase.ai form styling */
.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #E5E7EB;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: all 0.2s ease;
  background: white;
}

.form-input:focus {
  outline: none;
  border-color: #7C3AED;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
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
- [ ] Snap Violet (#7C3AED) used consistently
- [ ] Poppins font for headings
- [ ] Inter font for body text
- [ ] Consistent spacing and padding
- [ ] Matching shadow and border radius values

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
  --brand-primary: #7C3AED;
  --brand-primary-light: #A78BFA;
  --brand-primary-dark: #5B21B6;
  /* ... other variables */
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
