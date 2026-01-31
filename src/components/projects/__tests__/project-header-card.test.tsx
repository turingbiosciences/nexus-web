import React from 'react';
import {
  render,
  screen,
  fireEvent,
  RenderResult,
} from '@testing-library/react';
import { ProjectHeaderCard } from '@/components/projects/project-header-card';
import { Project } from '@/types/project';
import { createMockProject } from '@/lib/mock-factories';

describe('ProjectHeaderCard', () => {
  const mockOnRun = jest.fn();

  const baseProject: Project = createMockProject({
    id: 'project-1',
    name: 'Test Project',
    description: 'Test project description',
  });

  // Helper function to reduce duplication in render calls
  type RenderCardOptions = {
    project?: Partial<Project>;
    isRunning?: boolean;
    onRun?: jest.Mock;
  };

  const renderCard = (options: RenderCardOptions = {}): RenderResult => {
    const {
      project: projectOverrides = {},
      isRunning = false,
      onRun = mockOnRun,
    } = options;

    const project = { ...baseProject, ...projectOverrides };

    return render(
      <ProjectHeaderCard
        project={project}
        isRunning={isRunning}
        onRun={onRun}
      />
    );
  };

  // Helper to get tooltip elements
  const getTooltipElements = (container: HTMLElement) => {
    const tooltipButton = screen.getByRole('button', {
      name: 'Project description',
    });
    const tooltip = container.querySelector('[role="tooltip"]');
    return { tooltipButton, tooltip };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders project name and description', () => {
      renderCard();

      expect(screen.getByText('Test Project')).toBeInTheDocument();
      expect(screen.getByText('Test project description')).toBeInTheDocument();
    });

    it('renders Run button', () => {
      renderCard();

      expect(screen.getByRole('button', { name: /run/i })).toBeInTheDocument();
    });

    it('renders project metadata inline', () => {
      renderCard();

      // Component shows dataset count
      expect(screen.getByText(/3 datasets/)).toBeInTheDocument();
    });
  });

  describe('Last Run Display', () => {
    it('displays formatted date when completedAt is set', () => {
      renderCard({
        project: { completedAt: new Date('2024-06-15T12:00:00') },
      });

      expect(screen.getByText(/Jun 15, 2024/)).toBeInTheDocument();
    });

    it("displays 'Never run' when completedAt is not set", () => {
      renderCard({ project: { completedAt: undefined } });

      expect(screen.getByText('Never run')).toBeInTheDocument();
    });
  });

  describe('Dataset Count Display', () => {
    it.each([
      [5, /5 datasets/],
      [undefined, /0 datasets/],
      [0, /0 datasets/],
    ])(
      'displays correct count when datasetCount is %s',
      (datasetCount, expectedPattern) => {
        renderCard({ project: { datasetCount } });

        expect(screen.getByText(expectedPattern)).toBeInTheDocument();
      }
    );
  });

  describe('Run Button Behavior', () => {
    it('enables Run button when not running and has datasets', () => {
      renderCard();

      const runButton = screen.getByRole('button', { name: /run/i });
      expect(runButton).not.toBeDisabled();
    });

    it('disables Run button when project is running', () => {
      renderCard({ isRunning: true });

      const runButton = screen.getByRole('button', { name: /running/i });
      expect(runButton).toBeDisabled();
    });

    it("shows 'Running...' text when project is running", () => {
      renderCard({ isRunning: true });

      expect(screen.getByText('Running...')).toBeInTheDocument();
    });

    it.each([
      [0, 'datasetCount is 0'],
      [undefined, 'datasetCount is undefined'],
    ])('disables Run button when %s', (datasetCount, _description) => {
      renderCard({ project: { datasetCount } });

      const runButton = screen.getByRole('button', { name: /run/i });
      expect(runButton).toBeDisabled();
    });

    it('calls onRun when Run button is clicked', () => {
      renderCard();

      const runButton = screen.getByRole('button', { name: /run/i });
      fireEvent.click(runButton);

      expect(mockOnRun).toHaveBeenCalledTimes(1);
    });

    it('does not call onRun when button is disabled', () => {
      renderCard({ isRunning: true });

      const runButton = screen.getByRole('button', { name: /running/i });
      fireEvent.click(runButton);

      expect(mockOnRun).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('handles project with empty description', () => {
      renderCard({ project: { description: '' } });

      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });

    it('handles very long project names gracefully', () => {
      renderCard({
        project: {
          name: 'This is a very long project name that should wrap properly in the UI without breaking the layout',
        },
      });

      expect(
        screen.getByText(/This is a very long project name/)
      ).toBeInTheDocument();
    });

    it('handles very long descriptions gracefully', () => {
      renderCard({
        project: {
          description:
            'This is a very long description that contains a lot of text and should wrap properly without breaking the layout or causing any visual issues in the component rendering',
        },
      });

      expect(
        screen.getByText(/This is a very long description/)
      ).toBeInTheDocument();
    });

    it('renders correctly with large dataset count', () => {
      renderCard({ project: { datasetCount: 9999 } });

      expect(screen.getByText(/9999 datasets/)).toBeInTheDocument();
    });
  });

  describe('Metadata Grid Layout', () => {
    it('renders with correct layout', () => {
      const { container } = renderCard();

      // Check for the main card container
      const cardElement = container.querySelector('.card');
      expect(cardElement).toBeInTheDocument();
    });

    it('renders all metadata items with icons', () => {
      const { container } = renderCard();

      // Check for lucide icons (svg elements)
      const icons = container.querySelectorAll('svg');
      // Expect at least 3 icons: calendar, database, and play button icon
      expect(icons.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Tooltip Accessibility', () => {
    it('tooltip button has correct ARIA attributes', () => {
      renderCard();

      const tooltipButton = screen.getByRole('button', {
        name: 'Project description',
      });
      expect(tooltipButton).toBeInTheDocument();
      expect(tooltipButton).toHaveAttribute('aria-describedby');
      expect(tooltipButton).toHaveAttribute('type', 'button');
    });

    it("tooltip element has role='tooltip'", () => {
      const { container } = renderCard();

      const tooltip = container.querySelector('[role="tooltip"]');
      expect(tooltip).toBeInTheDocument();
      expect(tooltip).toHaveTextContent('Test project description');
    });

    it('tooltip button and tooltip are linked via aria-describedby', () => {
      const { container } = renderCard();
      const { tooltipButton, tooltip } = getTooltipElements(container);

      const ariaDescribedby = tooltipButton.getAttribute('aria-describedby');
      expect(tooltip).toBeInTheDocument();
      expect(ariaDescribedby).toBe(tooltip!.id);
    });

    it('shows tooltip on focus', () => {
      const { container } = renderCard();
      const { tooltipButton, tooltip } = getTooltipElements(container);

      // Initially hidden
      expect(tooltip).toHaveClass('opacity-0');

      // Focus the button
      fireEvent.focus(tooltipButton);

      // Should be visible
      expect(tooltip).toHaveClass('opacity-100');
    });

    it('hides tooltip on blur', () => {
      const { container } = renderCard();
      const { tooltipButton, tooltip } = getTooltipElements(container);

      // Focus to show
      fireEvent.focus(tooltipButton);
      expect(tooltip).toHaveClass('opacity-100');

      // Blur to hide
      fireEvent.blur(tooltipButton);
      expect(tooltip).toHaveClass('opacity-0');
    });

    it.each([
      ['Enter', { key: 'Enter' }],
      ['Space', { key: ' ' }],
    ])('shows tooltip when %s key is pressed', (_keyName, keyEvent) => {
      const { container } = renderCard();
      const { tooltipButton, tooltip } = getTooltipElements(container);

      fireEvent.keyDown(tooltipButton, keyEvent);
      expect(tooltip).toHaveClass('opacity-100');
    });

    it('hides tooltip when Escape key is pressed', () => {
      const { container } = renderCard();
      const { tooltipButton, tooltip } = getTooltipElements(container);

      // Show tooltip first
      fireEvent.focus(tooltipButton);
      expect(tooltip).toHaveClass('opacity-100');

      // Hide with Escape
      fireEvent.keyDown(tooltipButton, { key: 'Escape' });
      expect(tooltip).toHaveClass('opacity-0');
    });

    it('tooltip button has visible focus indicator', () => {
      renderCard();

      const tooltipButton = screen.getByRole('button', {
        name: 'Project description',
      });

      expect(tooltipButton).toHaveClass('focus:ring-2');
      expect(tooltipButton).toHaveClass('focus:ring-blue-500');
    });

    it('shows tooltip on mouse enter', () => {
      const { container } = renderCard();
      const { tooltipButton, tooltip } = getTooltipElements(container);

      // Initially hidden
      expect(tooltip).toHaveClass('opacity-0');

      // Mouse enter the button
      fireEvent.mouseEnter(tooltipButton);

      // Should be visible
      expect(tooltip).toHaveClass('opacity-100');
    });

    it('hides tooltip on mouse leave', () => {
      const { container } = renderCard();
      const { tooltipButton, tooltip } = getTooltipElements(container);

      // Mouse enter to show
      fireEvent.mouseEnter(tooltipButton);
      expect(tooltip).toHaveClass('opacity-100');

      // Mouse leave to hide
      fireEvent.mouseLeave(tooltipButton);
      expect(tooltip).toHaveClass('opacity-0');
    });

    it('tooltip has aria-hidden attribute that toggles with visibility', () => {
      const { container } = renderCard();
      const { tooltipButton, tooltip } = getTooltipElements(container);

      // Initially hidden
      expect(tooltip).toHaveAttribute('aria-hidden', 'true');

      // Focus to show
      fireEvent.focus(tooltipButton);
      expect(tooltip).toHaveAttribute('aria-hidden', 'false');

      // Blur to hide
      fireEvent.blur(tooltipButton);
      expect(tooltip).toHaveAttribute('aria-hidden', 'true');
    });
  });
});
