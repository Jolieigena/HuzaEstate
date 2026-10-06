import type { Metadata } from "next";

// The property page itself is a client component, so the link preview (Open Graph / X card) a shared
// listing shows is produced here, on the server. Failing to load the listing just falls back to the
// site's default metadata; it never breaks the page.
const API_URL = process.env.PROPERTY_API_INTERNAL_URL || process.env.NEXT_PUBLIC_PROPERTY_API_URL || "http://localhost:8081/api/property-service";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetch(`${API_URL}/properties/${encodeURIComponent(id)}`, { next: { revalidate: 300 } });
    if (!res.ok) return {};
    const { property } = (await res.json()) as { property?: { title?: string; description?: string; location?: string; city?: string; country?: string; imageUrl?: string } };
    if (!property?.title) return {};
    const place = [property.location, property.city, property.country].filter(Boolean).join(", ");
    const description = (property.description || place || "View this listing on HuzaEstate.").replace(/\s+/g, " ").trim().slice(0, 200);
    const images = property.imageUrl ? [property.imageUrl] : undefined;
    return {
      title: property.title,
      description,
      openGraph: { title: property.title, description, type: "website", images },
      twitter: { card: images ? "summary_large_image" : "summary", title: property.title, description, images },
    };
  } catch {
    return {};
  }
}

export default function PropertyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
