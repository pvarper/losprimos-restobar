export interface ApiKeyPayload {
  clientId: string;
  roles: string[];
}

export interface ActiveApiKeyPayload extends ApiKeyPayload {
  status: 'active';
}

export interface InactiveApiKeyPayload extends ApiKeyPayload {
  status: 'inactive';
}

export type ApiKeyValidationResult = ActiveApiKeyPayload | InactiveApiKeyPayload;

export interface ValidateApiKeyPort {
  validate(apiKey: string): Promise<ApiKeyValidationResult | null>;
}
