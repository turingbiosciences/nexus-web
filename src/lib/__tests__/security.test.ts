import { sanitizeFilename } from '@/lib/security';

describe('sanitizeFilename', () => {
  it('should return the filename as is for safe names', () => {
    expect(sanitizeFilename('file.txt')).toBe('file.txt');
    expect(sanitizeFilename('My_File-123.jpg')).toBe('My_File-123.jpg');
  });

  it('should remove path separators and directory traversal', () => {
    expect(sanitizeFilename('../../etc/passwd')).toBe('passwd');
    expect(sanitizeFilename('foo/bar/baz.txt')).toBe('baz.txt');
    expect(sanitizeFilename('C:\\Windows\\System32\\cmd.exe')).toBe('cmd.exe');
  });

  it('should replace special characters with underscores', () => {
    expect(sanitizeFilename('file with spaces.txt')).toBe('file_with_spaces.txt');
    expect(sanitizeFilename('file(1).txt')).toBe('file_1_.txt');
    expect(sanitizeFilename('crazy$file#name!.pdf')).toBe('crazy_file_name_.pdf');
  });

  it('should collapse multiple underscores', () => {
    expect(sanitizeFilename('file___name.txt')).toBe('file_name.txt');
    expect(sanitizeFilename('___file.txt')).toBe('_file.txt');
  });

  it('should truncate long filenames to 255 characters', () => {
    const longName = 'a'.repeat(300) + '.txt';
    const sanitized = sanitizeFilename(longName);
    expect(sanitized.length).toBeLessThanOrEqual(255);
    expect(sanitized.endsWith('.txt')).toBe(true);
  });

  it('should handle filenames with only special characters', () => {
    // If the sanitized name is empty or just dots, it returns a fallback
    const result = sanitizeFilename('!@#$%^&*()');
    expect(result).toMatch(/^upload_\d+$/);
  });

  it('should handle empty or whitespace-only filenames', () => {
    const result = sanitizeFilename('   ');
    expect(result).toMatch(/^upload_\d+$/);
  });

  it('should preserve extensions correctly', () => {
    const name = 'some.really.long.name.with.dots.tar.gz';
    const sanitized = sanitizeFilename(name);
    expect(sanitized).toBe('some.really.long.name.with.dots.tar.gz');
  });
});
