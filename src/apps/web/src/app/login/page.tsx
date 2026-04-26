'use client';

import { useMemo, type ReactElement } from 'react';

import { LoginScreen } from './login-screen';
import { createFetchHttpTransport } from '@/auth/fetch-http-transport';
import { createWebApiClient } from '@/auth/web-api-client';
import { createWebAuthExperience } from '@/auth/web-auth-experience';
import { createWebAuthSessionState } from '@/auth/web-auth-flow';
import { createWebAuthErrorPresenter } from '@/auth/web-auth-presenter';

const PROTECTED_URL = '/api/v1/protected/orders';

const LoginPage = (): ReactElement => {
  const experience = useMemo(() => {
    const sessionState = createWebAuthSessionState();
    const apiClient = createWebApiClient({
      transport: createFetchHttpTransport(),
      sessionState,
    });
    const presenter = createWebAuthErrorPresenter({ apiClient });

    return createWebAuthExperience({
      sessionState,
      apiClient,
      presenter,
    });
  }, []);

  return <LoginScreen experience={experience} protectedUrl={PROTECTED_URL} />;
};

export default LoginPage;
