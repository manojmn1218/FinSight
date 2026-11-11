declare module 'razorpay' {
  interface RazorpayConfig {
    key_id: string;
    key_secret: string;
  }

  interface OrderCreateArgs {
    amount: number;
    currency: string;
    receipt?: string;
    notes?: Record<string, string | number | boolean | null | undefined>;
    partial_payment?: boolean;
  }

  interface RazorpayOrder {
    id: string;
    entity: string;
    amount: number;
    amount_paid: number;
    amount_due: number;
    currency: string;
    receipt: string;
    status: string;
    attempts: number;
    notes: Record<string, string | number | boolean | null | undefined>;
    created_at: number;
  }

  interface OrdersAPI {
    create(args: OrderCreateArgs): Promise<RazorpayOrder>;
    fetch(orderId: string): Promise<RazorpayOrder>;
  }

  interface PaymentsAPI {
    fetch(paymentId: string): Promise<Record<string, unknown>>;
    capture(paymentId: string, amount: number, currency: string): Promise<Record<string, unknown>>;
  }

  class Razorpay {
    constructor(config: RazorpayConfig);
    orders: OrdersAPI;
    payments: PaymentsAPI;
  }

  export default Razorpay;
}

