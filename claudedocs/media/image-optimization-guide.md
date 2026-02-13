# Next.js Image Optimization Guide

## Overview

This guide covers best practices for using optimized images in the BuildTrack Pro application with skeleton loading states.

## Components

### OptimizedImage

A wrapper around Next.js `Image` component with automatic skeleton loading and error handling.

**Features:**
- Automatic skeleton loader during image load
- Error state with fallback UI
- Smooth fade-in transition
- Responsive sizing support
- Automatic optimization (WebP, AVIF)
- Lazy loading (unless `priority` is set)

**Usage:**

```tsx
import { OptimizedImage } from '@/components/ui/optimized-image';

// Fixed size image
<OptimizedImage
  src="/images/project-photo.jpg"
  alt="Project construction site"
  width={800}
  height={600}
  className="rounded-lg"
/>

// Fill container (like background images)
<OptimizedImage
  src="/images/background.jpg"
  alt="Background"
  fill
  objectFit="cover"
  sizes="100vw"
/>

// Above-the-fold image (loads immediately)
<OptimizedImage
  src="/images/hero.jpg"
  alt="Hero image"
  width={1200}
  height={800}
  priority
/>
```

### HeroImage

Specialized component for hero sections with gradient overlay and content support.

**Features:**
- All OptimizedImage features
- Gradient overlay (customizable)
- Support for overlaid content (text, cards, CTAs)
- Optimized for large viewport images

**Usage:**

```tsx
import { HeroImage } from '@/components/ui/optimized-image';

<HeroImage
  src="/images/hero-construction.jpg"
  alt="Construction site aerial view"
  className="h-[500px] lg:h-[600px]"
  priority
  sizes="(max-width: 1024px) 100vw, 50vw"
  overlayOpacity={40}
>
  {/* Your content here - cards, text, CTAs */}
  <div className="absolute bottom-8 left-8">
    <h2>Start Building Today</h2>
  </div>
</HeroImage>
```

## Best Practices

### 1. Use `priority` for Above-the-Fold Images

Images visible on initial page load should use `priority` to avoid layout shift:

```tsx
<OptimizedImage
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={800}
  priority // ✅ Loads immediately
/>
```

### 2. Always Provide `sizes` for Responsive Images

Help Next.js generate optimal image sizes:

```tsx
<OptimizedImage
  src="/image.jpg"
  alt="Responsive image"
  fill
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
/>
```

Size breakpoints:
- Mobile: `(max-width: 640px) 100vw`
- Tablet: `(max-width: 1024px) 50vw`
- Desktop: `33vw`

### 3. Use Descriptive Alt Text

Provide meaningful descriptions for accessibility:

```tsx
// ❌ Bad
<OptimizedImage src="/photo.jpg" alt="Photo" />

// ✅ Good
<OptimizedImage
  src="/photo.jpg"
  alt="Construction workers installing steel beams on high-rise building"
/>
```

### 4. Optimize Image Dimensions

Store images at their display size (or 2x for retina):

- Hero images: 2400x1600px (1200x800 display)
- Card thumbnails: 800x600px (400x300 display)
- Icons/avatars: 256x256px (128x128 display)

### 5. Use Appropriate Quality Settings

Default quality is 90 (good balance). Adjust based on use case:

```tsx
// High quality for hero images
<OptimizedImage quality={95} />

// Lower quality for thumbnails
<OptimizedImage quality={75} />
```

### 6. Leverage Next.js Image Optimization

Next.js automatically:
- Converts images to WebP/AVIF
- Generates responsive sizes
- Lazy loads images (unless `priority`)
- Serves optimized formats based on browser support

## Common Patterns

### Card with Image Thumbnail

```tsx
<div className="rounded-lg overflow-hidden">
  <OptimizedImage
    src="/project-thumbnail.jpg"
    alt="Project name"
    width={400}
    height={300}
    objectFit="cover"
    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
  />
</div>
```

### Background Image Section

```tsx
<section className="relative h-96">
  <OptimizedImage
    src="/background.jpg"
    alt=""
    fill
    objectFit="cover"
    sizes="100vw"
  />
  <div className="relative z-10">
    {/* Content */}
  </div>
</section>
```

### Image Gallery

```tsx
<div className="grid grid-cols-3 gap-4">
  {images.map((image, i) => (
    <OptimizedImage
      key={image.id}
      src={image.url}
      alt={image.description}
      width={400}
      height={400}
      priority={i < 3} // Prioritize first row
      sizes="(max-width: 1024px) 50vw, 33vw"
    />
  ))}
</div>
```

### Avatar/Profile Picture

```tsx
<div className="w-12 h-12 rounded-full overflow-hidden">
  <OptimizedImage
    src="/avatar.jpg"
    alt="User name"
    width={48}
    height={48}
    objectFit="cover"
  />
</div>
```

## Performance Considerations

### Image Size Budget

- Hero images: < 200KB
- Card images: < 100KB
- Thumbnails: < 50KB
- Icons: < 20KB

### Loading Strategy

1. **Above-the-fold**: Use `priority`
2. **Below-the-fold**: Let Next.js lazy load
3. **Many images**: Consider progressive loading

### Skeleton Loading States

Skeleton loaders appear automatically while images load:
- Shows gray placeholder with icon
- Fades smoothly to actual image
- Maintains layout stability (no CLS)

## Migration from Old Components

### Replace `ImageWithFallback`

```tsx
// ❌ Old
import { ImageWithFallback } from '@/components/ui/image-with-fallback';
<ImageWithFallback src="/image.jpg" alt="Image" />

// ✅ New
import { OptimizedImage } from '@/components/ui/optimized-image';
<OptimizedImage src="/image.jpg" alt="Image" width={800} height={600} />
```

### Replace plain `<img>` tags

```tsx
// ❌ Old
<img src="/image.jpg" alt="Image" />

// ✅ New
<OptimizedImage src="/image.jpg" alt="Image" width={800} height={600} />
```

### Replace Next.js Image directly

```tsx
// ❌ Old
<Image src="/image.jpg" alt="Image" fill className="object-cover" />

// ✅ New (adds skeleton + error handling)
<OptimizedImage src="/image.jpg" alt="Image" fill objectFit="cover" />
```

## Troubleshooting

### Image not loading

1. Check `public/images/` directory exists
2. Verify image path is correct
3. Check browser console for errors

### Skeleton showing too long

1. Optimize source image size
2. Check network speed
3. Consider using `priority` for critical images

### Layout shift on load

1. Always specify width/height or use `fill`
2. Use `sizes` prop for responsive images
3. Ensure parent container has defined dimensions

## Next.js Image Configuration

Check `next.config.js` for image optimization settings:

```js
module.exports = {
  images: {
    domains: ['example.com'], // External image domains
    formats: ['image/avif', 'image/webp'], // Supported formats
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};
```
