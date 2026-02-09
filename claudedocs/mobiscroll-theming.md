# Mobiscroll SCSS Theming Reference

**Source**: `node_modules/@mobiscroll/react/dist/css/mobiscroll.scss`
**Purpose**: Complete reference for customizing Mobiscroll styles via SCSS variables and themes

---

## Table of Contents
1. [Tree Shaking](#tree-shaking)
2. [Sass Variables](#sass-variables)
3. [Sass Themes](#sass-themes)
4. [Practical Examples](#practical-examples)

---

## Tree Shaking

Mobiscroll allows you to reduce bundle size by disabling unused components and themes via SCSS variables.

### Component Toggle Variables
Set these to `false` before importing Mobiscroll to exclude components:

```scss
$mbsc-calendar: false;
$mbsc-eventcalendar: false;
$mbsc-datepicker: false;
$mbsc-select: false;
$mbsc-popup: false;
$mbsc-form: false;
$mbsc-input: false;
$mbsc-button: false;
$mbsc-segmented: false;
$mbsc-stepper: false;
$mbsc-page: false;
$mbsc-card: false;
$mbsc-listview: false;
$mbsc-scrollview: false;
$mbsc-progress: false;
$mbsc-slider: false;
$mbsc-rating: false;
$mbsc-timer: false;
$mbsc-range: false;
$mbsc-numpad: false;
$mbsc-scroller: false;
$mbsc-optionlist: false;
$mbsc-image: false;
$mbsc-notifications: false;
```

**Default**: All components are enabled (`true`)

### Theme Toggle Variables
Set these to `false` to exclude entire theme stylesheets:

```scss
$mbsc-ios-theme: false;
$mbsc-material-theme: false;
$mbsc-windows-theme: false;
```

**Default**: All themes are enabled (`true`)

**Example**: Only use Material theme with Eventcalendar
```scss
$mbsc-ios-theme: false;
$mbsc-windows-theme: false;
$mbsc-datepicker: false;
$mbsc-select: false;
// ... disable other unused components

@import '@mobiscroll/react/dist/css/mobiscroll.scss';
```

---

## Sass Variables

Override these variables **before** importing Mobiscroll to customize styling.

### Global Variables

```scss
// Typography
$mbsc-font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
$mbsc-font-size: 16px;

// Sizing
$mbsc-border-radius: 4px;
$mbsc-spacing: 8px;

// Z-index layers
$mbsc-z-index-overlay: 1000;
$mbsc-z-index-popup: 1100;
$mbsc-z-index-notification: 1200;
```

### iOS Theme Variables

```scss
// iOS Colors
$mbsc-ios-primary: #007aff;
$mbsc-ios-secondary: #8e8e93;
$mbsc-ios-success: #34c759;
$mbsc-ios-danger: #ff3b30;
$mbsc-ios-warning: #ff9500;
$mbsc-ios-info: #5ac8fa;

// iOS Light Theme
$mbsc-ios-background: #ffffff;
$mbsc-ios-text: #000000;
$mbsc-ios-accent: #f2f2f7;
$mbsc-ios-border: rgba(0, 0, 0, 0.1);

// iOS Dark Theme
$mbsc-ios-dark-background: #000000;
$mbsc-ios-dark-text: #ffffff;
$mbsc-ios-dark-accent: #1c1c1e;
$mbsc-ios-dark-border: rgba(255, 255, 255, 0.1);

// iOS Typography
$mbsc-ios-font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
$mbsc-ios-font-size: 17px;
```

### Material Theme Variables

```scss
// Material Colors
$mbsc-material-primary: #1976d2;
$mbsc-material-secondary: #dc004e;
$mbsc-material-success: #4caf50;
$mbsc-material-danger: #f44336;
$mbsc-material-warning: #ff9800;
$mbsc-material-info: #2196f3;

// Material Light Theme
$mbsc-material-background: #ffffff;
$mbsc-material-text: rgba(0, 0, 0, 0.87);
$mbsc-material-accent: #f5f5f5;
$mbsc-material-border: rgba(0, 0, 0, 0.12);

// Material Dark Theme
$mbsc-material-dark-background: #121212;
$mbsc-material-dark-text: #ffffff;
$mbsc-material-dark-accent: #1e1e1e;
$mbsc-material-dark-border: rgba(255, 255, 255, 0.12);

// Material Typography
$mbsc-material-font-family: 'Roboto', system-ui, sans-serif;
$mbsc-material-font-size: 16px;

// Material Elevation Shadows
$mbsc-material-shadow-1: 0 2px 1px -1px rgba(0,0,0,0.2);
$mbsc-material-shadow-2: 0 3px 3px -2px rgba(0,0,0,0.2);
$mbsc-material-shadow-4: 0 4px 5px 0 rgba(0,0,0,0.14);
```

### Windows Theme Variables

```scss
// Windows Colors
$mbsc-windows-primary: #0078d4;
$mbsc-windows-secondary: #605e5c;
$mbsc-windows-success: #107c10;
$mbsc-windows-danger: #d13438;
$mbsc-windows-warning: #faa81a;
$mbsc-windows-info: #00b7c3;

// Windows Light Theme
$mbsc-windows-background: #ffffff;
$mbsc-windows-text: #323130;
$mbsc-windows-accent: #f3f2f1;
$mbsc-windows-border: #edebe9;

// Windows Dark Theme
$mbsc-windows-dark-background: #1b1a19;
$mbsc-windows-dark-text: #ffffff;
$mbsc-windows-dark-accent: #252423;
$mbsc-windows-dark-border: #3b3a39;

// Windows Typography
$mbsc-windows-font-family: 'Segoe UI', system-ui, sans-serif;
$mbsc-windows-font-size: 14px;
```

### Component-Specific Variables

#### Calendar / Eventcalendar

```scss
$mbsc-calendar-header-height: 56px;
$mbsc-calendar-cell-size: 48px;
$mbsc-calendar-event-height: 24px;
$mbsc-calendar-today-color: $mbsc-primary; // per theme
$mbsc-calendar-weekend-color: rgba(0, 0, 0, 0.38);
```

#### Form Components

```scss
$mbsc-input-height: 56px;
$mbsc-input-padding: 16px;
$mbsc-input-border-width: 1px;
$mbsc-button-height: 40px;
$mbsc-button-padding: 8px 16px;
$mbsc-button-border-radius: $mbsc-border-radius;
```

#### Popup

```scss
$mbsc-popup-max-width: 600px;
$mbsc-popup-padding: 24px;
$mbsc-popup-overlay-opacity: 0.5;
```

#### Page / Card

```scss
$mbsc-page-padding: 16px;
$mbsc-card-padding: 16px;
$mbsc-card-border-radius: 8px;
$mbsc-card-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
```

---

## Sass Themes

Mobiscroll provides three base themes: **iOS**, **Material**, and **Windows**. Each has light and dark variants.

### Theme Structure

```scss
// iOS Theme
.mbsc-ios {
  // iOS Light styles
}

.mbsc-ios.mbsc-dark {
  // iOS Dark styles
}

// Material Theme
.mbsc-material {
  // Material Light styles
}

.mbsc-material.mbsc-dark {
  // Material Dark styles
}

// Windows Theme
.mbsc-windows {
  // Windows Light styles
}

.mbsc-windows.mbsc-dark {
  // Windows Dark styles
}
```

### Applying Themes

**In React components:**
```tsx
import { Eventcalendar } from '@mobiscroll/react';

<Eventcalendar theme="ios" themeVariant="dark" />
<Eventcalendar theme="material" themeVariant="light" />
<Eventcalendar theme="windows" />
```

**Global theme class:**
```html
<body class="mbsc-material mbsc-dark">
  <div id="root"></div>
</body>
```

### Custom Themes

Use the `@include mbsc-custom-theme()` mixin to create branded themes:

```scss
@import '@mobiscroll/react/dist/css/mobiscroll.scss';

.mbsc-custom-brand {
  @include mbsc-custom-theme((
    primary: #6200ea,
    secondary: #03dac6,
    success: #00c853,
    danger: #ff5252,
    warning: #ffc107,
    info: #2979ff,
    background: #fafafa,
    text: #212121,
    accent: #f5f5f5,
    border: #e0e0e0
  ));
}
```

**Apply custom theme:**
```tsx
<Eventcalendar theme="custom-brand" />
```

---

## Practical Examples

### Example 1: Override Primary Color for Material Theme

```scss
// custom-theme.scss
$mbsc-material-primary: #6200ea; // Purple instead of blue

@import '@mobiscroll/react/dist/css/mobiscroll.scss';
```

### Example 2: Tree-Shake to Only Eventcalendar + Material Theme

```scss
// minimal-bundle.scss

// Disable iOS and Windows themes
$mbsc-ios-theme: false;
$mbsc-windows-theme: false;

// Disable unused components
$mbsc-datepicker: false;
$mbsc-select: false;
$mbsc-popup: false;
$mbsc-form: false;
$mbsc-input: false;
$mbsc-button: false;
$mbsc-segmented: false;
$mbsc-stepper: false;
$mbsc-page: false;
$mbsc-card: false;
$mbsc-listview: false;
$mbsc-scrollview: false;
$mbsc-progress: false;
$mbsc-slider: false;
$mbsc-rating: false;
$mbsc-timer: false;
$mbsc-range: false;
$mbsc-numpad: false;
$mbsc-scroller: false;
$mbsc-optionlist: false;
$mbsc-image: false;
$mbsc-notifications: false;

// Only Eventcalendar and Material theme will be included
@import '@mobiscroll/react/dist/css/mobiscroll.scss';
```

### Example 3: Custom Construction-Themed Brand

```scss
// construction-theme.scss

// Override Material base colors
$mbsc-material-primary: #ff6b35; // Construction orange
$mbsc-material-secondary: #004e89; // Steel blue
$mbsc-material-warning: #ffd23f; // Safety yellow
$mbsc-material-success: #4caf50; // Keep default green

@import '@mobiscroll/react/dist/css/mobiscroll.scss';

// Additional custom theme
.mbsc-construction {
  @include mbsc-custom-theme((
    primary: #ff6b35,
    secondary: #004e89,
    success: #3a7d44,
    danger: #d62828,
    warning: #ffd23f,
    info: #00b4d8,
    background: #fafafa,
    text: #2b2d42,
    accent: #edf2f4,
    border: #8d99ae
  ));
}
```

**Usage in React:**
```tsx
import './construction-theme.scss';

<Eventcalendar theme="construction" />
```

### Example 4: Global Dark Mode Override

```scss
// dark-mode.scss

// Override dark theme colors
$mbsc-material-dark-background: #0d1117; // GitHub dark
$mbsc-material-dark-text: #c9d1d9;
$mbsc-material-dark-accent: #161b22;
$mbsc-material-dark-border: #30363d;

@import '@mobiscroll/react/dist/css/mobiscroll.scss';
```

**Apply dark theme:**
```tsx
<Eventcalendar theme="material" themeVariant="dark" />
```

---

## Additional Resources

- **Mobiscroll Docs**: [https://docs.mobiscroll.com/react/eventcalendar](https://docs.mobiscroll.com/react/eventcalendar)
- **SCSS Source**: `node_modules/@mobiscroll/react/dist/css/mobiscroll.scss`
- **Theming Guide**: [https://docs.mobiscroll.com/react/theming](https://docs.mobiscroll.com/react/theming)

---

## Notes

- Always set variables **before** the `@import` statement
- Component toggle variables only affect CSS bundle size, not JS tree-shaking
- Theme variants (light/dark) are applied via `themeVariant` prop or `.mbsc-dark` class
- Custom themes inherit from base theme if not all properties are specified
- Use browser DevTools to inspect actual class names and CSS custom properties applied

---

**Last Updated**: Based on installed package `@mobiscroll/react` in `node_modules/`
