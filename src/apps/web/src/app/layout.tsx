import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import './globals.css';

export const metadata: Metadata = {
  title: 'Los Primos Restobar',
  description: 'Operación interna del restobar',
};

interface RootLayoutProps {
  readonly children: ReactNode;
}

const RootLayout = ({ children }: RootLayoutProps): JSX.Element => (
  <html lang="es">
    <body>{children}</body>
  </html>
);

export default RootLayout;
