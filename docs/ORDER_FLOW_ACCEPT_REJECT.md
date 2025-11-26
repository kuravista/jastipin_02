# Order Flow - Accept & Reject Documentation

## 📊 Complete Order Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CUSTOMER UPLOAD DP PROOF                        │
│                     Status: pending_dp                              │
└─────────────────────┬───────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  JASTIPER VALIDASI DP                               │
│                  Status: awaiting_validation                        │
└──────────┬──────────────────────────────────────────────┬───────────┘
           │                                              │
      ✅ ACCEPT                                      ❌ REJECT
           │                                              │
           ▼                                              ▼
┌──────────────────────────────┐            ┌────────────────────────┐
│  Status: awaiting_final_     │            │   Status: rejected     │
│          payment             │            │                        │
│                              │            │  Actions:              │
│  Actions:                    │            │  - Stock restored      │
│  - Email sent with breakdown │            │  - Order cancelled     │
│  - Magic link generated      │            │  - Customer notified   │
│  - Customer notified         │            └────────────────────────┘
└──────────┬───────────────────┘                      (END)
           │
           ▼
┌─────────────────────────────────────────────────────────────────────┐
│              CUSTOMER UPLOAD PELUNASAN PROOF                        │
│              Uses magic link from email                             │
└─────────────────────┬───────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│              JASTIPER VALIDASI PELUNASAN                            │
│              Status: awaiting_final_validation                      │
└──────────┬──────────────────────────────────────────────┬───────────┘
           │                                              │
      ✅ ACCEPT                                      ❌ REJECT
           │                                              │
           ▼                                              ▼
┌──────────────────────────────┐            ┌────────────────────────┐
│      Status: paid            │            │ Status: awaiting_final_│
│      (COMPLETED)             │            │        payment         │
│                              │            │                        │
│  Actions:                    │            │  Actions:              │
│  - Order marked as paid      │            │  - finalProofUrl = null│
│  - Customer notified         │            │  - finalPaidAt = null  │
│  - Transaction complete      │            │  - Customer notified   │
└──────────────────────────────┘            │  - Can upload again    │
         (END)                              └────────┬───────────────┘
                                                     │
                                                     └─> Loop back to
                                                         upload pelunasan
```

---

## 🔄 Detailed Flow Scenarios

### Scenario 1: Happy Path (All Accepted)

```
1. Customer uploads DP proof
   └─> Status: pending_dp → awaiting_validation

2. Jastiper reviews DP proof ✅ ACCEPT
   └─> Status: awaiting_validation → awaiting_final_payment
   └─> Email sent with:
       - Order breakdown (subtotal, ongkir, service fee, commission)
       - Magic link for final payment upload
       - Payment instructions

3. Customer clicks magic link, uploads final payment proof
   └─> Status: awaiting_final_payment → awaiting_final_validation

4. Jastiper reviews final proof ✅ ACCEPT
   └─> Status: awaiting_final_validation → paid
   └─> Order COMPLETE
```

**Timeline:** DP → Validate DP → Email → Final Payment → Validate Final → PAID ✅

---

### Scenario 2: DP Rejected

```
1. Customer uploads DP proof
   └─> Status: pending_dp → awaiting_validation

2. Jastiper reviews DP proof ❌ REJECT
   └─> Status: awaiting_validation → rejected
   └─> Actions:
       - Stock released and restored
       - Rejection reason saved
       - Customer notified via email/WhatsApp
       - Order CANCELLED
```

**Result:** Order ends at `rejected` status. Customer cannot proceed. ❌

---

### Scenario 3: Final Payment Rejected

```
1-3. (Same as Happy Path until awaiting_final_validation)

4. Jastiper reviews final proof ❌ REJECT
   └─> Status: awaiting_final_validation → awaiting_final_payment
   └─> Actions:
       - finalProofUrl = null (proof deleted)
       - finalPaidAt = null (timestamp cleared)
       - rejectionReason saved
       - Email sent with rejection reason and new magic link
       - Customer notified

