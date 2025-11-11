"use client";

import { useProjects } from "@/components/providers/projects-provider";
import {
  CheckCircle,
  Play,
  Settings2,
  Calendar,
  Database,
  Hash,
  Clock,
} from "lucide-react";

interface ProjectStatsCardProps {
  projectId: string;
}

const statusConfig = {
  complete: {
    icon: CheckCircle,
    label: "Complete",
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
  },
  running: {
    icon: Play,
    label: "Running",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  setup: {
    icon: Settings2,
    label: "Setup",
    color: "text-yellow-600",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
  },
};

export function ProjectStatsCard({ projectId }: ProjectStatsCardProps) {
  const { getProjectById } = useProjects();
  const project = getProjectById(projectId);

  if (!project) {
    return null;
  }

  const config = statusConfig[project.status] || statusConfig.setup;
  const StatusIcon = config.icon;

  // Format last run date
  const lastRunDate = project.completedAt
    ? project.completedAt.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Never";

  // Placeholder for run count (will be populated from API)
  const runCount = 0;

  // Dataset count from project
  const datasetCount = project.datasetCount || 0;

  return (
    <div className="card">
      <h3 className="card-title">Project Statistics</h3>
      <div className="space-y-4">
        {/* Current Status */}
        <div className="flex items-center justify-between py-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <StatusIcon className={`h-5 w-5 ${config.color}`} />
            <span className="text-sm font-medium text-gray-700">
              Current Status
            </span>
          </div>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.color} ${config.border} border`}
          >
            {config.label}
          </span>
        </div>

        {/* Last Project Run */}
        <div className="flex items-center justify-between py-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">
              Last Project Run
            </span>
          </div>
          <span className="text-sm text-gray-900 font-medium">
            {lastRunDate}
          </span>
        </div>

        {/* Number of Runs */}
        <div className="flex items-center justify-between py-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Hash className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">
              Number of Runs
            </span>
          </div>
          <span className="text-sm text-gray-900 font-medium">{runCount}</span>
        </div>

        {/* Number of Datasets */}
        <div className="flex items-center justify-between py-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Database className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">
              Number of Datasets
            </span>
          </div>
          <span className="text-sm text-gray-900 font-medium">
            {datasetCount}
          </span>
        </div>

        {/* Last Updated */}
        <div className="flex items-center justify-between py-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">
              Last Updated
            </span>
          </div>
          <span className="text-sm text-gray-900 font-medium">
            {project.updatedAt.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>

        {/* Created */}
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Created</span>
          </div>
          <span className="text-sm text-gray-900 font-medium">
            {project.createdAt.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
      </div>
    </div>
  );
}
