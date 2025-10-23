'use client';

import ClientOnly from './components/ClientOnly';
import GlobalEffects from './components/GlobalEffects';

export default function ClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClientOnly>
      <GlobalEffects />
      {children}
    </ClientOnly>
  );
}