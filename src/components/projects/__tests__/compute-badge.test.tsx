import { render, screen } from '@testing-library/react';
import { ComputeBadge, describeCompute, estimateCost } from '../compute-badge';

describe('describeCompute', () => {
  it('names the GPU model and its VRAM', () => {
    expect(
      describeCompute({
        type: 'gpu',
        model: 'nvidia_h100',
        gpu_count: 1,
        vram_gb: 80,
      })
    ).toBe('GPU · NVIDIA H100 (80 GiB)');
  });

  it('shows the count only when more than one GPU', () => {
    const two = describeCompute({
      type: 'gpu',
      model: 'nvidia_h100',
      gpu_count: 2,
      vram_gb: 160,
    });
    expect(two).toBe('GPU · NVIDIA H100 ×2 (160 GiB)');

    const one = describeCompute({
      type: 'gpu',
      model: 'nvidia_h100',
      gpu_count: 1,
      vram_gb: 80,
    });
    expect(one).not.toContain('×');
  });

  it('uppercases AMD as an acronym too', () => {
    expect(describeCompute({ type: 'gpu', model: 'amd_mi300x' })).toBe(
      'GPU · AMD MI300X'
    );
  });

  it('falls back to the size slug when the model was never resolved', () => {
    // The static-slug path knows what it asked for but not what it is.
    expect(describeCompute({ type: 'gpu', size: 'gpu-h100x1-80gb' })).toBe(
      'GPU · gpu-h100x1-80gb'
    );
  });

  it('distinguishes a CPU droplet from a local run', () => {
    // Both are CPU, but "droplet" means a GPU launch was attempted and failed.
    expect(describeCompute({ type: 'cpu', location: 'droplet' })).toBe(
      'CPU · droplet'
    );
    expect(describeCompute({ type: 'cpu', location: 'local' })).toBe(
      'CPU · local'
    );
    expect(describeCompute({ type: 'cpu' })).toBe('CPU');
  });

  it('returns null for missing or unrecognised compute', () => {
    expect(describeCompute({})).toBeNull();
    expect(describeCompute({ type: 'quantum' })).toBeNull();
  });
});

describe('estimateCost', () => {
  it('prorates the hourly rate over the run', () => {
    // 3m 53s of an H100 at $4.41/hr
    expect(estimateCost(4.41, 233)).toBe('$0.29');
  });

  it('floors tiny amounts rather than showing $0.00', () => {
    expect(estimateCost(4.41, 1)).toBe('<$0.01');
  });

  it('returns null when either input is missing or nonsensical', () => {
    expect(estimateCost(0, 233)).toBeNull();
    expect(estimateCost(4.41, 0)).toBeNull();
    expect(estimateCost(-1, 233)).toBeNull();
  });
});

describe('ComputeBadge', () => {
  it('renders hardware, rate and estimated cost together', () => {
    render(
      <ComputeBadge
        compute={{
          type: 'gpu',
          model: 'nvidia_h100',
          gpu_count: 1,
          vram_gb: 80,
          size: 'gpu-h100x1-80gb',
          region: 'tor1',
          price_hourly: 4.41,
        }}
        durationSeconds={233}
      />
    );

    expect(screen.getByText('GPU · NVIDIA H100 (80 GiB)')).toBeInTheDocument();
    expect(screen.getByText(/\$4\.41\/hr/)).toBeInTheDocument();
    expect(screen.getByText(/~\$0\.29 this run/)).toBeInTheDocument();
  });

  it('exposes the slug and region as a tooltip, not as clutter', () => {
    render(
      <ComputeBadge
        compute={{
          type: 'gpu',
          model: 'nvidia_h100',
          vram_gb: 80,
          size: 'gpu-h100x1-80gb',
          region: 'tor1',
        }}
      />
    );

    expect(screen.getByText('GPU · NVIDIA H100 (80 GiB)')).toHaveAttribute(
      'title',
      'gpu-h100x1-80gb · tor1'
    );
  });

  it('omits the cost line when there is no price', () => {
    render(
      <ComputeBadge
        compute={{ type: 'cpu', location: 'local' }}
        durationSeconds={233}
      />
    );

    expect(screen.getByText('CPU · local')).toBeInTheDocument();
    expect(screen.queryByText(/\/hr/)).not.toBeInTheDocument();
  });

  it('shows the rate but no estimate when the duration is unknown', () => {
    render(
      <ComputeBadge
        compute={{ type: 'gpu', model: 'nvidia_h100', price_hourly: 4.41 }}
        durationSeconds={null}
      />
    );

    expect(screen.getByText(/\$4\.41\/hr/)).toBeInTheDocument();
    expect(screen.queryByText(/this run/)).not.toBeInTheDocument();
  });

  it('renders nothing for results that predate the compute column', () => {
    // Historical jobs have no compute record and never will; the badge is
    // omitted rather than guessing what they ran on.
    const { container } = render(<ComputeBadge compute={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
