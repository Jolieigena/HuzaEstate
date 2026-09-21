import { NextResponse } from 'next/server';

export interface AIPropertyFilters {
  type?: 'sale' | 'rent' | 'all';
  propertyType?: 'house' | 'apartment' | 'land' | 'all';
  minBedrooms?: number;
  maxBedrooms?: number;
  minPrice?: number;
  maxPrice?: number;
  minSqm?: number;
  maxSqm?: number;
  city?: string;
  keywords?: string[];
  suggestBuild: boolean;
  summary: string;
}

/** Lightweight NLP parser — no external API required. */
function parsePropertyRequest(input: string): AIPropertyFilters {
  const text = input.toLowerCase().trim();
  const filters: AIPropertyFilters = { suggestBuild: false, summary: '' };

  // ── Sale / Rent ──────────────────────────────────────────────────────────
  if (/\b(rent|rental|renting|lease|for rent|monthly)\b/.test(text)) {
    filters.type = 'rent';
  } else if (/\b(buy|purchase|sale|for sale|buying)\b/.test(text)) {
    filters.type = 'sale';
  }

  // ── Property Type ─────────────────────────────────────────────────────────
  if (/\b(apartment|flat|condo|studio|penthouse|loft)\b/.test(text)) {
    filters.propertyType = 'apartment';
  } else if (/\b(land|plot|lot|acre|hectare)\b/.test(text)) {
    filters.propertyType = 'land';
  } else if (/\b(house|home|villa|bungalow|townhouse|cottage|mansion|residence)\b/.test(text)) {
    filters.propertyType = 'house';
  }

  // ── Bedrooms ──────────────────────────────────────────────────────────────
  const bedroomPatterns = [
    /(\d+)\s*-?\s*(?:\+|or more|plus)?\s*-?\s*(?:bed(?:room)?s?|br|bdr)/,
    /(\d+)\s*-?\s*(?:bedroom|bed)/,
    /(studio)/,
  ];
  for (const pat of bedroomPatterns) {
    const m = text.match(pat);
    if (m) {
      if (m[1] === 'studio') {
        filters.minBedrooms = 0;
        filters.maxBedrooms = 1;
      } else {
        const n = parseInt(m[1], 10);
        if (/(\d+)\s*\+/.test(text.slice(m.index ?? 0, (m.index ?? 0) + 20))) {
          filters.minBedrooms = n;
        } else {
          filters.minBedrooms = n;
          filters.maxBedrooms = n;
        }
      }
      break;
    }
  }

  // ── Price ─────────────────────────────────────────────────────────────────
  // Matches patterns like "$300k", "300,000", "under $1500/mo", "between $100k and $300k"
  // Bedroom/bath/sqm counts are numbers too — strip them first so "3-bed house"
  // isn't misread as a $3 price cap (which returned zero results).
  const priceText = text
    .replace(/\d+\s*\+?\s*-?\s*(?:bed(?:room)?s?|br|bdr|bath(?:room)?s?)\b/g, ' ')
    .replace(/\d+\s*(?:sqm|sq\.?\s*m|square\s*met(?:er|re)s?)/g, ' ');
  const priceTokens = [...priceText.matchAll(/\$?([\d,]+(?:\.\d+)?)\s*k?\b/g)].map(m => {
    const raw = parseFloat(m[1].replace(/,/g, ''));
    // detect 'k' suffix
    return /^\$?[\d,]+k/.test(m[0]) ? raw * 1000 : raw;
  });

  const underMatch = text.match(/(?:under|below|less than|max(?:imum)?|up to)\s*\$?([\d,]+(?:\.\d+)?)\s*k?\b/);
  const overMatch = text.match(/(?:over|above|more than|min(?:imum)?|at least)\s*\$?([\d,]+(?:\.\d+)?)\s*k?\b/);
  const betweenMatch = text.match(/between\s*\$?([\d,]+(?:\.\d+)?)\s*k?\s*(?:and|to|-)\s*\$?([\d,]+(?:\.\d+)?)\s*k?\b/);

  if (betweenMatch) {
    const a = parseFloat(betweenMatch[1].replace(/,/g, '')) * (/k/.test(betweenMatch[0].split('and')[0]) ? 1000 : 1);
    const b = parseFloat(betweenMatch[2].replace(/,/g, '')) * (/k\b/.test(betweenMatch[0].split('and')[1] ?? '') ? 1000 : 1);
    filters.minPrice = Math.min(a, b);
    filters.maxPrice = Math.max(a, b);
  } else {
    if (underMatch) {
      const raw = parseFloat(underMatch[1].replace(/,/g, ''));
      filters.maxPrice = /k\b/.test(underMatch[0]) ? raw * 1000 : raw;
    }
    if (overMatch) {
      const raw = parseFloat(overMatch[1].replace(/,/g, ''));
      filters.minPrice = /k\b/.test(overMatch[0]) ? raw * 1000 : raw;
    }
    // Fallback: if exactly one price token and no directional word, treat as max
    if (!filters.minPrice && !filters.maxPrice && priceTokens.length === 1) {
      filters.maxPrice = priceTokens[0];
    }
  }

  // ── Square Meters ────────────────────────────────────────────────────────
  const sqmMatch = text.match(/(\d+)\s*(?:sqm|sq\.?\s*m|square\s*met(?:er|re)s?)/);
  if (sqmMatch) {
    filters.minSqm = parseInt(sqmMatch[1], 10);
  }

  // ── City / Location ───────────────────────────────────────────────────────
  const rwandaCities = [
    'kigali', 'gasabo', 'nyarugenge', 'kicukiro',
    'musanze', 'rubavu', 'muhanga', 'huye', 'nyagatare', 'rusizi',
    'gicumbi', 'kayonza', 'rwamagana', 'bugesera', 'nyamasheke',
    'kamonyi', 'ngoma', 'kirehe', 'gatsibo', 'rulindo',
    'gakenke', 'nyabihu', 'ngororero', 'rutsiro', 'karongi',
    'nyanza', 'gisagara', 'nyaruguru', 'ruhango', 'nyamagabe',
  ];
  for (const city of rwandaCities) {
    if (text.includes(city)) {
      filters.city = city.charAt(0).toUpperCase() + city.slice(1);
      break;
    }
  }

  // ── Keywords (amenity signals) ────────────────────────────────────────────
  const amenityWords = [
    'pool', 'garden', 'garage', 'parking', 'balcony', 'terrace',
    'view', 'modern', 'furnished', 'unfurnished', 'gated', 'security',
    'solar', 'elevator', 'gym', 'compound', 'quiet', 'spacious',
  ];
  filters.keywords = amenityWords.filter(w => text.includes(w));

  // ── Build a readable summary ──────────────────────────────────────────────
  const parts: string[] = [];
  if (filters.propertyType && filters.propertyType !== 'all') parts.push(filters.propertyType);
  if (filters.minBedrooms !== undefined) {
    parts.push(
      filters.maxBedrooms === filters.minBedrooms
        ? `${filters.minBedrooms}-bed`
        : `${filters.minBedrooms}+ bed`
    );
  }
  if (filters.type) parts.push(`for ${filters.type}`);
  if (filters.maxPrice) parts.push(`under $${filters.maxPrice.toLocaleString()}`);
  if (filters.minPrice && !filters.maxPrice) parts.push(`over $${filters.minPrice.toLocaleString()}`);
  if (filters.city) parts.push(`in ${filters.city}`);
  if (filters.keywords?.length) parts.push(`with ${filters.keywords.slice(0, 2).join(' & ')}`);

  filters.summary = parts.length
    ? `Looking for a ${parts.join(', ')}.`
    : 'Showing all available properties.';

  return filters;
}

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }
    const filters = parsePropertyRequest(message);
    return NextResponse.json(filters);
  } catch {
    return NextResponse.json({ error: 'Failed to parse request' }, { status: 500 });
  }
}
