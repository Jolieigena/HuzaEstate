import type { Product, ProductFacets, ProductList, ProductQuery } from "./api";

const SUPPLIERS = {
  urbanLiving: {
    accountId: "09b19224-86d2-4a2e-bfc5-18ebff911232",
    companyName: "Urban Living Rwanda",
    logoUrl: "/seed/interior-living-sofa.jpg",
    city: "Kigali",
    country: "Rwanda",
    verified: true,
    paused: false,
    rating: { average: 4.9, count: 28 },
    delivery: { fee: 15, currency: "USD", freeOver: 300 },
  },
  kigaliFurniture: {
    accountId: "596c3c88-c2f4-4293-a8ba-29a79facc5d8",
    companyName: "Kigali Furniture House",
    logoUrl: "/seed/interior-living-chair.jpg",
    city: "Kigali",
    country: "Rwanda",
    verified: true,
    paused: false,
    rating: { average: 4.8, count: 42 },
    delivery: { fee: 10, currency: "USD", freeOver: 200 },
  },
  nairobiWoodworks: {
    accountId: "63359f15-1cfe-4bfa-82f0-9bed1212dd37",
    companyName: "Nairobi Woodworks",
    logoUrl: "/seed/interior-bedroom-modern.jpg",
    city: "Nairobi",
    country: "Kenya",
    verified: true,
    paused: false,
    rating: { average: 4.7, count: 19 },
    delivery: { fee: 25, currency: "USD", freeOver: 500 },
  },
};

export const INITIAL_PRODUCTS: Product[] = [
  // ── Co-Creation AI Designed Sets & Per m² Items ──────────────────────────
  {
    id: "huza-set-living-room",
    name: "Living Room Set",
    description: "Round oak coffee table (80 cm) and two cream bouclé armchairs. Made in Kigali.",
    category: "Sofas & seating",
    images: ["/seed/products/living-room-set.jpg"],
    price: 480,
    currency: "USD",
    stock: "made_to_order",
    leadTimeDays: 10,
    status: "published",
    supplier: SUPPLIERS.urbanLiving,
    createdAt: "2026-11-03T14:00:00.000Z",
  },
  {
    id: "huza-set-dining-table",
    name: "Walnut Dining Set",
    description: "Solid walnut table (180 × 90 cm) with six padded chairs. Matte wax finish.",
    category: "Tables & desks",
    images: ["/seed/products/dining-table-set.jpg"],
    price: 680,
    currency: "USD",
    stock: "made_to_order",
    leadTimeDays: 14,
    status: "published",
    supplier: SUPPLIERS.kigaliFurniture,
    createdAt: "2026-11-03T14:05:00.000Z",
  },
  {
    id: "huza-set-tv-stand",
    name: "Fluted Oak TV Stand",
    description: "Low oak console with sliding doors, a soundbar shelf and hidden cable space. Fits 55\" to 75\" TVs.",
    category: "Storage & wardrobes",
    images: ["/seed/products/tv-stand-console.jpg"],
    price: 320,
    currency: "USD",
    stock: "in_stock",
    quantity: 8,
    lowStockAt: 3,
    status: "published",
    supplier: SUPPLIERS.kigaliFurniture,
    createdAt: "2026-11-03T14:10:00.000Z",
  },
  {
    id: "huza-set-kitchen-modular",
    name: "Modular Kitchen Set",
    description: "Oak and charcoal cabinets with soft-close hinges and a quartz island. Fitted to your kitchen.",
    category: "Kitchen furniture",
    images: ["/seed/products/modern-kitchen-design.jpg"],
    price: 1650,
    currency: "USD",
    stock: "made_to_order",
    leadTimeDays: 21,
    status: "published",
    supplier: SUPPLIERS.nairobiWoodworks,
    createdAt: "2026-11-03T14:15:00.000Z",
  },
  {
    id: "huza-m2-gypsum-ceiling",
    name: "Gypsum Ceiling (per m²)",
    description: "Multi-tier gypsum ceiling with LED cove lighting, supplied and installed in Kigali. Enter your room area in m² as the quantity.",
    category: "Roofing & building materials",
    images: ["/seed/products/ceiling-design-gypsum.jpg"],
    price: 28,
    currency: "USD",
    stock: "made_to_order",
    leadTimeDays: 3,
    status: "published",
    supplier: SUPPLIERS.urbanLiving,
    createdAt: "2026-11-03T14:20:00.000Z",
  },
  {
    id: "huza-m2-wall-paint",
    name: "Wall Paint & Limewash (per m²)",
    description: "Low-VOC velvet matte finish in Warm Sand, Kigali Terracotta, Soft Sage or Slate Grey. Priced per m² applied, also sold in 20 L drums.",
    category: "Paint & finishes",
    images: ["/seed/products/wall-paints-finish.jpg"],
    price: 12,
    currency: "USD",
    stock: "in_stock",
    quantity: 150,
    lowStockAt: 10,
    status: "published",
    supplier: SUPPLIERS.kigaliFurniture,
    createdAt: "2026-11-03T14:25:00.000Z",
  },
];

