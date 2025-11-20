import { render, screen } from "@testing-library/react";
import {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
} from "../skeleton";

describe("Skeleton", () => {
  it("renders a single skeleton by default", () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.querySelector(".animate-pulse");
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass("bg-gray-200");
  });

  it("renders with full width by default", () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.querySelector(".animate-pulse");
    expect(skeleton).toHaveClass("w-full");
  });

  it("renders with custom width", () => {
    const { container } = render(<Skeleton width="200px" />);
    const skeleton = container.querySelector(".animate-pulse");
    expect(skeleton).toHaveStyle({ width: "200px" });
  });

  it("renders with custom height", () => {
    const { container } = render(<Skeleton height="32px" />);
    const skeleton = container.querySelector(".animate-pulse");
    expect(skeleton).toHaveStyle({ height: "32px" });
  });

  it("renders rectangle variant by default", () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.querySelector(".animate-pulse");
    expect(skeleton).toHaveClass("rounded-none");
  });

  it("renders rounded variant", () => {
    const { container } = render(<Skeleton variant="rounded" />);
    const skeleton = container.querySelector(".animate-pulse");
    expect(skeleton).toHaveClass("rounded");
  });

  it("renders circle variant", () => {
    const { container } = render(<Skeleton variant="circle" />);
    const skeleton = container.querySelector(".animate-pulse");
    expect(skeleton).toHaveClass("rounded-full");
  });

  it("renders multiple skeleton lines when count is provided", () => {
    const { container } = render(<Skeleton count={3} />);
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons).toHaveLength(3);
  });

  it("renders single skeleton when count is 1", () => {
    const { container } = render(<Skeleton count={1} />);
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons).toHaveLength(1);
  });

  it("applies custom className", () => {
    const { container } = render(<Skeleton className="custom-class" />);
    const skeleton = container.querySelector(".animate-pulse");
    expect(skeleton).toHaveClass("custom-class");
  });

  it("spreads additional HTML attributes", () => {
    render(<Skeleton data-testid="test-skeleton" aria-label="Loading" />);
    const skeleton = screen.getByTestId("test-skeleton");
    expect(skeleton).toHaveAttribute("aria-label", "Loading");
  });

  it("applies custom inline styles", () => {
    const { container } = render(
      <Skeleton style={{ opacity: 0.5, backgroundColor: "blue" }} />
    );
    const skeleton = container.querySelector(".animate-pulse");
    expect(skeleton).toHaveStyle({ opacity: "0.5", backgroundColor: "blue" });
  });
});

describe("SkeletonText", () => {
  it("renders 3 lines by default", () => {
    const { container } = render(<SkeletonText />);
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons).toHaveLength(3);
  });

  it("renders custom number of lines", () => {
    const { container } = render(<SkeletonText lines={5} />);
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons).toHaveLength(5);
  });

  it("renders lines with varying widths", () => {
    const { container } = render(<SkeletonText lines={3} />);
    const skeletons = container.querySelectorAll(".animate-pulse");

    // Check that lines have different widths
    const widths = Array.from(skeletons).map(
      (skeleton) => (skeleton as HTMLElement).style.width
    );

    expect(widths[0]).toBe("100%");
    expect(widths[1]).toBe("95%");
    expect(widths[2]).toBe("85%");
  });

  it("applies space between lines", () => {
    const { container } = render(<SkeletonText />);
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("space-y-2");
  });

  it("applies custom className to wrapper", () => {
    const { container } = render(<SkeletonText className="custom-class" />);
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("custom-class", "space-y-2");
  });
});

describe("SkeletonCard", () => {
  it("renders a card structure", () => {
    const { container } = render(<SkeletonCard />);
    const card = container.firstChild;
    expect(card).toHaveClass("card");
  });

  it("renders title skeleton", () => {
    const { container } = render(<SkeletonCard />);
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders description skeletons", () => {
    const { container } = render(<SkeletonCard />);
    const skeletons = container.querySelectorAll(".animate-pulse");
    // Title (1) + Description lines (2) + Footer items (2) = 5 total
    expect(skeletons).toHaveLength(5);
  });

  it("renders footer metadata skeletons", () => {
    const { container } = render(<SkeletonCard />);
    const footer = container.querySelector(".flex.items-center.gap-4");
    expect(footer).toBeInTheDocument();

    const footerSkeletons = footer?.querySelectorAll(".animate-pulse");
    expect(footerSkeletons).toHaveLength(2);
  });

  it("applies custom className", () => {
    const { container } = render(<SkeletonCard className="custom-card" />);
    const card = container.firstChild;
    expect(card).toHaveClass("custom-card", "card");
  });
});

describe("SkeletonTable", () => {
  it("renders 5 rows by default", () => {
    const { container } = render(<SkeletonTable />);
    const rows = container.querySelectorAll(".flex.items-center.gap-4");
    expect(rows).toHaveLength(5);
  });

  it("renders custom number of rows", () => {
    const { container } = render(<SkeletonTable rows={3} />);
    const rows = container.querySelectorAll(".flex.items-center.gap-4");
    expect(rows).toHaveLength(3);
  });

  it("renders 4 columns by default", () => {
    const { container } = render(<SkeletonTable />);
    const firstRow = container.querySelector(".flex.items-center.gap-4");
    const columns = firstRow?.querySelectorAll(".animate-pulse");
    expect(columns).toHaveLength(4);
  });

  it("renders custom number of columns", () => {
    const { container } = render(<SkeletonTable columns={6} />);
    const firstRow = container.querySelector(".flex.items-center.gap-4");
    const columns = firstRow?.querySelectorAll(".animate-pulse");
    expect(columns).toHaveLength(6);
  });

  it("renders first column wider than others", () => {
    const { container } = render(<SkeletonTable />);
    const firstRow = container.querySelector(".flex.items-center.gap-4");
    const columns = firstRow?.querySelectorAll(".animate-pulse");

    if (columns) {
      const firstColWidth = (columns[0] as HTMLElement).style.width;
      const secondColWidth = (columns[1] as HTMLElement).style.width;

      expect(firstColWidth).toBe("30%");
      expect(secondColWidth).toBe("20%");
    }
  });

  it("applies custom className to wrapper", () => {
    const { container } = render(<SkeletonTable className="custom-table" />);
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("custom-table", "space-y-3");
  });

  it("renders correct total number of skeletons", () => {
    const rows = 3;
    const columns = 5;
    const { container } = render(
      <SkeletonTable rows={rows} columns={columns} />
    );
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons).toHaveLength(rows * columns);
  });
});
