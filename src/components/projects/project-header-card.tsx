'use client';

import { Button } from '@/components/ui/button';
import {
  CheckCircle,
  Play,
  Settings2,
  Calendar,
  Database,
  Info,
} from 'lucide-react';
import { Project } from '@/types/project';

interface ProjectHeaderCardProps {
  project: Project;
  isRunning: boolean;
  onRun: () => void;
  latestResultDate?: Date;
}

const statusConfig = {
  complete: {
    icon: CheckCircle,
    label: 'Complete',
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
  },
  running: {
    icon: Play,
    label: 'Running',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  setup: {
    icon: Settings2,
    label: 'Setup',
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
  },
};

export function ProjectHeaderCard({
  project,
  isRunning,
  onRun,
  latestResultDate,
}: ProjectHeaderCardProps) {
  const config = statusConfig[project.status] || statusConfig.setup;
  const StatusIcon = config.icon;

  return (
    <div className="card">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          {/* Project name with description tooltip */}
          <div className="group relative inline-block">
            <h1 className="text-xl font-bold text-gray-900 cursor-help inline-flex items-center gap-2">
              {project.name}
              <Info className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
            </h1>
            {/* Tooltip popup */}
            <div className="absolute left-0 top-full mt-2 w-80 bg-gray-900 text-white text-sm rounded-lg p-3 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              {project.description}
              <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 transform rotate-45"></div>
            </div>
          </div>

          {/* Compact metadata below name */}
          <div className="flex items-center gap-6 mt-2 text-sm text-gray-600">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span>
                {project.completedAt
                  ? `${project.completedAt.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })} ${project.completedAt.toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })}`
                  : latestResultDate
                    ? `${latestResultDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })} ${latestResultDate.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      })}`
                    : 'Never run'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Database className="h-4 w-4 text-gray-400" />
              <span>
                {project.datasetCount || 0} dataset
                {project.datasetCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Status icon and Run button side by side */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <StatusIcon className={`h-5 w-5 ${config.color}`} />
            <span className="text-sm font-medium text-gray-700">
              {config.label}
            </span>
          </div>
          <Button
            onClick={onRun}
            disabled={isRunning || !project.datasetCount}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Play className="h-4 w-4 mr-2" />
            {isRunning ? 'Running...' : 'Run'}
          </Button>
        </div>
      </div>
    </div>
  );
}
