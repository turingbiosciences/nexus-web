import { render, screen, waitFor } from '@testing-library/react';
import { DebugPanel } from '../debug-panel';

// Mock fetch globally
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ isAuthenticated: true }),
  })
) as jest.Mock;

describe('DebugPanel', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should not fetch user data when debug mode is disabled', async () => {
    process.env.NEXT_PUBLIC_TBIO_DEBUG = 'false';

    render(<DebugPanel />);

    // It should render nothing
    const heading = screen.queryByText(/Debug Panel/i);
    expect(heading).not.toBeInTheDocument();

    // Verify fetch was NOT called
    // Wait a bit to ensure useEffect had a chance to fire
    await waitFor(() => {}, { timeout: 100 });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should fetch user data when debug mode is enabled', async () => {
    process.env.NEXT_PUBLIC_TBIO_DEBUG = 'true';

    render(<DebugPanel />);

    // It should render
    expect(await screen.findByText(/Debug Panel/i)).toBeInTheDocument();

    // Verify fetch WAS called
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/logto/user');
    });
  });
});
