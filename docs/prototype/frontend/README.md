# Jastipin.me - Otomatisasi Jastip via WhatsApp

Platform otomatisasi jastip yang membantu para jastiper mengelola bisnis mereka dengan lebih profesional melalui integrasi WhatsApp dan dashboard manajemen lengkap.

## Overview

Jastipin.me adalah solusi lengkap untuk jastiper yang ingin mengotomatisasi bisnis mereka. Dengan fitur katalog produk otomatis, tracking pesanan, dan profil publik yang menarik, platform ini mengubah chaos manajemen order WhatsApp menjadi sistem yang terorganisir dan profesional.

## Tech Stack

### Core Framework
- **Next.js 16** - React framework dengan App Router
- **React 19.2** - Library UI dengan fitur canary terbaru
- **TypeScript** - Type-safe development
- **Tailwind CSS v4** - Utility-first CSS framework

### UI Components
- **shadcn/ui** - Komponen UI yang customizable dan accessible
- **Radix UI** - Headless UI primitives
- **Lucide React** - Icon library

### Styling & Fonts
- **Poppins** - Font untuk heading (400, 500, 600, 700)
- **Inter** - Font untuk body text
- **OKLCH Color Space** - Modern color system untuk konsistensi warna

### Analytics
- **Vercel Analytics** - Web analytics dan monitoring

## Color Palette

Platform ini menggunakan color system yang warm dan approachable:

- **Primary (Coral Pink)**: #F26B8A - Untuk CTA dan aksen utama
- **Accent (Bright Blue)**: #3A86FF - Untuk link dan indikator aktif
- **Secondary (Soft Blush)**: #FFB6B9 - Untuk background dan aksen soft
- **Background (Cloud White)**: #FFFFFF - Background utama
- **Foreground (Charcoal)**: #363636 - Text color utama
- **Muted (Mist Gray)**: #F8F9FA - Background muted sections

Border radius: 8px untuk memberikan kesan soft dan modern.

## Project Structure

