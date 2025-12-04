# Dynamic Profile Feature Plan - Single Source of Truth (SSOT)

**Status**: Approved for Implementation  
**Date**: 2025-12-04  
**Goal**: Implement dynamic layout and theming for user profiles with focus on Performance and SEO.

---

## 1. Core Concept: "Curated Presets"
To ensure design quality and ease of use, we strictly limit customization to pre-validated presets.

*   **User Input**: Select `Layout Style` (5 options) + Select `Color Theme` (10 options).
*   **Total Variations**: 50 unique combinations.
*   **Mechanism**: Server-side rendering of layouts + CSS Variables for theming.

---

## 2. Layout Options (Mobile-First)

| Layout ID | Name | Concept | Target User |
| :--- | :--- | :--- | :--- |
| `classic` | **The Classic** | Central avatar, bio, stacked cards. | General / Personal |
| `store` | **The Storefront** | Compact header, dominant 2-col product grid. | Sellers / Shops |
| `bento` | **The Bento** | Modular grid blocks for avatar, stats, socials. | Tech / Creators |
| `editorial` | **The Editorial** | Minimalist, left-aligned, typography focus. | Luxury / Professional |
| `immersive` | **The Immersive** | Full-screen background cover image focus. | Travel / Visual |

---

## 3. Technical Architecture

### A. Database Schema (Prisma)
Embed configuration directly in `ProfileDesign` model (1-to-1 relation with User).

```prisma
model ProfileDesign {
  id          String   @id @default(cuid())
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  layoutId    String   @default("classic") // "classic", "store", "bento", etc.
  themeId     String   @default("jastip")  // "jastip", "ocean", "midnight", etc.
  
  updatedAt   DateTime @updatedAt
}
```

### B. Theme Engine (Performance Optimized)
*   **Zero-Runtime CSS**: Use CSS Variables injected at root level.
*   **Definition**: `lib/theme-config.ts` contains the dictionary of themes.
*   **Injection**: Server Component reads DB -> Injects `<style>:root { --primary: ... }</style>`.

### C. Layout Engine (Bundle Size Optimized)
*   **Server-Side Switch**: Logic to choose layout happens on the server.
*   **Code Splitting**: Client only downloads the Javascript for the *active* layout.

---

## 4. SEO Strategy (Structure Architect)

Regardless of the visual layout selected, the HTML structure must remain semantically consistent for crawlers.

### H-Tag Hierarchy (Fixed)
Every layout **MUST** follow this strict hierarchy:
*   `H1`: Profile Name (e.g., "Budi Jastip Jepang")
*   `H2`: Main Sections (e.g., "Bio", "Active Trips", "Catalog")
*   `H3`: Item Titles (e.g., "Trip Tokyo Dec", "KitKat Matcha")

### Semantic HTML Enforced
*   **Bio**: `<section id="bio">`
*   **Products**: `<section id="catalog">` wrapped in `<article>` for individual items.
*   **Socials**: `<nav aria-label="Social links">`

### Dynamic Schema Markup (JSON-LD)
Inject structured data based on content:
1.  **Person/Organization**: For the profile owner.
2.  **ProfilePage**: Standard schema.
3.  **Product/Offer**: For catalog items (MerchantListing).

### Metadata Strategy
*   **Title**: `{Name} (@{username}) | Jastipin`
*   **Description**: First 160 chars of Bio.
*   **OG Image**: Dynamic generated image based on active **Theme Colors**.

---

## 5. Implementation Roadmap

### Phase 1: Backend & Data
- [ ] Update `schema.prisma` with `ProfileDesign` model.
- [ ] Run migration.
- [ ] Update `profile.service.ts` to include design data in fetch.
- [ ] Create API `PATCH /profile/design`.

### Phase 2: Frontend Core
- [ ] Create `lib/theme-config.ts` (Color definitions).
- [ ] Create `lib/layout-config.ts` (Layout metadata).
- [ ] Refactor current `page.tsx` to `layouts/ClassicLayout.tsx`.
- [ ] Create `components/profile/ProfileThemeWrapper.tsx` (CSS Var injector).

### Phase 3: Layout Development
- [ ] Implement `StoreLayout.tsx`
- [ ] Implement `BentoLayout.tsx`
- [ ] Implement `EditorialLayout.tsx`
- [ ] Implement `ImmersiveLayout.tsx`

### Phase 4: User Interface
- [ ] Update `EditProfileDialog.tsx`:
    - [ ] Add "Tampilan" Tab.
    - [ ] Add Layout Selector (Radio Grid).
    - [ ] Add Theme Selector (Color Swatches).
    - [ ] Add Live Preview (optional/later).

### Phase 5: SEO & Polish
- [ ] Verify H-tags across all layouts.
- [ ] Implement JSON-LD injection.
- [ ] Test Lighthouse Score (Performance & SEO).