export function filterInitialProducts(query: ProductQuery = {}): ProductList {
  let list = [...INITIAL_PRODUCTS];

  if (query.category) {
    list = list.filter((p) => p.category.toLowerCase() === query.category?.toLowerCase());
  }

  if (query.supplierId) {
    list = list.filter((p) => p.supplier?.accountId === query.supplierId);
  }

  if (query.country) {
    list = list.filter((p) => p.supplier?.country?.toLowerCase() === query.country?.toLowerCase());
  }

  if (query.availability === "available") {
    list = list.filter((p) => p.stock !== "out_of_stock");
  }

  if (query.minPrice !== undefined && query.minPrice !== "") {
    list = list.filter((p) => p.price >= Number(query.minPrice));
  }

  if (query.maxPrice !== undefined && query.maxPrice !== "") {
    list = list.filter((p) => p.price <= Number(query.maxPrice));
  }

  if (query.search) {
    const q = query.search.toLowerCase();
    list = list.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
  }

  switch (query.sort) {
    case "price_asc":
      list.sort((a, b) => a.price - b.price);
      break;
    case "price_desc":
      list.sort((a, b) => b.price - a.price);
      break;
    case "name":
      list.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "newest":
    default:
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
  }

  const page = query.page || 1;
  const limit = query.limit || 24;
  const total = list.length;
  const start = (page - 1) * limit;
  const paged = list.slice(start, start + limit);

  return {
    products: paged,
    total,
    page,
    limit,
  };
}

export function getInitialFacets(): ProductFacets {
  const categoriesMap = new Map<string, number>();
  const suppliersMap = new Map<string, { name: string; count: number }>();
  const countriesMap = new Map<string, number>();
  let available = 0;

  for (const p of INITIAL_PRODUCTS) {
    categoriesMap.set(p.category, (categoriesMap.get(p.category) ?? 0) + 1);
    if (p.supplier) {
      const prev = suppliersMap.get(p.supplier.accountId) ?? { name: p.supplier.companyName, count: 0 };
      suppliersMap.set(p.supplier.accountId, { name: p.supplier.companyName, count: prev.count + 1 });
      if (p.supplier.country) {
        countriesMap.set(p.supplier.country, (countriesMap.get(p.supplier.country) ?? 0) + 1);
      }
    }
    if (p.stock !== "out_of_stock") available++;
  }

  return {
    categories: Array.from(categoriesMap.entries()).map(([name, count]) => ({ name, count })),
    suppliers: Array.from(suppliersMap.entries()).map(([id, { name, count }]) => ({ id, name, count })),
    countries: Array.from(countriesMap.entries()).map(([name, count]) => ({ name, count })),
    currencies: [{ code: "USD", count: INITIAL_PRODUCTS.length }],
    available,
    total: INITIAL_PRODUCTS.length,
  };
}

export function getInitialProduct(id: string): Product | undefined {
  return INITIAL_PRODUCTS.find((p) => p.id === id);
}
