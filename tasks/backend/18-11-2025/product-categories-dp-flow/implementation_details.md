# Implementation Details: DP Flow & Jastiper Origin Address

**Date**: 2025-11-19
**Status**: Implemented

## 1. Jastiper Origin Address Setup

**Objective**: Allow Jastipers to set their origin address (province, city, district) to enable shipping cost calculations.

### Backend Changes
- **Schema (`prisma/schema.prisma`)**: Added fields to `User` model:
  - `originProvinceId`, `originProvinceName`
  - `originCityId`, `originCityName`
  - `originDistrictId`, `originDistrictName`
  - `originPostalCode`, `originAddressText`
- **Validators (`src/utils/validators.ts`)**: Updated `updateProfileSchema` to allow these new fields.
- **Service (`src/services/auth.service.ts`)**: Updated `updateUserProfile` to handle these fields.

### Frontend Changes
- **Component (`EditProfileDialog.tsx`)**: 
  - Added cascading dropdowns (Province -> City -> District) using `wilayah.service.ts` API.
  - Added fields for Postal Code and Address Text.
  - Integrated with the new backend schema.

## 2. Trip Payment Scheme (DP vs Full)

**Objective**: Allow Jastipers to choose between "Full Payment" and "Down Payment" schemes when creating/editing trips.

### Backend Changes
- **Schema (`prisma/schema.prisma`)**: `Trip` model already had `paymentType` (default 'full').
- **Service (`src/services/trip.service.ts`)**: Updated `createTrip` and `updateTrip` to accept `paymentType` argument.
- **Validators (`src/utils/validators.ts`)**: `createTripSchema` and `updateTripSchema` updated to validate `paymentType` enum ('full' | 'dp').

### Frontend Changes
- **Create Trip (`CreateTripDialog.tsx`)**: Added "Skema Pembayaran" selection (Radio/Card style).
- **Edit Trip (`EditTripDialog.tsx`)**: Added "Skema Pembayaran" selection.
- **Dashboard (`DashboardTrips.tsx`)**: Updated type definitions to include `paymentType`.

## 3. Verification
- **Profile**: Jastiper can now save their origin location. This data is critical for the `calculate-shipping` endpoint (already implemented in previous steps) to work correctly.
- **Trips**: New trips can be created as 'DP' flow. This triggers the frontend to use the `CheckoutDP` flow when a user purchases from that trip.
