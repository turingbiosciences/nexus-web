/** @jest-environment node */
import { logRequest, logResponse, logRequestWithResponse } from '../api-logger';
import { logger } from '../logger';

// Mock logger
jest.mock('../logger', () => ({
  logger: {
    info: jest.fn(),
  },
}));

describe('API Logger', () => {
  const req = new Request('http://localhost/api/test');
  const res = new Response('ok', { status: 200 });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('logRequest should call logger.info with correct parameters', () => {
    logRequest('test-label', req);
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        label: 'test-label',
        url: 'http://localhost/api/test',
      }),
      expect.stringContaining('[logto:test-label] Request')
    );
  });

  it('logResponse should call logger.info with correct parameters', () => {
    logResponse('test-label', 200);
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ label: 'test-label', status: 200 }),
      expect.stringContaining('[logto:test-label] Response status')
    );
  });

  it('logRequestWithResponse should call logger.info twice', () => {
    logRequestWithResponse('test-label', req, res);
    expect(logger.info).toHaveBeenCalledTimes(2);
    expect(logger.info).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        label: 'test-label',
        url: 'http://localhost/api/test',
      }),
      expect.stringContaining('[logto:test-label] Request')
    );
    // Verify logRequestWithResponse calls logger.info twice: once for request, once for response
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ label: 'test-label', status: 200 }),
      expect.stringContaining('[logto:test-label]')
    );
  });
});
