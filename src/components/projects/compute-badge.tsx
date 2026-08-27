/**
 * Shows which hardware produced an analysis result.
 *
 * Runtime alone is ambiguous: a fast run might mean a GPU, or it might mean a
 * small dataset. More importantly, a *slow* run might mean a large dataset or
 * it might mean the GPU launch failed and the job quietly fell back to CPU.
 * The API records what actually ran the job, and this surfaces it next to the
 * runtime so the two are read together.
 */

export interface ComputeInfo {
  type?: string;
  /** e.g. "nvidia_h100" */
  model?: string;
  gpu_count?: number;
  vram_gb?: number;
  /** DigitalOcean size slug, e.g. "gpu-h100x1-80gb" */
  size?: string;
  region?: string;
  price_hourly?: number;
  /** "droplet" or "local", for CPU runs */
  location?: string;
}

/** "nvidia_h100" -> "NVIDIA H100". Vendors are acronyms; model names are codes. */
function formatModel(model: string): string {
  const [vendor, ...rest] = model.split('_');
  const vendors: Record<string, string> = { nvidia: 'NVIDIA', amd: 'AMD' };
  const head =
    vendors[vendor.toLowerCase()] ??
    vendor.charAt(0).toUpperCase() + vendor.slice(1);
  return rest.length > 0 ? `${head} ${rest.join(' ').toUpperCase()}` : head;
}

/**
 * Estimated spend for the run.
 *
 * Deliberately approximate, and labelled as such wherever it is shown. It is
 * derived from training duration, but the droplet is billed from creation to
 * destruction — which includes boot and dependency install — and DigitalOcean
 * applies its own minimums. Treat it as an order-of-magnitude figure, not an
 * invoice.
 */
export function estimateCost(
  pricePerHour: number,
  durationSeconds: number
): string | null {
  if (!(pricePerHour > 0) || !(durationSeconds > 0)) return null;
  const cost = pricePerHour * (durationSeconds / 3600);
  if (cost < 0.01) return '<$0.01';
  return `$${cost.toFixed(2)}`;
}

/** The hardware line, e.g. "GPU · NVIDIA H100 (80 GiB)". */
export function describeCompute(compute: ComputeInfo): string | null {
  if (!compute?.type) return null;

  if (compute.type === 'cpu') {
    // "local" means the job ran in the API process, which only happens when a
    // remote launch was skipped or failed. Worth distinguishing.
    if (compute.location === 'droplet') return 'CPU · droplet';
    if (compute.location === 'local') return 'CPU · local';
    return 'CPU';
  }

  if (compute.type !== 'gpu') return null;

  if (!compute.model) {
    // Static slug path: we know what was requested but never resolved its
    // model or VRAM, so show the slug rather than inventing detail.
    return compute.size ? `GPU · ${compute.size}` : 'GPU';
  }

  const count =
    compute.gpu_count && compute.gpu_count > 1 ? compute.gpu_count : null;
  const name = formatModel(compute.model) + (count ? ` ×${count}` : '');
  return compute.vram_gb
    ? `${'GPU · '}${name} (${compute.vram_gb} GiB)`
    : `GPU · ${name}`;
}

interface ComputeBadgeProps {
  compute?: ComputeInfo | null;
  /** Training duration in seconds, used only for the cost estimate. */
  durationSeconds?: number | null;
}

export function ComputeBadge({ compute, durationSeconds }: ComputeBadgeProps) {
  if (!compute) return null;

  const hardware = describeCompute(compute);
  if (!hardware) return null;

  const rate = compute.price_hourly;
  const estimate =
    rate && durationSeconds ? estimateCost(rate, durationSeconds) : null;

  // The size slug and region are the operational detail; useful when tracking
  // down a specific run, noise the rest of the time.
  const tooltip = [compute.size, compute.region].filter(Boolean).join(' · ');

  return (
    <>
      <div
        className="text-xs text-gray-400 mt-0.5"
        title={tooltip || undefined}
      >
        {hardware}
      </div>
      {rate ? (
        <div className="text-xs text-gray-400 mt-0.5">
          ${rate.toFixed(2)}/hr
          {estimate ? ` · ~${estimate} this run` : ''}
        </div>
      ) : null}
    </>
  );
}
