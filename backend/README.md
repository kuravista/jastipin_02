# Jastipin.me Backend API

Express.js API backend for Jastipin.me MVP with JWT authentication, Prisma ORM, and PostgreSQL.

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and update with your database URL:
```bash
cp .env.example .env
```

### 3. Setup Database
```bash
# Run migrations
npx prisma migrate dev --name init

# View database UI
npx prisma studio
```

### 4. Start Development Server
```bash
npm run dev
```

Server runs on `http://localhost:4000`

## API Endpoints

### Health Check
- `GET /` - API info and available endpoints
- `GET /health` - Basic health check
- `GET /health/quick` - Quick status with uptime
- `GET /health/status` - Comprehensive health check (database, memory, environment)

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user

### Profile
- `GET /api/profile` - Get user profile (authenticated)
- `PATCH /api/profile` - Update user profile (authenticated)
- `GET /api/profile/:slug` - Get public profile

### Trips
- `POST /api/trips` - Create trip (authenticated)
- `GET /api/trips` - List user trips (authenticated)
- `GET /api/trips/:id` - Get trip details (authenticated)
- `PATCH /api/trips/:id` - Update trip (authenticated, owner only)
- `DELETE /api/trips/:id` - Delete trip (authenticated, owner only)

### Products
- `POST /api/trips/:tripId/products` - Create product (owner only)
- `GET /api/trips/:tripId/products` - List products
- `GET /api/trips/:tripId/products/:productId` - Get product
- `PATCH /api/trips/:tripId/products/:productId` - Update product (owner only)
- `DELETE /api/trips/:tripId/products/:productId` - Delete product (owner only)

### Participants
- `POST /api/trips/:tripId/participants` - Join trip
- `GET /api/trips/:tripId/participants` - List participants
- `GET /api/trips/:tripId/participants/:phone` - Get participant by phone
- `DELETE /api/trips/:tripId/participants/:participantId` - Remove participant (owner only)

### Orders
- `POST /api/trips/:tripId/orders` - Create order
- `GET /api/trips/:tripId/orders` - List orders (owner only)
- `GET /api/trips/:tripId/orders/:orderId` - Get order
- `PATCH /api/trips/:tripId/orders/:orderId` - Update order status (owner only)
- `DELETE /api/trips/:tripId/orders/:orderId` - Cancel order (owner only)

## Project Structure

```
backend/
├── src/
│   ├── routes/          # API route handlers
│   ├── services/        # Business logic
│   ├── middleware/      # Express middleware
│   ├── utils/           # Utility functions
│   ├── types/           # TypeScript types
│   ├── prisma/          # Prisma schema
│   └── index.ts         # App entry point
├── prisma/
│   └── schema.prisma    # Database schema
├── package.json         # Dependencies
├── tsconfig.json        # TypeScript config
└── jest.config.js       # Testing config
```

## Development

### Run Tests
```bash
npm test
npm run test:watch
```

### Database Studio
```bash
npx prisma studio
```

### Build for Production
```bash
npm run build
npm start
```

## Architecture Patterns

- **Modular Design**: Each file ≤600 lines, single responsibility
- **Service Layer**: Business logic separated from routes
- **Middleware Stack**: Auth, validation, error handling
- **Type Safety**: Full TypeScript strict mode, no `any`
- **JWT Auth**: 12h access token, 7d refresh token

## Environment Variables

```
DATABASE_URL         - PostgreSQL connection string
JWT_SECRET          - Access token signing key (min 64 chars)
JWT_REFRESH_SECRET  - Refresh token signing key (min 64 chars)
API_PORT            - Server port (default: 4000)
FRONTEND_URL        - Frontend origin for CORS
NODE_ENV            - Environment (development/production)
```

## Security

- Passwords hashed with bcrypt (10 rounds)
- JWT tokens with HS256 algorithm
- Refresh tokens in httpOnly cookies
- CORS configured for frontend origin only
- Input validation with Zod schemas
- SQL injection prevention via Prisma

## Performance

- Database indexes on frequent queries
- Connection pooling via Prisma
- Error handling with proper status codes
- Request size limit: 10MB

## License

MIT
