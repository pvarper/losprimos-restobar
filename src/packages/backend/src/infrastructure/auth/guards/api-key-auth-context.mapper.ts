import { ActiveApiKeyPayload } from '../../../application/auth/ports/validate-api-key.port';

export interface ApiKeyAuthenticatedContext {
  authMethod: 'api-key';
  clientId: string;
  roles: string[];
}

export const API_KEY_AUTH_METHOD = 'api-key' as const;

export const toApiKeyAuthenticatedContext = (
  payload: ActiveApiKeyPayload,
): ApiKeyAuthenticatedContext => ({
  authMethod: API_KEY_AUTH_METHOD,
  clientId: payload.clientId,
  roles: payload.roles,
});
