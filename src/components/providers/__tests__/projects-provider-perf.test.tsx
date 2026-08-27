import React, { useState } from 'react';
import { render, screen, act } from '@testing-library/react';
import {
  ProjectsProvider,
  useProjects,
} from '@/components/providers/projects-provider';

// Mock TokenProvider
const mockUseAuthState = jest.fn(() => ({
  accessToken: 'test-token',
  isLoading: false,
  error: null,
  refreshToken: jest.fn(),
}));

jest.mock('../auth-state-provider', () => ({
  useAuthState: () => mockUseAuthState(),
}));

// Mock API
jest.mock('@/lib/api/projects', () => ({
  fetchProjects: jest.fn().mockResolvedValue([]),
  createProject: jest.fn(),
  deleteProject: jest.fn(),
}));

const renderCounter = jest.fn();

function Consumer() {
  const { loading } = useProjects();
  renderCounter();
  if (loading) return <div>Loading...</div>;
  return <div>Consumer</div>;
}

const MemoizedConsumer = React.memo(Consumer);

function Parent() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <button onClick={() => setCount((c) => c + 1)}>Force Render</button>
      <ProjectsProvider>
        <MemoizedConsumer />
      </ProjectsProvider>
    </div>
  );
}

describe('ProjectsProvider Performance', () => {
  beforeEach(() => {
    renderCounter.mockClear();
  });

  it('avoids unnecessary re-renders of consumers when provider parent re-renders', async () => {
    render(<Parent />);

    // Initial render
    // 1. Parent renders
    // 2. ProjectsProvider renders
    // 3. Consumer renders

    // Also ProjectsProvider might trigger effects that cause state updates, re-rendering itself and Consumer.
    // We wait for everything to settle.

    await screen.findByText('Consumer');

    const initialRenderCount = renderCounter.mock.calls.length;

    // Force parent re-render
    act(() => {
      screen.getByText('Force Render').click();
    });

    // Without memoization:
    // Parent re-renders -> ProjectsProvider re-renders -> value object recreated -> Consumer re-renders.
    // So count should increase.

    // With memoization:
    // Parent re-renders -> ProjectsProvider re-renders -> value object memoized (same ref) -> Consumer SHOULD NOT re-render.

    const finalRenderCount = renderCounter.mock.calls.length;
    const additionalRenders = finalRenderCount - initialRenderCount;

    // We expect 0 additional renders with memoization.
    // Currently (without optimization), we expect > 0.

    expect(additionalRenders).toBe(0);
  });
});
