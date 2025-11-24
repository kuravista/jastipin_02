# SPF Record Setup Guide - Prevent Emails Going to Spam

**Issue:** Emails from `no-reply@jastipin.me` masuk ke spam folder
**Solution:** Setup SPF and DKIM records untuk verify sender authenticity

---

## 🎯 Why Emails Go to Spam

### Current Issue
- Sender: `no-reply@jastipin.me`
- Sending via: SendPulse SMTP (`smtp-pulse.com`)
- Problem: Gmail tidak recognize SendPulse sebagai authorized sender untuk domain `jastipin.me`

### Solution
Add **SPF (Sender Policy Framework)** dan **DKIM (DomainKeys Identified Mail)** records ke DNS.

---

## 📝 Step 1: Add SPF Record

### What is SPF?
SPF record memberitahu email servers bahwa SendPulse authorized untuk mengirim email atas nama domain `jastipin.me`.

### DNS Record to Add

**Login to your domain registrar (e.g., Cloudflare, Namecheap, GoDaddy)**

**Add TXT Record:**
```
Type:  TXT
Name:  @ (atau jastipin.me)
Value: v=spf1 include:sendpulse.com ~all
TTL:   Auto atau 3600
```

### Explanation
- `v=spf1` - SPF version 1
- `include:sendpulse.com` - Allow SendPulse servers to send emails
- `~all` - Soft fail (mark suspicious but don't reject)

**Alternative (Strict):**
```
v=spf1 include:sendpulse.com -all
```
- `-all` - Hard fail (reject if not from SendPulse)

---

## 📝 Step 2: Add DKIM Record

### Get DKIM from SendPulse

1. **Login to SendPulse**
   ```
   https://login.sendpulse.com/settings/
   ```

2. **Navigate to SMTP → Settings**

3. **Find "Domain Verification" section**

4. **Copy DKIM record** (will look like this):
   ```
   Type:  TXT
   Name:  sendpulse._domainkey.jastipin.me
   Value: v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBA...
   ```

5. **Add to your DNS provider**

---

## 🔧 Implementation Guide

### If using Cloudflare DNS:

#### 1. Login to Cloudflare Dashboard
```
https://dash.cloudflare.com/
```

#### 2. Select Domain
- Click on `jastipin.me`
- Go to **DNS** tab

#### 3. Add SPF Record
- Click **Add Record**
- Type: `TXT`
- Name: `@`
- Content: `v=spf1 include:sendpulse.com ~all`
- Proxy status: DNS only (grey cloud)
- Click **Save**

#### 4. Add DKIM Record
- Click **Add Record**
- Type: `TXT`
- Name: `sendpulse._domainkey` (or full record from SendPulse)
- Content: (paste DKIM value from SendPulse)
- Proxy status: DNS only
- Click **Save**

---

## ✅ Verify DNS Records

### Method 1: Using Online Tools

**Check SPF:**
```
https://mxtoolbox.com/spf.aspx
Enter: jastipin.me
```

**Check DKIM:**
```
https://mxtoolbox.com/dkim.aspx
Enter: sendpulse._domainkey.jastipin.me
```

### Method 2: Using Command Line

**Check SPF:**
```bash
dig TXT jastipin.me +short
# Expected output: "v=spf1 include:sendpulse.com ~all"
```

**Check DKIM:**
```bash
dig TXT sendpulse._domainkey.jastipin.me +short
# Expected output: "v=DKIM1; k=rsa; p=..."
```

---

## 🕐 DNS Propagation Time

**After adding records:**
- Cloudflare: 2-5 minutes (fast)
- Other providers: 15 minutes - 48 hours

**Check propagation:**
```
https://dnschecker.org/
Query: jastipin.me
Type: TXT
```

---

## 🧪 Test Email Deliverability

### Method 1: Send Test Email

After SPF/DKIM configured (wait 15-30 minutes):

```bash
cd /app/backend
env TEST_EMAIL=kuravista@gmail.com npx tsx src/scripts/test-sendpulse.ts
```

**Check:**
- Email should land in **Inbox** (not spam)
- Gmail will show "✓" next to sender name (verified)

### Method 2: Use Mail Tester

1. **Get test email address:**
   ```
   https://www.mail-tester.com/
   ```

2. **Copy the test email address** (e.g., `test-abc123@mail-tester.com`)

3. **Send test:**
   ```bash
   env TEST_EMAIL=test-abc123@mail-tester.com npx tsx src/scripts/test-sendpulse.ts
   ```

4. **Check score** (target: 8-10/10)

---

## 📊 Expected Results

### Before SPF/DKIM
- ❌ Emails land in spam folder
- ❌ Gmail shows warning: "Be careful with this message"
- ❌ No sender verification
- ❌ Low deliverability score (3-5/10)

### After SPF/DKIM
- ✅ Emails land in inbox
- ✅ Gmail shows verified sender
- ✅ Higher trust score
- ✅ Better deliverability (8-10/10)

---

## 🔍 Troubleshooting

### Issue: SPF record not working

**Check syntax:**
```bash
# Correct
v=spf1 include:sendpulse.com ~all

# Wrong (no spaces before ~all)
v=spf1 include:sendpulse.com~all

# Wrong (missing include:)
v=spf1 sendpulse.com ~all
```

**Check DNS:**
```bash
dig TXT jastipin.me
```

**Verify with MXToolbox:**
```
https://mxtoolbox.com/spf.aspx
```

---

### Issue: DKIM record not found

**Common mistakes:**
- Wrong subdomain name
- Missing `._domainkey` in name
- Wrong record type (should be TXT, not CNAME)

**Verify:**
```bash
dig TXT sendpulse._domainkey.jastipin.me
```

---

### Issue: Still going to spam after setup

**Possible reasons:**
1. DNS not propagated yet (wait 30 min - 2 hours)
2. Gmail has already marked previous emails as spam (need reputation recovery)
3. Email content triggers spam filters
4. Need DMARC record (advanced)

**Solutions:**
1. Wait for DNS propagation
2. Mark test emails as "Not Spam" in Gmail
3. Send more emails to build reputation
4. Add DMARC record (optional):
   ```
   Type: TXT
   Name: _dmarc
   Value: v=DMARC1; p=none; rua=mailto:dmarc@jastipin.me
   ```

---

## 📧 Gmail Specific Tips

### Build Sender Reputation

1. **Start with low volume** (< 100 emails/day)
2. **Gradually increase** over 2-4 weeks
3. **Monitor bounce rates** (keep < 5%)
4. **Get users to mark as "Not Spam"** if it lands there
5. **Add unsubscribe link** (future enhancement)

### Improve Inbox Placement

1. **Avoid spam trigger words:**
   - "Free", "Winner", "Click Here Now"
   - All caps subject lines
   - Excessive exclamation marks!!!

2. **Use good subject lines:**
   - ✅ "Order Confirmation - ORD-12345"
   - ✅ "Payment Required - ORD-12345"
   - ❌ "URGENT!!! ACT NOW!!!"
   - ❌ "You've WON a FREE prize!!!"

3. **Include text version:**
   - Already implemented ✅
   - Fallback for email clients that block HTML

---

## 📋 Quick Setup Checklist

**DNS Configuration:**
- [ ] Login to DNS provider (Cloudflare/Namecheap/etc)
- [ ] Add SPF TXT record: `v=spf1 include:sendpulse.com ~all`
- [ ] Get DKIM from SendPulse dashboard
- [ ] Add DKIM TXT record from SendPulse
- [ ] Save changes
- [ ] Wait 15-30 minutes for propagation

**Verification:**
- [ ] Check SPF with `dig TXT jastipin.me`
- [ ] Check DKIM with `dig TXT sendpulse._domainkey.jastipin.me`
- [ ] Verify with mxtoolbox.com
- [ ] Send test email
- [ ] Check inbox (not spam)
- [ ] Verify Gmail shows "✓" next to sender

**Optional (Advanced):**
- [ ] Add DMARC record
- [ ] Setup BIMI (Brand Indicators for Message Identification)
- [ ] Monitor SendPulse dashboard for delivery stats
- [ ] Setup email warmup strategy

---

## 🎯 Success Criteria

### Technical
- ✅ SPF record resolves correctly
- ✅ DKIM record found
- ✅ Mail-tester.com score > 8/10
- ✅ MXToolbox shows no errors

### User Experience
- ✅ Emails land in inbox (not spam)
- ✅ Gmail shows verified sender
- ✅ Professional appearance
- ✅ User feedback: "I received the email"

---

## 💡 Additional Tips

### For Production

1. **Monitor delivery rates:**
   - SendPulse dashboard: https://login.sendpulse.com/smtp/dashboard
   - Target: >95% delivery rate
   - Watch: Bounce rate (<5%), Spam rate (<0.1%)

2. **Email warmup strategy:**
   - Week 1: Send 50-100 emails/day
   - Week 2: Send 200-500 emails/day
   - Week 3: Send 500-1000 emails/day
   - Week 4+: Full production volume

3. **Content best practices:**
   - Clear "From" name: "Jastipin Team"
   - Professional design (already implemented ✅)
   - Plain text fallback (already implemented ✅)
   - Unsubscribe link (future enhancement)

---

## 📞 Support Resources

### DNS/Domain Help
- Cloudflare Docs: https://developers.cloudflare.com/dns/
- SPF Generator: https://www.spfwizard.net/

### Email Authentication
- SPF Checker: https://mxtoolbox.com/spf.aspx
- DKIM Checker: https://mxtoolbox.com/dkim.aspx
- DMARC Checker: https://mxtoolbox.com/dmarc.aspx
- Mail Tester: https://www.mail-tester.com/

### SendPulse
- Dashboard: https://login.sendpulse.com/
- SMTP Settings: https://login.sendpulse.com/settings/
- Support: support@sendpulse.com

---

## 📝 Summary

**Current Status:**
- ❌ Emails going to spam (no SPF/DKIM)
- ✅ HTML rendering fixed (no more Base64)
- ✅ Email service working

**Action Required:**
1. **Add SPF record** (5 minutes)
2. **Add DKIM record** (5 minutes)
3. **Wait for propagation** (15-30 minutes)
4. **Test again** (verify inbox placement)

**Expected Result:**
- ✅ Emails land in inbox
- ✅ Professional sender verification
- ✅ Better deliverability
- ✅ Happy users

---

**Last Updated:** 24 November 2025
**Priority:** HIGH - Required for production

---

**END OF SPF SETUP GUIDE**
