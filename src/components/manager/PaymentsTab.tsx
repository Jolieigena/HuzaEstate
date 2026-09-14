import BarBreakdown from './BarBreakdown';
import { SERIES_COLOR } from './styles';

export default function PaymentsTab() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
          <div className="text-sm font-semibold text-slate-500 mb-1">Total Collected</div>
          <div className="text-2xl font-black text-slate-900">$4,700</div>
          <div className="text-xs font-bold text-[#2ec440] mt-2">↑ +8% this month</div>
        </div>
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
          <div className="text-sm font-semibold text-slate-500 mb-1">Outstanding</div>
          <div className="text-2xl font-black text-red-500">$1,200</div>
          <div className="text-xs font-bold text-red-500 mt-2">1 tenant late</div>
        </div>
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-slate-500">Next Payout</div>
            <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2 py-1 rounded">Nov 1st</span>
          </div>
          <div className="text-2xl font-black text-slate-900 mb-2">$3,500</div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900">Recent Transactions</h3>
            <button className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">Download CSV</button>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold">✓</div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">Rent Payment - Apt 4B</div>
                  <div className="text-xs text-slate-500">Jane Doe • Today</div>
                </div>
              </div>
              <div className="font-black text-slate-900">+$1,200</div>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold">✓</div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">Security Deposit - Villa</div>
                  <div className="text-xs text-slate-500">Alex Thompson • Yesterday</div>
                </div>
              </div>
              <div className="font-black text-slate-900">+$3,500</div>
            </div>

            <div className="flex items-center justify-between p-4 border border-red-100 bg-red-50 rounded-xl">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold">!</div>
                <div>
                  <div className="font-bold text-red-900 text-sm">Overdue Rent - Eco Home</div>
                  <div className="text-xs text-red-600">Mark Smith • 3 days late</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button className="text-xs font-bold text-red-600 bg-white border border-red-200 px-3 py-1.5 rounded-lg shadow-sm hover:bg-red-50">Send Reminder</button>
                <div className="font-black text-red-600">-$850</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-900 text-lg mb-1">Collections Breakdown</h3>
          <p className="text-sm text-slate-500 mb-6">This billing cycle</p>
          <BarBreakdown
            format={(v) => `$${v.toLocaleString()}`}
            items={[
              { label: 'Collected', value: 4700, color: '#0ca30c' },
              { label: 'Upcoming', value: 3500, color: SERIES_COLOR },
              { label: 'Outstanding', value: 1200, color: '#d03b3b' },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
