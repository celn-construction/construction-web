'use client';

import dynamic from 'next/dynamic';

const AblyProvider = dynamic(() => import('./AblyProvider'), { ssr: false });

interface AblyGateProps {
  enabled: boolean;
  projectId: string;
  children: React.ReactNode;
}

/**
 * Conditionally wraps children with AblyProvider when Ably is configured.
 * Uses dynamic import to avoid loading the Ably SDK when not needed.
 */
export default function AblyGate({ enabled, projectId, children }: AblyGateProps) {
  if (!enabled) return <>{children}</>;
  return <AblyProvider projectId={projectId}>{children}</AblyProvider>;
}
