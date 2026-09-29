/**
 * VBO Platform Single Sign-On (SSO) Client Utility
 * Implements RFC 7636 (PKCE) for OAuth 2.1 authorization code flow.
 */

export interface SSOConfig {
  platformUrl: string;
  clientId: string;
  redirectUri: string;
}

export function getSSOConfig(): SSOConfig {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  return {
    platformUrl: process.env.NEXT_PUBLIC_VBO_PLATFORM_URL || 'http://localhost:3005',
    clientId: process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID || 'vbo-erp-web',
    redirectUri: process.env.NEXT_PUBLIC_SSO_REDIRECT_URI || `${origin}/auth/callback`,
  };
}

/**
 * Generate a cryptographically secure random URL-safe string
 */
export function generateRandomString(length = 48): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const randomValues = new Uint8Array(length);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(randomValues);
  } else {
    for (let i = 0; i < length; i++) {
      randomValues[i] = Math.floor(Math.random() * 256);
    }
  }
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset[randomValues[i] % charset.length];
  }
  return result;
}

/**
 * Base64-URL encode ArrayBuffer
 */
function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Compute SHA-256 PKCE Code Challenge from Verifier
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hash = await window.crypto.subtle.digest('SHA-256', data);
    return base64UrlEncode(hash);
  }
  // Plain fallback if subtle crypto is unavailable
  return verifier;
}

/**
 * Initiate Single Sign-On redirect with PKCE challenge
 */
export async function initiateSSORedirect(provider?: 'platform' | 'google', returnTo?: string) {
  if (typeof window === 'undefined') return;

  const config = getSSOConfig();
  const state = generateRandomString(32);
  const codeVerifier = generateRandomString(64);
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  // Store in sessionStorage for verification upon callback
  sessionStorage.setItem('vbo_sso_state', state);
  sessionStorage.setItem('vbo_sso_code_verifier', codeVerifier);
  if (returnTo) {
    sessionStorage.setItem('vbo_sso_return_to', returnTo);
  }

  if (provider === 'google') {
    window.location.href = `${config.platformUrl}/identity/google?redirect_uri=${encodeURIComponent(config.redirectUri)}`;
    return;
  }

  const authUrl = new URL(`${config.platformUrl}/oauth/authorize`);
  authUrl.searchParams.set('client_id', config.clientId);
  authUrl.searchParams.set('redirect_uri', config.redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');

  window.location.href = authUrl.toString();
}

/**
 * Exchange authorization code for access & refresh tokens via PKCE
 */
export async function exchangeSSOCode(code: string, state: string) {
  if (typeof window === 'undefined') {
    throw new Error('SSO code exchange can only be executed in browser');
  }

  const savedState = sessionStorage.getItem('vbo_sso_state');
  const codeVerifier = sessionStorage.getItem('vbo_sso_code_verifier');

  if (savedState && savedState !== state) {
    throw new Error('Invalid OAuth state parameter (potential CSRF attempt)');
  }

  const config = getSSOConfig();

  const response = await fetch(`${config.platformUrl}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: config.clientId,
      code,
      redirect_uri: config.redirectUri,
      code_verifier: codeVerifier || undefined,
    }),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.message || 'Failed to exchange authorization code');
  }

  // Cleanup session storage
  sessionStorage.removeItem('vbo_sso_state');
  sessionStorage.removeItem('vbo_sso_code_verifier');

  return response.json();
}
