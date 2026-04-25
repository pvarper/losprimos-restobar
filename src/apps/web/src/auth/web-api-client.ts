import type { WebAuthSessionState } from './web-auth-flow';

export const API_KEY_HEADER_NAME = 'X-API-Key';
const MISSING_API_KEY_ERROR = 'No hay API Key configurada para consumir endpoints protegidos.';

export interface HttpRequest {
  method: 'GET';
  url: string;
  headers: Record<string, string>;
}

export interface HttpResponse<TData> {
  status: number;
  data: TData;
}

export interface HttpTransport {
  request<TData>(request: HttpRequest): Promise<HttpResponse<TData>>;
}

interface WebApiClientDependencies {
  transport: HttpTransport;
  sessionState: Pick<WebAuthSessionState, 'getApiKey'>;
}

export interface WebApiClient {
  getPublic<TData>(url: string): Promise<HttpResponse<TData>>;
  getProtected<TData>(url: string): Promise<HttpResponse<TData>>;
}

const createRequest = (url: string, headers: Record<string, string>): HttpRequest => ({
  method: 'GET',
  url,
  headers
});

export const createWebApiClient = (dependencies: WebApiClientDependencies): WebApiClient => {
  const { transport, sessionState } = dependencies;

  return {
    async getPublic<TData>(url: string): Promise<HttpResponse<TData>> {
      return transport.request<TData>(createRequest(url, {}));
    },

    async getProtected<TData>(url: string): Promise<HttpResponse<TData>> {
      const apiKey = sessionState.getApiKey();

      if (apiKey === null) {
        throw new Error(MISSING_API_KEY_ERROR);
      }

      return transport.request<TData>(
        createRequest(url, {
          [API_KEY_HEADER_NAME]: apiKey
        })
      );
    }
  };
};
