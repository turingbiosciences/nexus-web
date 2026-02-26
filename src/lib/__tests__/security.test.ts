import { sanitizeFilename, sanitizeUrl } from '../security';

describe('Security Utilities', () => {
  describe('sanitizeFilename', () => {
    it('removes path traversal sequences', () => {
      expect(sanitizeFilename('../../etc/passwd')).toBe('passwd');
      expect(sanitizeFilename('..\\..\\windows\\system32')).toBe('system32');
    });

    it('replaces unsafe characters with underscores', () => {
      expect(sanitizeFilename('foo$bar')).toBe('foo_bar');
      expect(sanitizeFilename('hello world.txt')).toBe('hello_world.txt'); // Space replaced
    });

    it('preserves alphanumeric, dots, dashes, underscores', () => {
      expect(sanitizeFilename('my-file_name.123.txt')).toBe(
        'my-file_name.123.txt'
      );
    });

    it('collapses multiple dots', () => {
      expect(sanitizeFilename('foo..bar...txt')).toBe('foo.bar.txt');
    });

    it('removes leading dots', () => {
      expect(sanitizeFilename('.env')).not.toBe('.env');
      expect(sanitizeFilename('.env')).toBe('env');
    });

    it('truncates long filenames', () => {
      const longName = 'a'.repeat(300) + '.txt';
      const result = sanitizeFilename(longName);
      expect(result.length).toBe(255);
      expect(result.endsWith('.txt')).toBe(true);
    });

    it('provides fallback for empty or invalid names', () => {
      // Matches upload_ followed by UUID or random string
      expect(sanitizeFilename('')).toMatch(/^upload_[a-z0-9-]+$/);
      expect(sanitizeFilename('.')).toMatch(/^upload_[a-z0-9-]+$/);
      expect(sanitizeFilename('..')).toMatch(/^upload_[a-z0-9-]+$/);
    });
  });

  describe('sanitizeUrl', () => {
    it('redacts sensitive query parameters', () => {
      const url =
        'https://api.example.com/data?access_token=secret123&other=value';
      expect(sanitizeUrl(url)).toBe(
        'https://api.example.com/data?access_token=%5BREDACTED%5D&other=value'
      );
    });

    it('redacts multiple sensitive parameters', () => {
      const url =
        'https://example.com?client_id=123&client_secret=abc&code=xyz';
      expect(sanitizeUrl(url)).toBe(
        'https://example.com/?client_id=%5BREDACTED%5D&client_secret=%5BREDACTED%5D&code=%5BREDACTED%5D'
      );
    });

    it('handles relative URLs', () => {
      const url = '/api/data?token=secret';
      expect(sanitizeUrl(url)).toBe('/api/data?token=%5BREDACTED%5D');
    });

    it('preserves insensitive parameters', () => {
      const url = 'https://example.com/search?q=hello&page=1';
      expect(sanitizeUrl(url)).toBe(
        'https://example.com/search?q=hello&page=1'
      );
    });

    it('handles invalid URLs gracefully', () => {
      // If the URL is truly invalid (throws Error), it should return [Invalid URL]
      // We force an invalid URL that fails parsing even with a base
      const invalidUrl = 'http://[invalid-url';
      expect(sanitizeUrl(invalidUrl)).toBe('[Invalid URL]');
    });
  });
});
