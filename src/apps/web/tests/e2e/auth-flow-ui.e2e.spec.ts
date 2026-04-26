import { describe, expect, it } from 'vitest';

import {
  API_KEY_HEADER_NAME,
  createWebApiClient,
  type HttpRequest,
  type HttpResponse,
  type HttpTransport,
} from '../../src/auth/web-api-client';
import { createWebAuthExperience } from '../../src/auth/web-auth-experience';
import { createWebAuthSessionState } from '../../src/auth/web-auth-flow';
import { createWebAuthErrorPresenter } from '../../src/auth/web-auth-presenter';

class FullFlowHttpTransportStub implements HttpTransport {
  private readonly responseByUrl: Readonly<Record<string, HttpResponse<unknown>>>;

  public readonly requests: HttpRequest[] = [];

  public constructor(responseByUrl: Readonly<Record<string, HttpResponse<unknown>>>) {
    this.responseByUrl = responseByUrl;
  }

  public async request<TData>(request: HttpRequest): Promise<HttpResponse<TData>> {
    this.requests.push(request);

    const response = this.responseByUrl[request.url];

    if (response === undefined) {
      throw new Error(`No test response configured for ${request.url}`);
    }

    return response as HttpResponse<TData>;
  }
}

describe('auth flow e2e ui -> api -> visible response', () => {
  it('navega formulario auth, envía X-API-Key y renderiza payload visible al usuario', async () => {
    const transport = new FullFlowHttpTransportStub({
      '/api/v1/protected/orders': {
        status: 200,
        data: {
          totalOrders: 4,
          operationalDay: '2026-04-25',
        },
      },
    });

    const sessionState = createWebAuthSessionState();
    const apiClient = createWebApiClient({ transport, sessionState });
    const presenter = createWebAuthErrorPresenter({ apiClient });

    const experience = createWebAuthExperience({
      sessionState,
      apiClient,
      presenter,
    });

    experience.navigateToAuthForm();
    experience.typeApiKeyInput('  lp-key-e2e-200  ');

    await experience.submitProtectedRequest('/api/v1/protected/orders');

    const visibleState = experience.getVisibleState();

    expect(transport.requests).toHaveLength(1);
    expect(transport.requests[0]?.headers[API_KEY_HEADER_NAME]).toBe('lp-key-e2e-200');
    expect(visibleState.currentScreen).toBe('protected-result');
    expect(visibleState.status).toBe('success');
    expect(visibleState.message).toBe('Carga completada.');
    expect(visibleState.payload).toBe('{"totalOrders":4,"operationalDay":"2026-04-25"}');
  });

  it('renderiza estado visible de error para 401 canonical al finalizar la acción UI', async () => {
    const transport = new FullFlowHttpTransportStub({
      '/api/v1/protected/orders': {
        status: 401,
        data: {
          code: 'AUTH_UNAUTHENTICATED',
        },
      },
    });

    const sessionState = createWebAuthSessionState();
    const apiClient = createWebApiClient({ transport, sessionState });
    const presenter = createWebAuthErrorPresenter({ apiClient });

    const experience = createWebAuthExperience({
      sessionState,
      apiClient,
      presenter,
    });

    experience.navigateToAuthForm();
    experience.typeApiKeyInput('lp-key-e2e-401');

    await experience.submitProtectedRequest('/api/v1/protected/orders');

    const visibleState = experience.getVisibleState();

    expect(transport.requests).toHaveLength(1);
    expect(transport.requests[0]?.headers[API_KEY_HEADER_NAME]).toBe('lp-key-e2e-401');
    expect(visibleState.currentScreen).toBe('protected-result');
    expect(visibleState.status).toBe('error');
    expect(visibleState.message).toBe('No pudimos autenticar tu solicitud. Verificá tu API Key.');
    expect(visibleState.suggestedAction).toBe('reconfigure_api_key');
    expect(visibleState.payload).toBeNull();
  });

  it('renderiza estado visible de error para 403 canonical y acción sugerida de permisos', async () => {
    const transport = new FullFlowHttpTransportStub({
      '/api/v1/protected/admin': {
        status: 403,
        data: {
          code: 'AUTH_FORBIDDEN',
        },
      },
    });

    const sessionState = createWebAuthSessionState();
    const apiClient = createWebApiClient({ transport, sessionState });
    const presenter = createWebAuthErrorPresenter({ apiClient });

    const experience = createWebAuthExperience({
      sessionState,
      apiClient,
      presenter,
    });

    experience.navigateToAuthForm();
    experience.typeApiKeyInput('lp-key-e2e-403');

    await experience.submitProtectedRequest('/api/v1/protected/admin');

    const visibleState = experience.getVisibleState();

    expect(transport.requests).toHaveLength(1);
    expect(transport.requests[0]?.headers[API_KEY_HEADER_NAME]).toBe('lp-key-e2e-403');
    expect(visibleState.currentScreen).toBe('protected-result');
    expect(visibleState.status).toBe('error');
    expect(visibleState.message).toBe('Tu usuario no tiene permisos para esta acción.');
    expect(visibleState.suggestedAction).toBe('request_permissions');
    expect(visibleState.payload).toBeNull();
  });
});
