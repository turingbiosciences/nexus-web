"use client";

interface SignInPromptProps {
  title?: string;
  message?: string;
  buttonText?: string;
  signInUrl?: string;
}

export function SignInPrompt({
  title = "Sign in Required",
  message = "Please sign in to access the file upload dashboard",
  buttonText = "Sign In",
  signInUrl = "/api/logto/sign-in",
}: SignInPromptProps) {
  return (
    <div className="alert-info p-8 text-center">
      <svg
        className="h-16 w-16 text-blue-400 mx-auto mb-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
      </svg>
      <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6">{message}</p>
      <a href={signInUrl} className="btn-primary px-6 py-3">
        {buttonText}
      </a>
    </div>
  );
}
