import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Width of the skeleton. Can be a CSS value or "full" for 100%.
   * @default "full"
   */
  width?: string | "full";
  /**
   * Height of the skeleton. Can be a CSS value.
   * @default "1rem"
   */
  height?: string;
  /**
   * Shape of the skeleton.
   * @default "rectangle"
   */
  variant?: "rectangle" | "circle" | "rounded";
  /**
   * Number of skeleton lines to render (for text loading states).
   * If provided, renders multiple skeleton lines with gap.
   */
  count?: number;
}

/**
 * Skeleton loader component for loading states.
 *
 * @example
 * // Single line
 * <Skeleton />
 *
 * @example
 * // Multiple lines
 * <Skeleton count={3} />
 *
 * @example
 * // Circle avatar
 * <Skeleton variant="circle" width="3rem" height="3rem" />
 *
 * @example
 * // Custom dimensions
 * <Skeleton width="200px" height="24px" variant="rounded" />
 */
export function Skeleton({
  width = "full",
  height = "1rem",
  variant = "rectangle",
  count,
  className,
  style,
  ...props
}: SkeletonProps) {
  const baseStyles = "animate-pulse bg-gray-200";

  const variantStyles = {
    rectangle: "rounded-none",
    rounded: "rounded",
    circle: "rounded-full",
  };

  const widthStyle = width === "full" ? "w-full" : "";

  const inlineStyles = {
    ...style,
    ...(width !== "full" && { width }),
    height,
  };

  if (count && count > 1) {
    return (
      <div className="space-y-2" {...props}>
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className={cn(
              baseStyles,
              variantStyles[variant],
              widthStyle,
              className
            )}
            style={inlineStyles}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(baseStyles, variantStyles[variant], widthStyle, className)}
      style={inlineStyles}
      {...props}
    />
  );
}

/**
 * Skeleton component for text content with varying widths.
 * Renders multiple lines with different widths to simulate text.
 */
export function SkeletonText({
  lines = 3,
  className,
  ...props
}: {
  lines?: number;
  className?: string;
}) {
  const widths = ["100%", "95%", "85%", "90%", "80%"];

  return (
    <div className={cn("space-y-2", className)} {...props}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={widths[index % widths.length]}
          height="0.875rem"
        />
      ))}
    </div>
  );
}

/**
 * Skeleton component for card content.
 * Includes a title, description, and footer area.
 */
export function SkeletonCard({ className, ...props }: { className?: string }) {
  return (
    <div className={cn("card", className)} {...props}>
      {/* Title */}
      <Skeleton width="60%" height="1.25rem" className="mb-3" />

      {/* Description lines */}
      <div className="space-y-2 mb-4">
        <Skeleton width="100%" height="0.875rem" />
        <Skeleton width="90%" height="0.875rem" />
      </div>

      {/* Footer metadata */}
      <div className="flex items-center gap-4">
        <Skeleton width="5rem" height="0.75rem" />
        <Skeleton width="6rem" height="0.75rem" />
      </div>
    </div>
  );
}

/**
 * Skeleton component for table rows.
 */
export function SkeletonTable({
  rows = 5,
  columns = 4,
  className,
  ...props
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)} {...props}>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex items-center gap-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              width={colIndex === 0 ? "30%" : "20%"}
              height="1rem"
            />
          ))}
        </div>
      ))}
    </div>
  );
}
