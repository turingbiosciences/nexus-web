import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider, useToast } from "../toast-provider";

// Test component that uses the toast hook
function TestComponent() {
  const { toasts, push, dismiss } = useToast();

  return (
    <div>
      <button onClick={() => push({ title: "Test Toast" })}>Show Toast</button>
      <button
        onClick={() =>
          push({
            title: "Error Toast",
            description: "Something went wrong",
            variant: "destructive",
          })
        }
      >
        Show Error
      </button>
      <button
        onClick={() => push({ title: "Custom Duration", duration: 1000 })}
      >
        Show Custom Duration
      </button>
      <button onClick={() => push({ title: "No Auto Dismiss", duration: 0 })}>
        Show No Auto Dismiss
      </button>
      {toasts.map((toast) => (
        <div key={toast.id} data-testid={`toast-${toast.id}`}>
          <button onClick={() => dismiss(toast.id)}>Dismiss {toast.id}</button>
        </div>
      ))}
    </div>
  );
}

describe("ToastProvider", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it("renders children correctly", () => {
    render(
      <ToastProvider>
        <div>Test Content</div>
      </ToastProvider>
    );
    expect(screen.getByText(/test content/i)).toBeInTheDocument();
  });

  it("shows toast when push is called", async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const button = screen.getByRole("button", { name: /show toast/i });
    await user.click(button);

    expect(screen.getByText(/test toast/i)).toBeInTheDocument();
  });

  it("shows toast with description", async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const button = screen.getByRole("button", { name: /show error/i });
    await user.click(button);

    expect(screen.getByText(/error toast/i)).toBeInTheDocument();
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it("applies destructive variant styling", async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const button = screen.getByRole("button", { name: /show error/i });
    await user.click(button);

    const toast = screen.getByRole("status");
    expect(toast).toHaveClass("border-red-300");
    expect(toast).toHaveClass("bg-red-50");
    expect(toast).toHaveClass("text-red-800");
  });

  it("applies default variant styling", async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const button = screen.getByRole("button", { name: /show toast/i });
    await user.click(button);

    const toast = screen.getByRole("status");
    expect(toast).toHaveClass("bg-white");
    expect(toast).not.toHaveClass("border-red-300");
  });

  it("auto-dismisses toast after default duration", async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const button = screen.getByRole("button", { name: /show toast/i });
    await user.click(button);

    expect(screen.getByText(/test toast/i)).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(screen.queryByText(/test toast/i)).not.toBeInTheDocument();
    });
  });

  it("auto-dismisses toast after custom duration", async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const button = screen.getByRole("button", {
      name: /show custom duration/i,
    });
    await user.click(button);

    expect(screen.getByRole("status")).toHaveTextContent(/custom duration/i);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });
  });

  it("cancels auto-dismiss timer when manually dismissed early", async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    // Push a toast with short custom duration
    const customButton = screen.getByRole("button", {
      name: /show custom duration/i,
    });
    await user.click(customButton);
    expect(screen.getByRole("status")).toHaveTextContent(/custom duration/i);

    // Manually dismiss immediately
    const dismissButton = screen.getByRole("button", {
      name: /dismiss notification/i,
    });
    await user.click(dismissButton);

    await waitFor(() => {
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    // Advance timers beyond original duration; toast should not reappear
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("does not auto-dismiss when duration is 0", async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const button = screen.getByRole("button", {
      name: /show no auto dismiss/i,
    });
    await user.click(button);

    expect(screen.getByRole("status")).toHaveTextContent(/no auto dismiss/i);

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    // Should still be present
    expect(screen.getByRole("status")).toHaveTextContent(/no auto dismiss/i);
  });

  it("manually dismisses toast when dismiss button is clicked", async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const showButton = screen.getByRole("button", { name: /show toast/i });
    await user.click(showButton);

    const toast = screen.getByText(/test toast/i);
    expect(toast).toBeInTheDocument();

    const dismissButton = screen.getByRole("button", {
      name: /dismiss notification/i,
    });
    await user.click(dismissButton);

    await waitFor(() => {
      expect(screen.queryByText(/test toast/i)).not.toBeInTheDocument();
    });
  });

  it("shows multiple toasts at once", async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const showButton = screen.getByRole("button", { name: /show toast/i });
    const errorButton = screen.getByRole("button", { name: /show error/i });

    await user.click(showButton);
    await user.click(errorButton);

    expect(screen.getByText(/test toast/i)).toBeInTheDocument();
    expect(screen.getByText(/error toast/i)).toBeInTheDocument();
  });

  it("returns unique toast ID from push", async () => {
    const user = userEvent.setup({ delay: null });

    let toastId1: string | undefined;
    let toastId2: string | undefined;

    function TestIdComponent() {
      const { push } = useToast();
      return (
        <div>
          <button
            onClick={() => {
              toastId1 = push({ title: "Toast 1" });
            }}
          >
            Show Toast 1
          </button>
          <button
            onClick={() => {
              toastId2 = push({ title: "Toast 2" });
            }}
          >
            Show Toast 2
          </button>
        </div>
      );
    }

    render(
      <ToastProvider>
        <TestIdComponent />
      </ToastProvider>
    );

    await user.click(screen.getByRole("button", { name: /show toast 1/i }));
    await user.click(screen.getByRole("button", { name: /show toast 2/i }));

    expect(toastId1).toBeDefined();
    expect(toastId2).toBeDefined();
    expect(toastId1).not.toBe(toastId2);
  });

  it("has correct ARIA role for accessibility", async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const button = screen.getByRole("button", { name: /show toast/i });
    await user.click(button);

    const toast = screen.getByRole("status");
    expect(toast).toBeInTheDocument();
  });

  it("throws error when useToast is used outside provider", () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    function BadComponent() {
      useToast();
      return <div>Bad</div>;
    }

    expect(() => {
      render(<BadComponent />);
    }).toThrow("useToast must be used within <ToastProvider>");

    consoleSpy.mockRestore();
  });
});