5. Customer receives rejection email
   └─> Email contains rejection reason
   └─> Email contains new magic link (auto-generated, 7 days validity)
   └─> Clicks magic link to re-upload correct proof
   └─> Loop back to step 3
```

**Result:** Customer gets another chance to upload correct final payment proof. 🔄

---

## 📋 Status Reference Table

| Status | Description | Customer Action | Jastiper Action |
|--------|-------------|-----------------|-----------------|
| `pending_dp` | Waiting for DP proof | Upload DP proof | - |
| `awaiting_validation` | DP uploaded, pending review | Wait | Accept/Reject DP |
| `rejected` | DP rejected, order cancelled | - | - |
| `awaiting_final_payment` | DP approved, waiting for final payment | Upload final proof | - |
| `awaiting_final_validation` | Final proof uploaded, pending review | Wait | Accept/Reject final |
| `paid` | All payments verified, order complete | - | - |

---

## 🛡️ Key Features

### 1. **DP Rejection = Order Cancelled**
- Stock automatically restored
- No refund needed (DP never accepted)
- Clean cancellation

### 2. **Final Payment Rejection = Re-upload Opportunity**
- Proof deleted from database
- Customer can upload again
- Same magic link or new one can be generated
- Prevents permanent failure on payment disputes

### 3. **Separate Proof URLs**
- `dpProofUrl` - Permanent record of DP payment
- `finalProofUrl` - Can be cleared and re-uploaded if rejected
- Legacy `proofUrl` - Backward compatibility

### 4. **Non-blocking Email Notifications**
- Email failures don't break the flow
- Logged for debugging
- Customer can still proceed via dashboard

---

## 🔐 Security Considerations

1. **Magic Link Expiry:** 7 days
2. **Token Validation:** SHA256 hashing
3. **Challenge-Response:** Last 4 digits of WhatsApp
4. **One-time Use:** Token revoked after successful upload
5. **Ownership Verification:** Only trip owner can validate

---

## 📧 Email Notifications

### After DP Validation (Accept):
```
Subject: Pesanan Divalidasi - {orderCode}

Content:
- Order breakdown with all fees
- Magic link for final payment upload
- Payment instructions
- Jastiper contact info
- Security notice about magic link
```

### After DP Rejection:
```
Subject: Pesanan Ditolak - {orderCode}

Content:
- Rejection reason
- Refund information (if applicable)
- Contact jastiper for clarification
```

### After Final Payment Rejection:
```
Subject: Bukti Pelunasan Ditolak - {orderCode}

Content:
- Rejection reason
- Order breakdown (for reference)
- Instructions to upload correct proof
- New magic link for re-upload (auto-generated)
- Checklist of required proof details
- Jastiper contact information
- Security notice about magic link
```

---

## 🎯 Implementation Summary

### Backend Endpoints:
1. `POST /orders/:orderId/validate` - Validate DP
2. `POST /orders/:orderId/approve-final` - Validate final payment
3. `POST /api/upload/:orderId` - Upload proof (DP or final)

### Frontend Components:
1. Dashboard validation UI with accept/reject buttons
2. Toast notifications for user feedback
3. Badge colors for status visualization
4. Separate proof preview for DP vs final

### Database Fields:
- `dpProofUrl` - DP payment proof
- `finalProofUrl` - Final payment proof
- `dpPaidAt` - DP payment timestamp
- `finalPaidAt` - Final payment timestamp
- `validatedAt` - Validation timestamp
- `validatedBy` - Jastiper who validated
- `rejectionReason` - Reason if rejected

---

## ✅ Testing Checklist

- [ ] Upload DP proof → Accept → Email received
- [ ] Upload DP proof → Reject → Stock restored
- [ ] Upload final proof → Accept → Status = paid
- [ ] Upload final proof → Reject → Can re-upload
- [ ] Magic link expiry works correctly
- [ ] Challenge-response verification works
- [ ] Toast notifications display correctly
- [ ] Email templates render properly
- [ ] All status transitions logged

---

**Last Updated:** 2025-11-26
**Version:** 1.0.0
