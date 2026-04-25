import {
  ActiveApiKeyPayload,
  ApiKeyValidationResult,
  ValidateApiKeyPort,
} from '../../../application/auth/ports/validate-api-key.port';

const ACTIVE_API_KEYS: Readonly<Record<string, ActiveApiKeyPayload>> = {
  'admin-cajero-key': {
    clientId: 'internal-admin-cajero',
    roles: ['admin', 'cajero'],
    status: 'active',
  },
  'admin-only-key': {
    clientId: 'internal-admin',
    roles: ['admin'],
    status: 'active',
  },
};

export class InMemoryApiKeyValidatorAdapter implements ValidateApiKeyPort {
  async validate(apiKey: string): Promise<ApiKeyValidationResult | null> {
    return ACTIVE_API_KEYS[apiKey] ?? null;
  }
}
