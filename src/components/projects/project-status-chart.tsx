"use client";

import { ProjectStatusCount, STATUS_ORDER } from "@/types/project";
import { CheckCircle, Play, Settings2 } from "lucide-react";

interface ProjectStatusChartProps {
  statusCount: ProjectStatusCount;
}

const statusConfig = {
  complete: {
    label: "Complete",
    color: "#10b981",
    icon: CheckCircle,
  },
  running: {
    label: "Running",
    color: "#3b82f6",
    icon: Play,
  },
  setup: {
    label: "Setup",
    color: "#f59e0b",
    icon: Settings2,
  },
};

export function ProjectStatusChart({ statusCount }: ProjectStatusChartProps) {
  const total = statusCount.complete + statusCount.running + statusCount.setup;

  if (total === 0) {
    return (
      <div className="card">
        <h3 className="card-title">Project Status</h3>
        <div className="text-center py-8 text-gray-500">
          No projects to display
        </div>
      </div>
    );
  }

  const percentages = {
    complete: (statusCount.complete / total) * 100,
    running: (statusCount.running / total) * 100,
    setup: (statusCount.setup / total) * 100,
  };

  // Create pie chart segments using conic-gradient
  let currentAngle = 0;
  const gradientStops: string[] = [];

  STATUS_ORDER.forEach((status) => {
    const percent = percentages[status];
    if (percent > 0) {
      const endAngle = currentAngle + (percent * 360) / 100;
      gradientStops.push(
        `${statusConfig[status].color} ${currentAngle}deg ${endAngle}deg`
      );
      currentAngle = endAngle;
    }
  });

  return (
    <div className="card">
      <h3 className="card-title mb-6">Project Status Overview</h3>

      <div className="flex items-center justify-center mb-6">
        <div className="relative">
          <div
            className="w-48 h-48 rounded-full"
            style={{
              background: `conic-gradient(${gradientStops.join(", ")})`,
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
              <div className="text-3xl font-bold text-gray-900">{total}</div>
              <div className="text-sm text-gray-600">Projects</div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {STATUS_ORDER.map((status) => {
          const config = statusConfig[status];
          const Icon = config.icon;
          const count = statusCount[status];
          const percentage = percentages[status];

          if (count === 0) return null;

          return (
            <div
              key={status}
              className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: config.color }}
                />
                <Icon className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  {config.label}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">
                  {percentage.toFixed(1)}%
                </span>
                <span className="text-sm font-semibold text-gray-900 min-w-[2rem] text-right">
                  {count}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
