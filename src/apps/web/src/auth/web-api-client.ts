import type { WebAuthSessionState } from './web-auth-flow';

export const API_KEY_HEADER_NAME = 'X-API-Key';
const HTTP_METHOD_GET = 'GET';
const MISSING_API_KEY_ERROR = 'No hay API Key configurada para consumir endpoints protegidos.';

type HttpMethod = typeof HTTP_METHOD_GET;

export interface HttpRequest {
  method: HttpMethod;
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
  subscribeToResponses(listener: WebApiResponseListener): () => void;
}

export type WebApiResponseListener = (response: HttpResponse<unknown>) => void;

const createRequest = (url: string, headers: Record<string, string>): HttpRequest => ({
  method: HTTP_METHOD_GET,
  url,
  headers
});

const buildProtectedHeaders = (apiKey: string): Record<string, string> => ({
  [API_KEY_HEADER_NAME]: apiKey
});

export const createWebApiClient = (dependencies: WebApiClientDependencies): WebApiClient => {
  const { transport, sessionState } = dependencies;
  const responseListeners: WebApiResponseListener[] = [];

  const notifyResponseListeners = (response: HttpResponse<unknown>): void => {
    responseListeners.forEach((listener) => {
      listener(response);
    });
  };

  const requestAndNotify = async <TData>(request: HttpRequest): Promise<HttpResponse<TData>> => {
    const response = await transport.request<TData>(request);
    notifyResponseListeners(response);

    return response;
  };

  return {
    async getPublic<TData>(url: string): Promise<HttpResponse<TData>> {
      return requestAndNotify<TData>(createRequest(url, {}));
    },

    async getProtected<TData>(url: string): Promise<HttpResponse<TData>> {
      const apiKey = sessionState.getApiKey();

      if (apiKey === null) {
        throw new Error(MISSING_API_KEY_ERROR);
      }

      return requestAndNotify<TData>(createRequest(url, buildProtectedHeaders(apiKey)));
    },

    subscribeToResponses(listener: WebApiResponseListener): () => void {
      responseListeners.push(listener);

      return (): void => {
        const index = responseListeners.indexOf(listener);

        if (index >= 0) {
          responseListeners.splice(index, 1);
        }
      };
    },
  };
};
