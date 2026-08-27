import { NextResponse } from 'next/server';
import { mockProperties } from '@/lib/data';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const search = searchParams.get('search');

  let filteredProperties = [...mockProperties];

  // Filter by type (sale/rent)
  if (type && type !== 'all') {
    filteredProperties = filteredProperties.filter(p => p.type === type);
  }

  // Search by title or location
  if (search) {
    const searchLower = search.toLowerCase();
    filteredProperties = filteredProperties.filter(p => 
      p.title.toLowerCase().includes(searchLower) || 
      p.location.toLowerCase().includes(searchLower) ||
      p.city.toLowerCase().includes(searchLower)
    );
  }

  // Simulate network delay for a more realistic mock
  await new Promise(resolve => setTimeout(resolve, 500));

  return NextResponse.json(filteredProperties);
}
