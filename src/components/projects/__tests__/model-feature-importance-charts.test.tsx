import { render, screen } from '@testing-library/react';
import { ModelFeatureImportanceCharts } from '../model-feature-importance-charts';
import { ModelConfig } from '@/types/model-config';

// Mock Recharts to avoid rendering actual SVG in tests which can be tricky
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
}));

const mockModelConfigs: Record<string, ModelConfig> = {
  model_a: {
    best_config: 'config_1',
    feature_importance: [
      { name: 'feature_1', importance: 0.5 },
      { name: 'feature_2', importance: 0.3 },
      { name: 'feature_3', importance: 0.1 },
    ],
  } as unknown as ModelConfig,
  model_b: {
    best_config: 'config_2',
    feature_importance: {
      feature_x: 0.8,
      feature_y: 0.1,
    },
  } as unknown as ModelConfig,
};

describe('ModelFeatureImportanceCharts', () => {
  it('renders nothing when no model configs are provided', () => {
    const { container } = render(
      <ModelFeatureImportanceCharts modelConfigs={{}} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders charts when valid model configs are provided', () => {
    render(<ModelFeatureImportanceCharts modelConfigs={mockModelConfigs} />);

    expect(screen.getByText('Feature Importance by Rank')).toBeInTheDocument();
    expect(screen.getByText(/model a/i)).toBeInTheDocument();
    expect(screen.getByText(/model b/i)).toBeInTheDocument();

    // Check if top features are listed (part of the elbow method output)
    expect(screen.getByText(/feature_1/i)).toBeInTheDocument();
    expect(screen.getByText(/feature_x/i)).toBeInTheDocument();
  });
});
