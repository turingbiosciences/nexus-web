import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfusionMatrixSection } from '../confusion-matrix-section';
import { ConfusionMatrix, ModelConfig } from '@/types/model-config';

function makeConfusion(
  overrides: Partial<ConfusionMatrix> = {}
): ConfusionMatrix {
  return {
    labels: [0, 1],
    names: ['healthy', 'affected'],
    counts: [
      [80, 20],
      [10, 90],
    ],
    rates: [
      [0.8, 0.2],
      [0.1, 0.9],
    ],
    per_class: [
      {
        label: 0,
        name: 'healthy',
        support: 100,
        precision: 0.889,
        recall: 0.8,
        f1: 0.842,
      },
      {
        label: 1,
        name: 'affected',
        support: 100,
        precision: 0.818,
        recall: 0.9,
        f1: 0.857,
      },
    ],
    support: 200,
    accuracy: 0.85,
    ...overrides,
  };
}

describe('ConfusionMatrixSection', () => {
  it('renders nothing when no model has a confusion matrix', () => {
    const configs: Record<string, ModelConfig> = {
      xgboost: { metrics: { roc_auc: 0.9 } },
    };

    const { container } = render(
      <ConfusionMatrixSection modelConfigs={configs} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('skips a model whose matrix is null without hiding the others', () => {
    render(
      <ConfusionMatrixSection
        modelConfigs={{
          xgboost: { confusion: makeConfusion() },
          random_forest: { confusion: null },
        }}
      />
    );

    expect(screen.getByText('xgboost')).toBeInTheDocument();
    expect(screen.queryByText('random forest')).not.toBeInTheDocument();
  });

  it('renders one matrix per model', () => {
    render(
      <ConfusionMatrixSection
        modelConfigs={{
          xgboost: { confusion: makeConfusion() },
          catboost: { confusion: makeConfusion() },
        }}
      />
    );

    expect(screen.getAllByRole('table')).toHaveLength(4); // matrix + per-class, x2
    expect(screen.getByText('xgboost')).toBeInTheDocument();
    expect(screen.getByText('catboost')).toBeInTheDocument();
  });

  it('shows row-normalised rates by default', () => {
    render(
      <ConfusionMatrixSection
        modelConfigs={{ xgboost: { confusion: makeConfusion() } }}
      />
    );

    // 0.8 of true "healthy" was predicted "healthy".
    expect(screen.getByText('80.0%')).toBeInTheDocument();
    expect(screen.queryByText('80')).not.toBeInTheDocument();
  });

  it('switches to raw counts when Counts is selected', async () => {
    const user = userEvent.setup();
    render(
      <ConfusionMatrixSection
        modelConfigs={{ xgboost: { confusion: makeConfusion() } }}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Counts' }));

    expect(screen.getByText('90')).toBeInTheDocument();
    expect(screen.queryByText('90.0%')).not.toBeInTheDocument();
  });

  it('uses the class names the worker supplied', () => {
    render(
      <ConfusionMatrixSection
        modelConfigs={{
          xgboost: {
            confusion: makeConfusion({
              names: ['Authentic', 'Sophisticated'],
              per_class: [
                {
                  label: 0,
                  name: 'Authentic',
                  support: 100,
                  precision: 0.9,
                  recall: 0.8,
                  f1: 0.85,
                },
                {
                  label: 1,
                  name: 'Sophisticated',
                  support: 100,
                  precision: 0.8,
                  recall: 0.9,
                  f1: 0.85,
                },
              ],
            }),
          },
        }}
      />
    );

    expect(screen.getAllByText('Authentic').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Sophisticated').length).toBeGreaterThan(0);
  });

  it('renders a multiclass matrix including a class absent from the split', () => {
    render(
      <ConfusionMatrixSection
        modelConfigs={{
          xgboost: {
            confusion: makeConfusion({
              labels: [0, 1, 2],
              names: ['a', 'b', 'c'],
              counts: [
                [5, 0, 0],
                [0, 0, 0],
                [1, 0, 4],
              ],
              rates: [
                [1, 0, 0],
                [0, 0, 0],
                [0.2, 0, 0.8],
              ],
              per_class: [
                {
                  label: 0,
                  name: 'a',
                  support: 5,
                  precision: 0.833,
                  recall: 1,
                  f1: 0.909,
                },
                {
                  label: 1,
                  name: 'b',
                  support: 0,
                  precision: 0,
                  recall: 0,
                  f1: 0,
                },
                {
                  label: 2,
                  name: 'c',
                  support: 5,
                  precision: 1,
                  recall: 0.8,
                  f1: 0.889,
                },
              ],
              support: 10,
              accuracy: 0.9,
            }),
          },
        }}
      />
    );

    const [matrix] = screen.getAllByRole('table');
    // Header row, label row, then one row per class -- the empty class keeps its row.
    expect(within(matrix).getAllByRole('row')).toHaveLength(5);
  });

  it('exposes the matrix as a table with true/predicted headers', () => {
    render(
      <ConfusionMatrixSection
        modelConfigs={{ xgboost: { confusion: makeConfusion() } }}
      />
    );

    expect(screen.getByText('Predicted')).toBeInTheDocument();
    expect(screen.getByText('True')).toBeInTheDocument();
    expect(
      screen.getByRole('table', { name: /Confusion matrix for xgboost/i })
    ).toBeInTheDocument();
  });

  it('reports accuracy and sample count alongside each model', () => {
    render(
      <ConfusionMatrixSection
        modelConfigs={{ xgboost: { confusion: makeConfusion() } }}
      />
    );

    expect(screen.getByText(/85\.0% accuracy/)).toBeInTheDocument();
    expect(screen.getByText(/200 samples/)).toBeInTheDocument();
  });
});
