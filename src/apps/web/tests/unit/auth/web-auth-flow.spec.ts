import { describe, expect, it } from 'vitest';

import {
  API_KEY_HEADER_NAME,
  createWebApiClient,
  type HttpRequest,
  type HttpResponse,
  type HttpTransport
} from '../../../src/auth/web-api-client';
import { createWebAuthSessionState } from '../../../src/auth/web-auth-flow';

class TransportSpy implements HttpTransport {
  public readonly requests: HttpRequest[] = [];

  public async request<TData>(request: HttpRequest): Promise<HttpResponse<TData>> {
    this.requests.push(request);

    return {
      status: 200,
      data: 'ok' as TData
    } satisfies HttpResponse<TData>;
  }
}

describe('web auth flow', () => {
  it('guarda la API Key en memoria de sesión', () => {
    const sessionState = createWebAuthSessionState();

    sessionState.saveApiKey('  lp-key-001  ');

    expect(sessionState.getApiKey()).toBe('lp-key-001');
  });

  it('envía X-API-Key en llamadas protegidas', async () => {
    const transport = new TransportSpy();
    const sessionState = createWebAuthSessionState();

    sessionState.saveApiKey('lp-key-002');

    const apiClient = createWebApiClient({
      transport,
      sessionState
    });

    await apiClient.getProtected('/api/v1/secure-resource');

    expect(transport.requests).toHaveLength(1);
    expect(transport.requests[0]?.headers[API_KEY_HEADER_NAME]).toBe('lp-key-002');
  });

  it('no envía X-API-Key en llamadas públicas', async () => {
    const transport = new TransportSpy();
    const sessionState = createWebAuthSessionState();

    sessionState.saveApiKey('lp-key-003');

    const apiClient = createWebApiClient({
      transport,
      sessionState
    });

    await apiClient.getPublic('/api/v1/public-resource');

    expect(transport.requests).toHaveLength(1);
    expect(transport.requests[0]?.headers[API_KEY_HEADER_NAME]).toBeUndefined();
  });
});
