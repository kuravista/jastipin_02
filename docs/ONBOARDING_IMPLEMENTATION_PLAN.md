# 📋 User Onboarding System - Implementation Plan

**Project**: Jastipin.me
**Feature**: User Onboarding & Tutorial System
**Date**: 2025-11-27
**Status**: Planning Phase

---

## 🎯 Project Goals

### Primary Objectives
1. **Profile Completion Modal** - Multi-step wizard yang WAJIB dilengkapi sebelum user bisa akses dashboard
2. **Dashboard Interactive Tour** - Step-by-step tutorial menggunakan React Joyride (optional, bisa skip)
3. **Retrigger Tutorial** - User bisa mengulang tutorial dari Account Settings

### Success Criteria
- ✅ New user WAJIB lengkapi profile sebelum bisa akses fitur
- ✅ User experience smooth dengan wizard 3 steps
- ✅ Tutorial bisa di-skip tanpa mengganggu UX
- ✅ User bisa retrigger tutorial kapanpun
- ✅ Data tersimpan dengan benar di database

---

## 📊 Current System Analysis

### Auth Context Structure
**File**: `frontend/lib/auth-context.tsx` (lines 12-29)

```typescript
interface User {
  id: string
  email: string
  slug: string
  profileName?: string
  profileBio?: string
  avatar?: string
  coverImage?: string
  whatsappNumber?: string
  originProvinceId?: string
  originProvinceName?: string
  originCityId?: string
  originCityName?: string
  originDistrictId?: string
  originDistrictName?: string
  originPostalCode?: string
  originAddressText?: string
  // Missing: originRajaOngkirDistrictId, isProfileComplete, tutorialStep
}
```

### Database Schema (Prisma)
**File**: `backend/prisma/schema.prisma`

**User Model** (lines 207-245):
- ✅ Has: Basic profile fields, origin address fields
- ✅ Has: Legacy bank fields (bankName, accountNumber, accountHolderName)
- ✅ Has: BankAccount relation (separate table)
- ❌ Missing: `isProfileComplete`, `onboardingCompletedAt`, `tutorialStep`
- ❌ Missing: `originRajaOngkirDistrictId`

**BankAccount Model** (lines 247-265):
- Separate table for multiple bank accounts
- Fields: userId, bankName, accountNumber, accountHolderName, isPrimary, status

### Location API Endpoints
**File**: `backend/src/routes/locations.ts`

Available endpoints:
- ✅ `GET /api/locations/provinces` - List all provinces
- ✅ `GET /api/locations/regencies/:provinceId` - Get cities by province
- ✅ `GET /api/locations/districts/:cityId` - Get districts by city
- ✅ `GET /api/locations/rajaongkir/search?q=<query>` - Search RajaOngkir districts

Response format:
```json
{
  "success": true,
  "count": 38,
  "data": [
    { "id": "11", "code": "11", "name": "Aceh" }
  ]
}
```

---

## ✅ Requirements Confirmed

### Profile Data - WAJIB DIISI
1. **Nama Lengkap** (`profileName`) - String
2. **Email** (`email`) - Already filled during registration
3. **WhatsApp Number** (`whatsappNumber`) - String, 10-15 digits
4. **Origin Address** (Alamat Jastiper untuk shipping):
   - Province ID & Name
   - City ID & Name
   - District ID & Name
   - RajaOngkir District ID (for shipping calculation)
   - Postal Code
   - Address Detail Text
5. **Bank Account** (Primary):
   - Bank Name
   - Account Number (10-15 digits)
   - Account Holder Name

### UI/UX Requirements
- **Modal Style**: Full overlay with backdrop blur, TIDAK bisa di-close
- **Form Layout**: Multi-step wizard (3 steps)
- **Tutorial Style**: Interactive step-by-step tour (React Joyride)
- **Tutorial Behavior**: Optional, bisa skip → mark as completed
- **Design System**:
  - Primary Orange: `#FB923C`
  - Secondary Pink: `#F26B8A`
  - Border radius: `rounded-xl`
  - Shadows: `shadow-lg`

### Business Logic
- **Trigger**: User login/register → Check `isProfileComplete`
- **Blocking**: Profile completion modal is BLOCKING (cannot skip)
- **Tutorial**: Non-blocking, can skip
- **Retrigger**: Available in Account Settings
- **Storage**: All data saved to database

---

## 🏗️ Architecture Design

### Database Schema Changes

```prisma
model User {
  // ... existing fields ...

  // NEW: Onboarding tracking fields
  isProfileComplete      Boolean   @default(false)
  onboardingCompletedAt  DateTime?
  tutorialStep           String?   @default("pending")
  // Values: "pending" | "profile_complete" | "completed"

  // NEW: Missing RajaOngkir field for shipping
  originRajaOngkirDistrictId String?

  // ... rest of fields ...
}
```

**Migration file needed**: `XXXXXX_add_onboarding_fields.sql`

### Backend Architecture

#### New Service: `backend/src/services/onboarding.service.ts`

```typescript
// Core functions needed:

checkProfileComplete(userId: string): Promise<boolean>
// Check if all required fields are filled

completeProfile(userId: string, data: ProfileData): Promise<User>
// Update user fields + create BankAccount record
// Set isProfileComplete = true
// Set tutorialStep = "profile_complete"

completeTutorial(userId: string): Promise<User>
// Set tutorialStep = "completed"
// Set onboardingCompletedAt = now()

restartTutorial(userId: string): Promise<User>
// Set tutorialStep = "profile_complete"
// Allow retrigger from settings
```

#### New API Routes: `backend/src/routes/users.ts`

```typescript
PATCH /api/users/complete-profile
// Body: { profileName, whatsappNumber, originAddress, bankAccount }
// Response: { success: true, user: User }

PATCH /api/users/complete-tutorial
// No body needed
// Response: { success: true, user: User }

POST /api/users/restart-tutorial
// No body needed
// Response: { success: true, user: User }

GET /api/users/onboarding-status
// Response: { isProfileComplete, tutorialStep, needsOnboarding }
```

#### Update Existing Routes

**`POST /api/auth/login`** - Include onboarding fields in response:
```json
{
  "user": {
    "id": "...",
    "email": "...",
    "isProfileComplete": false,
    "tutorialStep": "pending"
  },
  "token": "..."
}
```

**`POST /api/auth/register`** - Same as above

**`GET /api/profile`** - Include onboarding fields

### Frontend Architecture

#### Component Structure