\`\`\`
jastipin-me/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout dengan font setup
│   ├── page.tsx                 # Landing page utama
│   ├── globals.css              # Global styles & design tokens
│   ├── auth/                    # Authentication pages
│   │   └── page.tsx            # Login/Register page
│   ├── dashboard/               # Dashboard jastiper
│   │   └── page.tsx            # Main dashboard dengan tab navigation
│   ├── inv/                     # Invoice pages
│   │   └── [invoiceId]/         # Dynamic route untuk invoice
│   │       ├── page.tsx        # Invoice detail page
│   │       └── not-found.tsx   # 404 page untuk invoice tidak ditemukan
│   └── [username]/              # Public profile pages (root level)
│       ├── page.tsx            # Link-in-bio style profile page
│       └── not-found.tsx       # 404 page untuk username tidak ditemukan
│
├── components/
│   ├── landing/                 # Landing page components
│   │   ├── top-bar.tsx         # Announcement bar di atas header
│   │   ├── header.tsx          # Floating rounded navigation
│   │   ├── hero.tsx            # Hero section dengan CTA
│   │   ├── live-demo-strip.tsx # Scrolling demo profile preview
│   │   ├── from-chaos-to-automated.tsx # Before/After + 3-step process
│   │   ├── testimonials-with-demo.tsx  # Testimonials + demo profiles
│   │   ├── trust-badges.tsx    # Trust indicators & badges
│   │   ├── pricing.tsx         # Pricing tiers
│   │   ├── faq.tsx             # Frequently asked questions
│   │   ├── final-cta.tsx       # Username claim input dengan CTA
│   │   └── footer.tsx          # Footer dengan links
│   │
│   ├── dashboard/               # Dashboard components
│   │   ├── dashboard-home.tsx        # Action Hub dengan mini analytics
│   │   ├── dashboard-validasi.tsx    # Order validation page
│   │   ├── dashboard-produk.tsx      # Product management page
│   │   ├── dashboard-account.tsx     # Account settings & profile links
│   │   ├── dashboard-profile.tsx     # Public profile editor
│   │   └── dashboard-trips.tsx       # Trip management
│   │
│   └── ui/                      # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── sheet.tsx
│       ├── tabs.tsx
│       ├── accordion.tsx
│       └── ... (70+ components)
│
└── public/                      # Static assets
    └── ... (images untuk demo content)
\`\`\`

## Key Features

### 1. Landing Page
Terdiri dari 11 section yang dirancang untuk konversi maksimal:
- **Top Bar**: Announcement dengan CTA
- **Header**: Floating rounded navbar dengan scroll effect
- **Hero**: Value proposition dengan dual CTA (primary & secondary)
- **Live Demo Strip**: Scrolling horizontal preview profil demo
- **From Chaos to Automated**: Before/After visual + 3-step process
- **Testimonials with Demo**: Social proof dengan link ke profil demo
- **Trust Badges**: Kredibilitas indicators
- **Pricing**: 3 tiers (Free, Starter, Pro)
- **FAQ**: Common questions dengan accordion
- **Final CTA**: Username claim input dengan CTA
- **Footer**: Links & social media

### 2. Public Profile Pages (`/[username]`)
Link-in-bio style profile seperti Beacons.ai atau Linktree:
- **Cover Image**: Full-width header (no padding) dengan gradient overlay dan rounded bottom
- **Profile Info**: Avatar dengan overlap effect, name, bio, stats (followers, products)
- **Social Links**: WhatsApp & Instagram buttons
- **Current Trip**: Trip aktif dengan countdown
- **Product Catalog**: Grid layout dengan gambar, nama, harga
- **Demo Banner**: Notifikasi untuk demo profiles

Design features:
- Rounded bottom header (rounded-b-3xl) untuk smooth transition
- Mobile-first dengan max-width 2xl
- Gradient background (pink-to-blue)
- Compact spacing untuk header info
- Hover states yang maintain contrast (no white text on white bg)

Access: `jastipin.me/tina`, `jastipin.me/ana`, `jastipin.me/jastipsg`

### 3. Authentication (`/auth`)
Single page dengan tab switching:
- Login tab dengan email/password
- Register tab dengan full name, email, password
- Social login options (Google & WhatsApp)
- Redirect ke dashboard setelah submit

### 4. Dashboard (`/dashboard`)
Protected area untuk jastiper manage bisnis mereka.

#### Tab Navigation (Bottom Navbar):
1. **Home** - Action Hub & Summary
   - Upload Produk button (large, orange, primary action)
   - Mini Analytics dengan gradient pink background:
     - Pendapatan (dengan growth indicator)
     - Total Order (dengan growth indicator)
     - Peserta (dengan growth indicator)
   - Summary Cards dengan "Lihat Detail" links:
     - Validasi (orders pending approval)
     - Stok Produk (low stock items)
     - Peserta Baru (new participants)

2. **Validasi** - Order Management
   - Badge notification untuk pending orders
   - Search & filter functionality
   - List pesanan pending dengan detail:
     - Product info dengan thumbnail
     - Customer info
     - Order details (qty, variant, price)
     - Action buttons (Terima/Tolak)
   - Link ke invoice untuk validated orders

#### Sub-pages (Accessed from Akun):
- **Profile Editor**: Edit public profile (avatar, bio, cover, social links)
- **Trip Management**: Create/edit trips dengan detail lengkap

Design Philosophy:
- **Summary Dashboard**: Home hanya menampilkan ringkasan dengan accordion toggles, detail di dedicated tabs
- **2-3 Klik Workflow**: Aksi utama dalam minimal clicks
- **Bottom Sheet Pattern**: Quick actions tanpa leave page
- **Optimistic UI**: Instant feedback untuk actions
- **Mobile-First**: Semua interactions dioptimasi untuk mobile
- **Compact Spacing**: py-8 md:py-12 untuk sections (reduced from default)

### 5. Invoice Pages (`/inv/[invoiceId]`)
Public invoice page untuk share dengan customers:
- **Hero Header**: Invoice number, date, total, dan status (grid 2 kolom untuk mobile)
- **Info Cards**: Jastiper info dan Penitip info side-by-side dengan clear borders
- **Product List**: 
  - Desktop: Table format
  - Mobile: Card-based list dengan compact spacing
- **Summary**: Subtotal, Jasa Jastip, Total dengan border top
- **Payment Info**: Bank details dan notes
- **Actions**:
  - Desktop: Print & Download PDF buttons
  - Mobile: Sticky bottom "Share via WhatsApp" button

Design features:
- Mobile-first dengan responsive layout
- Print-friendly styling (print:shadow-none, print:rounded-none)
- Gradient pink-blue background untuk hero
- Compact spacing untuk mobile optimization
- Clear visual hierarchy dengan borders dan shadows

Access: `jastipin.me/inv/250403ABCD`, `jastipin.me/inv/250404XYZ1`

## Component Patterns

### Accordion/Collapsible Sections
Digunakan di FAQ dan dashboard Home sections untuk save space:
\`\`\`tsx
const [isOpen, setIsOpen] = useState(true)
// Arrow icon rotates 180deg saat open
<ChevronDown className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
\`\`\`

### Bottom Navigation
Sticky bottom navbar dengan active state:
\`\`\`tsx
// Active tab dengan background primary dan text white
// Inactive tabs dengan text muted
<button className={activeTab === 'home' ? 'bg-primary text-white' : 'text-muted'}>
\`\`\`

### Floating Header
Header dengan floating effect dan backdrop blur:
\`\`\`tsx
className="fixed top-4 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-lg rounded-3xl shadow-lg"
\`\`\`

### Demo Banner
Sticky top banner untuk demo profiles:
\`\`\`tsx
className="sticky top-0 bg-accent text-white text-center py-2"
\`\`\`

### Username Claim Input
Final CTA dengan beacons.ai style input:
\`\`\`tsx
// Prefix tetap "jastipin.me/" dengan input untuk username
// Rounded-2xl di mobile, rounded-full di desktop
className="rounded-2xl sm:rounded-full"
// Input validation: lowercase, numbers, underscore, dash only
\`\`\`

### Invoice Layout
Responsive invoice dengan grid system:
\`\`\`tsx
// Hero header: 2 kolom di mobile, auto di desktop
className="grid grid-cols-2 md:flex md:justify-between"
// Product list: cards di mobile, table di desktop
className="space-y-3 md:hidden" // Mobile
className="hidden md:table" // Desktop
\`\`\`

## Spacing System

Layout menggunakan compact spacing untuk modern feel:
- Section padding: `py-8 md:py-12` (reduced untuk compact layout)
- Container: `max-w-7xl mx-auto px-4` (landing), `max-w-2xl mx-auto px-4` (profile/invoice)
- Card spacing: `p-4 md:p-6` untuk responsive padding
- Gap antara elements: `gap-3 md:gap-4`, `gap-4 md:gap-6` untuk consistency
- Accordion sections: `mb-6` spacing dengan smooth transitions

## Responsive Design

Mobile-first approach dengan breakpoints:
\`\`\`tsx
// Mobile default
className="text-sm p-4"

// Tablet (md: 768px+)
className="md:text-base md:p-6"

// Desktop (lg: 1024px+)
className="lg:text-lg lg:p-8"
\`\`\`

Horizontal scrolling untuk mobile:
\`\`\`tsx
className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory scrollbar-hide"
\`\`\`

## Image Handling

Semua images menggunakan Next.js Image component atau img tag dengan:
- Proper alt text untuk accessibility
- Aspect ratio yang konsisten (1:1 untuk avatar, 16:9 untuk cover)
- Object-fit: cover untuk avoid distortion
- Placeholder: `/placeholder.svg?height=X&width=Y&query=description`

## Development Guidelines

### Component Organization
- Landing components: Simple, stateless, marketing-focused
- Dashboard components: Stateful, dengan form handling dan optimistic UI
- UI components: Reusable primitives dari shadcn/ui

### State Management
- Local state dengan useState untuk UI interactions
- Props drilling untuk simple parent-child communication
- Context belum diperlukan karena state masih sederhana

### Naming Conventions
- Components: PascalCase (DashboardHome.tsx)
- Files: kebab-case untuk pages (dashboard-home.tsx)
- CSS classes: Tailwind utility classes (bg-primary, text-lg)

### Code Style
- TypeScript strict mode
- Functional components dengan hooks
- Explicit return types untuk functions
- Descriptive variable names

## Future Enhancements

Potential features untuk development selanjutnya:
- [ ] Backend integration dengan API routes
- [ ] Database connection (Supabase recommended)
- [ ] Real authentication dengan NextAuth atau Supabase Auth
- [ ] WhatsApp Business API integration untuk auto-reply dan katalog sync
- [ ] Payment gateway integration (Midtrans/Xendit)
- [ ] Real-time notifications dengan Pusher atau Supabase Realtime
- [ ] Analytics dashboard dengan charts (Recharts)
- [ ] Multi-language support (ID/EN)
- [ ] PWA capabilities untuk mobile app feel
- [ ] Image upload dengan Vercel Blob atau Cloudinary
- [ ] PDF generation untuk invoice (react-pdf atau Puppeteer)
- [ ] Email notifications untuk order updates
- [ ] QR code untuk profil dan invoice
- [ ] CSV export untuk orders dan products

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Run development server: `npm run dev`
4. Open [http://localhost:3000](http://localhost:3000)

## Deployment

Optimized untuk deployment di Vercel:
- Automatic deployments dari Git
- Edge functions support
- Analytics included
- Zero configuration required

## License

[Your License Here]

## Credits

Built with v0.app - AI-powered web development platform.
