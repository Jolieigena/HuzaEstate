"use client";

import { useState } from "react";
import { listDistrictTrends } from "@/lib/marketAnalytics/analyticsService";
import { getPortfolio } from "@/lib/portfolio/portfolioService";
import { MARKET_ANALYTICS_DISCLAIMER, RESALE_VERDICT_LABELS } from "@/lib/marketAnalytics/types";
import TrendChart from "@/components/charts/TrendChart";
import StatTile from "@/components/charts/StatTile";

const VERDICT_STYLE: Record<string, string> = {
  hold: "bg-slate-100 text-slate-600",
  consider_selling: "bg-amber-100 text-amber-700",
  sell_now: "bg-[#2ec440]/10 text-[#219b31]",
};

export default function MarketInsightsTab() {
  const trends = listDistrictTrends();
  // Matches every other dashboard tab in this prototype: reads the single
  // fixture "demo-user" owner (myProperties.ts) rather than the real logged
  // in account id — see the comment in PropertiesTab.tsx.
  const portfolio = getPortfolio("demo-user");
  const withRecommendation = portfolio.filter((p) => p.resaleRecommendation);

  const [selectedDistrict, setSelectedDistrict] = useState(portfolio[0]?.district ?? trends[0].district);
  const trend = trends.find((t) => t.district === selectedDistrict) ?? trends[0];

  const combined = [...trend.history, ...trend.forecast].map((p) => ({ label: p.month, value: p.avgPricePerSqm }));
  const currentPricePerSqm = trend.history[trend.history.length - 1].avgPricePerSqm;
  const forecastPricePerSqm = trend.forecast[trend.forecast.length - 1].avgPricePerSqm;
  const forecastChangePct = Math.round(((forecastPricePerSqm - currentPricePerSqm) / currentPricePerSqm) * 1000) / 10;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Market Insights</h2>
        <select
          value={selectedDistrict}
          onChange={(e) => setSelectedDistrict(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2ec440]/20 focus:border-[#2ec440]"
        >
          {trends.map((t) => (
            <option key={t.district} value={t.district}>
              {t.district}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
        <StatTile label="Avg. price / m²" value={`$${currentPricePerSqm.toLocaleString()}`} />
        <StatTile
          label="Year over year"
          value={`${trend.yoyChangePct > 0 ? "+" : ""}${trend.yoyChangePct}%`}
          delta={trend.yoyChangePct >= 0 ? "Rising" : "Softening"}
          deltaDirection={trend.yoyChangePct >= 0 ? "up" : "down"}
        />
        <StatTile
          label="6-month forecast"
          value={`$${forecastPricePerSqm.toLocaleString()}`}
          delta={`${forecastChangePct > 0 ? "+" : ""}${forecastChangePct}% projected`}
          deltaDirection={forecastChangePct >= 0 ? "up" : "down"}
        />
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8 mb-6">
        <div className="mb-6">
          <h3 className="font-bold text-slate-900 text-lg">{trend.district} — price per m²</h3>
          <p className="text-sm text-slate-500">Last 12 months, plus a 6-month projection</p>
        </div>
        <TrendChart data={combined} format={(v) => `$${v.toLocaleString()}`} ariaLabel={`${trend.district} average price per square meter, trailing 12 months and 6-month forecast`} />
      </div>

      {withRecommendation.length > 0 && (
        <div className="mb-4">
          <h3 className="font-bold text-slate-900 text-lg mb-3">Should you sell?</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {withRecommendation.map((property) => (
              <div key={property.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-slate-900 truncate">{property.name}</h4>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-black flex-shrink-0 ${VERDICT_STYLE[property.resaleRecommendation!.verdict]}`}>
                    {RESALE_VERDICT_LABELS[property.resaleRecommendation!.verdict]}
                  </span>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">{property.resaleRecommendation!.reasoning}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-slate-400">{MARKET_ANALYTICS_DISCLAIMER}</p>
    </div>
  );
}
