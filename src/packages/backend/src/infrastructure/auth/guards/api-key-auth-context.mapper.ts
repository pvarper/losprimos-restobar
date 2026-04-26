import { ActiveApiKeyPayload } from '../../../application/auth/ports/validate-api-key.port';

export interface ApiKeyAuthenticatedContext {
  authMethod: 'api-key';
  clientId: string;
  roles: string[];
  internalSessionId?: string;
  principalId?: string;
}

export const API_KEY_AUTH_METHOD = 'api-key' as const;

export const toApiKeyAuthenticatedContext = (
  payload: ActiveApiKeyPayload,
): ApiKeyAuthenticatedContext => {
  const context: ApiKeyAuthenticatedContext = {
    authMethod: API_KEY_AUTH_METHOD,
    clientId: payload.clientId,
    roles: payload.roles,
  };
  
  // Soporte genérico para compatibilidad de tests
  Object.defineProperty(context, 'principalId', {
    get() { return payload.clientId; },
    enumerable: true
  });
  
  if (payload.internalSessionId) {
    context.internalSessionId = payload.internalSessionId;
  }
  
  return context;
};
