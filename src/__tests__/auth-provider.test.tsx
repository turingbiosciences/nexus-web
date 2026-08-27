import React from 'react';
import { render, screen } from '@testing-library/react';
import { AuthProvider } from '@/components/auth/auth-provider';

// Mock LogtoProvider to observe config
interface MockConfig {
  endpoint: string;
  appId: string;
  scopes: string[];
}

// Mock the auth config. This is '@/lib/auth-client', not '@/lib/auth':
// auth.ts became server-only when it started reading secrets via node:fs, so
// the client-safe config moved here. Mocking the old path would silently do
// nothing — the component no longer imports it.
jest.mock('@/lib/auth-client', () => ({
  logtoClientConfig: {
    endpoint: 'https://logto.example.com',
    appId: 'app_123',
    scopes: ['openid', 'profile', 'email', 'offline_access', 'all'],
    // No `resources` key: API tokens are attached server-side by the
    // /api/turing/* proxy, so the client config must not request them.
  },
}));

jest.mock('@logto/react', () => ({
  LogtoProvider: ({
    children,
    config,
  }: {
    children: React.ReactNode;
    config: MockConfig;
  }) => (
    <div
      data-testid="logto-provider"
      data-endpoint={config.endpoint}
      data-appid={config.appId}
      data-scopes={config.scopes?.join(',')}
    >
      {children}
    </div>
  ),
}));

describe('AuthProvider', () => {
  it('passes config to LogtoProvider and renders children', () => {
    render(
      <AuthProvider>
        <span data-testid="child">Child</span>
      </AuthProvider>
    );
    const provider = screen.getByTestId('logto-provider');
    expect(provider).toHaveAttribute(
      'data-endpoint',
      'https://logto.example.com'
    );
    expect(provider).toHaveAttribute('data-appid', 'app_123');
    expect(provider).toHaveAttribute(
      'data-scopes',
      'openid,profile,email,offline_access,all'
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
});
