// @vitest-environment jsdom

import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { LoginScreen } from '../../../src/app/login/login-screen';
import type {
  WebAuthExperience,
  WebAuthExperienceVisibleState,
} from '../../../src/auth/web-auth-experience';

class FakeWebAuthExperience implements WebAuthExperience {
  public typedApiKey: string | null = null;
  public submittedUrl: string | null = null;

  private visibleState: WebAuthExperienceVisibleState = {
    currentScreen: 'auth-form',
    status: 'idle',
    message: null,
    payload: null,
    suggestedAction: null,
  };

  public navigateToAuthForm(): void {
    this.visibleState = {
      currentScreen: 'auth-form',
      status: 'idle',
      message: null,
      payload: null,
      suggestedAction: null,
    };
  }

  public typeApiKeyInput(value: string): void {
    this.typedApiKey = value;
  }

  public async submitProtectedRequest(url: string): Promise<void> {
    this.submittedUrl = url;
    this.visibleState = {
      currentScreen: 'protected-result',
      status: 'success',
      message: 'Carga completada.',
      payload: '{"ok":true}',
      suggestedAction: null,
    };
  }

  public getVisibleState(): WebAuthExperienceVisibleState {
    return this.visibleState;
  }
}

class FakeWebAuthErrorExperience implements WebAuthExperience {
  private visibleState: WebAuthExperienceVisibleState = {
    currentScreen: 'auth-form',
    status: 'idle',
    message: null,
    payload: null,
    suggestedAction: null,
  };

  public navigateToAuthForm(): void {
    this.visibleState = {
      currentScreen: 'auth-form',
      status: 'idle',
      message: null,
      payload: null,
      suggestedAction: null,
    };
  }

  public typeApiKeyInput(_value: string): void {}

  public async submitProtectedRequest(_url: string): Promise<void> {
    this.visibleState = {
      currentScreen: 'protected-result',
      status: 'error',
      message: 'No pudimos autenticar tu solicitud. Verificá tu API Key.',
      payload: null,
      suggestedAction: 'reconfigure_api_key',
    };
  }

  public getVisibleState(): WebAuthExperienceVisibleState {
    return this.visibleState;
  }
}

describe('login screen', () => {
  afterEach(() => {
    cleanup();
  });

  it('muestra resultado exitoso al enviar API Key y ejecutar acción protegida', async () => {
    const experience = new FakeWebAuthExperience();

    render(<LoginScreen experience={experience} protectedUrl="/api/v1/protected/orders" />);

    fireEvent.change(screen.getByLabelText('API Key'), {
      target: { value: 'lp-ui-key-001' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }));

    await waitFor(() => {
      expect(screen.queryByText('Estado: success')).not.toBeNull();
      expect(screen.queryByText('Mensaje: Carga completada.')).not.toBeNull();
      expect(screen.queryByText('Payload: {"ok":true}')).not.toBeNull();
    });

    expect(experience.typedApiKey).toBe('lp-ui-key-001');
    expect(experience.submittedUrl).toBe('/api/v1/protected/orders');
  });

  it('muestra error canónico y acción sugerida cuando la solicitud protegida falla', async () => {
    const experience = new FakeWebAuthErrorExperience();

    render(<LoginScreen experience={experience} protectedUrl="/api/v1/protected/orders" />);

    fireEvent.change(screen.getByLabelText('API Key'), {
      target: { value: 'lp-ui-key-401' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }));

    await waitFor(() => {
      expect(screen.queryByText('Estado: error')).not.toBeNull();
      expect(
        screen.queryByText('Mensaje: No pudimos autenticar tu solicitud. Verificá tu API Key.'),
      ).not.toBeNull();
      expect(screen.queryByText('Acción sugerida: reconfigure_api_key')).not.toBeNull();
    });
  });
});
