import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { RunModelModal } from '../run-model-modal';
import {
  createSuccessQueryReturn,
  createLoadingQueryReturn,
} from '@/lib/test-mocks';

// Mock the useDatasets hook
jest.mock('@/lib/queries/datasets', () => ({
  useDatasets: jest.fn(),
}));

// Mock the Modal component
jest.mock('@/components/ui/modal', () => ({
  Modal: ({
    isOpen,
    onClose: _onClose,
    title,
    children,
  }: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
  }) =>
    isOpen ? (
      <div data-testid="modal" role="dialog">
        <h2>{title}</h2>
        {children}
      </div>
    ) : null,
}));

import { useDatasets } from '@/lib/queries/datasets';

const mockUseDatasets = useDatasets as jest.MockedFunction<typeof useDatasets>;

describe('RunModelModal', () => {
  const mockOnClose = jest.fn();
  const mockOnConfirm = jest.fn();
  const mockDatasets = [
    {
      id: 'ds-1',
      filename: 'data1.csv',
      size: 1024 * 1024 * 2, // 2 MB
      uploadedAt: new Date('2024-01-15'),
    },
    {
      id: 'ds-2',
      filename: 'data2.csv',
      size: 1024 * 1024 * 5, // 5 MB
      uploadedAt: new Date('2024-01-10'),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDatasets.mockReturnValue(
      createSuccessQueryReturn(mockDatasets) as ReturnType<typeof useDatasets>
    );
  });

  describe('Rendering', () => {
    it('renders nothing when isOpen is false', () => {
      const { container } = render(
        <RunModelModal
          isOpen={false}
          onClose={mockOnClose}
          projectId="proj-1"
          onConfirm={mockOnConfirm}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('renders modal content when isOpen is true', () => {
      render(
        <RunModelModal
          isOpen={true}
          onClose={mockOnClose}
          projectId="proj-1"
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByText('Start ML Training')).toBeInTheDocument();
      expect(screen.getByLabelText('Select Dataset')).toBeInTheDocument();
      expect(screen.getByLabelText('Target Column')).toBeInTheDocument();
      expect(
        screen.getByLabelText('Exclude Columns (Optional)')
      ).toBeInTheDocument();
    });

    it('renders dataset options', () => {
      render(
        <RunModelModal
          isOpen={true}
          onClose={mockOnClose}
          projectId="proj-1"
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByText(/data1.csv/)).toBeInTheDocument();
      expect(screen.getByText(/data2.csv/)).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading spinner when datasets are loading', () => {
      mockUseDatasets.mockReturnValue(
        createLoadingQueryReturn() as ReturnType<typeof useDatasets>
      );

      const { container } = render(
        <RunModelModal
          isOpen={true}
          onClose={mockOnClose}
          projectId="proj-1"
          onConfirm={mockOnConfirm}
        />
      );

      expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('shows message when no datasets available', () => {
      mockUseDatasets.mockReturnValue(
        createSuccessQueryReturn([]) as ReturnType<typeof useDatasets>
      );

      render(
        <RunModelModal
          isOpen={true}
          onClose={mockOnClose}
          projectId="proj-1"
          onConfirm={mockOnConfirm}
        />
      );

      expect(
        screen.getByText(/No datasets available. Please upload a dataset first/)
      ).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('calls onClose when Cancel button is clicked', () => {
      render(
        <RunModelModal
          isOpen={true}
          onClose={mockOnClose}
          projectId="proj-1"
          onConfirm={mockOnConfirm}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('disables Confirm button when no dataset is selected', () => {
      render(
        <RunModelModal
          isOpen={true}
          onClose={mockOnClose}
          projectId="proj-1"
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByRole('button', { name: /confirm/i })).toBeDisabled();
    });

    it('disables Confirm button when no target column is entered', () => {
      render(
        <RunModelModal
          isOpen={true}
          onClose={mockOnClose}
          projectId="proj-1"
          onConfirm={mockOnConfirm}
        />
      );

      // Select a dataset
      fireEvent.change(screen.getByLabelText('Select Dataset'), {
        target: { value: 'ds-1' },
      });

      // Confirm should still be disabled without target column
      expect(screen.getByRole('button', { name: /confirm/i })).toBeDisabled();
    });

    it('enables Confirm button when dataset and target column are provided', () => {
      render(
        <RunModelModal
          isOpen={true}
          onClose={mockOnClose}
          projectId="proj-1"
          onConfirm={mockOnConfirm}
        />
      );

      // Select a dataset
      fireEvent.change(screen.getByLabelText('Select Dataset'), {
        target: { value: 'ds-1' },
      });

      // Enter target column
      fireEvent.change(screen.getByLabelText('Target Column'), {
        target: { value: 'outcome' },
      });

      expect(
        screen.getByRole('button', { name: /confirm/i })
      ).not.toBeDisabled();
    });

    it('calls onConfirm with correct parameters when Confirm is clicked', () => {
      render(
        <RunModelModal
          isOpen={true}
          onClose={mockOnClose}
          projectId="proj-1"
          onConfirm={mockOnConfirm}
        />
      );

      // Select a dataset
      fireEvent.change(screen.getByLabelText('Select Dataset'), {
        target: { value: 'ds-1' },
      });

      // Enter target column
      fireEvent.change(screen.getByLabelText('Target Column'), {
        target: { value: 'outcome' },
      });

      // Enter exclude columns
      fireEvent.change(screen.getByLabelText('Exclude Columns (Optional)'), {
        target: { value: 'id, timestamp' },
      });

      // Click confirm
      fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

      expect(mockOnConfirm).toHaveBeenCalledWith('ds-1', 'outcome', [
        'id',
        'timestamp',
      ]);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('disables target and exclude inputs when no dataset is selected', () => {
      render(
        <RunModelModal
          isOpen={true}
          onClose={mockOnClose}
          projectId="proj-1"
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByLabelText('Target Column')).toBeDisabled();
      expect(
        screen.getByLabelText('Exclude Columns (Optional)')
      ).toBeDisabled();
    });

    it('enables target and exclude inputs when dataset is selected', () => {
      render(
        <RunModelModal
          isOpen={true}
          onClose={mockOnClose}
          projectId="proj-1"
          onConfirm={mockOnConfirm}
        />
      );

      // Select a dataset
      fireEvent.change(screen.getByLabelText('Select Dataset'), {
        target: { value: 'ds-1' },
      });

      expect(screen.getByLabelText('Target Column')).not.toBeDisabled();
      expect(
        screen.getByLabelText('Exclude Columns (Optional)')
      ).not.toBeDisabled();
    });
  });
});
