"use client";

interface LoadingCardProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingCard({
  message = "Loading...",
  size = "md",
}: LoadingCardProps) {
  const sizeClasses = {
    sm: "h-8 w-8 border-2",
    md: "h-12 w-12 border-b-2",
    lg: "h-16 w-16 border-b-3",
  };

  return (
    <div className="card p-6 text-center">
      <div
        className={`animate-spin rounded-full ${sizeClasses[size]} border-blue-600 mx-auto mb-4`}
      ></div>
      <p className="text-gray-600">{message}</p>
    </div>
  );
}
