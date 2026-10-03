import type { Category, Product, Store, StoreSource } from "@/lib/types"

export const STORES: Record<StoreSource, Store> = {
  mercado_livre: { id: "mercado_livre", name: "Mercado Livre", color: "#FFE600" },
  shopee: { id: "shopee", name: "Shopee", color: "#EE4D2D" },
  amazon: { id: "amazon", name: "Amazon", color: "#FF9900" },
  telegram: { id: "telegram", name: "Telegram", color: "#26A5E4" },
}

export const CATEGORIES: Category[] = [
  {
    slug: "eletronicos",
    name: "Eletrônicos",
    icon: "Smartphone",
    image:
      "https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=300&auto=format&fit=crop",
  },
  {
    slug: "casa",
    name: "Casa e Decoração",
    icon: "Sofa",
    image:
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=300&auto=format&fit=crop",
  },
  {
    slug: "moda",
    name: "Moda",
    icon: "Shirt",
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=300&auto=format&fit=crop",
  },
  {
    slug: "calcados",
    name: "Calçados",
    icon: "Footprints",
    image:
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=300&auto=format&fit=crop",
  },
  {
    slug: "beleza",
    name: "Beleza",
    icon: "Sparkles",
    image:
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=300&auto=format&fit=crop",
  },
  {
    slug: "esporte",
    name: "Esporte e Fitness",
    icon: "Dumbbell",
    image:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=300&auto=format&fit=crop",
  },
  {
    slug: "games",
    name: "Games",
    icon: "Gamepad2",
    image:
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=300&auto=format&fit=crop",
  },
  {
    slug: "infantil",
    name: "Infantil",
    icon: "Baby",
    image:
      "https://images.unsplash.com/photo-1587654780291-39c9404d746b?q=80&w=300&auto=format&fit=crop",
  },
]

export const DEALS: Product[] = [
  {
    id: "d1",
    title: "Fone de Ouvido Bluetooth com Cancelamento de Ruído",
    image:
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?q=80&w=500&auto=format&fit=crop",
    price: 189.9,
    originalPrice: 349.9,
    installments: { count: 6, value: 31.65 },
    rating: 4.7,
    reviewsCount: 2318,
    store: "amazon",
    category: "eletronicos",
    affiliateUrl: "#",
    isFreeShipping: true,
    discountLabel: "-46%",
  },
  {
    id: "d2",
    title: "Smartwatch Esportivo Tela AMOLED à Prova d'Água",
    image:
      "https://images.unsplash.com/photo-1544117519-31a4b719223d?q=80&w=500&auto=format&fit=crop",
    price: 149.0,
    originalPrice: 299.0,
    installments: { count: 5, value: 29.8 },
    rating: 4.5,
    reviewsCount: 981,
    store: "shopee",
    category: "eletronicos",
    affiliateUrl: "#",
    isFreeShipping: true,
    discountLabel: "-50%",
  },
  {
    id: "d3",
    title: "Cadeira Gamer Ergonômica Reclinável",
    image:
      "https://images.unsplash.com/photo-1598550476439-6847785fcea6?q=80&w=500&auto=format&fit=crop",
    price: 799.0,
    originalPrice: 1199.0,
    installments: { count: 10, value: 79.9 },
    rating: 4.6,
    reviewsCount: 654,
    store: "mercado_livre",
    category: "casa",
    affiliateUrl: "#",
    discountLabel: "-33%",
  },
  {
    id: "d4",
    title: "Air Fryer Digital 5L Antiaderente",
    image:
      "https://images.unsplash.com/photo-1585659722983-3a675dabf23d?q=80&w=500&auto=format&fit=crop",
    price: 259.9,
    originalPrice: 399.9,
    installments: { count: 8, value: 32.49 },
    rating: 4.8,
    reviewsCount: 4102,
    store: "amazon",
    category: "casa",
    affiliateUrl: "#",
    isFreeShipping: true,
    discountLabel: "-35%",
  },
  {
    id: "d5",
    title: "Tênis Casual Confort Respirável",
    image:
      "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=500&auto=format&fit=crop",
    price: 119.9,
    originalPrice: 219.9,
    installments: { count: 4, value: 29.98 },
    rating: 4.4,
    reviewsCount: 312,
    store: "shopee",
    category: "calcados",
    affiliateUrl: "#",
    discountLabel: "-45%",
  },
  {
    id: "d6",
    title: "Controle Sem Fio Compatível com PS5",
    image:
      "https://images.unsplash.com/photo-1592840062661-eb5f6c087a89?q=80&w=500&auto=format&fit=crop",
    price: 279.0,
    originalPrice: 399.0,
    installments: { count: 6, value: 46.5 },
    rating: 4.9,
    reviewsCount: 1543,
    store: "mercado_livre",
    category: "games",
    affiliateUrl: "#",
    isFreeShipping: true,
    discountLabel: "-30%",
  },
]

export const POPULAR_SEARCHES = [
  "air fryer",
  "fone bluetooth",
  "tênis",
  "smartwatch",
  "cadeira gamer",
  "ssd nvme",
]

