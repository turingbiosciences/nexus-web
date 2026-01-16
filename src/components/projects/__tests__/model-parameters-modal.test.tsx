import React from 'react';
import { render, screen } from '@testing-library/react';
import { ModelParametersModal } from '../model-parameters-modal';

// Mock the Modal component
jest.mock('@/components/ui/modal', () => ({
  Modal: ({
    isOpen,
    onClose,
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

describe('ModelParametersModal', () => {
  const mockOnClose = jest.fn();
  const mockParameters = {
    n_estimators: 100,
    max_depth: 10,
    learning_rate: 0.015,
    null_param: null,
    string_param: 'value',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders nothing when isOpen is false', () => {
      const { container } = render(
        <ModelParametersModal
          isOpen={false}
          onClose={mockOnClose}
          modelName="RandomForest"
          bestConfig="config_1"
          parameters={mockParameters}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('renders modal with model name in title', () => {
      render(
        <ModelParametersModal
          isOpen={true}
          onClose={mockOnClose}
          modelName="RandomForest"
          bestConfig="config_1"
          parameters={mockParameters}
        />
      );

      expect(screen.getByText('RandomForest Parameters')).toBeInTheDocument();
    });

    it('displays best configuration name', () => {
      render(
        <ModelParametersModal
          isOpen={true}
          onClose={mockOnClose}
          modelName="RandomForest"
          bestConfig="config_1"
          parameters={mockParameters}
        />
      );

      expect(screen.getByText('Best Configuration')).toBeInTheDocument();
      expect(screen.getByText('config_1')).toBeInTheDocument();
    });

    it('displays all parameter key-value pairs', () => {
      render(
        <ModelParametersModal
          isOpen={true}
          onClose={mockOnClose}
          modelName="RandomForest"
          bestConfig="config_1"
          parameters={mockParameters}
        />
      );

      expect(screen.getByText('n_estimators')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('max_depth')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
    });

    it('formats decimal numbers correctly', () => {
      render(
        <ModelParametersModal
          isOpen={true}
          onClose={mockOnClose}
          modelName="RandomForest"
          bestConfig="config_1"
          parameters={mockParameters}
        />
      );

      expect(screen.getByText('learning_rate')).toBeInTheDocument();
      expect(screen.getByText('0.015')).toBeInTheDocument();
    });

    it("displays 'null' for null values", () => {
      render(
        <ModelParametersModal
          isOpen={true}
          onClose={mockOnClose}
          modelName="RandomForest"
          bestConfig="config_1"
          parameters={mockParameters}
        />
      );

      expect(screen.getByText('null_param')).toBeInTheDocument();
      expect(screen.getByText('null')).toBeInTheDocument();
    });

    it('displays string values correctly', () => {
      render(
        <ModelParametersModal
          isOpen={true}
          onClose={mockOnClose}
          modelName="RandomForest"
          bestConfig="config_1"
          parameters={mockParameters}
        />
      );

      expect(screen.getByText('string_param')).toBeInTheDocument();
      expect(screen.getByText('value')).toBeInTheDocument();
    });
  });

  describe('Empty Parameters', () => {
    it('renders empty state when no parameters', () => {
      render(
        <ModelParametersModal
          isOpen={true}
          onClose={mockOnClose}
          modelName="RandomForest"
          bestConfig="config_1"
          parameters={{}}
        />
      );

      expect(screen.getByText('Model Parameters')).toBeInTheDocument();
    });
  });
});
