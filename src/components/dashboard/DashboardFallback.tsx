export default function DashboardFallback() {
  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 animate-pulse">
        <div className="h-9 w-64 bg-slate-200 rounded-lg mb-3" />
        <div className="h-5 w-80 bg-slate-200 rounded-lg mb-12" />
        <div className="grid md:grid-cols-2 gap-6">
          <div className="h-64 bg-white rounded-3xl border border-slate-100" />
          <div className="h-64 bg-white rounded-3xl border border-slate-100" />
        </div>
      </div>
    </div>
  );
}
