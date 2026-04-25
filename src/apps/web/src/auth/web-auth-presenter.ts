import type { HttpResponse, WebApiClient } from './web-api-client';

const HTTP_STATUS_UNAUTHORIZED = 401;
const HTTP_STATUS_FORBIDDEN = 403;

type AuthErrorCode = 'AUTH_UNAUTHENTICATED' | 'AUTH_FORBIDDEN';

type WebAuthUiStatus = 'idle' | 'error';

export type WebAuthUiSuggestedAction = 'reconfigure_api_key' | 'request_permissions' | null;

export interface WebAuthUiErrorState {
  status: WebAuthUiStatus;
  errorMessage: string | null;
  suggestedAction: WebAuthUiSuggestedAction;
}

interface WebAuthErrorPresenterDependencies {
  apiClient: WebApiClient;
}

export interface WebAuthErrorPresenter {
  loadProtectedResource(url: string): Promise<void>;
  getState(): WebAuthUiErrorState;
}

const DEFAULT_WEB_AUTH_UI_ERROR_STATE: WebAuthUiErrorState = {
  status: 'idle',
  errorMessage: null,
  suggestedAction: null,
};

const isRecordValue = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const readAuthErrorCode = (response: HttpResponse<unknown>): AuthErrorCode | null => {
  if (!isRecordValue(response.data)) {
    return null;
  }

  const code = response.data['code'];

  if (code === 'AUTH_UNAUTHENTICATED' || code === 'AUTH_FORBIDDEN') {
    return code;
  }

  return null;
};

const resolveUiErrorStateFromResponse = (
  response: HttpResponse<unknown>,
): WebAuthUiErrorState | null => {
  const canonicalCode = readAuthErrorCode(response);

  if (
    response.status === HTTP_STATUS_UNAUTHORIZED ||
    canonicalCode === 'AUTH_UNAUTHENTICATED'
  ) {
    return {
      status: 'error',
      errorMessage: 'No pudimos autenticar tu solicitud. Verificá tu API Key.',
      suggestedAction: 'reconfigure_api_key',
    };
  }

  if (response.status === HTTP_STATUS_FORBIDDEN || canonicalCode === 'AUTH_FORBIDDEN') {
    return {
      status: 'error',
      errorMessage: 'Tu usuario no tiene permisos para esta acción.',
      suggestedAction: 'request_permissions',
    };
  }

  return null;
};

export const createWebAuthErrorPresenter = (
  dependencies: WebAuthErrorPresenterDependencies,
): WebAuthErrorPresenter => {
  const { apiClient } = dependencies;

  let state: WebAuthUiErrorState = DEFAULT_WEB_AUTH_UI_ERROR_STATE;

  apiClient.subscribeToResponses((response) => {
    const authErrorState = resolveUiErrorStateFromResponse(response);

    state = authErrorState ?? DEFAULT_WEB_AUTH_UI_ERROR_STATE;
  });

  return {
    async loadProtectedResource(url: string): Promise<void> {
      await apiClient.getProtected(url);
    },

    getState(): WebAuthUiErrorState {
      return state;
    },
  };
};
