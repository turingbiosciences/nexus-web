import React from "react";
import { render, screen } from "@testing-library/react";
import { FeatureImportanceSection } from "../feature-importance-section";

// Mock the FeatureImportanceChart component
jest.mock("../feature-importance-chart", () => ({
    FeatureImportanceChart: ({
        modelName,
        bestConfig,
    }: {
        modelName: string;
        bestConfig: string;
    }) => (
        <div data-testid="feature-importance-chart">
            {modelName} - {bestConfig}
        </div>
    ),
}));

describe("FeatureImportanceSection", () => {
    const mockModelConfigs = {
        RandomForest: {
            best_config: "config1",
            configs: {
                config1: { accuracy: 0.95 },
            },
            feature_importance: [
                { name: "age", importance: 0.3 },
                { name: "blood_pressure", importance: 0.2 },
            ],
        },
        XGBoost: {
            best_config: "config2",
            configs: {
                config2: { accuracy: 0.94 },
            },
            feature_importance: { age: 0.25, weight: 0.18 },
        },
    };

    describe("Rendering", () => {
        it("renders section heading", () => {
            render(<FeatureImportanceSection modelConfigs={mockModelConfigs} />);

            expect(
                screen.getByText("Feature Importance by Model")
            ).toBeInTheDocument();
        });

        it("renders feature importance charts for each model", () => {
            render(<FeatureImportanceSection modelConfigs={mockModelConfigs} />);

            const charts = screen.getAllByTestId("feature-importance-chart");
            expect(charts).toHaveLength(2);
            expect(screen.getByText(/RandomForest - config1/)).toBeInTheDocument();
            expect(screen.getByText(/XGBoost - config2/)).toBeInTheDocument();
        });
    });

    describe("Edge Cases", () => {
        it("renders nothing for models without best_config", () => {
            const configWithoutBest = {
                ModelA: {
                    best_config: undefined,
                    configs: { config1: {} },
                    feature_importance: { age: 0.3 },
                },
            };

            render(
                <FeatureImportanceSection
                    modelConfigs={configWithoutBest as unknown as typeof mockModelConfigs}
                />
            );

            expect(
                screen.queryByTestId("feature-importance-chart")
            ).not.toBeInTheDocument();
        });

        it("renders nothing for models without configs", () => {
            const configWithoutConfigs = {
                ModelA: {
                    best_config: "config1",
                    configs: undefined,
                    feature_importance: { age: 0.3 },
                },
            };

            render(
                <FeatureImportanceSection
                    modelConfigs={
                        configWithoutConfigs as unknown as typeof mockModelConfigs
                    }
                />
            );

            expect(
                screen.queryByTestId("feature-importance-chart")
            ).not.toBeInTheDocument();
        });

        it("renders nothing for models without feature_importance", () => {
            const configWithoutFeatureImportance = {
                ModelA: {
                    best_config: "config1",
                    configs: { config1: {} },
                    feature_importance: undefined,
                },
            };

            render(
                <FeatureImportanceSection
                    modelConfigs={
                        configWithoutFeatureImportance as unknown as typeof mockModelConfigs
                    }
                />
            );

            expect(
                screen.queryByTestId("feature-importance-chart")
            ).not.toBeInTheDocument();
        });

        it("renders nothing for models with empty feature_importance", () => {
            const configWithEmptyFeatureImportance = {
                ModelA: {
                    best_config: "config1",
                    configs: { config1: {} },
                    feature_importance: {},
                },
            };

            render(
                <FeatureImportanceSection
                    modelConfigs={
                        configWithEmptyFeatureImportance as unknown as typeof mockModelConfigs
                    }
                />
            );

            expect(
                screen.queryByTestId("feature-importance-chart")
            ).not.toBeInTheDocument();
        });

        it("renders nothing for models when config data doesn't exist", () => {
            const configWithMissingConfigData = {
                ModelA: {
                    best_config: "nonexistent",
                    configs: { config1: {} },
                    feature_importance: { age: 0.3 },
                },
            };

            render(
                <FeatureImportanceSection
                    modelConfigs={
                        configWithMissingConfigData as unknown as typeof mockModelConfigs
                    }
                />
            );

            expect(
                screen.queryByTestId("feature-importance-chart")
            ).not.toBeInTheDocument();
        });
    });

    describe("Empty State", () => {
        it("renders section with no charts when modelConfigs is empty", () => {
            render(<FeatureImportanceSection modelConfigs={{}} />);

            expect(
                screen.getByText("Feature Importance by Model")
            ).toBeInTheDocument();
            expect(
                screen.queryByTestId("feature-importance-chart")
            ).not.toBeInTheDocument();
        });
    });
});
