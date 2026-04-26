import Link from 'next/link';
import type { ReactElement } from 'react';

const HomePage = (): ReactElement => (
  <main style={{ padding: '2rem' }}>
    <h1>Los Primos Restobar</h1>
    <p>Accedé al flujo inicial de autenticación por API Key.</p>
    <Link href="/login">Ir al Login</Link>
  </main>
);

export default HomePage;
