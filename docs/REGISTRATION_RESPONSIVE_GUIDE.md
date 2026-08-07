# Registration Flow Responsive Design Guide

## 📱 Breakpoint Reference

### Mobile Small (< 640px)
```
Container: Full width with p-4
Grid: Single column
Logo: h-6
Heading: text-xl
Spacing: gap-4
Buttons: h-11
Button Layout: Vertical stack (flex-col)
```

### Mobile Large / Tablet (640px - 1023px)
```
Container: Full width with p-4
Grid: Single column
Logo: h-7 (sm:)
Heading: text-2xl (sm:)
Spacing: gap-5 (sm:)
Buttons: h-12 (sm:)
Button Layout: Horizontal (sm:flex-row)
```

### Desktop (≥ 1024px)
```
Container: max-w-4xl
Grid: Two columns (lg:grid-cols-2)
Logo: h-8 (lg:)
Heading: text-[28px] (lg:)
Spacing: p-8 (lg:)
Buttons: Full-width in column
Button Layout: Side-by-side
```

---

## 🎨 Component Sizing Matrix

| Component | Mobile (<640px) | Tablet (640-1023px) | Desktop (≥1024px) |
|-----------|-----------------|---------------------|-------------------|
| Logo Height | 24px (h-6) | 28px (h-7) | 32px (h-8) |
| Main Heading | 20px (text-xl) | 24px (text-2xl) | 28px (text-[28px]) |
| Icon Size | 16px (h-4 w-4) | 16-20px (h-4/5 w-4/5) | 20px (h-5 w-5) |
| Button Height | 44px (h-11) | 48px (h-12) | 48px (h-12) |
| Card Padding | 20px (p-5) | 28px (p-7) | 32px (p-8) |
| Gap Between | 16px (gap-4) | 20px (gap-5) | 20px (gap-5) |
| Grid Layout | 1 column | 1 column | 2 columns |

---

## 🔍 Key Responsive Classes

### Container
```jsx
<div className="w-full max-w-4xl mx-auto">
```
- Mobile: 100% width minus p-4
- Desktop: Capped at 896px (4xl)

### Grid Layout
```jsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
```
- Mobile/Tablet: Single column, full-width sections
- Desktop: Two equal columns side-by-side

### Text Sizing
```jsx
<h1 className="text-xl sm:text-2xl lg:text-[28px]">
```
- Mobile: 20px (1.25rem)
- Tablet: 24px (1.5rem)
- Desktop: 28px (custom)

### Spacing
```jsx
<div className="gap-4 sm:gap-5">
```
- Mobile: 16px (1rem)
- Tablet+: 20px (1.25rem)

### Padding
```jsx
<div className="p-5 sm:p-7 lg:p-8">
```
- Mobile: 20px (1.25rem)
- Tablet: 28px (1.75rem)
- Desktop: 32px (2rem)

---

## 🎯 Touch Target Guidelines

All interactive elements follow WCAG 2.1 touch target guidelines:

### Minimum Touch Targets
- Buttons: **44px** minimum (h-11 = 44px, h-12 = 48px)
- Icons: **16-20px** with padding for 44px tap area
- Links: **44px** height with padding

### Button Sizing
```jsx
// Primary action
<Button className="h-11 sm:h-12 w-full">

// Secondary actions
<Button className="h-10 w-full">
```

---

## 📐 Layout Behavior

### Mobile Portrait (< 640px)
```
┌─────────────┐
│   Logo      │
│             │
│   Status    │
│   Badge     │
│             │
│   Heading   │
│   Text      │
│             │
│   Steps     │
│   1. ...    │
│   2. ...    │
│   3. ...    │
├─────────────┤
│   Details   │
│   Card      │
│             │
│   [Button1] │
│   [Button2] │
│   [Btn] [Btn]│
│             │
│   Footer    │
└─────────────┘
```

### Desktop (≥ 1024px)
```
┌──────────────┬──────────────┐
│   Logo       │  Details     │
│              │  Card        │
│   Status     │              │
│   Badge      │  [Button 1]  │
│              │  [Button 2]  │
│   Heading    │  [Btn][Btn]  │
│   Text       │              │
│              │  Footer      │
│   Steps      │              │
│   1. ...     │              │
│   2. ...     │              │
│   3. ...     │              │
└──────────────┴──────────────┘
```

---

## 🌟 Best Practices Applied

1. **Mobile-First**: Base styles for mobile, progressive enhancement
2. **Touch-Friendly**: All buttons ≥44px height
3. **Readable Text**: Scales from 20px → 28px
4. **Proper Wrapping**: `break-words` prevents overflow
5. **Flexible Layout**: Grid adapts to viewport
6. **Icon Scaling**: Icons resize with screen
7. **Consistent Spacing**: Proportional gaps at all sizes

---

## 🧪 Testing Checklist

### Mobile (375px - iPhone SE)
- [ ] Logo visible and sized correctly
- [ ] Heading fits without wrapping awkwardly
- [ ] All buttons easily tappable (44px+)
- [ ] Email doesn't overflow
- [ ] Category name wraps properly
- [ ] Footer text readable

### Tablet (768px - iPad)
- [ ] Single column layout maintained
- [ ] Comfortable spacing between elements
- [ ] Buttons properly sized
- [ ] Text scales appropriately
- [ ] No horizontal scroll

### Desktop (1280px+)
- [ ] Two-column layout displays
- [ ] Visual balance between columns
- [ ] All content visible without scroll
- [ ] Proper spacing maintained
- [ ] Professional appearance

---

## 🔧 Common Issues & Solutions

### Issue: Text Overflow
**Solution**: Use `break-words` or `break-all`
```jsx
<dd className="break-all">{business.email}</dd>
```

### Issue: Small Touch Targets
**Solution**: Minimum h-11 (44px)
```jsx
<Button className="h-11 w-full">
```

### Issue: Grid Breaking
**Solution**: Explicit breakpoints
```jsx
<div className="grid grid-cols-1 lg:grid-cols-2">
```

### Issue: Fixed Spacing
**Solution**: Responsive classes
```jsx
<div className="gap-4 sm:gap-5">
```

---

## 📱 Device Testing Matrix

| Device | Width | Expected Layout | Status |
|--------|-------|----------------|--------|
| iPhone SE | 375px | Single column | ✅ |
| iPhone 12 | 390px | Single column | ✅ |
| Pixel 5 | 393px | Single column | ✅ |
| iPad Mini | 768px | Single column | ✅ |
| iPad Pro | 1024px | Two columns | ✅ |
| Laptop | 1280px+ | Two columns | ✅ |

---

**Last Updated**: January 7, 2026  
**Applies To**: Pending-approval page, Registration confirmation flows
