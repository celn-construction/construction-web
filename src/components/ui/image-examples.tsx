/**
 * Image Component Examples
 *
 * This file demonstrates various use cases for the OptimizedImage and HeroImage components.
 * Use these patterns throughout the application for consistent image handling.
 */

import { OptimizedImage, HeroImage } from './optimized-image';
import { Calendar, Users } from 'lucide-react';

// Example 1: Hero Section with Overlay and Content
export function HeroSectionExample() {
  return (
    <HeroImage
      src="/images/hero-construction.jpg"
      alt="Construction site aerial view showing workers and rebar foundation"
      className="h-[500px] lg:h-[600px]"
      priority
      sizes="(max-width: 1024px) 100vw, 50vw"
      overlayOpacity={40}
    >
      {/* Content overlaid on image */}
      <div className="absolute bottom-8 left-8 text-white">
        <h2 className="text-4xl font-bold mb-4">Start Building Today</h2>
        <p className="text-lg">Join thousands of construction professionals</p>
      </div>

      {/* Floating card on image */}
      <div className="absolute top-1/4 right-8 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-md flex items-center justify-center">
            <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <div className="text-sm font-medium">Timeline</div>
            <div className="text-xs text-gray-500">On schedule</div>
          </div>
        </div>
      </div>
    </HeroImage>
  );
}

// Example 2: Project Card with Thumbnail
export function ProjectCardExample() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md">
      <OptimizedImage
        src="/images/project-thumbnail.jpg"
        alt="Residential construction project overview"
        width={400}
        height={300}
        objectFit="cover"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
      />
      <div className="p-4">
        <h3 className="text-lg font-semibold">Project Name</h3>
        <p className="text-gray-600 dark:text-gray-400">Project details...</p>
      </div>
    </div>
  );
}

// Example 3: Background Image Section
export function BackgroundSectionExample() {
  return (
    <section className="relative h-96 rounded-lg overflow-hidden">
      <OptimizedImage
        src="/images/background.jpg"
        alt=""
        fill
        objectFit="cover"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 flex items-center justify-center h-full text-white">
        <h2 className="text-4xl font-bold">Your Content Here</h2>
      </div>
    </section>
  );
}

// Example 4: Image Gallery Grid
export function ImageGalleryExample() {
  const images = [
    { id: 1, url: '/images/gallery-1.jpg', description: 'Foundation work in progress' },
    { id: 2, url: '/images/gallery-2.jpg', description: 'Steel frame construction' },
    { id: 3, url: '/images/gallery-3.jpg', description: 'Team meeting on site' },
    { id: 4, url: '/images/gallery-4.jpg', description: 'Completed interior space' },
    { id: 5, url: '/images/gallery-5.jpg', description: 'Exterior facade detail' },
    { id: 6, url: '/images/gallery-6.jpg', description: 'Final walkthrough' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {images.map((image, index) => (
        <div key={image.id} className="rounded-lg overflow-hidden">
          <OptimizedImage
            src={image.url}
            alt={image.description}
            width={400}
            height={300}
            priority={index < 3} // Prioritize first row
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            objectFit="cover"
          />
        </div>
      ))}
    </div>
  );
}

// Example 5: Team Member Card with Avatar
export function TeamMemberCardExample() {
  return (
    <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg">
      <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
        <OptimizedImage
          src="/images/avatar.jpg"
          alt="John Doe, Project Manager"
          width={64}
          height={64}
          objectFit="cover"
        />
      </div>
      <div>
        <h4 className="font-semibold">John Doe</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">Project Manager</p>
      </div>
    </div>
  );
}

// Example 6: Document Preview
export function DocumentPreviewExample() {
  return (
    <div className="border rounded-lg overflow-hidden">
      <OptimizedImage
        src="/images/document-preview.jpg"
        alt="Blueprint preview for project XYZ"
        width={800}
        height={600}
        sizes="(max-width: 1024px) 100vw, 800px"
      />
    </div>
  );
}

// Example 7: Feature Section with Side Image
export function FeatureSectionExample() {
  return (
    <div className="grid lg:grid-cols-2 gap-8 items-center">
      <div>
        <h2 className="text-3xl font-bold mb-4">Powerful Features</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Manage your construction projects with ease using our comprehensive toolkit.
        </p>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <span className="text-green-500">✓</span>
            <span>Real-time collaboration</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-green-500">✓</span>
            <span>Timeline management</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-green-500">✓</span>
            <span>Document organization</span>
          </li>
        </ul>
      </div>
      <div className="rounded-lg overflow-hidden">
        <OptimizedImage
          src="/images/feature-demo.jpg"
          alt="Dashboard interface showing project timeline and team collaboration"
          width={600}
          height={400}
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
      </div>
    </div>
  );
}

// Example 8: Logo Image (Small, Fixed Size)
export function LogoExample() {
  return (
    <OptimizedImage
      src="/images/company-logo.png"
      alt="BuildTrack Pro"
      width={120}
      height={40}
      priority
    />
  );
}

// Example 9: Responsive Banner
export function BannerExample() {
  return (
    <div className="w-full h-48 md:h-64 lg:h-80 rounded-lg overflow-hidden">
      <OptimizedImage
        src="/images/banner.jpg"
        alt="Promotional banner for construction services"
        fill
        objectFit="cover"
        sizes="100vw"
        priority
      />
    </div>
  );
}

// Example 10: Comparison View (Before/After)
export function ComparisonExample() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-sm font-medium mb-2 text-gray-600">Before</p>
        <OptimizedImage
          src="/images/before.jpg"
          alt="Construction site before renovation"
          width={400}
          height={300}
          objectFit="cover"
          sizes="50vw"
        />
      </div>
      <div>
        <p className="text-sm font-medium mb-2 text-gray-600">After</p>
        <OptimizedImage
          src="/images/after.jpg"
          alt="Construction site after renovation completion"
          width={400}
          height={300}
          objectFit="cover"
          sizes="50vw"
        />
      </div>
    </div>
  );
}
