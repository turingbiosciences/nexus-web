import { sanitizeUrl, sanitizeFilename, isSafeUrl } from '../security';

describe('Security Utilities', () => {
  describe('isSafeUrl', () => {
    it('should return false for invalid or missing URLs', () => {
      expect(isSafeUrl(null)).toBe(false);
      expect(isSafeUrl(undefined)).toBe(false);
      expect(isSafeUrl('')).toBe(false);
      expect(isSafeUrl('not a url')).toBe(false);
    });

    it('should return true for relative URLs starting with /', () => {
      expect(isSafeUrl('/dashboard')).toBe(true);
      expect(isSafeUrl('/users?id=1')).toBe(true);
    });

    it('should return false for protocol-relative URLs', () => {
      expect(isSafeUrl('//evil.com')).toBe(false);
      expect(isSafeUrl('//example.com/test')).toBe(false);
      expect(isSafeUrl('/\\evil.com')).toBe(false); // browser normalization bypass
    });

    it('should return false for absolute URLs if baseUrl is missing', () => {
      expect(isSafeUrl('https://example.com', '')).toBe(false);
    });

    it('should return true for absolute URLs that match the baseUrl origin', () => {
      expect(
        isSafeUrl(
          'https://app.example.com/dashboard',
          'https://app.example.com'
        )
      ).toBe(true);
      expect(
        isSafeUrl('http://localhost:3000/test', 'http://localhost:3000')
      ).toBe(true);
    });

    it('should return false for absolute URLs with a different origin', () => {
      expect(
        isSafeUrl(
          'https://evil.example.com/dashboard',
          'https://app.example.com'
        )
      ).toBe(false);
      expect(
        isSafeUrl(
          'https://app.example.com.evil.com/test',
          'https://app.example.com'
        )
      ).toBe(false);
      expect(
        isSafeUrl('http://localhost:3001/test', 'http://localhost:3000')
      ).toBe(false);
    });
  });

  describe('sanitizeUrl', () => {
    it('should redact sensitive query parameters', () => {
      const url =
        'https://api.example.com/v1/users?token=secret123&access_token=secret456';
      const sanitized = sanitizeUrl(url);
      expect(sanitized).toBe(
        'https://api.example.com/v1/users?token=%5BREDACTED%5D&access_token=%5BREDACTED%5D'
      );
    });

    it('should redact other sensitive keys like password and secret', () => {
      const url =
        'https://example.com/login?password=mypassword&client_secret=xyz';
      const sanitized = sanitizeUrl(url);
      expect(sanitized).toContain('password=%5BREDACTED%5D');
      expect(sanitized).toContain('client_secret=%5BREDACTED%5D');
    });

    it('should preserve non-sensitive parameters', () => {
      const url = 'https://example.com/search?q=hello&page=1';
      const sanitized = sanitizeUrl(url);
      expect(sanitized).toBe('https://example.com/search?q=hello&page=1');
    });

    it('should handle relative URLs', () => {
      const url = '/api/users?token=secret';
      const sanitized = sanitizeUrl(url);
      expect(sanitized).toBe('/api/users?token=%5BREDACTED%5D');
    });

    it('should return placeholder if parsing fails', () => {
      const originalURL = global.URL;
      const mockURL = jest.fn(() => {
        throw new Error('Invalid URL');
      });
      global.URL = mockURL as unknown as typeof URL;

      const url = 'some-url';
      const sanitized = sanitizeUrl(url);
      expect(sanitized).toBe('[Invalid URL]');

      global.URL = originalURL;
    });
  });

  describe('sanitizeFilename', () => {
    it('should replace directory traversal sequences', () => {
      const filename = '../../etc/passwd';
      const sanitized = sanitizeFilename(filename);
      // Basename behavior: extracts 'passwd' and then sanitizes it.
      expect(sanitized).toBe('passwd');
    });

    it('should replace unsafe characters with underscores', () => {
      const filename = 'file name with spaces!.txt';
      const sanitized = sanitizeFilename(filename);
      expect(sanitized).toBe('file_name_with_spaces_.txt');
    });

    it('should allow alphanumeric characters, dots, dashes, and underscores', () => {
      const filename = 'valid-file_name.123.txt';
      const sanitized = sanitizeFilename(filename);
      expect(sanitized).toBe('valid-file_name.123.txt');
    });

    it('should limit filename length to 255 characters', () => {
      const longName = 'a'.repeat(300) + '.txt';
      const sanitized = sanitizeFilename(longName);
      expect(sanitized.length).toBe(255);
      expect(sanitized.endsWith('.txt')).toBe(true);
    });

    it('should provide a fallback if filename becomes empty', () => {
      const filename = '...';
      const sanitized = sanitizeFilename(filename);
      // Expect upload_ followed by a UUID (alphanumeric and dashes)
      expect(sanitized).toMatch(/^upload_[0-9a-f-]+$/i);
    });

    it('should provide a fallback for dot and dotdot', () => {
      expect(sanitizeFilename('.')).toMatch(/^upload_[0-9a-f-]+$/i);
      expect(sanitizeFilename('..')).toMatch(/^upload_[0-9a-f-]+$/i);
    });
  });
});
