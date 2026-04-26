import type { WebApiClient } from './web-api-client';
import type {
  WebAuthErrorPresenter,
  WebAuthUiSuggestedAction,
} from './web-auth-presenter';
import type { WebAuthSessionState } from './web-auth-flow';

const SUCCESS_MESSAGE = 'Carga completada.';
const GENERIC_ERROR_MESSAGE = 'No pudimos completar la operación. Reintentá en unos segundos.';

type WebAuthExperienceScreen = 'auth-form' | 'protected-result';
type WebAuthExperienceStatus = 'idle' | 'success' | 'error';
const PROTECTED_RESULT_SCREEN: WebAuthExperienceScreen = 'protected-result';

export interface WebAuthExperienceVisibleState {
  currentScreen: WebAuthExperienceScreen;
  status: WebAuthExperienceStatus;
  message: string | null;
  payload: string | null;
  suggestedAction: WebAuthUiSuggestedAction;
}

interface WebAuthExperienceDependencies {
  sessionState: Pick<WebAuthSessionState, 'saveApiKey'>;
  apiClient: Pick<WebApiClient, 'getProtected'>;
  presenter: Pick<WebAuthErrorPresenter, 'getState'>;
}

export interface WebAuthExperience {
  navigateToAuthForm(): void;
  typeApiKeyInput(value: string): void;
  submitProtectedRequest(url: string): Promise<void>;
  getVisibleState(): WebAuthExperienceVisibleState;
}

interface InternalUiState {
  apiKeyInput: string;
  visible: WebAuthExperienceVisibleState;
}

const createDefaultVisibleState = (): WebAuthExperienceVisibleState => ({
  currentScreen: 'auth-form',
  status: 'idle',
  message: null,
  payload: null,
  suggestedAction: null,
});

const serializePayload = (payload: unknown): string => {
  if (typeof payload === 'string') {
    return payload;
  }

  try {
    return JSON.stringify(payload);
  } catch {
    return String(payload);
  }
};

const createErrorVisibleState = (
  message: string,
  suggestedAction: WebAuthUiSuggestedAction,
): WebAuthExperienceVisibleState => ({
  currentScreen: PROTECTED_RESULT_SCREEN,
  status: 'error',
  message,
  payload: null,
  suggestedAction,
});

const createSuccessVisibleState = (payload: unknown): WebAuthExperienceVisibleState => ({
  currentScreen: PROTECTED_RESULT_SCREEN,
  status: 'success',
  message: SUCCESS_MESSAGE,
  payload: serializePayload(payload),
  suggestedAction: null,
});

export const createWebAuthExperience = (
  dependencies: WebAuthExperienceDependencies,
): WebAuthExperience => {
  const { sessionState, apiClient, presenter } = dependencies;

  const uiState: InternalUiState = {
    apiKeyInput: '',
    visible: createDefaultVisibleState(),
  };

  return {
    navigateToAuthForm(): void {
      uiState.visible = createDefaultVisibleState();
    },

    typeApiKeyInput(value: string): void {
      uiState.apiKeyInput = value;
    },

    async submitProtectedRequest(url: string): Promise<void> {
      uiState.visible = {
        ...uiState.visible,
        currentScreen: PROTECTED_RESULT_SCREEN,
      };

      sessionState.saveApiKey(uiState.apiKeyInput);

      try {
        const response = await apiClient.getProtected<unknown>(url);
        const presenterState = presenter.getState();

        if (presenterState.status === 'error') {
          uiState.visible = createErrorVisibleState(
            presenterState.errorMessage ?? GENERIC_ERROR_MESSAGE,
            presenterState.suggestedAction,
          );

          return;
        }

        uiState.visible = createSuccessVisibleState(response.data);
      } catch {
        uiState.visible = createErrorVisibleState(
          GENERIC_ERROR_MESSAGE,
          'reconfigure_api_key',
        );
      }
    },

    getVisibleState(): WebAuthExperienceVisibleState {
      return uiState.visible;
    },
  };
};
