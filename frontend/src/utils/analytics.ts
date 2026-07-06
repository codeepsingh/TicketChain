/**
 * TicketChain Analytics — Google Analytics 4
 *
 * Wraps all GA4 gtag calls with TypeScript type safety.
 * Silently no-ops if GA4 is not loaded (dev mode / blocked).
 *
 * Measurement ID is read from VITE_GA4_MEASUREMENT_ID env var.
 * If not present, analytics are disabled gracefully.
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

const MEASUREMENT_ID = (import.meta as any).env?.VITE_GA4_MEASUREMENT_ID || '';

const isEnabled = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.gtag === 'function' &&
  !!MEASUREMENT_ID;

// ─── Core helpers ─────────────────────────────────────────────────────────────

/**
 * Track a custom GA4 event.
 */
export const trackEvent = (
  eventName: string,
  params?: Record<string, string | number | boolean | null>
): void => {
  if (!isEnabled()) {
    console.debug('[Analytics]', eventName, params);
    return;
  }
  try {
    window.gtag!('event', eventName, {
      ...params,
      app_name: 'TicketChain',
      network: 'stellar_testnet',
    });
  } catch (err) {
    console.warn('[Analytics] trackEvent failed:', err);
  }
};

/**
 * Track a page view (call on every route change).
 */
export const trackPageView = (pagePath: string, pageTitle?: string): void => {
  if (!isEnabled()) {
    console.debug('[Analytics] page_view', pagePath);
    return;
  }
  try {
    window.gtag!('event', 'page_view', {
      page_path: pagePath,
      page_title: pageTitle || document.title,
      page_location: window.location.href,
    });
  } catch (err) {
    console.warn('[Analytics] trackPageView failed:', err);
  }
};

// ─── Wallet Events ─────────────────────────────────────────────────────────────

export const trackWalletConnected = (walletAddress: string, walletType: string): void => {
  trackEvent('wallet_connected', {
    wallet_type: walletType,
    wallet_address_prefix: walletAddress.slice(0, 8),
  });
};

export const trackWalletDisconnected = (): void => {
  trackEvent('wallet_disconnected');
};

// ─── Event / Ticket Events ─────────────────────────────────────────────────────

export const trackEventCreated = (
  eventName: string,
  ticketPrice: number,
  maxTickets: number,
  txHash?: string
): void => {
  trackEvent('event_created', {
    event_name: eventName,
    ticket_price_xlm: ticketPrice,
    max_tickets: maxTickets,
    tx_hash: txHash || null,
  });
};

export const trackTicketPurchased = (
  eventId: number,
  quantity: number,
  totalCostXlm: number,
  txHash?: string
): void => {
  trackEvent('ticket_purchased', {
    event_id: eventId,
    quantity,
    total_cost_xlm: totalCostXlm,
    tx_hash: txHash || null,
  });
};

export const trackTicketTransferred = (ticketId: number, txHash?: string): void => {
  trackEvent('ticket_transferred', {
    ticket_id: ticketId,
    tx_hash: txHash || null,
  });
};

export const trackTicketVerified = (ticketId: number, txHash?: string): void => {
  trackEvent('ticket_verified', {
    ticket_id: ticketId,
    tx_hash: txHash || null,
  });
};

export const trackEventCancelled = (eventId: number, txHash?: string): void => {
  trackEvent('event_cancelled', {
    event_id: eventId,
    tx_hash: txHash || null,
  });
};

export const trackEventCompleted = (eventId: number, txHash?: string): void => {
  trackEvent('event_completed', {
    event_id: eventId,
    tx_hash: txHash || null,
  });
};

export const trackRefundClaimed = (eventId: number, ticketId: number, txHash?: string): void => {
  trackEvent('refund_claimed', {
    event_id: eventId,
    ticket_id: ticketId,
    tx_hash: txHash || null,
  });
};

// ─── Transaction Status ────────────────────────────────────────────────────────

export const trackTransactionSuccess = (label: string, txHash: string): void => {
  trackEvent('transaction_success', {
    transaction_label: label,
    tx_hash: txHash,
  });
};

export const trackTransactionFailed = (label: string, errorMessage: string): void => {
  trackEvent('transaction_failed', {
    transaction_label: label,
    error_message: errorMessage.slice(0, 200), // GA4 param limit
  });
};

// ─── Dashboard / UX Events ────────────────────────────────────────────────────

export const trackDashboardViewed = (dashboardType: 'organizer' | 'user'): void => {
  trackEvent('dashboard_viewed', { dashboard_type: dashboardType });
};

export const trackGateScannerOpened = (): void => {
  trackEvent('gate_scanner_opened');
};

export const trackFeedbackFormOpened = (): void => {
  trackEvent('feedback_form_opened');
};

// ─── Error Events ─────────────────────────────────────────────────────────────

export const trackError = (
  errorType: 'wallet' | 'contract' | 'network' | 'simulation' | 'unknown',
  message: string
): void => {
  trackEvent('app_error', {
    error_type: errorType,
    error_message: message.slice(0, 200),
  });
};
