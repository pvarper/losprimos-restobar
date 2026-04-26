'use client';

import { useState, useTransition, type FormEvent } from 'react';

import type {
  WebAuthExperience,
  WebAuthExperienceVisibleState,
} from '@/auth/web-auth-experience';

const EMPTY_VISIBLE_STATE: WebAuthExperienceVisibleState = {
  currentScreen: 'auth-form',
  status: 'idle',
  message: null,
  payload: null,
  suggestedAction: null,
};

interface LoginScreenProps {
  readonly experience: WebAuthExperience;
  readonly protectedUrl: string;
}

export const LoginScreen = ({ experience, protectedUrl }: LoginScreenProps): JSX.Element => {
  const [apiKey, setApiKey] = useState<string>('');
  const [visibleState, setVisibleState] =
    useState<WebAuthExperienceVisibleState>(EMPTY_VISIBLE_STATE);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    startTransition(() => {
      void (async () => {
        experience.navigateToAuthForm();
        experience.typeApiKeyInput(apiKey);
        await experience.submitProtectedRequest(protectedUrl);
        setVisibleState(experience.getVisibleState());
      })();
    });
  };

  return (
    <main style={{ maxWidth: '40rem', margin: '0 auto', padding: '2rem' }}>
      <h1>Login</h1>

      <form onSubmit={handleSubmit}>
        <label htmlFor="api-key-input">API Key</label>
        <input
          id="api-key-input"
          name="api-key"
          value={apiKey}
          onChange={(event) => {
            setApiKey(event.target.value);
          }}
          placeholder="Ingresá tu X-API-Key"
        />
        <button type="submit" disabled={isPending}>
          {isPending ? 'Procesando...' : 'Ingresar'}
        </button>
      </form>

      <section aria-live="polite" style={{ marginTop: '1.5rem' }}>
        <p>Estado: {visibleState.status}</p>
        {visibleState.message !== null ? <p>Mensaje: {visibleState.message}</p> : null}
        {visibleState.payload !== null ? <p>Payload: {visibleState.payload}</p> : null}
        {visibleState.suggestedAction !== null ? (
          <p>Acción sugerida: {visibleState.suggestedAction}</p>
        ) : null}
      </section>
    </main>
  );
};
