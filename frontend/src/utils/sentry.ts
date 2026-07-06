/**
 * TicketChain Sentry — Error & Performance Monitoring
 *
 * Wraps Sentry calls safely. If @sentry/react is not installed,
 * falls back to console.error gracefully so the app never breaks.
 *
 * DSN is read from VITE_SENTRY_DSN env var.
 */

// ─── Sentry type stubs (avoids hard dependency if not installed) ───────────────

type SentryScope = {
  setTag: (key: string, value: string) => void;
  setExtra: (key: string, value: any) => void;
};

interface SentrySDK {
  init: (config: Record<string, any>) => void;
  captureException: (error: Error | unknown, context?: Record<string, any>) => void;
  captureMessage: (message: string, level?: string) => void;
  withScope: (callback: (scope: SentryScope) => void) => void;
  setUser: (user: { id: string; username?: string } | null) => void;
  addBreadcrumb: (breadcrumb: {
    message: string;
    category?: string;
    level?: string;
    data?: Record<string, any>;
  }) => void;
}

// Try to load Sentry at runtime
let Sentry: SentrySDK | null = null;
try {
  // Dynamic import — will succeed if @sentry/react is installed
  Sentry = require('@sentry/react') as SentrySDK;
} catch {
  // @sentry/react not installed — monitoring gracefully disabled
  console.info('[Sentry] SDK not installed. Error monitoring disabled. Run: npm install @sentry/react');
}

const DSN = (import.meta as any).env?.VITE_SENTRY_DSN || '';

// ─── Initialise ───────────────────────────────────────────────────────────────

/**
 * Call once in main.tsx before rendering the React tree.
 */
export const initSentry = (): void => {
  if (!Sentry || !DSN) {
    console.info('[Sentry] Not initialised (DSN missing or SDK not installed).');
    return;
  }

  try {
    Sentry.init({
      dsn: DSN,
      environment: (import.meta as any).env?.MODE || 'production',
      release: 'ticketchain@1.0.0',
      tracesSampleRate: 1.0,
      replaysOnErrorSampleRate: 1.0,
      ignoreErrors: [
        // Freighter wallet user rejections — not real errors
        'User rejected',
        'user rejected',
        'Transaction rejected',
      ],
    });
    console.info('[Sentry] Initialised successfully.');
  } catch (err) {
    console.warn('[Sentry] Init failed:', err);
  }
};

// ─── Error Capture ────────────────────────────────────────────────────────────

/**
 * Capture a runtime exception with optional context tags.
 */
export const captureException = (
  error: Error | unknown,
  context?: {
    tag?: string;
    contractMethod?: string;
    walletAddress?: string;
    contractId?: string;
    extra?: Record<string, any>;
  }
): void => {
  console.error('[Error]', error);

  if (!Sentry) return;

  try {
    Sentry.withScope((scope) => {
      if (context?.tag) scope.setTag('area', context.tag);
      if (context?.contractMethod) scope.setTag('contract_method', context.contractMethod);
      if (context?.walletAddress) scope.setTag('wallet_prefix', context.walletAddress.slice(0, 8));
      if (context?.contractId) scope.setTag('contract_id', context.contractId.slice(0, 8));
      if (context?.extra) {
        Object.entries(context.extra).forEach(([k, v]) => scope.setExtra(k, v));
      }
    });
    Sentry.captureException(error);
  } catch (sentryErr) {
    console.warn('[Sentry] captureException failed:', sentryErr);
  }
};

/**
 * Capture a non-fatal warning message.
 */
export const captureMessage = (message: string, level: 'info' | 'warning' | 'error' = 'info'): void => {
  console.warn(`[Sentry Message][${level}]`, message);
  if (!Sentry) return;
  try {
    Sentry.captureMessage(message, level);
  } catch (err) {
    console.warn('[Sentry] captureMessage failed:', err);
  }
};

// ─── User Context ─────────────────────────────────────────────────────────────

/**
 * Set the authenticated wallet address as the Sentry user context.
 */
export const setSentryUser = (walletAddress: string | null): void => {
  if (!Sentry) return;
  try {
    if (walletAddress) {
      Sentry.setUser({ id: walletAddress, username: walletAddress.slice(0, 10) + '...' });
    } else {
      Sentry.setUser(null);
    }
  } catch (err) {
    console.warn('[Sentry] setUser failed:', err);
  }
};

// ─── Breadcrumbs ──────────────────────────────────────────────────────────────

/**
 * Add a breadcrumb for debugging context before errors.
 */
export const addBreadcrumb = (
  message: string,
  category: 'wallet' | 'contract' | 'navigation' | 'ui' | 'network' = 'ui',
  data?: Record<string, any>
): void => {
  if (!Sentry) return;
  try {
    Sentry.addBreadcrumb({ message, category, level: 'info', data });
  } catch (err) {
    console.warn('[Sentry] addBreadcrumb failed:', err);
  }
};

// ─── Domain-specific helpers ──────────────────────────────────────────────────

export const captureWalletError = (error: unknown, walletAddress?: string): void => {
  captureException(error, { tag: 'wallet', walletAddress });
};

export const captureContractError = (
  error: unknown,
  method: string,
  contractId?: string,
  walletAddress?: string
): void => {
  captureException(error, {
    tag: 'contract',
    contractMethod: method,
    contractId,
    walletAddress,
  });
};

export const captureNetworkError = (error: unknown, endpoint?: string): void => {
  captureException(error, { tag: 'network', extra: { endpoint } });
};

export const captureSimulationError = (error: unknown, method: string): void => {
  captureException(error, { tag: 'simulation', contractMethod: method });
};
