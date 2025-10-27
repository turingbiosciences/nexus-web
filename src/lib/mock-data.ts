import { Project, ProjectStatusCount, STATUS_ORDER } from "@/types/project";

// Helper function to create dates relative to now
function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function hoursAgo(hours: number): Date {
  const date = new Date();
  date.setHours(date.getHours() - hours);
  return date;
}

// Mock project data for development
export const mockProjects: Project[] = [
  {
    id: "1",
    name: "sJIA Metabolites Analysis",
    description:
      "Comprehensive metabolite profiling for systemic juvenile idiopathic arthritis patients. Analyzing biomarkers and disease progression indicators.",
    status: "running",
    createdAt: daysAgo(12),
    updatedAt: hoursAgo(2),
    datasets: [
      {
        id: "d1-1",
        filename: "patient_cohort_metadata.csv",
        size: 48_532, // ~47.4 KB
        uploadedAt: daysAgo(10),
      },
      {
        id: "d1-2",
        filename: "metabolite_peak_table.xlsx",
        size: 1_824_392, // ~1.74 MB
        uploadedAt: daysAgo(6),
      },
      {
        id: "d1-3",
        filename: "qc_report.pdf",
        size: 362_114, // ~353 KB
        uploadedAt: hoursAgo(5),
      },
    ],
    datasetCount: 3,
    lastActivity: "2 hours ago",
  },
  {
    id: "2",
    name: "COVID-19 Proteomics",
    description:
      "Multi-omics study of protein expression patterns in COVID-19 patients across disease severity stages.",
    status: "complete",
    createdAt: daysAgo(56),
    updatedAt: daysAgo(7),
    completedAt: daysAgo(7),
    datasets: [
      {
        id: "d2-1",
        filename: "protein_expression_matrix.csv",
        size: 5_234_882,
        uploadedAt: daysAgo(40),
      },
      {
        id: "d2-2",
        filename: "sample_manifest.csv",
        size: 92_114,
        uploadedAt: daysAgo(39),
      },
      {
        id: "d2-3",
        filename: "mass_spec_runs_batch1.raw",
        size: 734_003_221,
        uploadedAt: daysAgo(35),
      },
      {
        id: "d2-4",
        filename: "mass_spec_runs_batch2.raw",
        size: 806_553_114,
        uploadedAt: daysAgo(33),
      },
      {
        id: "d2-5",
        filename: "differential_expression_results.tsv",
        size: 2_345_112,
        uploadedAt: daysAgo(20),
      },
      {
        id: "d2-6",
        filename: "pathway_enrichment_output.json",
        size: 184_221,
        uploadedAt: daysAgo(14),
      },
      {
        id: "d2-7",
        filename: "figures_archive.zip",
        size: 12_553_882,
        uploadedAt: daysAgo(9),
      },
      {
        id: "d2-8",
        filename: "final_report.pdf",
        size: 1_223_992,
        uploadedAt: daysAgo(7),
      },
    ],
    datasetCount: 8,
    lastActivity: "7 days ago",
  },
  {
    id: "3",
    name: "Alzheimer's Biomarker Discovery",
    description:
      "Identification of novel biomarkers for early detection of Alzheimer's disease using machine learning approaches.",
    status: "setup",
    createdAt: daysAgo(3),
    updatedAt: daysAgo(2),
    datasets: [],
    datasetCount: 0,
    lastActivity: "2 days ago",
  },
  {
    id: "4",
    name: "Cancer Cell Line Screening",
    description:
      "High-throughput screening of drug responses across multiple cancer cell lines to identify therapeutic targets.",
    status: "running",
    createdAt: daysAgo(17),
    updatedAt: hoursAgo(5),
    datasets: [
      {
        id: "d4-1",
        filename: "cell_line_metadata.csv",
        size: 151_223,
        uploadedAt: daysAgo(15),
      },
      {
        id: "d4-2",
        filename: "drug_panel_plate_layout.pdf",
        size: 553_221,
        uploadedAt: daysAgo(15),
      },
      {
        id: "d4-3",
        filename: "viability_readout_batch1.csv",
        size: 2_553_882,
        uploadedAt: daysAgo(14),
      },
      {
        id: "d4-4",
        filename: "viability_readout_batch2.csv",
        size: 2_612_112,
        uploadedAt: daysAgo(13),
      },
      {
        id: "d4-5",
        filename: "compound_annotations.tsv",
        size: 446_221,
        uploadedAt: daysAgo(12),
      },
      {
        id: "d4-6",
        filename: "quality_control_metrics.json",
        size: 183_992,
        uploadedAt: daysAgo(11),
      },
      {
        id: "d4-7",
        filename: "dose_response_curves_batch1.png",
        size: 823_441,
        uploadedAt: daysAgo(9),
      },
      {
        id: "d4-8",
        filename: "dose_response_curves_batch2.png",
        size: 806_112,
        uploadedAt: daysAgo(8),
      },
      {
        id: "d4-9",
        filename: "screen_summary_interim.pdf",
        size: 1_223_992,
        uploadedAt: daysAgo(6),
      },
      {
        id: "d4-10",
        filename: "ml_feature_matrix.parquet",
        size: 23_553_882,
        uploadedAt: daysAgo(4),
      },
      {
        id: "d4-11",
        filename: "prediction_results.json",
        size: 2_345_112,
        uploadedAt: daysAgo(3),
      },
      {
        id: "d4-12",
        filename: "heatmap_visualization.svg",
        size: 106_553,
        uploadedAt: hoursAgo(6),
      },
    ],
    datasetCount: 12,
    lastActivity: "5 hours ago",
  },
  {
    id: "5",
    name: "Diabetes Risk Prediction",
    description:
      "Predictive modeling of type 2 diabetes risk using clinical and genomic data from longitudinal cohort studies.",
    status: "complete",
    createdAt: daysAgo(73),
    updatedAt: daysAgo(27),
    completedAt: daysAgo(27),
    datasets: [
      {
        id: "d5-1",
        filename: "cohort_labs_baseline.csv",
        size: 823_441,
        uploadedAt: daysAgo(60),
      },
      {
        id: "d5-2",
        filename: "cohort_labs_followup.csv",
        size: 806_112,
        uploadedAt: daysAgo(55),
      },
      {
        id: "d5-3",
        filename: "genomic_variants_panel.vcf",
        size: 12_553_882,
        uploadedAt: daysAgo(50),
      },
      {
        id: "d5-4",
        filename: "model_training_features.parquet",
        size: 23_553_882,
        uploadedAt: daysAgo(40),
      },
      {
        id: "d5-5",
        filename: "risk_model_report.pdf",
        size: 1_223_992,
        uploadedAt: daysAgo(27),
      },
    ],
    datasetCount: 5,
    lastActivity: "27 days ago",
  },
  {
    id: "6",
    name: "Rare Disease Genomics",
    description:
      "Whole genome sequencing analysis for rare genetic disorders to identify causative mutations and inheritance patterns.",
    status: "setup",
    createdAt: daysAgo(1),
    updatedAt: hoursAgo(3),
    datasets: [],
    datasetCount: 0,
    lastActivity: "3 hours ago",
  },
];

export function getProjectStatusCount(projects: Project[]): ProjectStatusCount {
  // Initialize counts using STATUS_ORDER to ensure consistency
  const initialCounts = STATUS_ORDER.reduce((acc, status) => {
    acc[status] = 0;
    return acc;
  }, {} as ProjectStatusCount);

  return projects.reduce((acc, project) => {
    acc[project.status]++;
    return acc;
  }, initialCounts);
}

export function getProjectById(id: string): Project | undefined {
  return mockProjects.find((p) => p.id === id);
}
