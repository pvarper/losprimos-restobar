export interface WebAuthSessionState {
  saveApiKey(apiKey: string): void;
  getApiKey(): string | null;
  clearApiKey(): void;
  hasApiKey(): boolean;
}

interface WebAuthSessionMemory {
  apiKey: string | null;
}

export const normalizeApiKey = (apiKey: string): string => apiKey.trim();

export const createWebAuthSessionState = (): WebAuthSessionState => {
  const memory: WebAuthSessionMemory = {
    apiKey: null
  };

  return {
    saveApiKey(apiKey: string): void {
      const normalizedApiKey = normalizeApiKey(apiKey);
      memory.apiKey = normalizedApiKey.length > 0 ? normalizedApiKey : null;
    },

    getApiKey(): string | null {
      return memory.apiKey;
    },

    clearApiKey(): void {
      memory.apiKey = null;
    },

    hasApiKey(): boolean {
      return memory.apiKey !== null;
    }
  };
};
