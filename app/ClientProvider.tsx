'use client';

import ClientOnly from './components/ClientOnly';
import GlobalEffects from './components/GlobalEffects';
import NavigationGuard from './components/NavigationGuard';

export default function ClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClientOnly>
      <GlobalEffects />
      <NavigationGuard />
      {children}
    </ClientOnly>
  );
}