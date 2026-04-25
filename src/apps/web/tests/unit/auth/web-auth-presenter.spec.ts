import { describe, expect, it } from 'vitest';

import {
  API_KEY_HEADER_NAME,
  createWebApiClient,
  type HttpRequest,
  type HttpResponse,
  type HttpTransport,
} from '../../../src/auth/web-api-client';
import {
  createWebAuthErrorPresenter,
  type WebAuthUiErrorState,
} from '../../../src/auth/web-auth-presenter';
import { createWebAuthSessionState } from '../../../src/auth/web-auth-flow';

class ProtectedResponseTransportStub implements HttpTransport {
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

describe('web auth presenter canonical errors', () => {
  it('mapea 401 AUTH_UNAUTHENTICATED a estado visible con recuperación de API Key', async () => {
    const transport = new ProtectedResponseTransportStub({
      '/api/v1/protected': {
        status: 401,
        data: {
          code: 'AUTH_UNAUTHENTICATED',
        },
      },
    });

    const sessionState = createWebAuthSessionState();
    sessionState.saveApiKey('lp-key-401');

    const apiClient = createWebApiClient({
      transport,
      sessionState,
    });

    const presenter = createWebAuthErrorPresenter({
      apiClient,
    });

    await presenter.loadProtectedResource('/api/v1/protected');

    const errorState: WebAuthUiErrorState = presenter.getState();

    expect(transport.requests).toHaveLength(1);
    expect(transport.requests[0]?.headers[API_KEY_HEADER_NAME]).toBe('lp-key-401');
    expect(errorState).toEqual({
      status: 'error',
      errorMessage: 'No pudimos autenticar tu solicitud. Verificá tu API Key.',
      suggestedAction: 'reconfigure_api_key',
    });
  });

  it('mapea 403 AUTH_FORBIDDEN a estado visible con recuperación de permisos y reintento', async () => {
    const transport = new ProtectedResponseTransportStub({
      '/api/v1/admin-only': {
        status: 403,
        data: {
          code: 'AUTH_FORBIDDEN',
        },
      },
    });

    const sessionState = createWebAuthSessionState();
    sessionState.saveApiKey('lp-key-403');

    const apiClient = createWebApiClient({
      transport,
      sessionState,
    });

    const presenter = createWebAuthErrorPresenter({
      apiClient,
    });

    await presenter.loadProtectedResource('/api/v1/admin-only');

    const errorState = presenter.getState();

    expect(transport.requests).toHaveLength(1);
    expect(transport.requests[0]?.headers[API_KEY_HEADER_NAME]).toBe('lp-key-403');
    expect(errorState).toEqual({
      status: 'error',
      errorMessage: 'Tu usuario no tiene permisos para esta acción.',
      suggestedAction: 'request_permissions',
    });
  });
});
