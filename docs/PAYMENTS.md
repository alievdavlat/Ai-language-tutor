# Payments & monetization pipeline (#32)

Covers course purchase/enroll checkout, subscriptions, tips, teacher payouts,
and referrals. The model lives in `shared/types/studio.types.ts`; the local
pipeline is in `services/studio/store.ts` (`checkout`, `tip`, `requestPayout`,
`getReferral`, balances). The teacher *Monetization* page reads it live.

## Provider choice — Uzbekistan / region constraints

International card rails (Stripe, PayPal) are **not reliably usable** by teachers
or students in Uzbekistan and much of Central Asia: PayPal does not support
receiving money in UZ, and Stripe has no UZ entity. So the pipeline treats the
local rails as first-class:

| Provider | Region | Use |
|----------|--------|-----|
| **Payme** (paycom) | 🇺🇿 Uzbekistan | Primary — cards (UzCard/Humo), wallet. Merchant API + checkout. |
| **Click** | 🇺🇿 Uzbekistan | Primary alternative — `click.uz` Merchant API, SHOP-API. |
| **Stripe** | 🌍 Global | Rest-of-world cards & subscriptions. |
| **PayPal** | 🌍 Global | Rest-of-world one-off. |

Recommended default: **detect region** → UZ users see Payme/Click first;
everyone else sees Stripe. Payouts to teachers follow the same split (Payme/Click
card transfer in UZ; Stripe Connect / PayPal Payouts elsewhere).

## Flow (current local implementation)

```
Course → Checkout(provider) → Order{status:'paid'}  (mock instant capture)
                                   │
                ├─ enroll buyer (shared backend)
                ├─ subscription kind → Subscription row
                ├─ referral code → credit owner
                └─ credit teacher pending balance (14-day clearing → available)
Teacher → Withdraw → Payout{status:'requested'}
```

`checkout()` records intent and *mock-captures* immediately so the UI is fully
functional offline. Real capture is a provider webhook (see below).

## Wiring real providers

1. **Create payment intent** server-side (never expose secret keys to the
   renderer). For Payme/Click this is the Merchant API "create transaction"; for
   Stripe a PaymentIntent / Checkout Session.
2. **Redirect / embed** the provider checkout.
3. **Webhook** → on `paid`, set the `Order.status = 'paid'`, enroll the buyer,
   credit the teacher. Replace the optimistic capture in `studio.checkout`.
4. **Payouts** → `requestPayout` becomes a provider payout/transfer call; update
   `Payout.status` from the payout webhook.

### Required environment (when going live)

```ini
# Payme (Uzbekistan)
PAYME_MERCHANT_ID=...
PAYME_SECRET_KEY=...
# Click (Uzbekistan)
CLICK_MERCHANT_ID=...
CLICK_SERVICE_ID=...
CLICK_SECRET_KEY=...
# Stripe (global)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Keep all secret keys on the server / Electron main — only publishable keys may
reach the renderer.

## Referrals

Each teacher gets a code (`REF-XXXX`). Applying it at checkout increments the
owner's `conversions`; credit `rewardUsd` to their balance on the paid webhook.
