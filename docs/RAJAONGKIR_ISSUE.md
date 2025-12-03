# RajaOngkir Shipping Calculation Issue

## Problem
**Endpoint `/calculate/district/domestic-cost` returns 422 error** with message "Origin or Destination not found"

## Root Cause
RajaOngkir Komerce API has two levels:
1. **Search API** (`/destination/domestic-destination`) returns **subdistrict IDs** (e.g., 17486, 61995)
2. **Calculate API** (`/calculate/district/domestic-cost`) does NOT accept subdistrict IDs

## Test Results

### Search Results (works)
- Kebon Jeruk: ID 17486 (subdistrict level)
- Jumapolo: ID 61995 (subdistrict level)

### Calculate Cost with District IDs (fails - 422)
```bash
POST /calculate/district/domestic-cost
origin=17486&destination=61995&weight=1000&courier=jne
→ 422 "Origin or Destination not found"
```

### Calculate Cost with City IDs (works!)
```bash
POST /calculate/domestic-cost  # City-level endpoint
origin=151&destination=180&weight=1000&courier=jne
→ 200 OK with shipping options
```

## Solution Options

### Option 1: Use City-Level Calculation (RECOMMENDED)
- Use endpoint `/calculate/domestic-cost` instead of `/calculate/district/domestic-cost`
- Requires city ID mapping (Jakarta Barat=151, Karanganyar=180, etc.)
- Less accurate but WORKS

### Option 2: Find Correct District-Level API
- Research if there's a different endpoint for district-level with subdistrict IDs
- May require Pro/Enterprise API access

### Option 3: Manual City ID Database
- Build mapping table: CityName → CityID
- Extract from RajaOngkir city list endpoint

## City ID Mapping (Partial)
```
Jakarta Barat (Kota Administrasi Jakarta Barat) → 151
Karanganyar (Kabupaten Karanganyar) → 180
```

## Next Steps
1. Switch to city-level calculation endpoint
2. Add city ID mapping table
3. Update `calculateShippingCost` to use city IDs
4. Update `autoMapToRajaOngkir` to return city IDs instead of subdistrict IDs

## Files to Modify
- `/app/backend/src/services/rajaongkir.service.ts`
- `/app/backend/src/routes/orders.ts` (pass city names to calculateShippingCost)
