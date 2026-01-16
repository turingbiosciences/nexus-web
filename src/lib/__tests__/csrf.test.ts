import { NextRequest, NextResponse } from 'next/server';
import { validateCSRF } from '@/lib/csrf';

// Mock NextRequest and NextResponse
jest.mock('next/server', () => {
  return {
    NextRequest: class {
      method: string;
      headers: Headers;
      constructor(url: string, init: any) {
        this.method = init.method;
        this.headers = init.headers;
      }
    },
    NextResponse: {
      json: jest.fn().mockImplementation((body, init) => ({
        body,
        status: init?.status,
      })),
    },
  };
});

describe('validateCSRF', () => {
  const createRequest = (method: string, headers: Record<string, string>) => {
    return new NextRequest('http://example.com/api/test', {
      method,
      headers: new Headers(headers),
    });
  };

  it('should ignore non-state-changing methods', () => {
    const req = createRequest('GET', {});
    const result = validateCSRF(req);
    expect(result).toBeNull();
  });

  it('should fail if host header is missing', () => {
    const req = createRequest('POST', {});
    const result = validateCSRF(req);
    expect(result).not.toBeNull();
    expect(result?.status).toBe(403);
    // @ts-ignore
    expect(result?.body).toEqual(
      expect.objectContaining({ error: 'Invalid request: Missing Host header' })
    );
  });

  it('should fail if origin does not match host', () => {
    const req = createRequest('POST', {
      origin: 'http://evil.com',
      host: 'example.com',
    });
    const result = validateCSRF(req);
    expect(result).not.toBeNull();
    expect(result?.status).toBe(403);
  });

  it('should pass if origin matches host', () => {
    const req = createRequest('POST', {
      origin: 'http://example.com',
      host: 'example.com',
    });
    const result = validateCSRF(req);
    expect(result).toBeNull();
  });

  it('should fail if origin is invalid URL', () => {
    const req = createRequest('POST', {
      origin: 'not-a-url',
      host: 'example.com',
    });
    const result = validateCSRF(req);
    expect(result).not.toBeNull();
    expect(result?.status).toBe(403);
  });

  it('should fail if referer does not match host (when origin missing)', () => {
    const req = createRequest('POST', {
      referer: 'http://evil.com/page',
      host: 'example.com',
    });
    const result = validateCSRF(req);
    expect(result).not.toBeNull();
    expect(result?.status).toBe(403);
  });

  it('should pass if referer matches host (when origin missing)', () => {
    const req = createRequest('POST', {
      referer: 'http://example.com/page',
      host: 'example.com',
    });
    const result = validateCSRF(req);
    expect(result).toBeNull();
  });

  it('should fail if neither origin nor referer are present', () => {
    const req = createRequest('POST', {
      host: 'example.com',
    });
    const result = validateCSRF(req);
    expect(result).not.toBeNull();
    expect(result?.status).toBe(403);
  });
});
