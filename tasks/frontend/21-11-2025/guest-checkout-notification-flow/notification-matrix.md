# Notification Matrix - Quick Reference Guide

**Task:** Guest Checkout & Notification Flow  
**Date:** 21 November 2025

---

## 📋 Complete Notification Event Matrix

### Legend

**Channels:**
- 🔔 Browser Push Notification
- 📱 WhatsApp Message
- 📧 Email

**Priority:**
- 🔴 High (critical, time-sensitive)
- 🟡 Medium (important, not urgent)
- 🟢 Low (informational, can be batched)

---

## Order Lifecycle Events

### 1. ORDER_CREATED_DP
**When:** Guest completes DP checkout  
**Status Trigger:** Order created with status `pending_validation`

| Channel | Send? | Priority | Timing | Template ID |
|---------|-------|----------|--------|-------------|
| 🔔 Push | ✅ Yes | 🔴 High | Immediate | `order_created_push` |
| 📱 WhatsApp | ✅ Yes | 🔴 High | Immediate | `order_confirmation_dp` |
| 📧 Email | ✅ Yes | 🟡 Medium | Immediate | `order_confirmation_email` |

**Content:**
- Order ID
- DP amount paid
- Product list
- Next steps (validation in 1-2 days)
- Jastiper contact info

---

### 2. ORDER_VALIDATED
**When:** Jastiper validates and approves order  
**Status Trigger:** Order status → `validated`

| Channel | Send? | Priority | Timing | Template ID |
|---------|-------|----------|--------|-------------|
| 🔔 Push | ✅ Yes | 🔴 High | Immediate | `order_validated_push` |
| 📱 WhatsApp | ✅ Yes | 🔴 High | Immediate | `order_validated_wa` |
| 📧 Email | ✅ Yes | 🟡 Medium | Immediate | `order_validated_email` |

**Content:**
- Validation confirmation
- Total amount
- Remaining payment amount
- Payment link
- Payment deadline

---

### 3. PAYMENT_LINK_SENT (UPLOAD PROOF REQUEST)
**When:** System generates payment link for remaining amount  
**Status Trigger:** Invoice created after validation

| Channel | Send? | Priority | Timing | Template ID |
|---------|-------|----------|--------|-------------|
| 🔔 Push | ✅ Yes | 🔴 High | Immediate | `upload_proof_push` |
| 📱 WhatsApp | ✅ Yes | 🔴 High | Immediate | `payment_link_wa` |
| 📧 Email | ✅ Yes | 🟡 Medium | Immediate | `payment_link_email` |

**Content:**
- **Magic Link**: Secure link to upload proof (`/order/upload/[token]`)
- Amount due
- Deadline
- Payment methods accepted

---

### 4. PAYMENT_REMINDER_24H
**When:** 24 hours before payment deadline  
**Status Trigger:** Scheduled job checks unpaid invoices

| Channel | Send? | Priority | Timing | Template ID |
|---------|-------|----------|--------|-------------|
| 🔔 Push | ❌ No | - | - | - |
| 📱 WhatsApp | ✅ Yes | 🔴 High | 24h before | `payment_reminder_24h` |
| 📧 Email | ✅ Yes | 🟡 Medium | 24h before | `payment_reminder_email` |

**Content:**
- Friendly reminder
- Amount due
- Hours remaining
- Payment link
- Late payment consequences

---

### 5. PAYMENT_REMINDER_3H
**When:** 3 hours before payment deadline (urgent)  
**Status Trigger:** Scheduled job (last reminder)

| Channel | Send? | Priority | Timing | Template ID |
|---------|-------|----------|--------|-------------|
| 🔔 Push | ✅ Yes | 🔴 High | 3h before | `payment_reminder_urgent_push` |
| 📱 WhatsApp | ✅ Yes | 🔴 High | 3h before | `payment_reminder_urgent_wa` |
| 📧 Email | ❌ No | - | - | - |

**Content:**
- **URGENT** tone
- Final reminder
- Amount due
- Hours remaining
- Direct payment link

---

### 6. PAYMENT_RECEIVED
**When:** Full payment confirmed  
**Status Trigger:** Payment status → `paid`

| Channel | Send? | Priority | Timing | Template ID |
|---------|-------|----------|--------|-------------|
| 🔔 Push | ✅ Yes | 🔴 High | Immediate | `payment_received_push` |
| 📱 WhatsApp | ✅ Yes | 🔴 High | Immediate | `payment_received_wa` |
| 📧 Email | ✅ Yes | 🟡 Medium | Immediate | `payment_receipt_email` |

