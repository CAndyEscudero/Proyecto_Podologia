import { useEffect } from "react";
import { env } from "../../app/config/env";

const RECENT_ERROR_KEYS = new Map<string, number>();
const DEDUP_WINDOW_MS = 30_000;

function buildErrorKey(message: string, source: string | null, pathname: string): string {
  return `${message}::${source || "unknown"}::${pathname}`;
}

function shouldSendError(key: string): boolean {
  const now = Date.now();
  const lastSentAt = RECENT_ERROR_KEYS.get(key) || 0;

  if (now - lastSentAt < DEDUP_WINDOW_MS) {
    return false;
  }

  RECENT_ERROR_KEYS.set(key, now);
  return true;
}

async function postFrontendError(payload: Record<string, unknown>) {
  try {
    await fetch(`${env.apiUrl}/observability/frontend-errors`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-host": window.location.host,
      },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // Silencioso a propósito para no generar loops de errores.
  }
}

function reportFrontendError({
  message,
  source,
  severity,
  stack,
}: {
  message: string;
  source?: string | null;
  severity?: "info" | "warn" | "error";
  stack?: string | null;
}) {
  if (typeof window === "undefined") {
    return;
  }

  const pathname = window.location.pathname;
  const key = buildErrorKey(message, source || null, pathname);

  if (!shouldSendError(key)) {
    return;
  }

  void postFrontendError({
    message,
    source: source || null,
    severity: severity || "error",
    pathname,
    href: window.location.href,
    stack: stack || null,
    userAgent: navigator.userAgent,
  });
}

export function FrontendErrorReporter() {
  useEffect(() => {
    if (!env.frontendErrorLoggingEnabled) {
      return undefined;
    }

    function handleWindowError(event: ErrorEvent) {
      reportFrontendError({
        message: event.message || "Unhandled window error",
        source: event.filename || "window.error",
        severity: "error",
        stack: event.error?.stack || null,
      });
    }

    function handleUnhandledRejection(event: PromiseRejectionEvent) {
      const reason =
        typeof event.reason === "string"
          ? event.reason
          : event.reason?.message || "Unhandled promise rejection";

      reportFrontendError({
        message: reason,
        source: "unhandledrejection",
        severity: "error",
        stack: event.reason?.stack || null,
      });
    }

    window.addEventListener("error", handleWindowError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleWindowError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  return null;
}
