"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            backgroundColor: "#fafafa",
            textAlign: "center",
            padding: "0 16px",
            fontFamily:
              'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ marginBottom: 24 }}
          >
            <rect x="3" y="3" width="3" height="18" rx="0.5" fill="#1a1a1a" />
            <rect x="3" y="3" width="18" height="3" rx="0.5" fill="#1a1a1a" />
            <rect x="18" y="3" width="3" height="10" rx="0.5" fill="#1a1a1a" />
            <rect x="10" y="9" width="2.5" height="12" rx="0.5" fill="#1a1a1a" />
          </svg>

          <h2
            style={{
              fontSize: "2.125rem",
              fontWeight: 600,
              margin: "0 0 8px",
              color: "#1a1a1a",
            }}
          >
            Something went wrong
          </h2>

          <p
            style={{
              fontSize: "0.95rem",
              color: "#666",
              margin: "0 0 24px",
            }}
          >
            An unexpected error occurred.
          </p>

          <button
            onClick={reset}
            style={{
              backgroundColor: "#1a1a1a",
              color: "#fafafa",
              border: "none",
              padding: "8px 24px",
              borderRadius: 8,
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
