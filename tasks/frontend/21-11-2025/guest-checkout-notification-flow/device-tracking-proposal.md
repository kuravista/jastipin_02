# Device Tracking Proposal

## Current Status
Guest table has `deviceInfo Json?` field but NOT populated yet.

## Implementation Options

### Option 1: Frontend Sends Device Info
```typescript
// Frontend collects:
{
  userAgent: navigator.userAgent,
  language: navigator.language,
  screenResolution: `${window.screen.width}x${window.screen.height}`,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  platform: navigator.platform
}

// Backend saves to Guest.deviceInfo
```

### Option 2: Backend Extracts from Request
```typescript
// Backend extracts from req:
{
  ip: req.ip,
  userAgent: req.headers['user-agent'],
  acceptLanguage: req.headers['accept-language'],
  referer: req.headers['referer']
}
```

### Option 3: Both (Recommended)
Combine frontend + backend data for complete picture.

## Use Cases
1. **Fraud Detection**: Same person using multiple devices
2. **Push Notifications**: Store device tokens for web push
3. **Analytics**: Track device/browser usage
4. **User Experience**: Remember preferences per device

## Privacy Considerations
- **No persistent identifiers** (no device UUID without consent)
- **IP anonymization**: Store hashed IP, not raw
- **GDPR compliance**: User can request deletion
- **Transparent**: Show in privacy policy

## Recommendation
**NOT NEEDED YET** for Phase 1-4. Add in Phase 5 (Notification Integration) when:
- Push tokens needed
- Device-specific notifications
- Cross-device recognition required

Current `contactHash` (phone+email) sufficient for now.