**Content:**
- Payment confirmation
- Receipt/invoice number
- Order processing will begin
- Estimated timeline
- **Email:** PDF receipt attachment

---

### 7. ORDER_PROCESSING
**When:** Jastiper starts shopping/processing order  
**Status Trigger:** Order status → `processing`

| Channel | Send? | Priority | Timing | Template ID |
|---------|-------|----------|--------|-------------|
| 🔔 Push | ✅ Yes | 🟡 Medium | Immediate | `order_processing_push` |
| 📱 WhatsApp | ✅ Yes | 🟡 Medium | Immediate | `order_processing_wa` |
| 📧 Email | ❌ No | - | - | - |

**Content:**
- Processing started
- Estimated completion time
- Updates will follow

---

### 8. ORDER_PURCHASED
**When:** Items purchased abroad  
**Status Trigger:** Order status → `purchased`

| Channel | Send? | Priority | Timing | Template ID |
|---------|-------|----------|--------|-------------|
| 🔔 Push | ✅ Yes | 🟡 Medium | Immediate | `order_purchased_push` |
| 📱 WhatsApp | ✅ Yes | 🟡 Medium | Immediate | `order_purchased_wa` |
| 📧 Email | ✅ Yes | 🟢 Low | Immediate | `order_purchased_email` |

**Content:**
- Purchase confirmation
- Items purchased
- Shipping to Indonesia soon

---

### 9. ORDER_SHIPPED
**When:** Package shipped to Indonesia  
**Status Trigger:** Order status → `shipped`

| Channel | Send? | Priority | Timing | Template ID |
|---------|-------|----------|--------|-------------|
| 🔔 Push | ✅ Yes | 🔴 High | Immediate | `order_shipped_push` |
| 📱 WhatsApp | ✅ Yes | 🔴 High | Immediate | `order_shipped_wa` |
| 📧 Email | ✅ Yes | 🟡 Medium | Immediate | `order_shipped_email` |

**Content:**
- Shipping confirmation
- Tracking number (clickable)
- Estimated arrival date
- Tracking link

---

### 10. ORDER_IN_TRANSIT
**When:** Tracking update (package in transit)  
**Status Trigger:** Tracking API webhook

| Channel | Send? | Priority | Timing | Template ID |
|---------|-------|----------|--------|-------------|
| 🔔 Push | ✅ Yes | 🟢 Low | On event | `order_transit_push` |
| 📱 WhatsApp | ❌ No | - | - | - |
| 📧 Email | ❌ No | - | - | - |

**Content:**
- Current location
- Status update
- ETA if changed

---

### 11. ORDER_ARRIVED_INDO
**When:** Package arrived in Indonesia  
**Status Trigger:** Tracking milestone detected

| Channel | Send? | Priority | Timing | Template ID |
|---------|-------|----------|--------|-------------|
| 🔔 Push | ✅ Yes | 🟡 Medium | Immediate | `order_arrived_indo_push` |
| 📱 WhatsApp | ✅ Yes | 🟡 Medium | Immediate | `order_arrived_indo_wa` |
| 📧 Email | ❌ No | - | - | - |

**Content:**
- Arrival confirmation
- Customs clearance in progress
- Expected delivery soon

---

### 12. ORDER_OUT_FOR_DELIVERY
**When:** Out for final delivery  
**Status Trigger:** Tracking status = out_for_delivery

| Channel | Send? | Priority | Timing | Template ID |
|---------|-------|----------|--------|-------------|
| 🔔 Push | ✅ Yes | 🔴 High | Immediate | `order_out_for_delivery_push` |
| 📱 WhatsApp | ✅ Yes | 🔴 High | Immediate | `order_out_for_delivery_wa` |
| 📧 Email | ❌ No | - | - | - |

**Content:**
- Out for delivery today
- Expected delivery window
- Courier contact (if available)

---

### 13. ORDER_DELIVERED
**When:** Package delivered to customer  
**Status Trigger:** Order status → `delivered`

| Channel | Send? | Priority | Timing | Template ID |
|---------|-------|----------|--------|-------------|
| 🔔 Push | ✅ Yes | 🔴 High | Immediate | `order_delivered_push` |
| 📱 WhatsApp | ✅ Yes | 🔴 High | Immediate | `order_delivered_wa` |
| 📧 Email | ✅ Yes | 🟡 Medium | Immediate | `order_delivered_email` |

