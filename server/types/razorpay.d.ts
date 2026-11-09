declare module 'razorpay' {
  interface RazorpayConfig {
    key_id: string;
    key_secret: string;
  }

  interface OrderCreateArgs {
    amount: number;
    currency: string;
    receipt?: string;
    notes?: Record<string, any>;
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
    notes: Record<string, any>;
    created_at: number;
  }

  interface OrdersAPI {
    create(args: OrderCreateArgs): Promise<RazorpayOrder>;
    fetch(orderId: string): Promise<RazorpayOrder>;
  }

  interface PaymentsAPI {
    fetch(paymentId: string): Promise<any>;
    capture(paymentId: string, amount: number, currency: string): Promise<any>;
  }

  class Razorpay {
    constructor(config: RazorpayConfig);
    orders: OrdersAPI;
    payments: PaymentsAPI;
  }

  export default Razorpay;
}

