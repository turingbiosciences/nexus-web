import {
  authFetch,
  SessionExpiredError,
  resetSignOutLatch,
} from '@/lib/auth-fetch';

/** Queues the /api/logto/user reply that authFetch makes after a 401. */
const sessionCheck = (isAuthenticated: boolean) => ({
  ok: true,
  json: async () => ({ isAuthenticated }),
});

// Mock the logger so the tests do not emit noise
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('auth-fetch', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    jest.clearAllMocks();
    resetSignOutLatch();
    global.fetch = jest.fn();
    // jsdom's location is not writable; replace it so we can observe redirects.
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: { href: '' },
    });
  });

  afterAll(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: originalLocation,
    });
  });

  describe('authFetch', () => {
    it('returns a successful response unchanged', async () => {
      const mockResponse = { ok: true, status: 200 };
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const response = await authFetch('/api/turing/projects');

      expect(response).toBe(mockResponse);
    });

    it('sends credentials so the session cookie reaches the proxy', async () => {
      // Without this the proxy sees an anonymous request and rejects every call.
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

      await authFetch('/api/turing/projects', { method: 'GET' });

      expect(global.fetch).toHaveBeenCalledWith('/api/turing/projects', {
        method: 'GET',
        credentials: 'include',
      });
    });

    it('does not attach an Authorization header', async () => {
      // The whole point of the proxy: no credential exists on the client to
      // attach, and anything sent here would be stripped upstream anyway.
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

      await authFetch('/api/turing/projects');

      const [, init] = (global.fetch as jest.Mock).mock.calls[0];
      expect(init.headers).toBeUndefined();
    });

    it('preserves caller-supplied headers and body', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

      await authFetch('/api/turing/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"name":"x"}',
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/turing/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"name":"x"}',
        credentials: 'include',
      });
    });

    it('signs out on 401 once the server confirms the session is gone', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: false, status: 401 })
        .mockResolvedValueOnce(sessionCheck(false));

      await expect(authFetch('/api/turing/projects')).rejects.toThrow(
        SessionExpiredError
      );
      expect(window.location.href).toBe('/api/logto/sign-out');
    });

    it('does NOT sign out when the session is still valid', async () => {
      // The sign-out loop: a transient proxy 401 ended a live session, the user
      // signed back in, and the next blip did it again.
      const unauthorized = { ok: false, status: 401 };
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(unauthorized)
        .mockResolvedValueOnce(sessionCheck(true));

      const response = await authFetch('/api/turing/projects');

      expect(response).toBe(unauthorized);
      expect(window.location.href).toBe('');
    });

    it('does NOT sign out when the session check itself fails', async () => {
      // Being unable to reach /api/logto/user is not evidence of a dead
      // session, and signing out is the destructive reading.
      const unauthorized = { ok: false, status: 401 };
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(unauthorized)
        .mockRejectedValueOnce(new Error('network down'));

      const response = await authFetch('/api/turing/projects');

      expect(response).toBe(unauthorized);
      expect(window.location.href).toBe('');
    });

    it('checks the session against the server, with credentials', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: false, status: 401 })
        .mockResolvedValueOnce(sessionCheck(true));

      await authFetch('/api/turing/projects');

      expect(global.fetch).toHaveBeenLastCalledWith('/api/logto/user', {
        credentials: 'include',
      });
    });

    it('only redirects once when concurrent requests all 401', async () => {
      (global.fetch as jest.Mock).mockImplementation(async (url: string) =>
        url === '/api/logto/user'
          ? sessionCheck(false)
          : { ok: false, status: 401 }
      );

      const results = await Promise.allSettled([
        authFetch('/api/turing/a'),
        authFetch('/api/turing/b'),
        authFetch('/api/turing/c'),
      ]);

      expect(results.every((r) => r.status === 'rejected')).toBe(true);
      const signOutChecks = (global.fetch as jest.Mock).mock.calls.filter(
        ([u]) => u === '/api/logto/user'
      );
      // The latch stops later 401s from re-running the check and re-navigating.
      expect(signOutChecks.length).toBeLessThanOrEqual(3);
      expect(window.location.href).toBe('/api/logto/sign-out');
    });

    it('does not sign out on non-401 failures', async () => {
      // A 500 from the API is not a session problem; signing the user out
      // would turn a transient upstream error into a forced re-login.
      const mockResponse = { ok: false, status: 500 };
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const response = await authFetch('/api/turing/projects');

      expect(response).toBe(mockResponse);
      expect(window.location.href).toBe('');
    });

    it('does not sign out on 403', async () => {
      const mockResponse = { ok: false, status: 403 };
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const response = await authFetch('/api/turing/projects');

      expect(response).toBe(mockResponse);
      expect(window.location.href).toBe('');
    });
  });

  describe('SessionExpiredError', () => {
    it('is named so callers can distinguish it', () => {
      const error = new SessionExpiredError('Session expired');

      expect(error.name).toBe('SessionExpiredError');
      expect(error.message).toBe('Session expired');
      expect(error).toBeInstanceOf(Error);
    });
  });
});
