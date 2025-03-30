// API Configuration
export const API_BASE_URL = 'http://localhost:3001/api';

// Endpoints
export const ENDPOINTS = {
  TWITTER: {
    BASE: `${API_BASE_URL}/twitter`,
    LATEST: `${API_BASE_URL}/twitter/latest`,
    TWEETS: `${API_BASE_URL}/twitter/tweets`,
    RATE_LIMIT: `${API_BASE_URL}/twitter/rate-limit`,
    FORCE_RESET: `${API_BASE_URL}/twitter/force-reset`,
  },
  IDEAS: {
    GENERATE: `${API_BASE_URL}/ideas/generate`,
    GET_ALL: `${API_BASE_URL}/ideas`,
    GET_BY_ID: (id: number) => `${API_BASE_URL}/ideas/${id}`,
  },
  // FIXED PATH MISMATCH: Added correct path to test OpenAI endpoint
  OPENAI: {
    TEST: `${API_BASE_URL}/test/openai/test`
  },
  PROMPTS: {
    GET_ALL: `${API_BASE_URL}/prompts`,
    DEFAULT: `${API_BASE_URL}/prompts/default`,
    GET_BY_ID: (id: number) => `${API_BASE_URL}/prompts/${id}`,
    CREATE: `${API_BASE_URL}/prompts`,
    UPDATE: (id: number) => `${API_BASE_URL}/prompts/${id}`,
    DELETE: (id: number) => `${API_BASE_URL}/prompts/${id}`
  }
};
