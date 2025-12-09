import { Metadata } from "next"
import { notFound } from "next/navigation"
import { ProductDetailPageClient } from "./client"

interface ProductDetailResponse {
  product: {
    id: string
    slug: string
    title: string
    price: number
    description: string | null
    image: string | null
    stock: number | null
    isUnlimitedStock: boolean
    unit: string | null
    weightGram: number | null
    type: string
    available: boolean
  }
  trip: {
    id: string
    title: string
    status: string
    paymentType: string
  }
  jastiper: {
    slug: string
    profileName: string
    avatar: string | null
    profileDesign?: {
      layoutId: string
      themeId: string
    }
  }
}

interface PageProps {
  params: Promise<{
    username: string
    slug: string
  }>
  searchParams: Promise<{
    tripId?: string
  }>
}

/**
 * Fetch product detail from API (server-side)
 */
async function fetchProductDetail(
  username: string,
  slug: string,
  tripId?: string
): Promise<ProductDetailResponse | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
  
  try {
    // Include tripId to get correct product when same slug exists in multiple trips
    const queryParams = tripId ? `?tripId=${tripId}` : ''
    const response = await fetch(`${apiUrl}/profile/${username}/products/${slug}${queryParams}`, {
      next: { revalidate: 60 }, // Cache for 60 seconds
    })
    
    if (!response.ok) {
      return null
    }
    
    return response.json()
  } catch {
    return null
  }
}

/**
 * Generate SEO metadata for product page
 */
export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { username, slug } = await params
  const { tripId } = await searchParams
  const data = await fetchProductDetail(username, slug, tripId)

  if (!data) {
    return {
      title: "Produk Tidak Ditemukan | Jastipin.me",
    }
  }

  const title = `${data.product.title} - ${data.jastiper.profileName} | Jastipin.me`
  const description =
    data.product.description ||
    `Beli ${data.product.title} seharga Rp ${data.product.price.toLocaleString("id-ID")} dari ${data.jastiper.profileName}`
  const url = `https://jastipin.me/${username}/p/${slug}`
  const canonicalUrl = tripId ? `${url}?tripId=${tripId}` : url

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: data.product.title,
      description,
      images: data.product.image ? [data.product.image] : [],
      url: canonicalUrl,
      type: "website",
      siteName: "Jastipin.me",
      locale: "id_ID",
    },
    twitter: {
      card: "summary_large_image",
      title: data.product.title,
      description,
      images: data.product.image ? [data.product.image] : [],
      creator: "@jastipin",
    },
    other: {
      "product:price:amount": data.product.price.toString(),
      "product:price:currency": "IDR",
      "product:availability": data.product.available ? "in stock" : "out of stock",
    }
  }
}

/**
 * Product detail page for direct access (SEO-friendly)
 */
export default async function ProductDetailPage({ params, searchParams }: PageProps) {
  const { username, slug } = await params
  const { tripId } = await searchParams
  const data = await fetchProductDetail(username, slug, tripId)

  if (!data) {
    notFound()
  }

  // JSON-LD Structured Data for Product
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": data.product.title,
    "image": data.product.image ? [data.product.image] : [],
    "description": data.product.description || `Beli ${data.product.title} dari ${data.jastiper.profileName}`,
    "sku": data.product.id,
    "offers": {
      "@type": "Offer",
      "url": `https://jastipin.me/${username}/p/${slug}${tripId ? `?tripId=${tripId}` : ''}`,
      "priceCurrency": "IDR",
      "price": data.product.price,
      "availability": data.product.available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "itemCondition": "https://schema.org/NewCondition",
      "seller": {
        "@type": "Person",
        "name": data.jastiper.profileName
      }
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailPageClient
        data={data}
        username={username}
      />
    </>
  )
}
