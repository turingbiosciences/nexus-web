import { sanitizeUrl, sanitizeFilename } from '../security';

describe('Security Utilities', () => {
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
      // The sanitization implementation returns decoded URI components for relative paths,
      // but URL.searchParams encodes values.
      // So [REDACTED] becomes %5BREDACTED%5D in search params, but we decode it.
      // Wait, let's check the implementation again.
      // If we use decodeURIComponent, %5BREDACTED%5D becomes [REDACTED].
      expect(sanitized).toBe('/api/users?token=[REDACTED]');
    });

    it('should return original string if parsing fails', () => {
      const url = 'not a valid url';
      const sanitized = sanitizeUrl(url);
      expect(sanitized).toBe('not a valid url');
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
      expect(sanitized).toMatch(/^upload_\d+$/);
    });

    it('should provide a fallback for dot and dotdot', () => {
      expect(sanitizeFilename('.')).toMatch(/^upload_\d+$/);
      expect(sanitizeFilename('..')).toMatch(/^upload_\d+$/);
    });
  });
});
