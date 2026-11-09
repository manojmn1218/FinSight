/**
 * Razorpay Payment SDK Client Integration for FinSight
 * Handles script lazy-loading, modal launching, and lifecycle callbacks.
 */

export interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface RazorpayCheckoutOptions {
  keyId: string;
  orderId: string;
  amount: number; // in paise
  currency?: string;
  planName: string;
  billingCycle: 'monthly' | 'yearly';
  userProfile?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  themeColor?: string;
  onSuccess: (response: RazorpaySuccessResponse) => void;
  onDismiss?: () => void;
  onError?: (error: any) => void;
}

/**
 * Loads Razorpay's checkout.js dynamically if not already injected.
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if ((window as any).Razorpay) return resolve(true);

    // Check if script element is already added
    const existing = document.querySelector('script[src*="checkout.razorpay.com"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error('[Razorpay] Failed to load checkout script from Razorpay CDN.');
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

/**
 * Launches the native Razorpay Checkout payment gateway modal.
 */
export async function launchRazorpayCheckout(options: RazorpayCheckoutOptions): Promise<void> {
  const loaded = await loadRazorpayScript();
  if (!loaded || !(window as any).Razorpay) {
    throw new Error('Razorpay SDK could not be loaded. Please ensure you are online and try again.');
  }

  const rzpOptions = {
    key: options.keyId,
    amount: options.amount,
    currency: options.currency || 'INR',
    name: 'FinSight Technologies Inc.',
    description: `FinSight ${options.planName} Plan (${options.billingCycle})`,
    order_id: options.orderId,
    handler: function (response: RazorpaySuccessResponse) {
      options.onSuccess(response);
    },
    prefill: {
      name: options.userProfile?.name || '',
      email: options.userProfile?.email || '',
      contact: options.userProfile?.phone || '',
    },
    notes: {
      plan: options.planName,
      cycle: options.billingCycle,
      service: 'FinSight Financial Platform',
    },
    theme: {
      color: options.themeColor || '#ea580c', // Diego A. luxury editorial burnt orange
    },
    modal: {
      backdropclose: false,
      escape: true,
      handleback: true,
      confirm_close: true,
      ondismiss: function () {
        if (options.onDismiss) {
          options.onDismiss();
        }
      },
    },
  };

  const instance = new (window as any).Razorpay(rzpOptions);

  if (options.onError) {
    instance.on('payment.failed', function (res: any) {
      options.onError?.(res.error || res);
    });
  }

  instance.open();
}

