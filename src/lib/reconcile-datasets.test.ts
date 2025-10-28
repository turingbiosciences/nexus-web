import { reconcileDatasets } from "./reconcile-datasets";

interface TestDataset {
  id: string;
  filename: string;
  size: number;
  uploadedAt: Date;
}

type PartialTestDataset = Partial<TestDataset> & { id: string };

describe("reconcileDatasets", () => {
  const now = Date.now();
  const mk = (p: PartialTestDataset): TestDataset => ({
    id: p.id,
    filename: p.filename ?? "file.txt",
    size: p.size ?? 100,
    uploadedAt: p.uploadedAt ?? new Date(now),
  });

  it("returns remote when no optimistic", () => {
    const remote = [mk({ id: "r1" }), mk({ id: "r2" })];
    expect(reconcileDatasets({ remote })).toEqual(remote);
  });

  it("appends unmatched optimistic placeholders", () => {
    const remote = [mk({ id: "r1", filename: "a", size: 1 })];
    const optimistic = [mk({ id: "optimistic-x", filename: "b", size: 2 })];
    const result = reconcileDatasets({ remote, optimistic });
    expect(result.map((d) => d.id)).toEqual(["r1", "optimistic-x"]);
  });

  it("does not duplicate when signature matches within 10s window", () => {
    const remote = [
      mk({ id: "r1", filename: "a", size: 1, uploadedAt: new Date(now) }),
    ];
    const optimistic = [
      mk({
        id: "optimistic-x",
        filename: "a",
        size: 1,
        uploadedAt: new Date(now + 2000),
      }),
    ];
    const result = reconcileDatasets({ remote, optimistic });
    expect(result.length).toBe(1);
    expect(result[0].id).toBe("r1");
  });

  it("keeps optimistic when timestamp drift >10s", () => {
    const remote = [
      mk({ id: "r1", filename: "a", size: 1, uploadedAt: new Date(now) }),
    ];
    const optimistic = [
      mk({
        id: "optimistic-x",
        filename: "a",
        size: 1,
        uploadedAt: new Date(now + 11_000),
      }),
    ];
    const result = reconcileDatasets({ remote, optimistic });
    expect(result.map((d) => d.id)).toEqual(["r1", "optimistic-x"]);
  });

  it("filters pendingDeleteIds from both remote and optimistic", () => {
    const remote = [mk({ id: "r1", filename: "a", size: 1 })];
    const optimistic = [mk({ id: "optimistic-x", filename: "b", size: 2 })];
    const result = reconcileDatasets({
      remote,
      optimistic,
      pendingDeleteIds: ["r1", "optimistic-x"],
    });
    expect(result).toEqual([]);
  });
});
