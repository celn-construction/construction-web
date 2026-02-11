'use client';

import { Search, Moon, Sun, Plus, Menu } from 'lucide-react';
import { ImageWithFallback } from '@/components/ui/image-with-fallback';
import { useThemeStore } from '@/store/useThemeStore';
import { LogoIcon } from '@/components/ui/Logo';

interface MobileHeaderProps {
  onMenuOpen: () => void;
}

export default function MobileHeader({ onMenuOpen }: MobileHeaderProps) {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <header className="bg-[var(--bg-primary)] px-4 py-3 flex items-center justify-between border-b border-[var(--border-light)] sticky top-0 z-30 transition-colors duration-150">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuOpen}
          aria-label="Open menu"
          className="flex items-center justify-center hover:opacity-70 transition-opacity cursor-pointer"
        >
          <Menu className="w-5 h-5 text-[var(--text-secondary)]" />
        </button>
        <div className="flex items-center gap-2">
          <LogoIcon size={16} />
          <span className="text-[var(--text-primary)] font-medium text-sm">BuildTrack</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center hover:opacity-70 transition-opacity cursor-pointer"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-[var(--text-secondary)]" />
          ) : (
            <Moon className="w-4 h-4 text-[var(--text-secondary)]" />
          )}
        </button>
        <button className="flex items-center justify-center hover:opacity-70 transition-opacity cursor-pointer">
          <Search className="w-4 h-4 text-[var(--text-secondary)]" />
        </button>
        <button className="w-9 h-9 bg-[var(--bg-hover)] rounded-full overflow-hidden cursor-pointer">
          <ImageWithFallback
            src="/images/avatar-1.jpg"
            alt="User"
            className="w-full h-full object-cover"
          />
        </button>
        <button className="bg-[var(--accent-warm)] hover:bg-[var(--accent-warm-hover)] text-white p-2 rounded-md flex items-center justify-center transition-all duration-150 cursor-pointer">
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
