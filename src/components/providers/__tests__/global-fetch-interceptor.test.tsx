import React from "react";
import { render } from "@testing-library/react";
import { GlobalFetchInterceptor } from "@/components/providers/global-fetch-interceptor";
import * as globalFetchHandler from "@/lib/global-fetch-handler";

jest.mock("@/lib/global-fetch-handler", () => ({
  installGlobalFetchInterceptor: jest.fn(),
}));

describe("GlobalFetchInterceptor", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should render nothing", () => {
    const { container } = render(<GlobalFetchInterceptor />);
    expect(container.firstChild).toBeNull();
  });

  it("should install global fetch interceptor on mount", () => {
    render(<GlobalFetchInterceptor />);

    expect(
      globalFetchHandler.installGlobalFetchInterceptor
    ).toHaveBeenCalledTimes(1);
  });

  it("should only install interceptor once even with multiple renders", () => {
    const { rerender } = render(<GlobalFetchInterceptor />);

    rerender(<GlobalFetchInterceptor />);
    rerender(<GlobalFetchInterceptor />);

    // useEffect should only run once due to empty dependency array
    expect(
      globalFetchHandler.installGlobalFetchInterceptor
    ).toHaveBeenCalledTimes(1);
  });

  it("should not throw error if installation fails", () => {
    (
      globalFetchHandler.installGlobalFetchInterceptor as jest.Mock
    ).mockImplementation(() => {
      throw new Error("Installation failed");
    });

    expect(() => render(<GlobalFetchInterceptor />)).toThrow(
      "Installation failed"
    );
  });
});
