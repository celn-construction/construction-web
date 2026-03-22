'use client';

import { useMemo } from 'react';
import * as Ably from 'ably';
import { AblyProvider as AblyReactProvider } from 'ably/react';

interface AblyProviderProps {
  children: React.ReactNode;
}

export default function AblyProvider({ children }: AblyProviderProps) {
  const client = useMemo(() => {
    return new Ably.Realtime({
      authUrl: '/api/ably/auth',
      authMethod: 'GET',
      autoConnect: true,
    });
  }, []);

  return (
    <AblyReactProvider client={client}>
      {children}
    </AblyReactProvider>
  );
}