export const FEATURED_PRODUCTS: Product[] = [
  {
    id: "p1",
    title: "Notebook Ultrafino 16GB RAM 512GB SSD",
    image:
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=500&auto=format&fit=crop",
    price: 2899.0,
    originalPrice: 3499.0,
    installments: { count: 12, value: 241.58 },
    rating: 4.6,
    reviewsCount: 897,
    store: "amazon",
    category: "eletronicos",
    affiliateUrl: "#",
    isFreeShipping: true,
    discountLabel: "-17%",
  },
  {
    id: "p2",
    title: "Câmera de Segurança Wi-Fi Full HD",
    image:
      "https://images.unsplash.com/photo-1580983561371-7f4b242d8ec0?q=80&w=500&auto=format&fit=crop",
    price: 129.9,
    originalPrice: 189.9,
    rating: 4.3,
    reviewsCount: 2210,
    store: "shopee",
    category: "eletronicos",
    affiliateUrl: "#",
    discountLabel: "-32%",
  },
  {
    id: "p3",
    title: "Jaqueta Corta-Vento Impermeável",
    image:
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=500&auto=format&fit=crop",
    price: 149.9,
    rating: 4.5,
    reviewsCount: 176,
    store: "mercado_livre",
    category: "moda",
    affiliateUrl: "#",
    isSponsored: true,
  },
  {
    id: "p4",
    title: "Kit Skincare Facial Completo",
    image:
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=500&auto=format&fit=crop",
    price: 99.9,
    originalPrice: 159.9,
    rating: 4.7,
    reviewsCount: 543,
    store: "shopee",
    category: "beleza",
    affiliateUrl: "#",
    discountLabel: "-38%",
  },
  {
    id: "p5",
    title: "Mochila Impermeável para Notebook",
    image:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=500&auto=format&fit=crop",
    price: 89.9,
    originalPrice: 139.9,
    rating: 4.6,
    reviewsCount: 1022,
    store: "amazon",
    category: "moda",
    affiliateUrl: "#",
    isFreeShipping: true,
    discountLabel: "-36%",
  },
  {
    id: "p6",
    title: "Bicicleta Aro 29 21 Marchas",
    image:
      "https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=500&auto=format&fit=crop",
    price: 899.0,
    originalPrice: 1299.0,
    installments: { count: 10, value: 89.9 },
    rating: 4.8,
    reviewsCount: 289,
    store: "mercado_livre",
    category: "esporte",
    affiliateUrl: "#",
    discountLabel: "-31%",
  },
  {
    id: "p7",
    title: "Boneca Interativa com Acessórios",
    image:
      "https://images.unsplash.com/photo-1558877385-81a1c7e67d72?q=80&w=500&auto=format&fit=crop",
    price: 79.9,
    rating: 4.4,
    reviewsCount: 98,
    store: "shopee",
    category: "infantil",
    affiliateUrl: "#",
  },
  {
    id: "p8",
    title: "Headset Gamer com Microfone",
    image:
      "https://images.unsplash.com/photo-1599669454699-248893623440?q=80&w=500&auto=format&fit=crop",
    price: 159.9,
    originalPrice: 229.9,
    rating: 4.5,
    reviewsCount: 764,
    store: "amazon",
    category: "games",
    affiliateUrl: "#",
    isFreeShipping: true,
    discountLabel: "-30%",
  },
]

/** Every product across every home section, for search and category listings. */
export const ALL_PRODUCTS: Product[] = [...DEALS, ...FEATURED_PRODUCTS]

/** Products with a tracked price drop, used by the "Preço caiu" section. */
export const PRICE_DROP_PRODUCTS: Product[] = ALL_PRODUCTS.filter(
  (product) => product.originalPrice && product.originalPrice > product.price,
).map((product) => ({
  ...product,
  isPriceDrop: true,
  priceHistory: [
    product.originalPrice as number,
    Math.round(((product.originalPrice as number) + product.price) * 50) /
      100,
    product.price,
  ],
}))

const STORE_ORDER: StoreSource[] = ["mercado_livre", "shopee", "amazon"]

/**
 * Mocks the same product listed across the other marketplaces, so the
 * product page can show a price comparison. Deterministic (seeded by id)
 * so it doesn't reshuffle on every render.
 */
export function getProductOffers(product: Product) {
  const seed = product.id
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0)

  return STORE_ORDER.map((store, index) => {
    const variance = (((seed + index * 13) % 21) - 10) / 100 // -10%..+10%
    const isBase = store === product.store
    const price = isBase
      ? product.price
      : Math.round(product.price * (1 + variance) * 100) / 100
    const originalPrice = product.originalPrice
      ? Math.round(originalPriceFor(price, product) * 100) / 100
      : undefined

    return {
      store,
      price,
      originalPrice,
      affiliateUrl: isBase ? product.affiliateUrl : "#",
      isFreeShipping: isBase
        ? product.isFreeShipping
        : (seed + index) % 2 === 0,
    }
  }).sort((a, b) => a.price - b.price)
}

function originalPriceFor(price: number, product: Product) {
  if (!product.originalPrice) return price
  const ratio = product.originalPrice / product.price
  return price * ratio
}
