import { Project, ProjectStatusCount } from "@/types/project";

// Mock project data for development
export const mockProjects: Project[] = [
  {
    id: "1",
    name: "sJIA Metabolites Analysis",
    description:
      "Comprehensive metabolite profiling for systemic juvenile idiopathic arthritis patients. Analyzing biomarkers and disease progression indicators.",
    status: "running",
    createdAt: new Date("2025-10-15"),
    updatedAt: new Date("2025-10-26"),
    datasetCount: 3,
    lastActivity: "2 hours ago",
  },
  {
    id: "2",
    name: "COVID-19 Proteomics",
    description:
      "Multi-omics study of protein expression patterns in COVID-19 patients across disease severity stages.",
    status: "complete",
    createdAt: new Date("2025-09-01"),
    updatedAt: new Date("2025-10-20"),
    completedAt: new Date("2025-10-20"),
    datasetCount: 8,
    lastActivity: "6 days ago",
  },
  {
    id: "3",
    name: "Alzheimer's Biomarker Discovery",
    description:
      "Identification of novel biomarkers for early detection of Alzheimer's disease using machine learning approaches.",
    status: "setup",
    createdAt: new Date("2025-10-24"),
    updatedAt: new Date("2025-10-25"),
    datasetCount: 0,
    lastActivity: "1 day ago",
  },
  {
    id: "4",
    name: "Cancer Cell Line Screening",
    description:
      "High-throughput screening of drug responses across multiple cancer cell lines to identify therapeutic targets.",
    status: "running",
    createdAt: new Date("2025-10-10"),
    updatedAt: new Date("2025-10-26"),
    datasetCount: 12,
    lastActivity: "5 hours ago",
  },
  {
    id: "5",
    name: "Diabetes Risk Prediction",
    description:
      "Predictive modeling of type 2 diabetes risk using clinical and genomic data from longitudinal cohort studies.",
    status: "complete",
    createdAt: new Date("2025-08-15"),
    updatedAt: new Date("2025-09-30"),
    completedAt: new Date("2025-09-30"),
    datasetCount: 5,
    lastActivity: "26 days ago",
  },
  {
    id: "6",
    name: "Rare Disease Genomics",
    description:
      "Whole genome sequencing analysis for rare genetic disorders to identify causative mutations and inheritance patterns.",
    status: "setup",
    createdAt: new Date("2025-10-26"),
    updatedAt: new Date("2025-10-26"),
    datasetCount: 0,
    lastActivity: "3 hours ago",
  },
];

export function getProjectStatusCount(projects: Project[]): ProjectStatusCount {
  return projects.reduce(
    (acc, project) => {
      acc[project.status]++;
      return acc;
    },
    { complete: 0, running: 0, setup: 0 } as ProjectStatusCount
  );
}

export function getProjectById(id: string): Project | undefined {
  return mockProjects.find((p) => p.id === id);
}
