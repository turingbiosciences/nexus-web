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