**Content:**
- Delivery confirmation
- Thank you message
- Review request link
- Order complete

---

### 14. REVIEW_REQUEST
**When:** 2 days after delivery  
**Status Trigger:** Scheduled job (2 days post-delivery)

| Channel | Send? | Priority | Timing | Template ID |
|---------|-------|----------|--------|-------------|
| 🔔 Push | ❌ No | - | - | - |
| 📱 WhatsApp | ✅ Yes | 🟢 Low | 2 days after | `review_request_wa` |
| 📧 Email | ✅ Yes | 🟢 Low | 2 days after | `review_request_email` |

**Content:**
- Request for review
- Link to review form
- Optional: Incentive (discount on next order)

---

### 15. ORDER_CANCELLED
**When:** Order cancelled (by jastiper/admin/guest)  
**Status Trigger:** Order status → `cancelled`

| Channel | Send? | Priority | Timing | Template ID |
|---------|-------|----------|--------|-------------|
| 🔔 Push | ✅ Yes | 🔴 High | Immediate | `order_cancelled_push` |
| 📱 WhatsApp | ✅ Yes | 🔴 High | Immediate | `order_cancelled_wa` |
| 📧 Email | ✅ Yes | 🟡 Medium | Immediate | `order_cancelled_email` |

**Content:**
- Cancellation confirmation
- Reason (if provided)
- Refund timeline (if applicable)

---

### 16. REFUND_PROCESSED
**When:** Refund issued  
**Status Trigger:** Refund status → `completed`

| Channel | Send? | Priority | Timing | Template ID |
|---------|-------|----------|--------|-------------|
| 🔔 Push | ✅ Yes | 🔴 High | Immediate | `refund_processed_push` |
| 📱 WhatsApp | ✅ Yes | 🔴 High | Immediate | `refund_processed_wa` |
| 📧 Email | ✅ Yes | 🟡 Medium | Immediate | `refund_processed_email` |

**Content:**
- Refund confirmation
- Amount refunded
- Method (bank transfer, etc.)
- Processing time (3-7 days)

---

## Marketing & Engagement Events

### 17. TRIP_DEADLINE_REMINDER
**When:** 48 hours before trip closes  
**Status Trigger:** Scheduled job

| Channel | Send? | Priority | Timing | Template ID |
|---------|-------|----------|--------|-------------|
| 🔔 Push | ✅ Yes | 🟢 Low | 48h before | `trip_deadline_push` |
| 📱 WhatsApp | ❌ No | - | - | - |
| 📧 Email | ❌ No | - | - | - |

**Content:**
- Trip closing soon
- Last chance to order
- Link to jastiper profile

**Conditions:**
- Guest has visited this jastiper before
- Guest has not placed order in this trip yet

---

### 18. NEW_TRIP_FROM_FAVORITE_JASTIPER
**When:** Jastiper creates new trip  
**Status Trigger:** Trip status → `active`

| Channel | Send? | Priority | Timing | Template ID |
|---------|-------|----------|--------|-------------|
| 🔔 Push | ✅ Yes | 🟢 Low | Immediate | `new_trip_push` |
| 📱 WhatsApp | ❌ No | - | - | - |
| 📧 Email | ✅ Yes | 🟢 Low | Immediate | `new_trip_email` |

**Content:**
- New trip announcement
- Trip details (destination, deadline)
- Link to jastiper profile

**Conditions:**
- Guest has "favorited" this jastiper (feature to be built)
- OR guest has ordered from this jastiper before

---

### 19. PROMO_NOTIFICATION
**When:** Admin triggers promotional campaign  
**Status Trigger:** Manual trigger

| Channel | Send? | Priority | Timing | Template ID |
|---------|-------|----------|--------|-------------|
| 🔔 Push | ❌ No | - | - | - |
| 📱 WhatsApp | ❌ No* | 🟢 Low | Scheduled | `promo_wa` |
| 📧 Email | ✅ Yes | 🟢 Low | Scheduled | `promo_email` |

**Content:**
- Promotional message
- Discount/offer details
- CTA link

**Conditions:**
- *WhatsApp: Only if guest explicitly opted in to marketing messages
- Email: Only if guest has `notify_email = true` and `marketing_consent = true`
- Must comply with anti-spam regulations

---

## Notification Frequency Limits

### Rate Limiting Rules