```
frontend/
├── components/
│   └── onboarding/
│       ├── types.ts                        # TypeScript interfaces
│       ├── OnboardingProvider.tsx          # Context provider
│       ├── ProfileCompletionModal.tsx      # Main wizard container
│       ├── steps/
│       │   ├── Step1PersonalInfo.tsx       # Name + WhatsApp
│       │   ├── Step2OriginAddress.tsx      # Location form
│       │   └── Step3BankAccount.tsx        # Bank info form
│       ├── DashboardTour.tsx               # React Joyride wrapper
│       └── TourIntroDialog.tsx             # "Mau tur?" dialog
│
├── app/
│   └── dashboard/
│       └── page.tsx                        # Update: wrap with provider
│
└── lib/
    └── auth-context.tsx                    # Update: add fields & refreshUser()
```

#### Data Flow

```
1. User Login
   ↓
2. AuthContext fetches /api/profile
   ↓
3. User object includes: isProfileComplete, tutorialStep
   ↓
4. Dashboard checks user.isProfileComplete
   ↓
   FALSE → Show ProfileCompletionModal (BLOCKING)
   │       ↓
   │       User fills 3-step wizard
   │       ↓
   │       Submit → POST /api/users/complete-profile
   │       ↓
   │       Set isProfileComplete=true, tutorialStep="profile_complete"
   │       ↓
   │       RefreshUser()
   ↓
   TRUE → Check user.tutorialStep
          ↓
          "profile_complete" → Show TourIntroDialog
          │                    ↓
          │                    [Skip] → POST /api/users/complete-tutorial
          │                    [Start Tour] → Show DashboardTour
          │                                   ↓
          │                                   Tour Finish → POST /api/users/complete-tutorial
          ↓
          "completed" → Normal Dashboard (no prompts)
```

---

## 📝 Detailed Implementation Plan by Phase

## PHASE 1: Database Migration & Backend Setup

### 1.1 Database Migration

**Task**: Create Prisma migration file

**File**: `backend/prisma/migrations/XXXXXX_add_onboarding_fields/migration.sql`

**Changes**:
```sql
ALTER TABLE "User" ADD COLUMN "isProfileComplete" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "onboardingCompletedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "tutorialStep" TEXT DEFAULT 'pending';
ALTER TABLE "User" ADD COLUMN "originRajaOngkirDistrictId" TEXT;
```

**Schema Update**: `backend/prisma/schema.prisma`
- Add 4 new fields to User model
- Run: `npx prisma migrate dev --name add_onboarding_fields`
- Run: `npx prisma generate`

### 1.2 Backend Service Layer

**New File**: `backend/src/services/onboarding.service.ts`

**Functions to implement**:

```typescript
interface ProfileCompletionData {
  profileName: string
  whatsappNumber: string
  originProvinceId: string
  originProvinceName: string
  originCityId: string
  originCityName: string
  originDistrictId: string
  originDistrictName: string
  originRajaOngkirDistrictId: string
  originPostalCode: string
  originAddressText: string
  bankName: string
  accountNumber: string
  accountHolderName: string
}

export async function checkProfileComplete(userId: string): Promise<boolean>
// Query user from DB
// Check if all required fields are filled
// Return true/false

export async function completeProfile(
  userId: string,
  data: ProfileCompletionData
): Promise<User>
// Validate data (whatsapp 10-15 digits, account number 10-15 digits)
// Update User table with all fields
// Create BankAccount record with isPrimary=true
// Set isProfileComplete=true, tutorialStep="profile_complete"
// Return updated user

export async function completeTutorial(userId: string): Promise<User>
// Update tutorialStep="completed"
// Set onboardingCompletedAt=now()
// Return updated user

export async function restartTutorial(userId: string): Promise<User>
// Update tutorialStep="profile_complete"
// Return updated user

export async function getOnboardingStatus(userId: string)
// Return { isProfileComplete, tutorialStep, needsOnboarding }
```

**Validation rules**:
- WhatsApp: `/^\d{10,15}$/` (10-15 digits)
- Account Number: `/^\d{10,15}$/` (10-15 digits)
- All text fields: min length 2 characters
- Postal code: exactly 5 digits

### 1.3 API Routes

**Update File**: `backend/src/routes/users.ts`

**New endpoints**:

```typescript
// PATCH /api/users/complete-profile
router.patch('/complete-profile', authenticateToken, async (req, res) => {
  // Get userId from req.user
  // Validate request body
  // Call onboarding.completeProfile()
  // Return updated user
})

// PATCH /api/users/complete-tutorial
router.patch('/complete-tutorial', authenticateToken, async (req, res) => {
  // Call onboarding.completeTutorial()
  // Return updated user
})

// POST /api/users/restart-tutorial
router.post('/restart-tutorial', authenticateToken, async (req, res) => {
  // Call onboarding.restartTutorial()
  // Return updated user
})

// GET /api/users/onboarding-status
router.get('/onboarding-status', authenticateToken, async (req, res) => {
  // Call onboarding.getOnboardingStatus()
  // Return status object
})
```

### 1.4 Update Auth Responses

**Update File**: `backend/src/routes/auth.ts`

**Endpoints to update**:
- `POST /api/auth/login` - Include onboarding fields in user response
- `POST /api/auth/register` - Include onboarding fields in user response
- `GET /api/profile` - Include onboarding fields

**Add to user serialization**:
```typescript
{
  id, email, slug, profileName, avatar, // ... existing fields
  isProfileComplete: user.isProfileComplete,
  tutorialStep: user.tutorialStep,
  onboardingCompletedAt: user.onboardingCompletedAt
}
```

### Phase 1 Deliverables Checklist
- [ ] Migration file created and tested
- [ ] `onboarding.service.ts` implemented with all functions
- [ ] 4 new API endpoints created and tested
- [ ] Auth responses updated to include onboarding fields
- [ ] All validation logic implemented
- [ ] Unit tests written (optional but recommended)

---

## PHASE 2: Frontend - Profile Completion Modal

### 2.1 Dependencies

**Update File**: `frontend/package.json`

```json
{
  "dependencies": {
    "react-joyride": "^2.9.2"
  }
}
```

**Install**: `npm install react-joyride`

### 2.2 Update Auth Context

**File**: `frontend/lib/auth-context.tsx`

**Changes needed**:

1. **Update User interface** (line 12):
```typescript
export interface User {
  // ... existing fields ...
  originRajaOngkirDistrictId?: string  // ADD
  isProfileComplete?: boolean          // ADD
  onboardingCompletedAt?: string       // ADD
  tutorialStep?: string                // ADD
}
```

