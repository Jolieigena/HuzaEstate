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
    name: "Kigali Modern Living Room Set (Round Oak Coffee Table & 2 Bouclé Armchairs)",
    description: "Complete 3-piece living room conversation set designed for local artisan co-creation. Features a solid natural oak round coffee table (80cm diameter) with sculpted pedestal base and 2 matching ergonomic armchairs upholstered in high-durability cream textured bouclé fabric. Handcrafted in collaboration with Kigali woodworking and upholstery workshops.",
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
    name: "Solid Walnut 6-Seater Dining Room Set (Table & 6 Cushioned Chairs)",
    description: "Contemporary 7-piece dining set engineered for Rwandan hardwood production. Includes one rectangular solid walnut dining table (180cm x 90cm) and six matching minimalist dining chairs with charcoal grey padded seats. Built using sustainably sourced timber and a non-toxic matte protective wax finish.",
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
    name: "Fluted Oak TV Stand & Media Console Unit Set",
    description: "Modern low-profile entertainment console unit with fluted oak sliding tambour doors, open soundbar/media shelf, matte black powder-coated steel base, and hidden rear cable management. Designed for 55\" to 75\" TVs. Available ready-to-ship or custom-sized by local carpenters.",
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
    name: "Modular Contemporary Kitchen Cabinet & Island Counter Set",
    description: "Full modular kitchen cabinetry set co-created with local joinery and stone fabrication suppliers. Includes floor and wall cabinetry in warm oak grain and matte charcoal with soft-close Blum hinges, quartz waterfall prep island, and integrated LED accent profile channels. Customized on-site to your exact kitchen dimensions.",
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
    name: "Architectural Gypsum False Ceiling with LED Cove Lighting (Price per m²)",
    description: "Priced per square meter (m²). Multi-tier suspended gypsum plasterboard ceiling system featuring hidden LED warm cove lighting troughs, acoustic dampening, and reinforced steel frame grid. Supplied and installed by certified local drywall craftsmen across Kigali. Enter your room area in m² as quantity.",
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
    name: "Velvet Matte Architectural Wall Paint & Limewash Finish (Price per m²)",
    description: "Priced per square meter (m²) applied, or available in 20L drums. Premium eco-friendly, ultra-low VOC velvet matte architectural wall paint and microcement plaster finish. Formulated for high washability and humidity resistance in Rwandan climates. Includes custom color matching in earth tones: Warm Sand, Kigali Terracotta, Soft Sage, and Slate Grey.",
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

  // ── Additional Starter Products ──────────────────────────────────────────
  {
    id: "4219e793-0ddf-4593-9b08-31e5e4fd1419",
    name: "Tan leather 3 seater sofa",
    description: "Full-grain leather on a solid wood frame. Seats three comfortably.",
    category: "Sofas & seating",
    images: ["/seed/products/tan-leather-sofa.jpg"],
    price: 850,
    currency: "USD",
    stock: "in_stock",
    quantity: 4,
    status: "published",
    supplier: SUPPLIERS.kigaliFurniture,
    createdAt: "2026-10-15T10:00:00.000Z",
  },
  {
    id: "a9ae3f77-fbe0-4a52-9357-7e1b6f2595f0",
    name: "Emerald velvet sofa",
    description: "Deep green velvet with tapered wooden legs and high density foam cushioning.",
    category: "Sofas & seating",
    images: ["/seed/products/emerald-sofa.jpg"],
    price: 720,
    currency: "USD",
    stock: "in_stock",
    quantity: 3,
    status: "published",
    supplier: SUPPLIERS.kigaliFurniture,
    createdAt: "2026-10-15T10:05:00.000Z",
  },
  {
    id: "182abc26-69a3-4923-b40a-58ac2051d230",
    name: "Walnut console table",
    description: "A slim console with drawer storage, perfect for entrance halls and living rooms.",
    category: "Tables & desks",
    images: ["/seed/products/walnut-console.jpg"],
    price: 260,
    currency: "USD",
    stock: "in_stock",
    quantity: 5,
    status: "published",
    supplier: SUPPLIERS.kigaliFurniture,
    createdAt: "2026-10-15T10:10:00.000Z",
  },
  {
    id: "93e51c4c-f09e-4549-8022-cb5860d9096d",
    name: "Industrial floor lamp",
    description: "Matt grey metal shade with an adjustable counterweight arm.",
    category: "Lighting",
    images: ["/seed/products/floor-lamp.jpg"],
    price: 85,
    currency: "USD",
    stock: "in_stock",
    quantity: 12,
    status: "published",
    supplier: SUPPLIERS.kigaliFurniture,
    createdAt: "2026-10-15T10:15:00.000Z",
  },
  {
    id: "57cd82a7-b19f-4672-b5b2-64b1d0c2d960",
    name: "Grey pendant light",
    description: "A minimalist dome pendant light for kitchens, dining areas, and bedside lighting.",
    category: "Lighting",
    images: ["/seed/products/pendant-light.jpg"],
    price: 45,
    currency: "USD",
    stock: "in_stock",
    quantity: 20,
    status: "published",
    supplier: SUPPLIERS.kigaliFurniture,
    createdAt: "2026-10-15T10:20:00.000Z",
  },
  {
    id: "7e9dc4d2-2e9b-4e55-97ee-a5d1c03a57c3",
    name: "Yellow 2 seater sofa",
    description: "A bright, washable fabric cover on a compact hardwood frame.",
    category: "Sofas & seating",
    images: ["/seed/products/yellow-sofa.jpg"],
    price: 390,
    currency: "USD",
    stock: "in_stock",
    quantity: 5,
    status: "published",
    supplier: SUPPLIERS.urbanLiving,
    createdAt: "2026-10-15T10:25:00.000Z",
  },
  {
    id: "3cf958d7-9164-4e0a-b94f-41de030eff6e",
    name: "Round side table",
    description: "A light round accent table crafted for plants and coffee in cozy corners.",
    category: "Decor & accessories",
    images: ["/seed/products/side-table.jpg"],
    price: 95,
    currency: "USD",
    stock: "in_stock",
    quantity: 14,
    status: "published",
    supplier: SUPPLIERS.urbanLiving,
    createdAt: "2026-10-15T10:30:00.000Z",
  },
  {
    id: "72928f6e-c23d-41bb-ac8f-074bb7b87377",
    name: "Wooden wardrobe and shelving unit",
    description: "Tall wardrobe unit with open shelves, clothes rail, and modular storage compartments.",
    category: "Storage & wardrobes",
    images: ["/seed/products/wardrobe-unit.jpg"],
    price: 650,
    currency: "USD",
    stock: "made_to_order",
    leadTimeDays: 21,
    status: "published",
    supplier: SUPPLIERS.nairobiWoodworks,
    createdAt: "2026-10-15T10:35:00.000Z",
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
