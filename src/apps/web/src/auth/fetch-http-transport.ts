import type { HttpRequest, HttpResponse, HttpTransport } from './web-api-client';

const EMPTY_RESPONSE_BODY = '';

const parseResponseBody = async (response: Response): Promise<unknown> => {
  const rawBody = await response.text();

  if (rawBody === EMPTY_RESPONSE_BODY) {
    return null;
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    return rawBody;
  }
};

export const createFetchHttpTransport = (): HttpTransport => ({
  async request<TData>(request: HttpRequest): Promise<HttpResponse<TData>> {
    const response = await fetch(request.url, {
      method: request.method,
      headers: request.headers,
    });

    const parsedBody = await parseResponseBody(response);

    return {
      status: response.status,
      data: parsedBody as TData,
    };
  },
});
