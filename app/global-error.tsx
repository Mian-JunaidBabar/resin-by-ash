"use client";

import Link from "next/link";

/**
 * Last-resort boundary: this replaces the root layout, so it ships its own
 * html/body and inline colours rather than relying on globals.css.
 */
export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#FBF8F3", color: "#4A3428", fontFamily: "Georgia, serif" }}>
        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 18,
            padding: 24,
            textAlign: "center",
          }}
        >
          <span style={{ fontSize: 12, letterSpacing: ".16em", textTransform: "uppercase", color: "#A98A6D" }}>
            Resin by Ash
          </span>
          <h1 style={{ margin: 0, fontSize: 42, lineHeight: 1.05, fontWeight: 500 }}>The studio needs a moment.</h1>
          <p style={{ margin: 0, maxWidth: 460, fontSize: 15, lineHeight: 1.65, fontFamily: "system-ui, sans-serif" }}>
            Something went wrong before the page could load. Try again in a moment.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              minHeight: 48,
              border: 0,
              borderRadius: 12,
              background: "#A9714B",
              color: "#fff",
              padding: "0 22px",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          <Link href="/" style={{ color: "#4A3428", fontFamily: "system-ui, sans-serif", fontSize: 14 }}>
            Back to resinbyash.pk
          </Link>
        </main>
      </body>
    </html>
  );
}
