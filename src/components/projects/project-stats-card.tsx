'use client';

import { useProjects } from '@/components/providers/projects-provider';
import { formatDate } from '@/lib/utils/format-date';
import { Calendar, Database, Clock } from 'lucide-react';

interface ProjectStatsCardProps {
  projectId: string;
}

export function ProjectStatsCard({ projectId }: ProjectStatsCardProps) {
  const { getProjectById } = useProjects();
  const project = getProjectById(projectId);

  if (!project) {
    return null;
  }

  // Format last run date
  const lastRunDate = project.completedAt
    ? formatDate(project.completedAt)
    : 'Never';

  // Dataset count from project
  const datasetCount = project.datasetCount || 0;

  return (
    <div className="card">
      <h3 className="card-title">Project Statistics</h3>
      <div className="space-y-4">
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
            {formatDate(project.updatedAt)}
          </span>
        </div>

        {/* Created */}
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Created</span>
          </div>
          <span className="text-sm text-gray-900 font-medium">
            {formatDate(project.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}
