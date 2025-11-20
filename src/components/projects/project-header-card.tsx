"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle, Play, Settings2, Calendar, Database } from "lucide-react";
import { Project } from "@/types/project";

interface ProjectHeaderCardProps {
  project: Project;
  isRunning: boolean;
  onRun: () => void;
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

export function ProjectHeaderCard({
  project,
  isRunning,
  onRun,
}: ProjectHeaderCardProps) {
  const config = statusConfig[project.status] || statusConfig.setup;
  const StatusIcon = config.icon;

  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {project.name}
          </h1>
          <p className="text-gray-600">{project.description}</p>
        </div>
        <Button
          onClick={onRun}
          disabled={isRunning || !project.datasetCount}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Play className="h-4 w-4 mr-2" />
          {isRunning ? "Running..." : "Run"}
        </Button>
      </div>

      {/* Project Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t">
        <div className="flex items-center gap-3">
          <StatusIcon className={`h-5 w-5 ${config.color}`} />
          <div>
            <div className="text-sm text-gray-600">Status</div>
            <div className="font-medium text-gray-900">{config.label}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-gray-400" />
          <div>
            <div className="text-sm text-gray-600">Last Run</div>
            <div className="font-medium text-gray-900">
              {project.completedAt
                ? project.completedAt.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Never"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Database className="h-5 w-5 text-gray-400" />
          <div>
            <div className="text-sm text-gray-600">Datasets</div>
            <div className="font-medium text-gray-900">
              {project.datasetCount || 0}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
