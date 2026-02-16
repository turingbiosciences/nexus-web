import { logRequest, logResponse, logRequestWithResponse } from '../api-logger';
import { logger } from '../logger';

// Mock logger
jest.mock('../logger', () => ({
  logger: {
    info: jest.fn(),
  },
}));

describe('api-logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('logRequest calls logger.info with url', () => {
    const req = { url: 'http://example.com/api/test' } as unknown as Request;

    logRequest('test', req);

    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'http://example.com/api/test' }),
      expect.stringContaining('[logto:test]')
    );
  });

  it('logResponse calls logger.info with status', () => {
    logResponse('test', 200);
    expect(logger.info).toHaveBeenCalledWith(
      { status: 200 },
      expect.stringContaining('[logto:test]')
    );
  });

  it('logRequestWithResponse calls logger.info for both request and response', () => {
    const req = { url: 'http://example.com/api/test' } as unknown as Request;
    const res = { status: 201 } as unknown as Response;

    logRequestWithResponse('test', req, res);

    expect(logger.info).toHaveBeenCalledTimes(2);
    expect(logger.info).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ url: 'http://example.com/api/test' }),
      expect.stringContaining('[logto:test]')
    );
    expect(logger.info).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ status: 201 }),
      expect.stringContaining('[logto:test]')
    );
  });
});
