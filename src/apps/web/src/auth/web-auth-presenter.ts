import type { HttpResponse, WebApiClient } from './web-api-client';
import { resolveAuthCanonicalErrorKind } from '@/auth/auth-canonical-errors';

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

const resolveUiErrorStateFromResponse = (
  response: HttpResponse<unknown>,
): WebAuthUiErrorState | null => {
  const authCanonicalErrorKind = resolveAuthCanonicalErrorKind(
    response.status,
    response.data,
  );

  if (authCanonicalErrorKind === 'unauthenticated') {
    return {
      status: 'error',
      errorMessage: 'No pudimos autenticar tu solicitud. Verificá tu API Key.',
      suggestedAction: 'reconfigure_api_key',
    };
  }

  if (authCanonicalErrorKind === 'forbidden') {
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
