import { authFetch, SessionExpiredError } from '@/lib/auth-fetch';

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

    it('throws SessionExpiredError and redirects to sign-out on 401', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      await expect(authFetch('/api/turing/projects')).rejects.toThrow(
        SessionExpiredError
      );
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
