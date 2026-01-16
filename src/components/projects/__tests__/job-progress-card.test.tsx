import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { JobProgressCard } from '../job-progress-card';
import { Job } from '@/types/job';

describe('JobProgressCard', () => {
  const baseJob: Job = {
    job_id: 'job-123',
    project_id: 'project-456',
    status: 'running',
    progress_percent: 50,
    message: 'Training in progress...',
    created_at: new Date().toISOString(),
    completed_at: null,
    error: null,
    best_model: null,
    metrics: null,
    models_trained: null,
    feature_importance: null,
    results_csv_url: null,
    graph_svg_url: null,
  };

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Loading State', () => {
    it('renders loading state when isLoading is true and no job', () => {
      render(
        <JobProgressCard
          job={null}
          isConnected={false}
          isLoading={true}
          error={null}
        />
      );

      expect(
        screen.getByText('Connecting to job stream...')
      ).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('renders error state when error exists and no job', () => {
      render(
        <JobProgressCard
          job={null}
          isConnected={false}
          isLoading={false}
          error="Connection failed"
        />
      );

      expect(screen.getByText('Connection failed')).toBeInTheDocument();
    });

    it('shows dismiss button in error state when onDismiss provided', () => {
      const onDismiss = jest.fn();
      render(
        <JobProgressCard
          job={null}
          isConnected={false}
          isLoading={false}
          error="Connection failed"
          onDismiss={onDismiss}
        />
      );

      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      fireEvent.click(dismissButton);
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('No Job State', () => {
    it('renders nothing when no job and not loading or error', () => {
      const { container } = render(
        <JobProgressCard
          job={null}
          isConnected={false}
          isLoading={false}
          error={null}
        />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Running State', () => {
    it('renders progress bar with correct percentage', () => {
      render(
        <JobProgressCard
          job={baseJob}
          isConnected={true}
          isLoading={false}
          error={null}
        />
      );

      expect(screen.getByText('50%')).toBeInTheDocument();
      expect(screen.getByText('Training in Progress')).toBeInTheDocument();
    });

    it('renders job message', () => {
      render(
        <JobProgressCard
          job={baseJob}
          isConnected={true}
          isLoading={false}
          error={null}
        />
      );

      expect(screen.getByText('Training in progress...')).toBeInTheDocument();
    });

    it('shows cancel button when onCancel provided and job is running', () => {
      const onCancel = jest.fn();
      render(
        <JobProgressCard
          job={baseJob}
          isConnected={true}
          isLoading={false}
          error={null}
          onCancel={onCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('shows connection status indicator', () => {
      const { container } = render(
        <JobProgressCard
          job={baseJob}
          isConnected={true}
          isLoading={false}
          error={null}
        />
      );

      const connectedIndicator = container.querySelector('.bg-green-500');
      expect(connectedIndicator).toBeInTheDocument();
    });

    it('shows disconnected indicator when not connected', () => {
      const { container } = render(
        <JobProgressCard
          job={baseJob}
          isConnected={false}
          isLoading={false}
          error={null}
        />
      );

      const disconnectedIndicator = container.querySelector('.bg-gray-400');
      expect(disconnectedIndicator).toBeInTheDocument();
    });

    it('updates elapsed time while running', () => {
      render(
        <JobProgressCard
          job={baseJob}
          isConnected={true}
          isLoading={false}
          error={null}
        />
      );

      // Initial time should be displayed
      expect(screen.getByText(/0:0\d/)).toBeInTheDocument();

      // Advance time by 65 seconds
      act(() => {
        jest.advanceTimersByTime(65000);
      });

      // Should now show 1:05
      expect(screen.getByText('1:05')).toBeInTheDocument();
    });
  });

  describe('Completed State', () => {
    it('renders completed state with success styling', () => {
      const completedJob: Job = {
        ...baseJob,
        status: 'completed',
        progress_percent: 100,
        message: 'Training complete!',
      };

      render(
        <JobProgressCard
          job={completedJob}
          isConnected={false}
          isLoading={false}
          error={null}
        />
      );

      expect(screen.getByText('Training Complete')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('shows dismiss button for completed jobs', () => {
      const completedJob: Job = {
        ...baseJob,
        status: 'completed',
        progress_percent: 100,
      };
      const onDismiss = jest.fn();

      render(
        <JobProgressCard
          job={completedJob}
          isConnected={false}
          isLoading={false}
          error={null}
          onDismiss={onDismiss}
        />
      );

      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      fireEvent.click(dismissButton);
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('shows best model when provided', () => {
      const completedJob: Job = {
        ...baseJob,
        status: 'completed',
        progress_percent: 100,
        best_model: 'RandomForest',
        models_trained: 5,
      };

      render(
        <JobProgressCard
          job={completedJob}
          isConnected={false}
          isLoading={false}
          error={null}
        />
      );

      expect(screen.getByText('Best Model:')).toBeInTheDocument();
      expect(screen.getByText('RandomForest')).toBeInTheDocument();
      expect(screen.getByText('Models Trained:')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  describe('Failed State', () => {
    it('renders failed state with error styling', () => {
      const failedJob: Job = {
        ...baseJob,
        status: 'failed',
        message: 'Training failed',
        error: 'Out of memory',
      };

      render(
        <JobProgressCard
          job={failedJob}
          isConnected={false}
          isLoading={false}
          error={null}
        />
      );

      expect(screen.getByText('Training Failed')).toBeInTheDocument();
      expect(screen.getByText('Out of memory')).toBeInTheDocument();
    });
  });

  describe('Cancelled State', () => {
    it('renders cancelled state with error styling', () => {
      const cancelledJob: Job = {
        ...baseJob,
        status: 'cancelled',
        message: 'Training was cancelled',
      };

      render(
        <JobProgressCard
          job={cancelledJob}
          isConnected={false}
          isLoading={false}
          error={null}
        />
      );

      expect(screen.getByText('Training Failed')).toBeInTheDocument();
    });
  });
});