2. **Add refreshUser method** to AuthContextType (line 31):
```typescript
interface AuthContextType {
  // ... existing ...
  refreshUser: () => Promise<void>  // ADD
}
```

3. **Implement refreshUser** in AuthProvider:
```typescript
async function refreshUser() {
  await fetchUserProfile()
}
```

4. **Export refreshUser** in context value (line 157):
```typescript
const value: AuthContextType = {
  // ... existing ...
  refreshUser  // ADD
}
```

### 2.3 TypeScript Interfaces

**New File**: `frontend/components/onboarding/types.ts`

```typescript
export interface ProfileCompletionData {
  // Step 1: Personal Info
  profileName: string
  whatsappNumber: string

  // Step 2: Origin Address
  originProvinceId: string
  originProvinceName: string
  originCityId: string
  originCityName: string
  originDistrictId: string
  originDistrictName: string
  originRajaOngkirDistrictId: string
  originPostalCode: string
  originAddressText: string

  // Step 3: Bank Account
  bankName: string
  accountNumber: string
  accountHolderName: string
}

export interface LocationOption {
  id: string
  code: string
  name: string
}

export interface RajaOngkirSearchResult {
  subdistrict_id: string
  subdistrict_name: string
  type: string
  city: string
  province: string
}

export type OnboardingStep = 1 | 2 | 3

export interface StepValidation {
  isValid: boolean
  errors: Record<string, string>
}
```

### 2.4 Onboarding Context Provider

**New File**: `frontend/components/onboarding/OnboardingProvider.tsx`

```typescript
interface OnboardingContextType {
  // Modal state
  isModalOpen: boolean
  setModalOpen: (open: boolean) => void

  // Wizard state
  currentStep: OnboardingStep
  setCurrentStep: (step: OnboardingStep) => void

  // Form data
  formData: Partial<ProfileCompletionData>
  updateFormData: (data: Partial<ProfileCompletionData>) => void

  // Validation
  errors: Record<string, string>
  setErrors: (errors: Record<string, string>) => void

  // Submission
  isSubmitting: boolean
  submitProfile: () => Promise<void>

  // Navigation
  canGoNext: boolean
  canGoBack: boolean
  goNext: () => void
  goBack: () => void
}

export function OnboardingProvider({ children }) {
  // State management for wizard
  // Form validation logic
  // API submission logic
  // Navigation helpers
}

export function useOnboarding() {
  // Hook to consume context
}
```

**Responsibilities**:
- Manage modal open/close state
- Track current step (1, 2, or 3)
- Store form data across steps
- Validate each step before proceeding
- Submit final data to API
- Handle errors and loading states

### 2.5 Main Modal Component

**New File**: `frontend/components/onboarding/ProfileCompletionModal.tsx`

