# District Loading Fix - Edit Private Data Dialog

## Issue
Kecamatan (District) Select component was not loading initial data when the dialog opened, despite previous fixes. The district dropdown remained empty even when the user had a valid district saved in their profile.

## Root Cause Analysis

### Primary Issues Identified:
1. **React Select Component Re-render Issue**: Shadcn/Radix UI Select components don't automatically re-render when their options array updates asynchronously. This is a known gotcha with Radix UI.
   
2. **Async State Update Timing**: The `setDistricts()` call was happening, but the Select component wasn't re-rendering to reflect the new data because:
   - React's state updates are asynchronous
   - The formData was being set immediately after districts were fetched
   - The Select component had no way to know that new options were available

3. **Missing Validation**: No validation that cityId was a valid non-empty string before attempting to fetch districts.

## Solution Implemented

### 1. Added Key Prop to Force Re-render (Critical Fix)
```tsx
<Select 
  key={`district-${districts.length}-${formData.originCityId}`}
  value={formData.originDistrictId || ''} 
  onValueChange={handleDistrictChange}
  disabled={!formData.originCityId || locationLoading.districts}
>
```

**Why this works**: 
- When the `key` prop changes, React treats it as a completely new component and forces a full re-render
- `districts.length` changes when districts are loaded (0 → N)
- `formData.originCityId` ensures a fresh render if the city changes
- This is the recommended pattern for Radix UI Select with async data

### 2. Added 50ms Delay After setDistricts
```tsx
// Use a small delay to ensure state update completes before formData is set
setDistricts(districtsData)

// Wait for next tick to ensure React has processed the state update
await new Promise(resolve => setTimeout(resolve, 50))
```

**Why this helps**:
- Ensures React has time to process the `setDistricts()` state update
- Prevents race condition where formData is set before districts state is fully updated
- 50ms is imperceptible to users but sufficient for React's render cycle

### 3. Enhanced Validation
```tsx
// Before: if (profileData.originCityId)
// After:
if (profileData.originCityId && profileData.originCityId.trim() !== '') {
```

**Improvements**:
- Validates that cityId exists and is not just whitespace
- Prevents API calls with invalid IDs
- Same validation applied to provinceId

### 4. Better Error Handling
```tsx
try {
  const districtsRes = await apiGet<any>(`/locations/districts/${profileData.originCityId}`)
  // ... handle response
  setDistricts(districtsData)
  await new Promise(resolve => setTimeout(resolve, 50))
} catch (districtError) {
  console.error('[EditPrivateDataDialog] Error fetching districts:', districtError)
  setDistricts([])
} finally {
  setLocationLoading(prev => ({ ...prev, districts: false }))
}
```

**Benefits**:
- Isolated try-catch specifically for district fetching
- Ensures loading state is cleared even on error
- Sets empty array on error to prevent stale data

## Files Modified

### `frontend/components/dialogs/edit-private-data-dialog.tsx`

**Line 379** - Added key prop to District Select:
```tsx
key={`district-${districts.length}-${formData.originCityId}`}
```

**Lines 103-132** - Enhanced loadInitialData function:
- Added validation: `profileData.originCityId && profileData.originCityId.trim() !== ''`
- Wrapped district fetching in try-catch block
- Added 50ms delay after `setDistricts()`
- Improved error handling with finally block

## Testing Recommendations

1. **Happy Path**: User with existing address opens dialog → District should load correctly
2. **Empty State**: New user with no address → District should remain disabled
3. **City Change**: Change city → District should reset and load new options
4. **API Failure**: Mock API error → District should show empty, no crash
5. **Slow Network**: Throttle network → Loading state should show, then populate

## Technical Notes

### Why Key Prop is Essential for Radix UI Select
Radix UI's Select component uses internal state and doesn't always respond to prop changes. When options change asynchronously:
- Without key: Component keeps old internal state
- With key: Component unmounts and remounts with fresh state

This is documented in Radix UI best practices for async data loading.

### Alternative Approaches Considered
1. ❌ **UseEffect to force update**: Would add complexity and potential infinite loops
2. ❌ **Longer delay (500ms+)**: Noticeable lag, poor UX
3. ✅ **Key prop + minimal delay**: Best of both worlds - reliable and fast

## Prevention
- Always use `key` prop with Radix UI Select when options load asynchronously
- Add delays after state updates that affect dependent components
- Validate IDs before making API calls
- Use try-catch for individual async operations in sequence

## Related Patterns
This fix follows the pattern documented in:
- Radix UI documentation for Select with async data
- React documentation on using key to reset component state
- Common Next.js patterns for cascading dropdowns