| Channel | Max per Day | Max per Week | Cooldown between Non-Critical |
|---------|-------------|--------------|-------------------------------|
| 🔔 Push | 10 | 50 | 1 hour |
| 📱 WhatsApp | 5 transactional + 1 marketing | 30 | 30 minutes |
| 📧 Email | Unlimited transactional, 3 marketing | 10 marketing | 4 hours |

**Priority Override:**
- 🔴 High priority notifications bypass cooldown
- 🟡 Medium priority respects cooldown
- 🟢 Low priority can be batched

**Batch Sending:**
- Low-priority notifications can be batched daily
- Example: "Daily Order Summary" instead of multiple low-priority alerts

---

## User Preferences & Opt-Out

### Default Settings (New Guest)

```json
{
  "notificationConsent": {
    "email": true,              // Transactional only
    "whatsapp": true,           // Transactional only
    "push": false,              // Requires explicit opt-in
    "marketing": false          // Requires explicit opt-in
  }
}
```

### Opt-Out Mechanisms

**WhatsApp:**
- Reply "STOP" or "BERHENTI" → Opt out of marketing (transactional continues)
- System auto-responds with confirmation and opt-back-in instructions

**Email:**
- Footer link: "Unsubscribe from marketing emails"
- Preference center: Granular control (marketing vs transactional)

**Browser Push:**
- Browser-native permission revocation
- App settings: Disable specific event types

---

## Implementation Notes

### Notification Orchestrator Logic

```typescript
// Pseudo-code for notification sending

async function sendOrderNotification(event: NotificationEvent, order: Order) {
  const guest = await getGuestProfile(order.guestId)
  
  // Check notification matrix
  const channels = getChannelsForEvent(event)
  
  // Respect user preferences
  const enabledChannels = channels.filter(ch => {
    if (ch === 'push') return guest.notifyPush && guest.pushTokens.length > 0
    if (ch === 'whatsapp') return guest.notifyWhatsapp && guest.phone
    if (ch === 'email') return guest.notifyEmail && guest.email
    return false
  })
  
  // Check rate limits
  const allowedChannels = await checkRateLimits(guest.guestId, enabledChannels)
  
  // Send notifications in parallel
  const promises = allowedChannels.map(ch => {
    if (ch === 'push') return sendPushNotification(event, guest, order)
    if (ch === 'whatsapp') return sendWhatsAppNotification(event, guest, order)
    if (ch === 'email') return sendEmailNotification(event, guest, order)
  })
  
  // Wait for all, but don't fail if one channel fails
  await Promise.allSettled(promises)
  
  // Log all notification attempts
  await logNotifications(guest.guestId, event, allowedChannels, promises)
}
```

---

## Template Variable Reference

### Common Variables (Available in All Templates)

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `{customerName}` | string | Guest's name | "John Doe" |
| `{jastiperName}` | string | Jastiper's display name | "Tina Jastip" |
| `{orderId}` | string | Order ID | "ORD-20251121-001" |
| `{orderDate}` | date | Order creation date | "21 Nov 2025" |
| `{totalAmount}` | currency | Total order amount | "Rp 1.000.000" |
| `{dpAmount}` | currency | DP amount | "Rp 200.000" |
| `{remainingAmount}` | currency | Remaining payment | "Rp 800.000" |
| `{productList}` | string | Comma-separated product names | "Nike Air Max (2), Adidas Ultraboost (1)" |
| `{trackingNumber}` | string | Shipment tracking number | "JNE12345678" |
| `{trackingUrl}` | url | Tracking link | "https://jastipin.me/track/..." |
| `{paymentLink}` | url | Payment link | "https://jastipin.me/pay/..." |
| `{deadline}` | datetime | Payment/action deadline | "23 Nov 2025, 23:59" |

---

## Testing Checklist

Before deploying notification system:

- [ ] Test all 19 notification event types
- [ ] Verify WhatsApp templates are approved by Twilio
- [ ] Test email deliverability (inbox vs spam)
- [ ] Verify browser push permissions work across browsers
- [ ] Test rate limiting (send 100 notifications, verify limits)
- [ ] Test opt-out flows (WhatsApp STOP, Email unsubscribe)
- [ ] Verify notification logging (all sends logged to database)
- [ ] Test failed notification handling (retry logic)
- [ ] Test notification on multiple devices (mobile, desktop, tablet)
- [ ] Verify all template variables render correctly
- [ ] Test multi-language support (if applicable)
- [ ] Load test notification orchestrator (1000 concurrent sends)

---

**END OF NOTIFICATION MATRIX**

For full implementation details, see `design-document.md` Section 3 (Notification Architecture).