```typescript
export function ProfileCompletionModal() {
  const { isModalOpen, currentStep, canGoNext, canGoBack, goNext, goBack, submitProfile } = useOnboarding()

  return (
    <Dialog open={isModalOpen} onOpenChange={() => {}} modal>
      {/* Cannot close - no X button, no backdrop click */}

      <DialogContent className="max-w-2xl">
        {/* Header */}
        <div>
          <h2>Selamat Datang di Jastipin! 🎉</h2>
          <p>Lengkapi profil Anda untuk mulai jualan</p>
        </div>

        {/* Progress Indicator */}
        <div className="flex gap-2">
          <div className={currentStep >= 1 ? 'active' : ''}>1. Info Personal</div>
          <div className={currentStep >= 2 ? 'active' : ''}>2. Alamat</div>
          <div className={currentStep >= 3 ? 'active' : ''}>3. Bank</div>
        </div>

        {/* Step Content */}
        {currentStep === 1 && <Step1PersonalInfo />}
        {currentStep === 2 && <Step2OriginAddress />}
        {currentStep === 3 && <Step3BankAccount />}

        {/* Navigation */}
        <div className="flex justify-between">
          <Button onClick={goBack} disabled={!canGoBack}>
            Kembali
          </Button>

          {currentStep < 3 ? (
            <Button onClick={goNext} disabled={!canGoNext}>
              Lanjut
            </Button>
          ) : (
            <Button onClick={submitProfile} disabled={!canGoNext}>
              Simpan & Selesai
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

**Features**:
- Full overlay, cannot close
- Progress indicator shows which step
- Dynamic content based on currentStep
- Navigation buttons with validation
- Loading state during submission
- Error display

### 2.6 Step Components

#### **File**: `frontend/components/onboarding/steps/Step1PersonalInfo.tsx`

```typescript
export function Step1PersonalInfo() {
  const { formData, updateFormData, errors } = useOnboarding()

  return (
    <div className="space-y-4">
      {/* Profile Name */}
      <div>
        <Label>Nama Lengkap *</Label>
        <Input
          value={formData.profileName || ''}
          onChange={(e) => updateFormData({ profileName: e.target.value })}
          placeholder="Masukkan nama lengkap Anda"
        />
        {errors.profileName && <p className="text-red-500">{errors.profileName}</p>}
      </div>

      {/* WhatsApp Number */}
      <div>
        <Label>Nomor WhatsApp *</Label>
        <Input
          type="tel"
          value={formData.whatsappNumber || ''}
          onChange={(e) => updateFormData({ whatsappNumber: e.target.value })}
          placeholder="08123456789"
        />
        <p className="text-sm text-gray-500">10-15 digit angka</p>
        {errors.whatsappNumber && <p className="text-red-500">{errors.whatsappNumber}</p>}
      </div>

      {/* Email (read-only, already filled) */}
      <div>
        <Label>Email</Label>
        <Input value={formData.email || ''} disabled />
        <p className="text-sm text-gray-500">Email sudah terverifikasi ✓</p>
      </div>
    </div>
  )
}
```

**Validation**:
- profileName: required, min 2 characters
- whatsappNumber: required, 10-15 digits, numeric only
- Validate on blur and before proceeding to next step

#### **File**: `frontend/components/onboarding/steps/Step2OriginAddress.tsx`

```typescript
export function Step2OriginAddress() {
  const { formData, updateFormData, errors } = useOnboarding()
  const [provinces, setProvinces] = useState<LocationOption[]>([])
  const [cities, setCities] = useState<LocationOption[]>([])
  const [districts, setDistricts] = useState<LocationOption[]>([])
  const [rajaOngkirResults, setRajaOngkirResults] = useState([])

  // Fetch provinces on mount
  useEffect(() => {
    fetchProvinces()
  }, [])

  // Fetch cities when province changes
  useEffect(() => {
    if (formData.originProvinceId) {
      fetchCities(formData.originProvinceId)
    }
  }, [formData.originProvinceId])

  // Fetch districts when city changes
  useEffect(() => {
    if (formData.originCityId) {
      fetchDistricts(formData.originCityId)
    }
  }, [formData.originCityId])

  // Search RajaOngkir when district selected
  useEffect(() => {
    if (formData.originDistrictName && formData.originCityName) {
      searchRajaOngkir(`${formData.originDistrictName} ${formData.originCityName}`)
    }
  }, [formData.originDistrictName, formData.originCityName])

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Alamat ini digunakan untuk menghitung ongkos kirim ke pembeli
      </p>

      {/* Province Dropdown */}
      <Select
        value={formData.originProvinceId}
        onValueChange={(value) => {
          const province = provinces.find(p => p.id === value)
          updateFormData({
            originProvinceId: value,
            originProvinceName: province?.name,
            originCityId: '',
            originDistrictId: ''
          })
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Pilih Provinsi" />
        </SelectTrigger>
        <SelectContent>
          {provinces.map(p => (
            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* City Dropdown */}
      <Select
        value={formData.originCityId}
        onValueChange={(value) => {
          const city = cities.find(c => c.id === value)
          updateFormData({
            originCityId: value,
            originCityName: city?.name,
            originDistrictId: ''
          })
        }}
        disabled={!formData.originProvinceId}
      >
        <SelectTrigger>
          <SelectValue placeholder="Pilih Kota/Kabupaten" />
        </SelectTrigger>
        <SelectContent>
          {cities.map(c => (
            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* District Dropdown */}
      <Select
        value={formData.originDistrictId}
        onValueChange={(value) => {
          const district = districts.find(d => d.id === value)
          updateFormData({
            originDistrictId: value,
            originDistrictName: district?.name
          })
        }}
        disabled={!formData.originCityId}
      >
        <SelectTrigger>
          <SelectValue placeholder="Pilih Kecamatan" />
        </SelectTrigger>
        <SelectContent>
          {districts.map(d => (
            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* RajaOngkir District Selection */}
      {rajaOngkirResults.length > 0 && (
        <Select
          value={formData.originRajaOngkirDistrictId}
          onValueChange={(value) => {
            updateFormData({ originRajaOngkirDistrictId: value })
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Pilih Kecamatan untuk Ongkir" />
          </SelectTrigger>
          <SelectContent>
            {rajaOngkirResults.map(r => (
              <SelectItem key={r.subdistrict_id} value={r.subdistrict_id}>
                {r.subdistrict_name} - {r.city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Postal Code */}
      <Input
        value={formData.originPostalCode || ''}
        onChange={(e) => updateFormData({ originPostalCode: e.target.value })}
        placeholder="Kode Pos (5 digit)"
        maxLength={5}
      />

      {/* Address Detail */}
      <Textarea
        value={formData.originAddressText || ''}
        onChange={(e) => updateFormData({ originAddressText: e.target.value })}
        placeholder="Alamat lengkap (nama jalan, nomor rumah, RT/RW, dll)"
        rows={4}
      />
      {errors.originAddressText && <p className="text-red-500">{errors.originAddressText}</p>}
    </div>
  )
}
```

**API Integration**:
- `GET /api/locations/provinces`
- `GET /api/locations/regencies/:provinceId`
- `GET /api/locations/districts/:cityId`
- `GET /api/locations/rajaongkir/search?q=<query>`

**Validation**:
- All dropdowns: required
- Postal code: exactly 5 digits
- Address text: min 10 characters (reuse existing validation)
- RajaOngkir ID: required for shipping calculation

#### **File**: `frontend/components/onboarding/steps/Step3BankAccount.tsx`

```typescript
export function Step3BankAccount() {
  const { formData, updateFormData, errors } = useOnboarding()

  const bankOptions = [
    'BCA', 'BNI', 'BRI', 'Mandiri', 'CIMB Niaga',
    'Permata', 'Danamon', 'BTN', 'BSI', 'Lainnya'
  ]

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Informasi rekening ini digunakan untuk transfer pembayaran dari pembeli
      </p>

      {/* Bank Name */}
      <div>
        <Label>Nama Bank *</Label>
        <Select
          value={formData.bankName}
          onValueChange={(value) => updateFormData({ bankName: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Pilih Bank" />
          </SelectTrigger>
          <SelectContent>
            {bankOptions.map(bank => (
              <SelectItem key={bank} value={bank}>{bank}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.bankName && <p className="text-red-500">{errors.bankName}</p>}
      </div>

      {/* Custom bank name if "Lainnya" */}
      {formData.bankName === 'Lainnya' && (
        <Input
          placeholder="Masukkan nama bank"
          onChange={(e) => updateFormData({ bankName: e.target.value })}
        />
      )}

      {/* Account Number */}
      <div>
        <Label>Nomor Rekening *</Label>
        <Input
          type="text"
          value={formData.accountNumber || ''}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, '') // Only digits
            updateFormData({ accountNumber: value })
          }}
          placeholder="1234567890"
          maxLength={15}
        />
        <p className="text-sm text-gray-500">10-15 digit angka</p>
        {errors.accountNumber && <p className="text-red-500">{errors.accountNumber}</p>}
      </div>

      {/* Account Holder Name */}
      <div>
        <Label>Nama Pemilik Rekening *</Label>
        <Input
          value={formData.accountHolderName || ''}
          onChange={(e) => updateFormData({ accountHolderName: e.target.value })}
          placeholder="Nama sesuai rekening bank"
        />
        <p className="text-sm text-gray-500">Harus sama dengan nama di rekening</p>
        {errors.accountHolderName && <p className="text-red-500">{errors.accountHolderName}</p>}
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          💡 Pastikan informasi rekening Anda benar. Ini akan digunakan untuk
          menerima pembayaran dari pembeli.
        </p>
      </div>
    </div>
  )
}
```

**Validation**:
- bankName: required
- accountNumber: required, 10-15 digits, numeric only
- accountHolderName: required, min 3 characters

### 2.7 Integration with Dashboard

**Update File**: `frontend/app/dashboard/page.tsx`

```typescript
import { OnboardingProvider } from '@/components/onboarding/OnboardingProvider'
import { ProfileCompletionModal } from '@/components/onboarding/ProfileCompletionModal'

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <OnboardingProvider>
      <ProfileCompletionModal />

      {/* Existing dashboard content */}
      <DashboardContent />
    </OnboardingProvider>
  )
}
```

**Logic in OnboardingProvider**:
```typescript
// Auto-open modal if profile incomplete
useEffect(() => {
  if (user && !user.isProfileComplete) {
    setModalOpen(true)
  }
}, [user])
```

### Phase 2 Deliverables Checklist
- [ ] `react-joyride` dependency installed
- [ ] Auth context updated with new fields
- [ ] `types.ts` created with all interfaces
- [ ] `OnboardingProvider.tsx` implemented
- [ ] `ProfileCompletionModal.tsx` created
- [ ] Step 1 component (Personal Info) completed
- [ ] Step 2 component (Origin Address) completed with API integration
- [ ] Step 3 component (Bank Account) completed
- [ ] Dashboard integration completed
- [ ] All validations working
- [ ] Form state persists across steps
- [ ] API submission working
- [ ] Error handling implemented
- [ ] Loading states implemented

---

## PHASE 3: Dashboard Interactive Tour

### 3.1 Tour Intro Dialog

**New File**: `frontend/components/onboarding/TourIntroDialog.tsx`

```typescript
interface TourIntroDialogProps {
  open: boolean
  onStartTour: () => void
  onSkip: () => void
}

export function TourIntroDialog({ open, onStartTour, onSkip }: TourIntroDialogProps) {
  const [isSkipping, setIsSkipping] = useState(false)

  const handleSkip = async () => {
    setIsSkipping(true)
    await onSkip()
    setIsSkipping(false)
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-md">
        {/* Success Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <Check className="w-8 h-8 text-green-600" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center text-gray-900">
          Profil Sudah Lengkap! ✓
        </h2>

        {/* Description */}
        <p className="text-center text-gray-600">
          Mau tur singkat dashboard dulu?<br />
          <span className="text-sm">(hanya 30 detik)</span>
        </p>

        {/* Buttons */}
        <div className="flex gap-3 mt-4">
          <Button
            variant="outline"
            onClick={handleSkip}
            disabled={isSkipping}
            className="flex-1"
          >
            {isSkipping ? 'Melewati...' : 'Skip, Langsung Mulai'}
          </Button>

          <Button
            onClick={onStartTour}
            className="flex-1 bg-[#FB923C] hover:bg-[#EA7C2C]"
          >
            Mulai Tur
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

### 3.2 Dashboard Tour Component

**New File**: `frontend/components/onboarding/DashboardTour.tsx`

```typescript
import Joyride, { Step, CallBackProps, STATUS } from 'react-joyride'

interface DashboardTourProps {
  run: boolean
  onFinish: () => void
}

export function DashboardTour({ run, onFinish }: DashboardTourProps) {
  const steps: Step[] = [
    {
      target: '[data-tour="upload-product"]',
      content: (
        <div>
          <h3 className="text-lg font-bold mb-2">Upload Produk Cepat</h3>
          <p>Klik tombol ini untuk menambahkan produk baru yang ingin Anda jual.</p>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true
    },
    {
      target: '[data-tour="create-trip"]',
      content: (
        <div>
          <h3 className="text-lg font-bold mb-2">Tambah Trip</h3>
          <p>Buat trip baru untuk mengorganisir produk berdasarkan lokasi atau waktu belanja.</p>
        </div>
      ),
      placement: 'bottom'
    },
    {
      target: '[data-tour="validasi-card"]',
      content: (
        <div>
          <h3 className="text-lg font-bold mb-2">Validasi Order</h3>
          <p>Pantau order baru yang masuk dan perlu divalidasi di sini.</p>
        </div>
      ),
      placement: 'top'
    },
    {
      target: '[data-tour="profile-url"]',
      content: (
        <div>
          <h3 className="text-lg font-bold mb-2">Share Profil Anda</h3>
          <p>Ini adalah link profil Anda. Klik untuk copy dan bagikan ke calon pembeli!</p>
        </div>
      ),
      placement: 'bottom'
    },
    {
      target: 'body',
      content: (
        <div>
          <h3 className="text-lg font-bold mb-2">Selamat! 🎉</h3>
          <p>Anda siap untuk mulai jualan. Selamat berjualan di Jastipin!</p>
        </div>
      ),
      placement: 'center'
    }
  ]

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      onFinish()
    }
  }

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      hideCloseButton
      disableOverlayClose
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#FB923C',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: 12,
        },
        buttonNext: {
          backgroundColor: '#FB923C',
          borderRadius: 8,
        },
        buttonBack: {
          color: '#666',
        },
        buttonSkip: {
          color: '#F26B8A',
        }
      }}
      locale={{
        back: 'Kembali',
        close: 'Tutup',
        last: 'Selesai',
        next: 'Lanjut',
        skip: 'Lewati'
      }}
    />
  )
}
```

### 3.3 Update Dashboard Components for Tour Targets

**Update File**: `frontend/components/dashboard/dashboard-home.tsx`

Add `data-tour` attributes to tour target elements:

```typescript
// Line 99-105: Upload Produk button
<Button
  data-tour="upload-product"  // ADD THIS
  onClick={() => setProductDialogOpen(true)}
  className="flex-[4] h-14 bg-[#FB923C] hover:bg-[#EA7C2C] text-white font-semibold text-lg rounded-xl shadow-lg"
>
  <Plus className="w-6 h-6 mr-2" />
  Upload Produk Cepat
</Button>

// Line 108-113: Create Trip button
<Button
  data-tour="create-trip"  // ADD THIS
  onClick={() => setCreateTripOpen(true)}
  className="flex-1 h-14 bg-white hover:bg-gray-50 text-[#FB923C] border-2 border-[#FB923C] font-semibold rounded-xl shadow-lg"
>
  <Plus className="w-5 h-5" />Trip
</Button>

// Line 184-205: Validasi card
<div
  data-tour="validasi-card"  // ADD THIS
  className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
>
  {/* ... existing content ... */}
</div>

// Line 75-88: Profile URL
<div
  data-tour="profile-url"  // ADD THIS
  className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm cursor-pointer hover:border-orange-300 hover:shadow-md transition-all group"
  onClick={handleCopyUrl}
>
  {/* ... existing content ... */}
</div>
```

### 3.4 Integrate Tour with Dashboard

**Update File**: `frontend/app/dashboard/page.tsx`

```typescript
import { DashboardTour } from '@/components/onboarding/DashboardTour'
import { TourIntroDialog } from '@/components/onboarding/TourIntroDialog'

export default function DashboardPage() {
  const { user, refreshUser } = useAuth()
  const [showTourIntro, setShowTourIntro] = useState(false)
  const [runTour, setRunTour] = useState(false)

  // Check if tour should be shown
  useEffect(() => {
    if (user?.isProfileComplete && user?.tutorialStep === 'profile_complete') {
      setShowTourIntro(true)
    }
  }, [user])

  // Handle tour start
  const handleStartTour = () => {
    setShowTourIntro(false)
    setRunTour(true)
  }

  // Handle tour skip
  const handleSkipTour = async () => {
    try {
      await apiPatch('/users/complete-tutorial')
      await refreshUser()
      setShowTourIntro(false)
    } catch (error) {
      console.error('Failed to skip tutorial:', error)
    }
  }

  // Handle tour finish
  const handleTourFinish = async () => {
    try {
      await apiPatch('/users/complete-tutorial')
      await refreshUser()
      setRunTour(false)
    } catch (error) {
      console.error('Failed to complete tutorial:', error)
    }
  }

  return (
    <OnboardingProvider>
      <ProfileCompletionModal />

      <TourIntroDialog
        open={showTourIntro}
        onStartTour={handleStartTour}
        onSkip={handleSkipTour}
      />

      <DashboardTour
        run={runTour}
        onFinish={handleTourFinish}
      />

      <DashboardContent />
    </OnboardingProvider>
  )
}
```

### Phase 3 Deliverables Checklist
- [ ] `TourIntroDialog.tsx` created
- [ ] `DashboardTour.tsx` created with React Joyride
- [ ] Tour steps defined (4-5 steps)
- [ ] Dashboard components updated with `data-tour` attributes
- [ ] Tour integrated in dashboard page
- [ ] Skip functionality working
- [ ] Complete tutorial API call working
- [ ] Tour styling matches design system
- [ ] Tour is responsive on mobile

---

## PHASE 4: Settings Integration - Retrigger Tutorial

### 4.1 Find or Create Account Settings Page

**Option A**: Update existing settings page
**Option B**: Create new settings page if doesn't exist

**Expected file**: `frontend/app/dashboard/account/page.tsx` or similar

### 4.2 Add Tutorial Section

**Update/Create File**: `frontend/app/dashboard/account/page.tsx`

```typescript
import { useState } from 'react'
import { apiPost } from '@/lib/api-client'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'

export default function AccountSettingsPage() {
  const { refreshUser } = useAuth()
  const router = useRouter()
  const [isRestarting, setIsRestarting] = useState(false)

  const handleRestartTutorial = async () => {
    try {
      setIsRestarting(true)

      // Call API to restart tutorial
      await apiPost('/users/restart-tutorial', {})

      // Refresh user data
      await refreshUser()

      // Show success message (optional toast)
      // toast.success('Tutorial akan dimulai ulang')

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (error) {
      console.error('Failed to restart tutorial:', error)
      // Show error message
      // toast.error('Gagal memulai ulang tutorial')
    } finally {
      setIsRestarting(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Existing settings sections */}

      {/* Tutorial Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          Tutorial Dashboard
        </h3>

        <p className="text-sm text-gray-600 mb-4">
          Ingin mengulang tutorial dashboard? Anda akan dipandu kembali
          melalui fitur-fitur utama Jastipin.
        </p>

        <Button
          onClick={handleRestartTutorial}
          disabled={isRestarting}
          variant="outline"
          className="border-[#F26B8A] text-[#F26B8A] hover:bg-pink-50"
        >
          {isRestarting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Memuat...
            </>
          ) : (
            <>
              <RotateCcw className="w-4 h-4 mr-2" />
              Ulangi Tutorial Dashboard
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
```

### 4.3 Navigation Flow

```
User clicks "Ulangi Tutorial"
  ↓
POST /api/users/restart-tutorial
  ↓
tutorialStep = "profile_complete"
  ↓
Refresh user data
  ↓
Redirect to /dashboard
  ↓
Dashboard detects tutorialStep = "profile_complete"
  ↓
Show TourIntroDialog
  ↓
User starts tour or skips
```

### Phase 4 Deliverables Checklist
- [ ] Account settings page identified or created
- [ ] Tutorial section added to settings
- [ ] Restart tutorial button implemented
- [ ] API integration working
- [ ] Redirect to dashboard working
- [ ] Tour triggers correctly after restart
- [ ] Loading and error states handled
- [ ] UI matches design system

---

## PHASE 5: Testing, Polish & Documentation

### 5.1 Testing Scenarios

#### Profile Completion Flow
- [ ] **New User Registration**
  - Register new account
  - Should immediately see ProfileCompletionModal
  - Modal cannot be closed
  - All 3 steps work correctly
  - Submission saves to database
  - User redirected to tour intro

- [ ] **Existing User (Incomplete Profile)**
  - Login with user who has incomplete profile
  - Should see ProfileCompletionModal
  - Can navigate back/forward between steps
  - Form data persists across steps
  - Validation works per step

- [ ] **Profile Completion Validation**
  - Try submitting with empty fields → Should show errors
  - Try invalid WhatsApp (less than 10 digits) → Should show error
  - Try invalid account number → Should show error
  - All validations work correctly

#### Location Selection
- [ ] Province dropdown loads correctly
- [ ] Selecting province loads cities
- [ ] Selecting city loads districts
- [ ] RajaOngkir search triggers automatically
- [ ] All location data saves correctly

#### Bank Account Creation
- [ ] Bank account saves to BankAccount table
- [ ] isPrimary flag set correctly
- [ ] Validation for account number works

#### Tutorial Tour
- [ ] **First Tour After Profile Complete**
  - Complete profile → See TourIntroDialog
  - Click "Mulai Tur" → Tour starts
  - All tour steps work sequentially
  - Spotlight highlights correct elements
  - Tour can be skipped mid-way
  - Completing tour marks tutorialStep="completed"

- [ ] **Skip Tour**
  - Click "Skip" → Tour doesn't start
  - tutorialStep set to "completed"
  - User goes to normal dashboard

- [ ] **Restart Tour from Settings**
  - Go to account settings
  - Click "Ulangi Tutorial"
  - Redirect to dashboard
  - TourIntroDialog appears
  - Tour works correctly

#### Edge Cases
- [ ] Refresh page during profile wizard → State preserved or reset?
- [ ] Network error during submission → Error message shown
- [ ] API timeout → Retry or error message
- [ ] Multiple tabs open → State syncs?
- [ ] User completes profile in another tab → Modal closes?

### 5.2 Cross-Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

### 5.3 Responsive Design Testing
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)
- [ ] Modal fits on small screens
- [ ] Tour tooltips positioned correctly on mobile

### 5.4 Accessibility Testing
- [ ] Keyboard navigation works (Tab, Enter, Esc)
- [ ] Screen reader compatibility
- [ ] Focus states visible
- [ ] Color contrast meets WCAG standards
- [ ] ARIA labels present

### 5.5 Performance Testing
- [ ] Modal loads quickly
- [ ] Location API calls cached
- [ ] No memory leaks in tour
- [ ] Smooth animations
- [ ] Bundle size impact acceptable

### 5.6 Polish Checklist

#### UI/UX Polish
- [ ] Loading states for all async operations
- [ ] Smooth transitions between wizard steps
- [ ] Success feedback after completion
- [ ] Error messages are user-friendly
- [ ] Progress indicator clear and accurate
- [ ] Buttons have hover/active states
- [ ] Forms have proper focus states
- [ ] Tour tooltips readable and well-positioned

#### Copy/Content Review
- [ ] All text is clear and concise
- [ ] No typos or grammar errors
- [ ] Instructions are helpful
- [ ] Error messages are actionable
- [ ] Success messages are encouraging

#### Visual Polish
- [ ] Colors match design system exactly
- [ ] Spacing is consistent
- [ ] Border radius consistent
- [ ] Shadows match design
- [ ] Icons sized appropriately
- [ ] Typography hierarchy clear

### 5.7 Documentation

#### Code Documentation
- [ ] All components have JSDoc comments
- [ ] Complex logic explained with comments
- [ ] Type definitions are clear
- [ ] API functions documented

#### User Documentation (Optional)
- [ ] Help text in profile modal
- [ ] Tooltips for complex fields
- [ ] Link to FAQ if needed

#### Developer Documentation
- [ ] Update README with onboarding feature
- [ ] Document new API endpoints
- [ ] Document database changes
- [ ] Document environment variables (if any)

### Phase 5 Deliverables Checklist
- [ ] All testing scenarios passed
- [ ] Cross-browser testing complete
- [ ] Responsive design verified
- [ ] Accessibility standards met
- [ ] Performance acceptable
- [ ] UI polished and refined
- [ ] Content reviewed and approved
- [ ] Code documentation complete
- [ ] Developer documentation updated

---

## 🎨 Design System Reference

### Colors
```css
/* Primary Colors */
--orange-primary: #FB923C
--orange-hover: #EA7C2C
--pink-primary: #F26B8A
--pink-hover: #E15A7A

/* Neutrals */
--white: #FFFFFF
--gray-50: #F9FAFB
--gray-100: #F3F4F6
--gray-200: #E5E7EB
--gray-600: #4B5563
--gray-900: #111827

/* Feedback Colors */
--success: #10B981
--error: #EF4444
--warning: #F59E0B
--info: #3B82F6
```

### Typography
```css
/* Headings */
h1: text-2xl font-bold (24px)
h2: text-xl font-bold (20px)
h3: text-lg font-bold (18px)

/* Body */
body: text-base (16px)
small: text-sm (14px)
tiny: text-xs (12px)
```

### Spacing
```css
/* Common spacing values */
gap-2: 0.5rem (8px)
gap-3: 0.75rem (12px)
gap-4: 1rem (16px)
gap-5: 1.25rem (20px)

p-3: 0.75rem (12px)
p-4: 1rem (16px)
p-5: 1.25rem (20px)
p-6: 1.5rem (24px)
```

### Border Radius
```css
rounded-lg: 0.5rem (8px)
rounded-xl: 0.75rem (12px)
rounded-2xl: 1rem (16px)
rounded-full: 9999px
```

### Shadows
```css
shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05)
shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1)
```

---

## 🚀 Deployment Strategy

### Phase-by-Phase Deployment (Recommended)

#### Deploy Phase 1 First
1. Deploy database migration
2. Deploy backend API changes
3. Test API endpoints in production
4. Verify database updates working

**Benefits**: Backend ready, can test independently

#### Deploy Phase 2 Next
1. Deploy frontend profile modal
2. Test complete profile flow
3. Verify data saves correctly

**Benefits**: Core functionality working, can pause here if needed

#### Deploy Phase 3
1. Deploy tour components
2. Test tour flow
3. Verify tour completion tracking

**Benefits**: Optional feature, low risk

#### Deploy Phase 4
1. Deploy settings update
2. Test restart functionality

**Benefits**: Enhancement, can deploy anytime

### All-at-Once Deployment (Alternative)

1. Deploy all changes together
2. Feature flag to enable/disable onboarding
3. Gradual rollout to users

**Benefits**: Faster, but higher risk

### Rollback Plan

If issues occur after deployment:

1. **Backend Issues**:
   - Revert API changes
   - Keep migration (data safe)
   - Frontend will gracefully handle missing fields

2. **Frontend Issues**:
   - Revert frontend deployment
   - Backend still works
   - Old users unaffected

3. **Database Issues**:
   - Migration rollback available
   - Backup database before migration

---

## 📊 Success Metrics

### Key Performance Indicators

#### Completion Rates
- **Profile Completion Rate**: % of new users who complete profile
  - Target: >95%
- **Tutorial Completion Rate**: % of users who complete tour (not skip)
  - Target: >70%
- **Time to Complete**: Average time to finish profile wizard
  - Target: <3 minutes

#### User Experience
- **Drop-off Rate**: % of users who abandon during profile setup
  - Target: <5%
- **Error Rate**: % of submissions with validation errors
  - Target: <10%
- **Restart Rate**: % of users who restart tutorial from settings
  - Target: Monitor baseline

#### Technical Metrics
- **API Response Time**: Profile completion endpoint
  - Target: <500ms
- **Page Load Time**: Dashboard with onboarding components
  - Target: <2s
- **Error Logging**: Track API errors and client-side errors
  - Target: <1% error rate

### Analytics to Implement

```typescript
// Track events
analytics.track('onboarding_started', { userId })
analytics.track('onboarding_step_completed', { userId, step: 1 })
analytics.track('onboarding_completed', { userId, timeSpent })
analytics.track('tutorial_started', { userId })
analytics.track('tutorial_completed', { userId })
analytics.track('tutorial_skipped', { userId })
analytics.track('tutorial_restarted', { userId })
```

---

## 🐛 Potential Issues & Solutions

### Issue 1: Location API Slow
**Problem**: Wilayah.id API response slow, users wait long time
**Solution**:
- Implement caching (already in place)
- Add loading skeletons
- Preload provinces on page load
- Consider CDN for location data

### Issue 2: RajaOngkir Mapping Fails
**Problem**: District name doesn't match RajaOngkir database
**Solution**:
- Make RajaOngkir ID optional initially
- Allow manual entry if auto-search fails
- Provide fallback: admin can update later
- Add fuzzy matching for search

### Issue 3: Users Abandon During Wizard
**Problem**: Wizard too long, users give up
**Solution**:
- Save draft progress (optional)
- Reduce required fields if acceptable
- Add motivational copy
- Show progress clearly

### Issue 4: Bank Account Validation Too Strict
**Problem**: Some banks have different number formats
**Solution**:
- Adjust validation rules per bank
- Allow more flexibility (8-20 digits)
- Add bank-specific validation if needed

### Issue 5: Tour Blocks Important Actions
**Problem**: Users want to skip tour and do something urgent
**Solution**:
- Make tour skippable at any time
- Don't block critical actions
- Show "Resume tour" button if skipped mid-way

### Issue 6: Mobile UX Issues
**Problem**: Modal too large on mobile, hard to use
**Solution**:
- Make modal full-screen on mobile
- Adjust form layout for mobile
- Test on various screen sizes
- Consider step-by-step mobile flow

---

## 📅 Estimated Timeline

### Phase 1: Backend (2-3 hours)
- Database migration: 30 min
- Service layer: 1 hour
- API routes: 1 hour
- Testing: 30 min

### Phase 2: Profile Modal (4-5 hours)
- Setup & types: 30 min
- OnboardingProvider: 1 hour
- ProfileCompletionModal: 1 hour
- Step components: 2 hours
- Integration & testing: 1 hour

### Phase 3: Tour (2-3 hours)
- TourIntroDialog: 30 min
- DashboardTour: 1 hour
- Dashboard updates: 30 min
- Integration & testing: 1 hour

### Phase 4: Settings (1 hour)
- Settings page update: 30 min
- Testing: 30 min

### Phase 5: Testing & Polish (2-3 hours)
- Testing scenarios: 1 hour
- Bug fixes: 1 hour
- Polish & refinement: 1 hour

### Total Estimated Time: 11-15 hours

### Recommended Schedule
- **Day 1**: Phase 1 (Backend)
- **Day 2**: Phase 2 (Profile Modal)
- **Day 3**: Phase 3 (Tour) + Phase 4 (Settings)
- **Day 4**: Phase 5 (Testing & Polish)

---

## ✅ Final Checklist Before Production

### Code Quality
- [ ] All code reviewed
- [ ] No console.log or debug code
- [ ] No commented-out code
- [ ] Proper error handling everywhere
- [ ] TypeScript types correct
- [ ] No TypeScript `any` types

### Security
- [ ] Input validation on backend
- [ ] SQL injection protection (Prisma handles this)
- [ ] XSS protection
- [ ] CSRF protection if needed
- [ ] Rate limiting on API endpoints
- [ ] Authentication checks on all routes

### Performance
- [ ] No unnecessary re-renders
- [ ] API calls optimized
- [ ] Images optimized (if any)
- [ ] Bundle size acceptable
- [ ] Database queries optimized
- [ ] Indexes added where needed

### Data Integrity
- [ ] Database migration tested
- [ ] Rollback plan ready
- [ ] Backup created before migration
- [ ] Data validation on both client and server
- [ ] Transactions used where needed

### User Experience
- [ ] All flows tested end-to-end
- [ ] Error messages user-friendly
- [ ] Loading states everywhere
- [ ] Success feedback clear
- [ ] Mobile experience good
- [ ] Accessibility standards met

### Documentation
- [ ] API endpoints documented
- [ ] Code comments added
- [ ] README updated
- [ ] Change log updated
- [ ] Team notified of changes

### Monitoring
- [ ] Error logging setup
- [ ] Analytics events added
- [ ] Performance monitoring ready
- [ ] Alerts configured
- [ ] Dashboard to track metrics

---

## 📝 Notes & Considerations

### Future Enhancements (Out of Scope)
- Email verification reminder
- SMS verification for WhatsApp
- Bank account verification (with deposits)
- Multiple bank accounts management
- Profile photo upload during onboarding
- Social media links during onboarding
- Onboarding A/B testing
- Personalized tour based on user type
- Video tutorials
- Interactive product tour

### Technical Debt to Address Later
- Migrate from legacy bank fields to BankAccount table completely
- Consider splitting User model (too many fields)
- Add proper caching layer for location API
- Consider GraphQL for complex queries
- Add comprehensive logging
- Add feature flags system

### Known Limitations
- RajaOngkir mapping may not be 100% accurate
- Location API depends on external service (Wilayah.id)
- Tour may not work well on very small screens (<320px)
- Profile wizard can't be saved as draft (would need localStorage)
- No way to update profile from onboarding flow (must complete)

---

## 🤝 Team Coordination

### Roles & Responsibilities
- **Backend Developer**: Phase 1 (Database + API)
- **Frontend Developer**: Phase 2 & 3 (UI Components)
- **Full-Stack Developer**: Phase 4 & 5 (Integration + Testing)
- **Designer**: Review UI, provide assets if needed
- **QA**: Phase 5 testing
- **Product Manager**: Review flows, approve copy

### Communication Plan
- Daily standup to discuss progress
- Demo after each phase completion
- Code review before merging
- QA sign-off before production deploy

### Dependencies
- Wait for Phase 1 completion before starting Phase 2
- Can work on Phase 2 & 3 in parallel if multiple devs
- Phase 4 & 5 depend on all previous phases

---

## 📚 References

### External Documentation
- [React Joyride Docs](https://docs.react-joyride.com/)
- [Prisma Migrations](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Shadcn UI Components](https://ui.shadcn.com/)
- [Wilayah.id API](https://github.com/emsifa/api-wilayah-indonesia)
- [RajaOngkir API](https://rajaongkir.com/dokumentasi)

### Internal Documentation
- Authentication flow: `/docs/auth.md`
- API conventions: `/docs/api-conventions.md`
- Design system: `/docs/design-system.md`

---

## 📞 Questions & Support

If you encounter issues during implementation:

1. Check this document first
2. Review related code files mentioned
3. Test in isolation (unit tests)
4. Ask team for help
5. Document the solution for others

---

**Document Status**: ✅ Ready for Implementation
**Last Updated**: 2025-11-27
**Version**: 1.0
**Author**: Claude Code
**Approved By**: [Pending Approval]

---

**End of Implementation Plan**
