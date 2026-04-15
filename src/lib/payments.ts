// paystack-sdk ships CommonJS; use require to avoid TS export mismatches.
const { Paystack } = require('paystack-sdk');

const paystack = new Paystack(process.env.PAYSTACK_SECRET_KEY!);

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 2500, // ₦2,500/month
    features: ['50 posts/month', '3 social platforms', 'Basic analytics'],
  },
  {
    id: 'pro',
    name: 'Professional',
    price: 7500, // ₦7,500/month
    features: ['200 posts/month', 'All platforms', 'Advanced analytics', 'Priority support'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 25000, // ₦25,000/month
    features: ['Unlimited posts', 'All platforms', 'Custom integrations', 'Dedicated support'],
  },
];

export async function createSubscription(email: string, planId: string) {
  try {
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!plan) throw new Error('Invalid plan ID');

    const transaction = await paystack.transaction.initialize({
      email,
      amount: plan.price * 100, // Paystack expects kobo
      callback_url: `${process.env.NEXTAUTH_URL}/dashboard?payment=success`,
      metadata: {
        plan_id: planId,
        custom_fields: [
          {
            display_name: 'Plan',
            variable_name: 'plan',
            value: plan.name,
          },
        ],
      },
    });

    return {
      authorization_url: transaction.data.authorization_url,
      reference: transaction.data.reference,
    };
  } catch (error) {
    console.error('Payment creation error:', error);
    throw new Error('Failed to create payment');
  }
}

export async function verifyPayment(reference: string) {
  try {
    const verification = await paystack.transaction.verify(reference);

    if (verification.data.status === 'success') {
      const planId = verification.data.metadata?.plan_id;
      // TODO: Update user's subscription in database
      return { success: true, planId };
    }

    return { success: false };
  } catch (error) {
    console.error('Payment verification error:', error);
    throw new Error('Failed to verify payment');
  }
}

export async function initializeOrderPayment(params: {
  email: string;
  amountGhs: number;
  callbackUrl: string;
  metadata?: Record<string, any>;
}) {
  try {
    const transaction = await paystack.transaction.initialize({
      email: params.email,
      amount: Math.round(params.amountGhs * 100), // Paystack expects pesewas
      currency: 'GHS',
      callback_url: params.callbackUrl,
      metadata: params.metadata ?? {},
    });

    return {
      authorization_url: transaction.data.authorization_url,
      reference: transaction.data.reference,
    };
  } catch (error) {
    console.error('Order payment initialization error:', error);
    throw new Error('Failed to initialize order payment');
  }
}

export async function verifyTransaction(reference: string) {
  try {
    const verification = await paystack.transaction.verify(reference);
    return verification.data;
  } catch (error) {
    console.error('Payment verification error:', error);
    throw new Error('Failed to verify payment');
  }
}
