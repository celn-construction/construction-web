'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useLoading } from '@/components/providers/LoadingProvider';

export function useNavigationLoading() {
  const pathname = usePathname();
  const { showLoading, hideLoading } = useLoading();

  // Auto-hide the global loading spinner whenever navigation completes
  useEffect(() => {
    hideLoading();
  }, [pathname, hideLoading]);

  return { showLoading, hideLoading };
}
