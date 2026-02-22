import { sanitizeFilename } from '../security';

describe('sanitizeFilename', () => {
  it('should return "unnamed_file" for empty or null inputs', () => {
    expect(sanitizeFilename('')).toBe('unnamed_file');
    // @ts-expect-error - testing null input which might happen in runtime
    expect(sanitizeFilename(null)).toBe('unnamed_file');
    // @ts-expect-error - testing undefined input
    expect(sanitizeFilename(undefined)).toBe('unnamed_file');
  });

  it('should keep alphanumeric characters and dots/dashes/underscores', () => {
    const filename = 'Valid_File-Name.123.txt';
    expect(sanitizeFilename(filename)).toBe(filename);
  });

  it('should replace spaces with underscores', () => {
    const filename = 'My File Name.txt';
    expect(sanitizeFilename(filename)).toBe('My_File_Name.txt');
  });

  it('should replace special characters with underscores', () => {
    const filename = 'File!@#$%^&*().txt';
    // ! -> _
    // @ -> _
    // # -> _
    // $ -> _
    // % -> _
    // ^ -> _
    // & -> _
    // * -> _
    // ( -> _
    // ) -> _
    expect(sanitizeFilename(filename)).toBe('File__________.txt');
  });

  it('should prevent directory traversal sequences', () => {
    // ../../etc/passwd -> .._.._etc_passwd -> ._._etc_passwd -> _._etc_passwd
    expect(sanitizeFilename('../../etc/passwd')).toBe('_._etc_passwd');

    // .. -> . -> empty -> unnamed_file
    expect(sanitizeFilename('..')).toBe('unnamed_file');

    // ../file.txt -> .._file.txt -> ._file.txt -> _file.txt
    expect(sanitizeFilename('../file.txt')).toBe('_file.txt');
  });

  it('should trim leading and trailing dots', () => {
    expect(sanitizeFilename('.hidden')).toBe('hidden');
    expect(sanitizeFilename('file.')).toBe('file');
  });

  it('should truncate long filenames to 255 chars', () => {
    const longName = 'a'.repeat(300) + '.txt';
    // 255 chars total. Extension is .txt (4 chars).
    // So name part should be 251 chars.
    const expected = 'a'.repeat(251) + '.txt';
    const result = sanitizeFilename(longName);
    expect(result.length).toBe(255);
    expect(result).toBe(expected);
  });

  it('should handle filenames without extension correctly when truncating', () => {
    const longName = 'a'.repeat(300);
    const expected = 'a'.repeat(255);
    expect(sanitizeFilename(longName)).toBe(expected);
  });
});
