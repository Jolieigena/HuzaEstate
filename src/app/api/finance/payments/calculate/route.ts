import { NextRequest, NextResponse } from "next/server";
import { computeFeeBreakdown, sumLineItemsMinor } from "@/lib/finance/feeCalculator";
import type { Currency, FeeConfiguration, InvoiceLineItem } from "@/lib/finance/types";

// Server-side amount authority (Phase 3 / Journey F). The browser cannot be
// trusted to compute what a customer owes: this handler recomputes the
// subtotal from the invoice's line items and the resulting fee breakdown,
// and reports whether the client-submitted total matches. There is no
// database in this codebase (every other module persists to the browser's
// localStorage), so the fee configuration itself is supplied by the
// request rather than read from a server-side store — the guarantee this
// endpoint provides is that a client cannot alter the *total* without the
// mismatch being caught server-side, not that the fee configuration object
// itself is tamper-proof (a persistent server-side config store would be
// required for that; noted as a remaining production requirement).

interface CalculateRequestBody {
  lineItems: InvoiceLineItem[];
  currency: Currency;
  feeConfig: FeeConfiguration;
  clientTotalMinor: number;
}

function isValidLineItem(item: unknown): item is InvoiceLineItem {
  if (typeof item !== "object" || item === null) return false;
  const li = item as Partial<InvoiceLineItem>;
  return typeof li.lineTotal?.amountMinor === "number" && typeof li.lineTotal?.currency === "string";
}

export async function POST(request: NextRequest) {
  let body: CalculateRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!Array.isArray(body.lineItems) || !body.lineItems.every(isValidLineItem) || !body.currency || !body.feeConfig || typeof body.clientTotalMinor !== "number") {
    return NextResponse.json({ error: "Missing or malformed calculation fields." }, { status: 400 });
  }

  const subtotalMinor = sumLineItemsMinor(body.lineItems);
  const serviceAmount = { amountMinor: subtotalMinor, currency: body.currency };
  const breakdown = computeFeeBreakdown(serviceAmount, body.feeConfig);

  const matches = breakdown.totalCharge.amountMinor === body.clientTotalMinor;

  return NextResponse.json({
    ok: true,
    matchesClientTotal: matches,
    subtotalMinor,
    breakdown,
    authoritativeTotalMinor: breakdown.totalCharge.amountMinor,
  });
}
