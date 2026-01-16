import React from "react";
import { render, screen } from "@testing-library/react";
import { AggregateFeatureImportanceTable } from "../aggregate-feature-importance-table";

describe("AggregateFeatureImportanceTable", () => {
    const mockData = {
        top_features: [
            {
                feature: "age",
                mean_importance: 0.25,
                sum_importance: 0.75,
                max_importance: 0.35,
                min_importance: 0.15,
                std_importance: 0.05,
                weighted_score: 0.28,
                num_models: 3,
                models: ["RandomForest", "XGBoost", "GradientBoosting"],
            },
            {
                feature: "blood_pressure",
                mean_importance: 0.18,
                sum_importance: 0.54,
                max_importance: 0.22,
                min_importance: 0.14,
                std_importance: 0.03,
                weighted_score: 0.19,
                num_models: 3,
                models: ["RandomForest", "XGBoost", "GradientBoosting"],
            },
        ],
    };

    describe("Rendering", () => {
        it("renders table with feature data", () => {
            render(<AggregateFeatureImportanceTable data={mockData} />);

            expect(
                screen.getByText("Aggregate Feature Importance")
            ).toBeInTheDocument();
            expect(screen.getByText("age")).toBeInTheDocument();
            expect(screen.getByText("blood_pressure")).toBeInTheDocument();
        });

        it("renders all table headers", () => {
            render(<AggregateFeatureImportanceTable data={mockData} />);

            expect(screen.getByText("Rank")).toBeInTheDocument();
            expect(screen.getByText("Feature")).toBeInTheDocument();
            expect(screen.getByText("Weighted Score")).toBeInTheDocument();
            expect(screen.getByText("Mean Importance")).toBeInTheDocument();
            expect(screen.getByText("Max Importance")).toBeInTheDocument();
            expect(screen.getByText("Min Importance")).toBeInTheDocument();
            expect(screen.getByText("Std Dev")).toBeInTheDocument();
            expect(screen.getByText("# Models")).toBeInTheDocument();
            expect(screen.getByText("Models")).toBeInTheDocument();
        });

        it("shows correct rank numbers", () => {
            render(<AggregateFeatureImportanceTable data={mockData} />);

            const rows = screen.getAllByRole("row");
            // First row is header, so data rows start at index 1
            expect(rows[1]).toHaveTextContent("1");
            expect(rows[2]).toHaveTextContent("2");
        });

        it("formats numeric values correctly", () => {
            render(<AggregateFeatureImportanceTable data={mockData} />);

            // Check weighted score formatting
            expect(screen.getByText("0.2800")).toBeInTheDocument();
            expect(screen.getByText("0.1900")).toBeInTheDocument();
        });

        it("shows model tags", () => {
            render(<AggregateFeatureImportanceTable data={mockData} />);

            // Should have 6 model tags (3 models x 2 features)
            const randomForestTags = screen.getAllByText("RandomForest");
            expect(randomForestTags).toHaveLength(2);
        });

        it("shows feature count description", () => {
            render(<AggregateFeatureImportanceTable data={mockData} />);

            expect(
                screen.getByText(/Top 2 features ranked by weighted score/)
            ).toBeInTheDocument();
        });
    });

    describe("Empty State", () => {
        it("shows empty message when no features", () => {
            render(<AggregateFeatureImportanceTable data={{ top_features: [] }} />);

            expect(
                screen.getByText("No aggregate feature importance data available")
            ).toBeInTheDocument();
        });

        it("shows empty message when top_features is undefined", () => {
            render(
                <AggregateFeatureImportanceTable
                    data={{ top_features: undefined as unknown as never[] }}
                />
            );

            expect(
                screen.getByText("No aggregate feature importance data available")
            ).toBeInTheDocument();
        });
    });

    describe("Styling", () => {
        it("has proper table structure with header and body", () => {
            render(<AggregateFeatureImportanceTable data={mockData} />);

            expect(screen.getByRole("table")).toBeInTheDocument();
            const rows = screen.getAllByRole("row");
            expect(rows.length).toBe(3); // 1 header + 2 data rows
        });
    });
});
