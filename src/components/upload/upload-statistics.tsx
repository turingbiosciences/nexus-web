"use client";

interface UploadStatisticsProps {
  totalFiles?: number;
}

export function UploadStatistics({ totalFiles = 5 }: UploadStatisticsProps) {
  return (
    <div className="card p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">
        Upload Statistics
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card bg-blue-50">
          <h4 className="text-sm font-medium text-blue-900">Total Files</h4>
          <p className="text-2xl font-bold text-blue-600">{totalFiles}</p>
        </div>
        <div className="stat-card bg-green-50">
          <h4 className="text-sm font-medium text-green-900">Total Size</h4>
          <p className="text-2xl font-bold text-green-600">0 MB</p>
        </div>
        <div className="stat-card bg-purple-50">
          <h4 className="text-sm font-medium text-purple-900">
            Successful Uploads
          </h4>
          <p className="text-2xl font-bold text-purple-600">0</p>
        </div>
      </div>
    </div>
  );
}
