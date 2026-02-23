import { sanitizeFilename } from '../security';

describe('sanitizeFilename', () => {
  it('should remove path components', () => {
    expect(sanitizeFilename('../../../../etc/passwd')).toBe('passwd');
    expect(sanitizeFilename('C:\\Windows\\System32\\calc.exe')).toBe(
      'calc.exe'
    );
    expect(sanitizeFilename('/var/log/syslog')).toBe('syslog');
    expect(sanitizeFilename('./file.txt')).toBe('file.txt');
  });

  it('should allow alphanumeric characters, dots, dashes, and underscores', () => {
    expect(sanitizeFilename('valid_file-name.txt')).toBe('valid_file-name.txt');
    expect(sanitizeFilename('test_123.jpg')).toBe('test_123.jpg');
    expect(sanitizeFilename('a.b.c.d.tar.gz')).toBe('a.b.c.d.tar.gz');
  });

  it('should replace invalid characters with underscores', () => {
    expect(sanitizeFilename('file with spaces.txt')).toBe(
      'file_with_spaces.txt'
    );
    expect(sanitizeFilename('image(1).png')).toBe('image_1_.png');
    expect(sanitizeFilename('my$file.csv')).toBe('my_file.csv');
    expect(sanitizeFilename('über.txt')).toBe('_ber.txt');
  });

  it('should truncate to 255 characters', () => {
    const longName = 'a'.repeat(300) + '.txt';
    const sanitized = sanitizeFilename(longName);
    expect(sanitized.length).toBe(255);
    expect(sanitized.endsWith('.txt')).toBe(true);

    // Check truncation logic
    const baseLength = 255 - 4; // -4 for .txt
    expect(sanitized).toBe('a'.repeat(baseLength) + '.txt');
  });

  it('should handle filenames without extension', () => {
    expect(sanitizeFilename('README')).toBe('README');
    expect(sanitizeFilename('script_sh')).toBe('script_sh');
  });

  it('should handle empty or dot-only filenames', () => {
    expect(sanitizeFilename('')).toBe('unnamed_file');
    expect(sanitizeFilename('.')).toBe('unnamed_file');
    expect(sanitizeFilename('..')).toBe('unnamed_file');
    expect(sanitizeFilename('...')).toBe('unnamed_file');
  });

  it('should handle filenames with only invalid characters', () => {
    expect(sanitizeFilename('$$$')).toBe('___');
    expect(sanitizeFilename('   ')).toBe('___');
  });
});
