# Jastipin API Documentation

**Last Updated:** 2025-12-11  
**Project:** Jastipin Backend  
**Total Endpoints:** 68  
**API Base URL:** `/api`

---

## Table of Contents

1. [Authentication APIs](#authentication-apis)
2. [Health & Monitoring](#health--monitoring)
3. [Profile & User Management](#profile--user-management)
4. [Trip Management](#trip-management)
5. [Products](#products)
6. [Orders & Checkout](#orders--checkout)
7. [Payments & Webhooks](#payments--webhooks)
8. [Participants](#participants)
9. [Locations & Shipping](#locations--shipping)
10. [Bank Accounts](#bank-accounts)
11. [Social Media](#social-media)
12. [Password Reset](#password-reset)
13. [File Upload](#file-upload)
14. [Analytics](#analytics)
15. [Onboarding](#onboarding)
16. [Workers & Background Jobs](#workers--background-jobs)
17. [Error Response Formats](#error-response-formats)

---

## Authentication APIs

### POST /auth/register
Register new user with email and password

**Rate Limiting:** 3 attempts per hour  
**Authentication:** None (Public)  
**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "fullName": "John Doe"
}
```

**Validation Rules:**
- Email: Valid email format
- Password: Minimum 8 characters
- Full Name: At least 2 characters

**Success Response (201):**
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "slug": "john-doe-xxxxx",
    "profileName": "John Doe",
    "createdAt": "2025-12-11T10:00:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Missing required fields | Email, password, or fullName missing |
| 400 | Invalid email format | Email format validation failed |
| 400 | Password too short | Password less than 8 characters |
| 409 | Email already registered | Email exists in database |
| 429 | Too many registration attempts | Rate limit exceeded (3/hour) |
| 500 | Registration failed | Server error |

---

### POST /auth/login
Authenticate user with email and password

**Rate Limiting:** 5 attempts per 15 minutes  
**Authentication:** None (Public)  
**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Success Response (200):**
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "slug": "john-doe-xxxxx",
    "profileName": "John Doe"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Invalid email or password | Email/password format validation failed |
| 401 | Authentication failed | Invalid credentials (generic for security) |
| 429 | Too many login attempts | Rate limit exceeded (5/15min) |
| 500 | Login failed | Server error |

**Set-Cookie:**
- `refreshToken` (httpOnly, 7 days)

---

### POST /auth/refresh
Get new access token using refresh token

**Rate Limiting:** 10 attempts per 5 minutes  
**Authentication:** None (Public)  
**Request Methods:** Cookie or Body

**Request Body (Option 1 - Cookie):**
```
Cookie: refreshToken=xxx
```

**Request Body (Option 2 - Body):**
```json
{
  "refreshToken": "refresh_token_value"
}
```

**Success Response (200):**
```json
{
  "token": "new_access_token_jwt"
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 401 | Refresh token not provided | Token missing in cookie or body |
| 401 | Invalid or expired refresh token | Token validation failed |
| 429 | Too many refresh attempts | Rate limit exceeded (10/5min) |
| 500 | Token refresh failed | Server error |

---

### POST /auth/logout
Clear refresh token cookie

**Authentication:** None (Public)  
**Request Headers:** None required

**Success Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

---

### POST /auth/sync-user
Sync OAuth user to database and generate app JWT token

**Authentication:** None (Public)  
**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer supabase_access_token (optional)
```

**Request Body:**
```json
{
  "id": "supabase_user_id",
  "email": "user@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "db_user_id",
    "email": "user@example.com",
    "slug": "user-slug"
  },
  "token": "app_jwt_token"
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Missing required fields | id or email missing |
| 500 | Failed to sync user | Database or JWT generation error |

---

### GET /auth/check-username/:username
Check if username is available

**Rate Limiting:** 20 attempts per minute  
**Authentication:** None (Public)  
**Path Parameters:**
- `username` (string): Username to check (alphanumeric, dash, underscore only)

**Validation:**
- Length: 3-30 characters
- Format: Lowercase letters, numbers, dash, underscore only

**Success Response - Available (200):**
```json
{
  "available": true,
  "message": "Username \"john_doe\" tersedia!",
  "username": "john_doe"
}
```

**Success Response - Taken (200):**
```json
{
  "available": false,
  "message": "Username \"john_doe\" sudah digunakan",
  "username": "john_doe"
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Invalid username format | Contains invalid characters |
| 400 | Username length invalid | Less than 3 or more than 30 chars |
| 429 | Too many checks | Rate limit exceeded (20/min) |
| 500 | Username check failed | Server error |

---

## Health & Monitoring

### GET /health/status
Comprehensive health check including database, memory, uptime

**Authentication:** None (Public)

**Success Response (200):**
```json
{
  "status": "healthy",
  "database": "connected",
  "memory": {
    "usage": "256MB",
    "limit": "512MB"
  },
  "uptime": "86400 seconds",
  "timestamp": "2025-12-11T10:00:00Z"
}
```

**Error Response (503):**
```json
{
  "status": "unhealthy",
  "error": "Database connection failed",
  "timestamp": "2025-12-11T10:00:00Z"
}
```

---

### GET /health/quick
Quick health check (minimal response)

**Authentication:** None (Public)

**Success Response (200):**
```json
{
  "status": "up",
  "timestamp": "2025-12-11T10:00:00Z",
  "uptime": "86400 seconds"
}
```

---

## Profile & User Management

### GET /profile
Get authenticated user's profile

**Authentication:** Required (Bearer Token)

**Success Response (200):**
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "slug": "john-doe-xxxxx",
  "profileName": "John Doe",
  "avatar": "https://cdn.example.com/avatars/user_id.jpg",
  "whatsappNumber": "628123456789",
  "isProfileComplete": true,
  "profileDesign": {
    "layoutId": "layout1",
    "themeId": "theme1"
  },
  "createdAt": "2025-12-11T10:00:00Z"
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 401 | Unauthorized | Invalid or missing token |
| 404 | User not found | User doesn't exist |
| 500 | Failed to fetch profile | Server error |

---

### PATCH /profile
Update authenticated user's profile

**Authentication:** Required (Bearer Token)

**Request Body:**
```json
{
  "profileName": "Jane Doe",
  "avatar": "https://cdn.example.com/avatars/new.jpg",
  "whatsappNumber": "628123456789"
}
```

**Success Response (200):**
```json
{
  "id": "user_id",
  "profileName": "Jane Doe",
  "avatar": "https://cdn.example.com/avatars/new.jpg",
  "whatsappNumber": "628123456789"
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Invalid data | Validation failed |
| 401 | Unauthorized | Invalid token |
| 500 | Failed to update profile | Server error |

---

### PATCH /profile/design
Update profile design (layout and theme)

**Authentication:** Required (Bearer Token)

**Request Body:**
```json
{
  "layoutId": "layout2",
  "themeId": "theme2"
}
```

**Success Response (200):**
```json
{
  "id": "design_id",
  "layoutId": "layout2",
  "themeId": "theme2",
  "updatedAt": "2025-12-11T10:00:00Z"
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Invalid layout/theme | Unknown IDs |
| 401 | Unauthorized | Invalid token |
| 404 | Design not found | User design not created |
| 500 | Failed to update | Server error |

---

### GET /profile/:slug
Get public profile by user slug (no auth required)

**Authentication:** Optional (Public)

**Path Parameters:**
- `slug` (string): User's unique slug

**Success Response (200):**
```json
{
  "id": "user_id",
  "slug": "john-doe-xxxxx",
  "profileName": "John Doe",
  "avatar": "https://cdn.example.com/avatars/user_id.jpg",
  "profileDesign": {
    "layoutId": "layout1",
    "themeId": "theme1"
  },
  "tripCount": 5,
  "productCount": 23
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 404 | User not found | Slug doesn't exist |
| 500 | Failed to fetch | Server error |

---

### GET /profile/:slug/products/:productSlug
Get product detail from public profile

**Authentication:** Optional (Public)

**Path Parameters:**
- `slug` (string): User's slug
- `productSlug` (string): Product slug

**Query Parameters:**
- `tripId` (string, optional): Specific trip ID to avoid ambiguity

**Success Response (200):**
```json
{
  "product": {
    "id": "product_id",
    "slug": "product-slug",
    "title": "Product Name",
    "price": 50000,
    "description": "Product details",
    "image": "https://cdn.example.com/products/xxx.jpg",
    "stock": 10,
    "available": true,
    "unit": "pcs",
    "weightGram": 500,
    "type": "goods"
  },
  "trip": {
    "id": "trip_id",
    "title": "Trip to Japan",
    "status": "Buka",
    "paymentType": "dp"
  },
  "jastiper": {
    "slug": "john-doe-xxxxx",
    "profileName": "John Doe",
    "avatar": "https://cdn.example.com/avatars/xxx.jpg"
  }
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 404 | User not found | Slug doesn't exist |
| 404 | Product not found | Product slug doesn't exist |
| 500 | Failed to fetch | Server error |

---

### POST /profile/change-password
Change authenticated user's password

**Authentication:** Required (Bearer Token)

**Request Body:**
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword456!"
}
```

**Validation:**
- Current password must be correct
- New password: minimum 8 characters

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Invalid current password | Password doesn't match |
| 400 | Password too short | New password < 8 chars |
| 401 | Unauthorized | Invalid token |
| 500 | Failed to change | Server error |

---

### PATCH /profile/origin
Update jastiper's origin address with automatic RajaOngkir mapping

**Authentication:** Required (Bearer Token)

**Request Body:**
```json
{
  "originProvinceId": "province_id",
  "originProvinceName": "Jawa Barat",
  "originCityId": "city_id",
  "originCityName": "Bandung",
  "originDistrictId": "district_id",
  "originDistrictName": "Bandung Kulon"
}
```

**Required Fields:**
- originDistrictId
- originDistrictName
- originCityName

**Success Response (200):**
```json
{
  "success": true,
  "message": "Origin address updated successfully",
  "data": {
    "id": "user_id",
    "originProvinceId": "province_id",
    "originProvinceName": "Jawa Barat",
    "originCityName": "Bandung",
    "originDistrictName": "Bandung Kulon",
    "originRajaOngkirDistrictId": "12345"
  },
  "rajaOngkirMapped": true
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Missing required fields | District info missing |
| 401 | Unauthorized | Invalid token |
| 500 | Failed to update | Server error |

---

## Trip Management

### POST /trips
Create new trip for authenticated user

**Authentication:** Required (Bearer Token)  
**Rate Limiting:** No specific limit

**Request Body:**
```json
{
  "title": "Trip to Japan 2025",
  "startDate": "2025-06-01",
  "description": "Summer vacation to Japan",
  "paymentType": "dp",
  "dpPercentage": 50,
  "url_img": "https://cdn.example.com/images/japan.jpg",
  "slug": "trip-japan-2025"
}
```

**Validation:**
- title: Required, string
- startDate: Required, valid date
- paymentType: Required, "dp" or "full"
- dpPercentage: 10-100 if paymentType is "dp"
- slug: Optional, auto-generated if not provided

**Success Response (201):**
```json
{
  "id": "trip_id",
  "title": "Trip to Japan 2025",
  "slug": "trip-japan-initial",
  "startDate": "2025-06-01T00:00:00Z",
  "description": "Summer vacation to Japan",
  "paymentType": "dp",
  "dpPercentage": 50,
  "isActive": false,
  "url_img": "https://cdn.example.com/images/japan.jpg",
  "jastiperId": "user_id",
  "createdAt": "2025-12-11T10:00:00Z"
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Missing required fields | Title or startDate missing |
| 400 | Invalid date format | startDate not valid |
| 401 | Unauthorized | Invalid token |
| 500 | Failed to create | Server error |

---

### GET /trips
List all trips for authenticated user

**Authentication:** Required (Bearer Token)

**Success Response (200):**
```json
[
  {
    "id": "trip_id",
    "title": "Trip to Japan",
    "slug": "trip-japan-xxxxx",
    "startDate": "2025-06-01T00:00:00Z",
    "paymentType": "dp",
    "dpPercentage": 50,
    "isActive": true,
    "url_img": "https://cdn.example.com/images/japan.jpg",
    "productCount": 5,
    "orderCount": 12,
    "createdAt": "2025-12-11T10:00:00Z"
  }
]
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 401 | Unauthorized | Invalid token |
| 500 | Failed to fetch | Server error |

---

### GET /trips/:id/public
Get PUBLIC trip details for guest checkout (no auth required)

**Authentication:** None (Public)

**Path Parameters:**
- `id` (string): Trip ID

**Success Response (200):**
```json
{
  "id": "trip_id",
  "title": "Trip to Japan",
  "paymentType": "dp",
  "dpPercentage": 50,
  "jastiper": {
    "slug": "john-doe-xxxxx",
    "name": "John Doe"
  }
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 404 | Trip not found | Trip doesn't exist |
| 500 | Failed to fetch | Server error |

---

### GET /trips/:id
Get trip details with products and participants (AUTHENTICATED)

**Authentication:** Required (Bearer Token)

**Path Parameters:**
- `id` (string): Trip ID

**Success Response (200):**
```json
{
  "id": "trip_id",
  "title": "Trip to Japan",
  "slug": "trip-japan-xxxxx",
  "description": "Summer vacation",
  "startDate": "2025-06-01T00:00:00Z",
  "paymentType": "dp",
  "dpPercentage": 50,
  "products": [
    {
      "id": "product_id",
      "title": "Cosmetics Kit",
      "price": 50000,
      "stock": 10
    }
  ],
  "participants": [
    {
      "id": "participant_id",
      "name": "Jane Doe",
      "phone": "628123456789",
      "orderCount": 3
    }
  ]
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 401 | Unauthorized | Invalid token |
| 403 | Not authorized | User is not trip owner |
| 404 | Trip not found | Trip doesn't exist |
| 500 | Failed to fetch | Server error |

---

### GET /trips/:id/products
Get PUBLIC products for a trip (no auth required for guest checkout)

**Authentication:** None (Public)

**Path Parameters:**
- `id` (string): Trip ID

**Query Parameters:**
- `ids` (string, optional): Comma-separated product IDs to filter (e.g., "id1,id2,id3")

**Success Response (200):**
```json
[
  {
    "id": "product_id",
    "title": "Cosmetics Kit",
    "price": 50000,
    "type": "goods",
    "unit": "pcs",
    "stock": 10,
    "isUnlimitedStock": false,
    "image": "https://cdn.example.com/products/xxx.jpg",
    "description": "Premium cosmetics"
  }
]
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Invalid IDs format | IDs parameter malformed |
| 404 | Trip not found | Trip doesn't exist |
| 500 | Failed to fetch | Server error |

---

### PATCH /trips/:id
Update trip (owner only)

**Authentication:** Required (Bearer Token)

**Path Parameters:**
- `id` (string): Trip ID

**Request Body:**
```json
{
  "title": "Updated Trip Title",
  "description": "Updated description",
  "startDate": "2025-07-01",
  "paymentType": "full",
  "dpPercentage": 30
}
```

**Success Response (200):**
```json
{
  "id": "trip_id",
  "title": "Updated Trip Title",
  "isActive": true,
  "startDate": "2025-07-01T00:00:00Z"
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 401 | Unauthorized | Invalid token |
| 403 | Not authorized | User is not trip owner |
| 404 | Trip not found | Trip doesn't exist |
| 500 | Failed to update | Server error |

---

### DELETE /trips/:id
Delete trip (owner only)

**Authentication:** Required (Bearer Token)

**Path Parameters:**
- `id` (string): Trip ID

**Success Response (200):**
```json
{
  "message": "Trip deleted successfully"
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 401 | Unauthorized | Invalid token |
| 403 | Not authorized | User is not trip owner |
| 404 | Trip not found | Trip doesn't exist |
| 500 | Failed to delete | Server error |

---

## Products

### POST /products
Create new product

**Authentication:** Required (Bearer Token)

**Request Body:**
```json
{
  "tripId": "trip_id",
  "title": "Cosmetics Kit",
  "price": 50000,
  "description": "Premium cosmetics from Japan",
  "image": "https://cdn.example.com/products/xxx.jpg",
  "stock": 10,
  "isUnlimitedStock": false,
  "type": "goods",
  "unit": "pcs",
  "weightGram": 500,
  "markupType": "percent",
  "markupValue": 10
}
```

**Validation:**
- tripId: Required, must belong to authenticated user
- title: Required, string
- price: Required, positive number
- stock: Required if isUnlimitedStock is false
- weightGram: Optional for shipping calculation

**Success Response (201):**
```json
{
  "id": "product_id",
  "tripId": "trip_id",
  "title": "Cosmetics Kit",
  "slug": "cosmetics-kit",
  "price": 50000,
  "description": "Premium cosmetics from Japan",
  "image": "https://cdn.example.com/products/xxx.jpg",
  "stock": 10,
  "isUnlimitedStock": false,
  "type": "goods",
  "unit": "pcs",
  "weightGram": 500,
  "createdAt": "2025-12-11T10:00:00Z"
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Missing required fields | tripId, title, or price missing |
| 400 | Invalid trip ID | Trip doesn't exist |
| 401 | Unauthorized | Invalid token |
| 403 | Not authorized | User doesn't own trip |
| 500 | Failed to create | Server error |

---

### GET /products
List all user's products

**Authentication:** Required (Bearer Token)

**Success Response (200):**
```json
[
  {
    "id": "product_id",
    "tripId": "trip_id",
    "title": "Cosmetics Kit",
    "slug": "cosmetics-kit",
    "price": 50000,
    "stock": 10,
    "isUnlimitedStock": false,
    "type": "goods",
    "Trip": {
      "id": "trip_id",
      "title": "Trip to Japan"
    }
  }
]
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 401 | Unauthorized | Invalid token |
| 500 | Failed to fetch | Server error |

---

### PATCH /products/:productId
Update product (trip owner only)

**Authentication:** Required (Bearer Token)

**Path Parameters:**
- `productId` (string): Product ID

**Request Body:**
```json
{
  "title": "Updated Product",
  "price": 60000,
  "stock": 20,
  "isUnlimitedStock": true
}
```

**Success Response (200):**
```json
{
  "id": "product_id",
  "title": "Updated Product",
  "price": 60000,
  "stock": null,
  "isUnlimitedStock": true
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 401 | Unauthorized | Invalid token |
| 403 | Not authorized | User doesn't own trip |
| 404 | Product not found | Product doesn't exist |
| 500 | Failed to update | Server error |

---

### DELETE /products/:productId
Delete product (trip owner only)

**Authentication:** Required (Bearer Token)

**Path Parameters:**
- `productId` (string): Product ID

**Success Response (200):**
```json
{
  "message": "Product deleted successfully"
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 401 | Unauthorized | Invalid token |
| 403 | Not authorized | User doesn't own trip |
| 404 | Product not found | Product doesn't exist |
| 500 | Failed to delete | Server error |

---

## Orders & Checkout

### POST /trips/:tripId/orders
Create order for a product (guest or participant)

**Authentication:** None (Public)

**Path Parameters:**
- `tripId` (string): Trip ID

**Request Body:**
```json
{
  "productId": "product_id",
  "quantity": 2,
  "participantName": "Jane Doe",
  "participantEmail": "jane@example.com",
  "participantPhone": "628123456789",
  "participantAddress": "Jl. Example No. 123",
  "notes": "Please deliver carefully"
}
```

**Validation:**
- productId: Required, must exist in trip
- quantity: Required, positive integer
- participantPhone: Will auto-add 62 prefix if missing
- Stock validation: Quantity must not exceed available stock

**Success Response (201):**
```json
{
  "id": "order_id",
  "participantId": "participant_id",
  "productId": "product_id",
  "quantity": 2,
  "totalPrice": 100000,
  "notes": "Please deliver carefully",
  "status": "pending_dp",
  "Participant": {
    "id": "participant_id",
    "name": "Jane Doe",
    "phone": "628123456789"
  },
  "createdAt": "2025-12-11T10:00:00Z"
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Missing required fields | productId or quantity missing |
| 400 | Insufficient stock available | Quantity > available stock |
| 404 | Trip not found | Trip doesn't exist |
| 404 | Product not found | Product doesn't exist in trip |
| 500 | Failed to create | Server error |

---

### POST /trips/:tripId/checkout
Process checkout with multiple items (guest or participant)

**Authentication:** None (Public)

**Path Parameters:**
- `tripId` (string): Trip ID

**Request Body:**
```json
{
  "participantName": "Jane Doe",
  "participantEmail": "jane@example.com",
  "participantPhone": "628123456789",
  "participantAddress": "Jl. Example No. 123",
  "items": [
    {
      "productId": "product_id_1",
      "quantity": 2
    },
    {
      "productId": "product_id_2",
      "quantity": 1
    }
  ]
}
```

**Validation:**
- All participant fields required
- items: Array with at least 1 product
- Each item must have productId and quantity

**Success Response (201):**
```json
{
  "success": true,
  "message": "Checkout completed successfully",
  "participant": {
    "id": "participant_id",
    "name": "Jane Doe",
    "phone": "628123456789"
  },
  "orders": [
    {
      "id": "order_id",
      "status": "pending_dp",
      "totalPrice": 100000
    }
  ],
  "summary": {
    "totalItems": 2,
    "totalPrice": 100000
  }
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Missing required fields | Participant info missing |
| 400 | Invalid items array | No items or invalid structure |
| 400 | Stock insufficient | Quantity exceeds available stock |
| 404 | Trip not found | Trip doesn't exist |
| 500 | Failed to checkout | Server error |

---

### GET /trips/:tripId/checkout/summary/:phone
Get checkout summary for a participant (guest or user)

**Authentication:** None (Public)

**Path Parameters:**
- `tripId` (string): Trip ID
- `phone` (string): Participant phone number

**Success Response (200):**
```json
{
  "participant": {
    "id": "participant_id",
    "name": "Jane Doe",
    "phone": "628123456789"
  },
  "orders": [
    {
      "id": "order_id",
      "totalPrice": 100000,
      "status": "pending_dp"
    }
  ],
  "summary": {
    "totalItems": 3,
    "totalPrice": 150000
  }
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 404 | Participant not found | No orders for this phone |
| 500 | Failed to fetch | Server error |

---

### GET /trips/:tripId/orders
List all orders in trip (trip owner only)

**Authentication:** Required (Bearer Token)

**Path Parameters:**
- `tripId` (string): Trip ID

**Success Response (200):**
```json
[
  {
    "id": "order_id",
    "participantId": "participant_id",
    "productId": "product_id",
    "quantity": 2,
    "totalPrice": 100000,
    "status": "pending_dp",
    "createdAt": "2025-12-11T10:00:00Z",
    "Participant": {
      "name": "Jane Doe",
      "phone": "628123456789"
    },
    "Product": {
      "title": "Cosmetics Kit",
      "price": 50000
    }
  }
]
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 401 | Unauthorized | Invalid token |
| 403 | Not authorized | User doesn't own trip |
| 404 | Trip not found | Trip doesn't exist |
| 500 | Failed to fetch | Server error |

---

### GET /trips/:tripId/orders/:orderId
Get order details

**Authentication:** Required (Bearer Token)

**Path Parameters:**
- `tripId` (string): Trip ID
- `orderId` (string): Order ID

**Success Response (200):**
```json
{
  "id": "order_id",
  "participantId": "participant_id",
  "productId": "product_id",
  "quantity": 2,
  "totalPrice": 100000,
  "status": "pending_dp",
  "dpAmount": 50000,
  "finalAmount": 50000,
  "Participant": {
    "name": "Jane Doe",
    "phone": "628123456789"
  },
  "Product": {
    "title": "Cosmetics Kit",
    "price": 50000
  }
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 401 | Unauthorized | Invalid token |
| 404 | Order not found | Order doesn't exist |
| 500 | Failed to fetch | Server error |

---

### PATCH /trips/:tripId/orders/:orderId
Update order status (confirm/reject) - trip owner only

**Authentication:** Required (Bearer Token)

**Path Parameters:**
- `tripId` (string): Trip ID
- `orderId` (string): Order ID

**Request Body:**
```json
{
  "status": "confirmed",
  "rejectionReason": null
}
```

**Success Response (200):**
```json
{
  "id": "order_id",
  "status": "confirmed",
  "totalPrice": 100000
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 401 | Unauthorized | Invalid token |
| 403 | Not authorized | User doesn't own trip |
| 404 | Order not found | Order doesn't exist |
| 500 | Failed to update | Server error |

---

### DELETE /trips/:tripId/orders/:orderId
Cancel order (trip owner only)

**Authentication:** Required (Bearer Token)

**Path Parameters:**
- `tripId` (string): Trip ID
- `orderId` (string): Order ID

**Success Response (200):**
```json
{
  "message": "Order cancelled successfully"
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 401 | Unauthorized | Invalid token |
| 403 | Not authorized | User doesn't own trip |
| 404 | Order not found | Order doesn't exist |
| 500 | Failed to cancel | Server error |

---

### POST /orders/:orderId/validate
Jastiper validates order and sets final price

**Authentication:** Required (Bearer Token)  
**Authorization:** Jastiper only

**Path Parameters:**
- `orderId` (string): Order ID

**Request Body:**
```json
{
  "action": "accept",
  "shippingFee": 25000,
  "serviceFee": 5000,
  "rejectionReason": null
}
```

**Validation:**
- action: Required, "accept" or "reject"
- shippingFee: Required if action is "accept"
- serviceFee: Optional, defaults to 0
- rejectionReason: Required if action is "reject"

**Success Response (200):**
```json
{
  "success": true,
  "order": {
    "id": "order_id",
    "status": "validated",
    "totalPrice": 130000,
    "shippingFee": 25000,
    "serviceFee": 5000
  }
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Invalid action | Action not "accept" or "reject" |
| 401 | Unauthorized | Not authenticated |
| 403 | Forbidden | Not the jastiper |
| 404 | Order not found | Order doesn't exist |
| 500 | Validation failed | Server error |

---

### POST /orders/:orderId/approve-final
Jastiper approves final payment proof

**Authentication:** Required (Bearer Token)  
**Authorization:** Jastiper only

**Path Parameters:**
- `orderId` (string): Order ID

**Request Body:**
```json
{
  "action": "accept",
  "rejectionReason": null
}
```

**Validation:**
- action: Required, "accept" or "reject"
- Order status must be "awaiting_final_validation"

**Success Response (200):**
```json
{
  "success": true,
  "message": "Final payment approved successfully",
  "order": {
    "id": "order_id",
    "status": "paid"
  }
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Invalid action | Action not "accept" or "reject" |
| 400 | Invalid order status | Order not in awaiting_final_validation |
| 401 | Unauthorized | Not authenticated |
| 403 | Forbidden | Not the trip owner |
| 404 | Order not found | Order doesn't exist |
| 500 | Approval failed | Server error |

---

### GET /orders/:orderId/invoice
Get invoice data for an order (PUBLIC)

**Authentication:** None (Public)

**Path Parameters:**
- `orderId` (string): Order ID

**Success Response (200):**
```json
{
  "success": true,
  "invoice": {
    "invoiceId": "order_id",
    "invoiceNumber": "INV/2025/12/ABCD1234",
    "orderCode": "ORD-001",
    "date": "11 Desember 2025",
    "status": "Lunas",
    "customer": {
      "name": "Jane Doe",
      "whatsapp": "628123456789",
      "email": "jane@example.com"
    },
    "items": [
      {
        "name": "Cosmetics Kit",
        "quantity": 2,
        "price": 50000,
        "subtotal": 100000
      }
    ],
    "subtotal": 100000,
    "shippingFee": 25000,
    "serviceFee": 5000,
    "total": 130000
  }
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 404 | Order not found | Order doesn't exist |
| 500 | Failed to fetch | Server error |

---

### GET /orders/:orderId/breakdown
Get price breakdown for an order (PUBLIC)

**Authentication:** None (Public)

**Path Parameters:**
- `orderId` (string): Order ID

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "orderId": "order_id",
    "status": "paid",
    "dpAmount": 65000,
    "finalAmount": 65000,
    "totalPrice": 130000,
    "fees": {
      "shippingFee": 25000,
      "serviceFee": 5000,
      "platformCommission": 5000
    }
  }
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 404 | Order not found | Order doesn't exist |
| 500 | Failed to fetch | Server error |

---

### POST /orders/:orderId/calculate-shipping
Calculate shipping cost using RajaOngkir

**Authentication:** Required (Bearer Token)  
**Authorization:** Jastiper only

**Path Parameters:**
- `orderId` (string): Order ID

**Request Body:**
```json
{
  "courier": "jne:tiki:pos:jnt"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "origin": {
      "districtId": "district_id",
      "rajaOngkirDistrictId": "12345",
      "districtName": "Bandung Kulon",
      "cityName": "Bandung"
    },
    "destination": {
      "districtId": "dest_district_id",
      "rajaOngkirDistrictId": "54321",
      "districtName": "Jakarta Pusat"
    },
    "weight": 1000,
    "options": [
      {
        "courier": "jne",
        "service": "REG",
        "description": "Regular",
        "cost": 25000,
        "etd": "2-3"
      }
    ],
    "recommendedOption": {
      "courier": "jne",
      "service": "REG",
      "cost": 25000
    }
  }
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Order has no address | Delivery address not set |
| 400 | Origin not configured | Jastiper hasn't set origin |
| 401 | Unauthorized | Not authenticated |
| 403 | Forbidden | Not the trip owner |
| 404 | Order not found | Order doesn't exist |
| 500 | Calculation failed | Server error |

---

### GET /orders/pending-count
Get count of orders pending validation

**Authentication:** Required (Bearer Token)  
**Authorization:** Jastiper only

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "awaitingDPValidation": 5,
    "awaitingFinalValidation": 2,
    "total": 7
  }
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 401 | Unauthorized | Not authenticated |
| 500 | Failed to count | Server error |

---

### GET /orders
Get orders for authenticated jastiper with optional filtering

**Authentication:** Required (Bearer Token)  
**Authorization:** Jastiper only

**Query Parameters:**
- `status` (string, optional): Filter by order status
- `search` (string, optional): Search by participant name, phone, or order ID
- `limit` (number, optional): Max results, default 100, max 500
- `offset` (number, optional): Pagination offset, default 0

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "order_id",
      "orderCode": "ORD-001",
      "status": "validated",
      "dpAmount": 65000,
      "totalPrice": 130000,
      "createdAt": "2025-12-11T10:00:00Z",
      "Participant": {
        "name": "Jane Doe",
        "phone": "628123456789"
      },
      "OrderItem": [
        {
          "quantity": 2,
          "priceAtOrder": 50000,
          "Product": {
            "title": "Cosmetics Kit"
          }
        }
      ]
    }
  ],
  "pagination": {
    "total": 50,
    "limit": 100,
    "offset": 0,
    "page": 1,
    "totalPages": 1
  }
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Invalid limit/offset | Limit out of range or negative offset |
| 401 | Unauthorized | Not authenticated |
| 500 | Failed to fetch | Server error |

---

### POST /api/checkout/dp
Create order with DP payment (minimal checkout)

**Authentication:** None (Public)

**Request Body:**
```json
{
  "tripId": "trip_id",
  "participantPhone": "628123456789",
  "participantName": "Jane Doe",
  "participantEmail": "jane@example.com",
  "rememberMe": true,
  "address": {
    "recipientName": "Jane Doe",
    "phone": "628123456789",
    "addressText": "Jl. Example No. 123",
    "provinceId": "province_id",
    "provinceName": "DKI Jakarta",
    "cityId": "city_id",
    "cityName": "Jakarta Pusat",
    "districtId": "district_id",
    "districtName": "Jakarta Pusat",
    "postalCode": "12000"
  },
  "items": [
    {
      "productId": "product_id",
      "quantity": 2
    }
  ]
}
```

**Validation:**
- tripId, participantPhone, participantName required
- items array with at least 1 product
- address: All fields required if provided

**Success Response (201):**
```json
{
  "success": true,
  "participant": {
    "id": "participant_id",
    "name": "Jane Doe",
    "phone": "628123456789"
  },
  "orders": [
    {
      "id": "order_id",
      "status": "pending_dp",
      "dpAmount": 65000
    }
  ]
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Missing required fields | tripId, phone, or name missing |
| 400 | Invalid items array | No items or missing fields |
| 400 | Missing address fields | Required address field missing |
| 404 | Trip not found | Trip doesn't exist |
| 500 | Checkout failed | Server error |

---

### GET /api/checkout/order/:orderId
Get order summary for payment confirmation page

**Authentication:** None (Public)

**Path Parameters:**
- `orderId` (string): Order ID

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "orderId": "order_id",
    "status": "pending_dp",
    "dpAmount": 65000,
    "totalPrice": 130000,
    "items": [
      {
        "name": "Cosmetics Kit",
        "quantity": 2,
        "price": 50000
      }
    ]
  }
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 404 | Order not found | Order doesn't exist |
| 500 | Failed to fetch | Server error |

---

## Payments & Webhooks

### POST /api/webhooks/payment/dp
Payment gateway callback for DP payment

**Authentication:** Signature verification (TODO)

**Request Body:**
```json
{
  "orderId": "order_id",
  "status": "paid",
  "paymentId": "payment_id"
}
```

**Valid Status Values:**
- `paid` or `success`: Mark order as paid
- `failed` or `expired`: Cancel order and release stock

**Success Response (200):**
```json
{
  "success": true,
  "message": "DP payment received",
  "data": {
    "id": "order_id",
    "status": "awaiting_validation"
  }
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Missing required fields | orderId or status missing |
| 400 | Invalid order status | Order not in pending_dp |
| 404 | Order not found | Order doesn't exist |
| 500 | Webhook processing failed | Server error |

---

### POST /api/webhooks/payment/final
Payment gateway callback for final payment

**Authentication:** Signature verification (TODO)

**Request Body:**
```json
{
  "orderId": "order_id",
  "status": "paid",
  "paymentId": "payment_id"
}
```

**Valid Status Values:**
- `paid` or `success`: Mark order as confirmed
- `failed` or `expired`: Revert to awaiting_validation

**Success Response (200):**
```json
{
  "success": true,
  "message": "Final payment received, order confirmed",
  "data": {
    "id": "order_id",
    "status": "confirmed"
  }
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Missing required fields | orderId or status missing |
| 400 | Invalid order status | Order not in awaiting_payment |
| 404 | Order not found | Order doesn't exist |
| 500 | Webhook processing failed | Server error |

---

## Participants

### POST /trips/:tripId/participants
Join trip as participant

**Authentication:** Required (Bearer Token)

**Path Parameters:**
- `tripId` (string): Trip ID

**Request Body:**
```json
{
  "phone": "628123456789",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "address": "Jl. Example No. 123"
}
```

**Validation:**
- phone: Required, unique per trip
- name: Optional, defaults to "Participant"
- email: Optional
- address: Optional

**Success Response (201):**
```json
{
  "id": "participant_id",
  "tripId": "trip_id",
  "phone": "628123456789",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "address": "Jl. Example No. 123",
  "createdAt": "2025-12-11T10:00:00Z"
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Missing required fields | Phone missing |
| 401 | Unauthorized | Invalid token |
| 404 | Trip not found | Trip doesn't exist |
| 409 | Already joined | Participant already in trip |
| 500 | Failed to join | Server error |

---

### GET /trips/:tripId/participants
List all participants in trip

**Authentication:** Required (Bearer Token)

**Path Parameters:**
- `tripId` (string): Trip ID

**Success Response (200):**
```json
[
  {
    "id": "participant_id",
    "tripId": "trip_id",
    "phone": "628123456789",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "_count": {
      "Order": 3
    },
    "createdAt": "2025-12-11T10:00:00Z"
  }
]
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 401 | Unauthorized | Invalid token |
| 500 | Failed to fetch | Server error |

---

### GET /trips/:tripId/participants/:phone
Get participant by phone number

**Authentication:** Required (Bearer Token)

**Path Parameters:**
- `tripId` (string): Trip ID
- `phone` (string): Participant phone number

**Success Response (200):**
```json
{
  "id": "participant_id",
  "tripId": "trip_id",
  "phone": "628123456789",
  "name": "Jane Doe",
  "Order": [
    {
      "id": "order_id",
      "status": "pending_dp"
    }
  ]
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 401 | Unauthorized | Invalid token |
| 404 | Participant not found | No participant with this phone |
| 500 | Failed to fetch | Server error |

---

### DELETE /trips/:tripId/participants/:participantId
Remove participant from trip (trip owner only)

**Authentication:** Required (Bearer Token)

**Path Parameters:**
- `tripId` (string): Trip ID
- `participantId` (string): Participant ID

**Success Response (200):**
```json
{
  "message": "Participant removed successfully"
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 401 | Unauthorized | Invalid token |
| 403 | Not authorized | User doesn't own trip |
| 404 | Participant not found | Participant doesn't exist |
| 500 | Failed to remove | Server error |

---

## Locations & Shipping

### GET /api/locations/provinces
Get list of provinces in Indonesia

**Authentication:** None (Public)

**Success Response (200):**
```json
{
  "success": true,
  "count": 34,
  "data": [
    {
      "id": "11",
      "code": "11",
      "name": "Aceh"
    },
    {
      "id": "12",
      "code": "12",
      "name": "Sumatera Utara"
    }
  ]
}
```

---

### GET /api/locations/regencies/:provinceId
Get cities/regencies by province ID

**Authentication:** None (Public)

**Path Parameters:**
- `provinceId` (string): Province code/ID

**Success Response (200):**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": "1101",
      "code": "1101",
      "name": "Banda Aceh"
    }
  ]
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Province ID required | provinceId missing |
| 500 | Failed to fetch | Server error |

---

### GET /api/locations/districts/:cityId
Get districts by city ID

**Authentication:** None (Public)

**Path Parameters:**
- `cityId` (string): City code/ID

**Success Response (200):**
```json
{
  "success": true,
  "count": 8,
  "data": [
    {
      "id": "110101",
      "code": "110101",
      "name": "Kuta Raja"
    }
  ]
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | City ID required | cityId missing |
| 500 | Failed to fetch | Server error |

---

### GET /api/locations/villages/:districtId
Get villages by district ID

**Authentication:** None (Public)

**Path Parameters:**
- `districtId` (string): District code/ID

**Success Response (200):**
```json
{
  "success": true,
  "count": 12,
  "data": [
    {
      "id": "1101011",
      "name": "Peuniti"
    }
  ]
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | District ID required | districtId missing |
| 500 | Failed to fetch | Server error |

---

### GET /api/locations/rajaongkir/search
Search RajaOngkir locations by name

**Authentication:** None (Public)

**Query Parameters:**
- `q` (string, required): Search query (city name, district name)

**Validation:**
- Query minimum 3 characters

**Success Response (200):**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": "154",
      "name": "Bandung",
      "type": "Kota",
      "province": "Jawa Barat",
      "rajaongkirId": "154"
    }
  ]
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Query too short | Query < 3 characters |
| 500 | Search failed | Server error |

---

### POST /api/locations/cache/clear
Clear location cache (admin only)

**Authentication:** None (Public)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Location cache cleared"
}
```

---

### GET /api/locations/cache/stats
Get location cache statistics

**Authentication:** None (Public)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "totalCached": 34567,
    "cacheSize": "2.3MB",
    "hitRate": "95%",
    "lastCleared": "2025-12-11T09:00:00Z"
  }
}
```

---

### GET /shipping/search
Search domestic shipping destinations

**Authentication:** None (Public)

**Query Parameters:**
- `q` (string, required): Search query (minimum 2 characters)

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "154",
      "name": "Bandung",
      "city": "Bandung",
      "province": "Jawa Barat"
    }
  ]
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Query required | q parameter missing |
| 400 | Query too short | Query < 2 characters |
| 500 | Search failed | Server error |

---

### POST /shipping/calculate
Calculate shipping cost

**Authentication:** None (Public)

**Request Body:**
```json
{
  "origin": "12345",
  "destination": "54321",
  "weight": 1000,
  "courier": "jne:tiki:pos"
}
```

**Validation:**
- origin: Required, RajaOngkir district ID
- destination: Required, RajaOngkir district ID
- weight: Optional, defaults to 1000g
- courier: Optional, defaults to "jne:tiki:pos"

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "courier": "jne",
      "service": "REG",
      "description": "Regular",
      "cost": 25000,
      "etd": "2-3"
    },
    {
      "courier": "tiki",
      "service": "REG",
      "description": "Regular",
      "cost": 23000,
      "etd": "2-3"
    }
  ]
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Missing origin/destination | origin or destination missing |
| 400 | Unable to calculate | Shipping not available |
| 500 | Calculation failed | Server error |

---

## Bank Accounts

### GET /bank-accounts
Get user's bank accounts

**Authentication:** Required (Bearer Token)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "accounts": [
      {
        "id": "account_id",
        "bankName": "Bank Central Asia",
        "accountNumber": "12345678901",
        "accountHolderName": "Jane Doe",
        "isDefault": true,
        "isPrimary": true,
        "status": "active",
        "createdAt": "2025-12-11T10:00:00Z"
      }
    ],
    "defaultAccount": {
      "id": "account_id",
      "bankName": "Bank Central Asia"
    }
  }
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 401 | Unauthorized | Invalid token |
| 500 | Failed to fetch | Server error |

---

### POST /bank-accounts
Add new bank account

**Authentication:** Required (Bearer Token)

**Request Body:**
```json
{
  "bankName": "Bank Central Asia",
  "accountNumber": "12345678901",
  "accountHolderName": "Jane Doe",
  "isDefault": true
}
```

**Validation:**
- bankName: Minimum 2 characters
- accountNumber: Minimum 5 digits
- accountHolderName: Minimum 2 characters
- isDefault: Optional, auto-set to true if first account

**Success Response (201):**
```json
{
  "success": true,
  "message": "Rekening berhasil ditambahkan",
  "data": {
    "id": "account_id",
    "bankName": "Bank Central Asia",
    "accountNumber": "12345678901",
    "isDefault": true,
    "isPrimary": true
  }
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Invalid data | Validation failed |
| 400 | Duplicate account | Account number already registered |
| 401 | Unauthorized | Invalid token |
| 500 | Failed to add | Server error |

---

### PATCH /bank-accounts/:id
Update bank account

**Authentication:** Required (Bearer Token)

**Path Parameters:**
- `id` (string): Bank account ID

**Request Body:**
```json
{
  "bankName": "Bank Rakyat Indonesia",
  "accountNumber": "98765432101",
  "isDefault": true
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Rekening berhasil diperbarui",
  "data": {
    "id": "account_id",
    "bankName": "Bank Rakyat Indonesia",
    "accountNumber": "98765432101"
  }
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Invalid data | Validation failed |
| 400 | Duplicate account | Account number already registered |
| 401 | Unauthorized | Invalid token |
| 404 | Not found | Account doesn't exist |
| 500 | Failed to update | Server error |

---

### DELETE /bank-accounts/:id
Soft delete bank account

**Authentication:** Required (Bearer Token)

**Path Parameters:**
- `id` (string): Bank account ID

**Success Response (200):**
```json
{
  "success": true,
  "message": "Rekening berhasil dihapus"
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Cannot delete primary | Can't delete primary account if others exist |
| 401 | Unauthorized | Invalid token |
| 404 | Not found | Account doesn't exist |
| 500 | Failed to delete | Server error |

---

### POST /bank-accounts/:id/set-default
Set account as default

**Authentication:** Required (Bearer Token)

**Path Parameters:**
- `id` (string): Bank account ID

**Success Response (200):**
```json
{
  "success": true,
  "message": "Rekening default berhasil diubah",
  "data": {
    "id": "account_id",
    "isDefault": true
  }
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 401 | Unauthorized | Invalid token |
| 404 | Not found | Account doesn't exist |
| 500 | Failed to update | Server error |

---

### POST /bank-accounts/:id/set-primary
Set account as primary for payouts

**Authentication:** Required (Bearer Token)

**Path Parameters:**
- `id` (string): Bank account ID

**Success Response (200):**
```json
{
  "success": true,
  "message": "Rekening utama berhasil diubah",
  "data": {
    "id": "account_id",
    "isPrimary": true
  }
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 401 | Unauthorized | Invalid token |
| 404 | Not found | Account doesn't exist |
| 500 | Failed to update | Server error |

---

## Social Media

### POST /social-media
Create new social media account

**Authentication:** Required (Bearer Token)

**Request Body:**
```json
{
  "platform": "instagram",
  "handle": "@janedoe",
  "url": "https://instagram.com/janedoe",
  "followers": 5000
}
```

**Validation:**
- platform: Required, string
- handle: Required, string
- url: Required, valid URL

**Success Response (201):**
```json
{
  "id": "social_id",
  "userId": "user_id",
  "platform": "instagram",
  "handle": "@janedoe",
  "url": "https://instagram.com/janedoe",
  "followers": 5000,
  "createdAt": "2025-12-11T10:00:00Z"
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Invalid data | Validation failed |
| 401 | Unauthorized | Invalid token |
| 500 | Failed to create | Server error |

---

### GET /social-media
Get user's social media accounts

**Authentication:** Required (Bearer Token)

**Success Response (200):**
```json
[
  {
    "id": "social_id",
    "platform": "instagram",
    "handle": "@janedoe",
    "url": "https://instagram.com/janedoe",
    "followers": 5000
  }
]
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 401 | Unauthorized | Invalid token |
| 500 | Failed to fetch | Server error |

---

### PATCH /social-media/:id
Update social media account

**Authentication:** Required (Bearer Token)

**Path Parameters:**
- `id` (string): Social media ID

**Request Body:**
```json
{
  "handle": "@janedoe2",
  "followers": 6000
}
```

**Success Response (200):**
```json
{
  "id": "social_id",
  "platform": "instagram",
  "handle": "@janedoe2",
  "followers": 6000
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Invalid data | Validation failed |
| 401 | Unauthorized | Invalid token |
| 404 | Not found | Social media doesn't exist |
| 500 | Failed to update | Server error |

---

### DELETE /social-media/:id
Delete social media account

**Authentication:** Required (Bearer Token)

**Path Parameters:**
- `id` (string): Social media ID

**Success Response (200):**
```json
{
  "message": "Social media account deleted successfully",
  "data": {
    "id": "social_id"
  }
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 401 | Unauthorized | Invalid token |
| 404 | Not found | Social media doesn't exist |
| 500 | Failed to delete | Server error |

---

## Password Reset

### POST /forgot-password
Request password reset email

**Authentication:** None (Public)

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Validation:**
- email: Required, valid email format
- **Security:** Returns success even if email doesn't exist (prevents enumeration)

**Success Response (200):**
```json
{
  "success": true,
  "message": "If an account exists with this email, you will receive a password reset link shortly."
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Email required | Email missing or invalid |
| 500 | Error occurred | Server error |

---

### GET /reset-password/validate
Validate reset token before showing password form

**Authentication:** None (Public)

**Query Parameters:**
- `token` (string, required): Reset token from email

**Success Response (200):**
```json
{
  "valid": true,
  "expiresAt": "2025-12-11T14:00:00Z",
  "userId": "user_id"
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Token required | Token missing |
| 401 | Invalid/expired token | Token validation failed |
| 500 | Error occurred | Server error |

---

### POST /reset-password
Reset password with valid token

**Authentication:** None (Public)

**Request Body:**
```json
{
  "token": "reset_token_value",
  "newPassword": "NewPassword456!"
}
```

**Validation:**
- token: Required, valid reset token
- newPassword: Required, minimum 8 characters

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password has been reset successfully. Please log in with your new password."
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Token required | Token missing |
| 400 | Password too short | Password < 8 characters |
| 401 | Invalid/expired token | Token validation failed |
| 500 | Reset failed | Server error |

---

### POST /cleanup-expired-tokens
Clean up expired password reset tokens

**Authentication:** None (Public, but should be protected)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Cleaned up 42 expired tokens"
}
```

---

## File Upload

### GET /api/upload/validate
Validate upload token and get challenge type

**Authentication:** None (Public, rate limited)  
**Rate Limiting:** 10 attempts per minute

**Query Parameters:**
- `token` (string, required): Upload token

**Success Response (200):**
```json
{
  "valid": true,
  "challenge": "last4_whatsapp",
  "jastiperSlug": "john-doe-xxxxx"
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Token required | Token missing |
| 401 | Invalid token | Token validation failed |
| 429 | Too many attempts | Rate limit exceeded |
| 500 | Validation failed | Server error |

---

### POST /api/upload/verify
Verify challenge response (last 4 digits of WhatsApp)

**Authentication:** None (Public, rate limited)  
**Rate Limiting:** 5 attempts per minute

**Request Body:**
```json
{
  "token": "upload_token",
  "challengeResponse": "1234"
}
```

**Validation:**
- challengeResponse: 4 digits only

**Success Response (200):**
```json
{
  "verified": true,
  "orderId": "order_id"
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Missing fields | token or response missing |
| 400 | Invalid format | Response not 4 digits |
| 401 | Verification failed | Challenge answer incorrect |
| 429 | Too many attempts | Rate limit exceeded |
| 500 | Verification error | Server error |

---

### POST /api/upload/:orderId
Upload payment proof with verified token

**Authentication:** Bearer token (verified upload token)

**Path Parameters:**
- `orderId` (string): Order ID

**Request Headers:**
```
Authorization: Bearer verified_upload_token
Content-Type: multipart/form-data
```

**Request Body:**
- Form data with file field

**File Validation:**
- File size: Maximum 5MB
- File type: Image only (image/*)
- Format: JPEG, PNG

**Success Response (200):**
```json
{
  "success": true,
  "proofUrl": "https://cdn.example.com/proofs/order_id.jpg",
  "thumbnailUrl": "https://cdn.example.com/proofs/order_id_thumb.jpg",
  "filename": "payment_proof.jpg",
  "size": 245678,
  "message": "Payment proof uploaded successfully"
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | No file found | File missing in request |
| 401 | Missing authorization | Bearer token required |
| 401 | Invalid token | Token doesn't match order |
| 413 | File too large | File > 5MB |
| 415 | Invalid file type | Not an image |
| 404 | Order not found | Order doesn't exist |
| 500 | Upload failed | Server error |

---

## Analytics

### GET /analytics/dashboard
Get complete dashboard data (analytics + alerts)

**Authentication:** Required (Bearer Token)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "revenue": {
      "total": 5000000,
      "monthlyChange": "+15%",
      "trend": "up"
    },
    "orders": {
      "total": 47,
      "pending": 5,
      "completed": 42,
      "monthlyChange": "+20%"
    },
    "trips": {
      "active": 3,
      "total": 12
    },
    "alerts": [
      {
        "type": "warning",
        "message": "3 orders awaiting validation",
        "action": "review_orders"
      }
    ]
  }
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 401 | Unauthorized | Invalid token |
| 500 | Failed to fetch | Server error |

---

### GET /analytics/monthly
Get monthly analytics only

**Authentication:** Required (Bearer Token)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "month": "December 2025",
    "revenue": 1500000,
    "orders": 15,
    "growth": "+10%"
  }
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 401 | Unauthorized | Invalid token |
| 500 | Failed to fetch | Server error |

---

### GET /analytics/alerts
Get dashboard alerts only

**Authentication:** Required (Bearer Token)

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "type": "warning",
      "message": "3 orders awaiting validation",
      "action": "review_orders"
    },
    {
      "type": "info",
      "message": "New trip created",
      "action": "view_trip"
    }
  ]
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 401 | Unauthorized | Invalid token |
| 500 | Failed to fetch | Server error |

---

## Onboarding

### PATCH /users/complete-profile
Save user profile completion data

**Authentication:** Required (Bearer Token)

**Request Body:**
```json
{
  "profileName": "Jane Doe",
  "whatsappNumber": "628123456789",
  "originProvinceId": "province_id",
  "originProvinceName": "Jawa Barat",
  "originCityId": "city_id",
  "originCityName": "Bandung",
  "originDistrictId": "district_id",
  "originDistrictName": "Bandung Kulon",
  "originPostalCode": "40123",
  "originAddressText": "Jl. Example No. 123",
  "bankName": "Bank Central Asia",
  "accountNumber": "12345678901",
  "accountHolderName": "Jane Doe"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile completed successfully",
  "user": {
    "id": "user_id",
    "profileName": "Jane Doe",
    "whatsappNumber": "628123456789",
    "isProfileComplete": true
  }
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Invalid data | Validation failed |
| 401 | Unauthorized | Invalid token |
| 500 | Failed to complete | Server error |

---

### PATCH /users/complete-tutorial
Mark tutorial as completed

**Authentication:** Required (Bearer Token)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Tutorial completed successfully",
  "user": {
    "id": "user_id",
    "isTutorialComplete": true
  }
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 401 | Unauthorized | Invalid token |
| 500 | Failed to complete | Server error |

---

### POST /users/restart-tutorial
Restart tutorial from settings

**Authentication:** Required (Bearer Token)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Tutorial restarted successfully",
  "user": {
    "id": "user_id",
    "isTutorialComplete": false
  }
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 401 | Unauthorized | Invalid token |
| 500 | Failed to restart | Server error |

---

### GET /users/onboarding-status
Get current user's onboarding status

**Authentication:** Required (Bearer Token)

**Success Response (200):**
```json
{
  "userId": "user_id",
  "isProfileComplete": true,
  "isTutorialComplete": true,
  "completionPercentage": 100,
  "steps": {
    "profileSetup": true,
    "bankAccountSetup": true,
    "tutorialCompleted": true
  }
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 401 | Unauthorized | Invalid token |
| 500 | Failed to fetch | Server error |

---

### POST /users/sync-profile-status
Sync isProfileComplete flag with actual field values

**Authentication:** Required (Bearer Token)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile status synced successfully",
  "user": {
    "id": "user_id",
    "isProfileComplete": true
  }
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 401 | Unauthorized | Invalid token |
| 500 | Failed to sync | Server error |

---

## Workers & Background Jobs

### POST /api/workers/auto-refund
Trigger auto-refund worker

**Authentication:** Required (x-worker-token header or token query param)  
**Schedule:** Every 1 hour

**Request Headers:**
```
x-worker-token: YOUR_WORKER_TOKEN
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Auto-refund worker executed",
  "processed": 5,
  "refunded": 3
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 401 | Unauthorized | Invalid worker token |
| 500 | Worker failed | Execution error |

---

### POST /api/workers/expired-dp
Trigger expired DP worker

**Authentication:** Required (x-worker-token header or token query param)  
**Schedule:** Every 5 minutes

**Success Response (200):**
```json
{
  "success": true,
  "message": "Expired DP worker executed",
  "cancelled": 2
}
```

---

### POST /api/workers/payment-reminder
Trigger final payment reminder worker

**Authentication:** Required (x-worker-token header or token query param)  
**Schedule:** Every 6 hours

**Success Response (200):**
```json
{
  "success": true,
  "message": "Payment reminder worker executed",
  "notified": 8
}
```

---

### POST /api/workers/stock-cleanup
Trigger stock lock cleanup worker

**Authentication:** Required (x-worker-token header or token query param)  
**Schedule:** Every 10 minutes

**Success Response (200):**
```json
{
  "success": true,
  "message": "Stock cleanup executed",
  "cleaned": 15
}
```

---

### POST /api/workers/stock-sync
Trigger stock sync worker

**Authentication:** Required (x-worker-token header or token query param)  
**Schedule:** Every 1 hour

**Success Response (200):**
```json
{
  "success": true,
  "message": "Stock sync executed",
  "synced": 42
}
```

---

### POST /api/workers/order-cleanup
Trigger completed order cleanup worker

**Authentication:** Required (x-worker-token header or token query param)  
**Schedule:** Daily

**Success Response (200):**
```json
{
  "success": true,
  "message": "Order cleanup executed",
  "archived": 25
}
```

---

### POST /api/workers/run-all
Trigger all workers (testing only)

**Authentication:** Required (x-worker-token header or token query param)

**Success Response (200):**
```json
{
  "success": true,
  "message": "All workers executed",
  "results": {
    "autoRefund": {...},
    "expiredDP": {...},
    "stockCleanup": {...}
  }
}
```

---

### GET /api/workers/status
Get worker status and schedule info

**Authentication:** None (Public)

**Success Response (200):**
```json
{
  "success": true,
  "workers": [
    {
      "name": "auto-refund",
      "endpoint": "POST /api/workers/auto-refund",
      "schedule": "Every 1 hour",
      "description": "Auto-reject orders awaiting validation > 24h"
    }
  ],
  "authentication": {
    "method": "Bearer token",
    "header": "x-worker-token",
    "query": "?token=YOUR_TOKEN"
  }
}
```

---

## Error Response Formats

### Generic Error Response
```json
{
  "error": "Error message in English",
  "status": 400
}
```

### Validation Error Response
```json
{
  "error": "Validation failed",
  "details": {
    "email": "Invalid email format",
    "password": "Password must be at least 8 characters"
  }
}
```

### Rate Limit Error Response (429)
```json
{
  "error": "Too many requests. Please try again later.",
  "retryAfter": 300,
  "remainingTime": "5 minutes"
}
```

### Authentication Error Response (401)
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

### Authorization Error Response (403)
```json
{
  "error": "Forbidden",
  "message": "You don't have permission to access this resource"
}
```

### Not Found Error Response (404)
```json
{
  "error": "Resource not found",
  "resource": "User"
}
```

### Conflict Error Response (409)
```json
{
  "error": "Conflict",
  "message": "Email already registered"
}
```

### Server Error Response (500)
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred. Please try again later."
}
```

---

## Common Status Codes

| Code | Description | Usage |
|------|-------------|-------|
| 200 | OK | Successful GET request |
| 201 | Created | Successful POST request (resource created) |
| 204 | No Content | Successful DELETE request |
| 400 | Bad Request | Invalid input, missing fields, validation failed |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | Authenticated but not authorized (permission denied) |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists (duplicate key) |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service temporarily unavailable |

---

## API Summary

**Total Endpoints:** 68  
**Authenticated Endpoints:** 45  
**Public Endpoints:** 23  
**Rate-Limited Endpoints:** 8

### Endpoint Distribution by Category:
- Authentication: 6
- Profile & User: 8
- Trips: 6
- Products: 4
- Orders & Checkout: 11
- Payments: 2
- Participants: 4
- Locations & Shipping: 7
- Bank Accounts: 7
- Social Media: 4
- Password Reset: 3
- Upload: 3
- Analytics: 3
- Onboarding: 5
- Workers: 7
- Monitoring: 6
- Debug: 1

---

## Usage Notes

1. **Authentication:** Bearer token in `Authorization` header for protected endpoints
2. **Rate Limiting:** Check response headers for `X-RateLimit-*` values
3. **Timestamps:** All dates/times in ISO 8601 format (UTC)
4. **Phone Numbers:** Auto-prefixed with 62 if not present
5. **Errors:** Always include error message and HTTP status code
6. **CORS:** Configured for cross-origin requests
7. **Security Headers:** All requests include standard security headers (CSP, HSTS, etc.)

---

**Document Version:** 1.0  
**Last Updated:** 2025-12-11  
**Author:** API Documentation Team

