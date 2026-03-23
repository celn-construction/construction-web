'use client';

import { useMemo } from 'react';
import * as Ably from 'ably';
import { AblyProvider as AblyReactProvider } from 'ably/react';

interface AblyProviderProps {
  projectId: string;
  children: React.ReactNode;
}

export default function AblyProvider({ projectId, children }: AblyProviderProps) {
  const client = useMemo(() => {
    return new Ably.Realtime({
      authUrl: `/api/ably/auth?projectId=${encodeURIComponent(projectId)}`,
      authMethod: 'GET',
      autoConnect: true,
    });
  }, [projectId]);

  return (
    <AblyReactProvider client={client}>
      {children}
    </AblyReactProvider>
  );
}
