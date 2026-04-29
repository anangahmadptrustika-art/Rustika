import { useEffect, useState } from "react";
import { useOutletContext, Link } from "react-router-dom";
import api, { formatRupiah, formatRupiahShort, formatDateID } from "../lib/api";
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Plus, Mic, Eye, EyeOff } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import AddTransactionDialog from "../components/AddTransactionDialog";
import { HeaderUser } from "../components/Sidebar";
import useTheme from "../hooks/useTheme";

export default function DashboardPage() {
  const { refreshKey, refresh } = useOutletContext();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [hidden, setHidden] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const axisTick = { fontSize: 10, fill: isDark ? "#94A3B8" : "#9AA5B8" };
  const tooltipStyle = {
    background: isDark ? "#0B1220" : "#0F172A",
    border: isDark ? "1px solid #1E293B" : "none",
    borderRadius: 12,
    color: "#fff",
    fontSize: 12,
  };

  useEffect(() => {
    (async () => {
      try {
        const [s, t] = await Promise.all([
          api.get("/stats/summary"),
          api.get("/transactions", { params: { limit: 8 } }),
        ]);
        setStats(s.data);
        setRecent(t.data);
      } catch {}
    })();
  }, [refreshKey]);

  const monthLabel = new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  const masked = "Rp •••••••";

  return (
    <div className="space-y-5">
      <HeaderUser />

      {/* Wallet card */}
      <div
        className="relative rounded-3xl text-white p-5 overflow-hidden fade-up fade-up-1 shadow-lg shadow-[#118EEA]/20"
        style={{ background: "linear-gradient(135deg, #118EEA 0%, #0E7BC9 60%, #0A5091 100%)" }}
        data-testid="wallet-card"
      >
        {/* decorative shapes */}
        <div className="absolute -top-12 -right-10 w-44 h-44 rounded-full bg-white/12 blur-2xl" />
        <div className="absolute -bottom-16 -left-10 w-44 h-44 rounded-full bg-[#FF8A00]/15 blur-2xl" />

        <div className="relative flex items-center justify-between">
          <div className="text-[10px] tracking-[0.22em] uppercase font-bold text-white">Saldo Total</div>
          <button
            onClick={() => setHidden(!hidden)}
            data-testid="toggle-balance-visibility"
            className="w-8 h-8 rounded-full bg-white/10 backdrop-blur grid place-items-center text-white/80 hover:bg-white/20"
          >
            {hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <div
          className="relative mt-2 font-display text-[2.1rem] font-bold tracking-tight tabular leading-none"
          data-testid="balance-amount"
        >
          {hidden ? masked : formatRupiah(stats?.balance ?? 0)}
        </div>
        <div className="relative text-xs text-white/60 mt-1.5">{monthLabel}</div>

        <div className="relative grid grid-cols-2 gap-3 mt-5">
          <div className="bg-white/8 backdrop-blur-sm rounded-2xl p-3.5 border border-white/10" data-testid="stat-income">
            <div className="flex items-center gap-1.5">
              <span className="w-7 h-7 rounded-full bg-[#21BE7C]/30 grid place-items-center">
                <TrendingUp className="w-3.5 h-3.5 text-[#86E1B5]" strokeWidth={2} />
              </span>
              <div className="text-[10px] uppercase tracking-wider font-bold text-white/70">Pemasukan</div>
            </div>
            <div className="mt-2 font-display text-base font-bold tabular">
              {hidden ? "•••" : formatRupiahShort(stats?.total_income ?? 0)}
            </div>
          </div>
          <div className="bg-white/8 backdrop-blur-sm rounded-2xl p-3.5 border border-white/10" data-testid="stat-expense">
            <div className="flex items-center gap-1.5">
              <span className="w-7 h-7 rounded-full bg-[#EE4B5C]/30 grid place-items-center">
                <TrendingDown className="w-3.5 h-3.5 text-[#F5A9B0]" strokeWidth={2} />
              </span>
              <div className="text-[10px] uppercase tracking-wider font-bold text-white/70">Pengeluaran</div>
            </div>
            <div className="mt-2 font-display text-base font-bold tabular">
              {hidden ? "•••" : formatRupiahShort(stats?.total_expense ?? 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3 fade-up fade-up-2">
        <QuickAction
          testid="dashboard-add-transaction-btn"
          onClick={() => setOpenAdd(true)}
          icon={<Plus className="w-5 h-5" strokeWidth={2} />}
          label="Tambah"
          accent="bg-[#118EEA] text-white"
        />
        <Link to="/transactions" data-testid="quick-action-transactions" className="contents">
          <QuickAction
            icon={<ArrowLeftRightTiny />}
            label="Riwayat"
            accent="bg-white border border-[#E5E9F0] text-[#0F172A]"
          />
        </Link>
        <QuickAction
          testid="quick-action-voice"
          onClick={() => {
            const btn = document.querySelector('[data-testid="voice-mic-button"]');
            btn?.click();
          }}
          icon={<Mic className="w-5 h-5" strokeWidth={2} />}
          label="Suara"
          accent="bg-[#FF8A00] text-white"
        />
      </div>

      {/* Mini Trend */}
      <div className="bg-white rounded-2xl border border-[#E5E9F0] p-4 fade-up fade-up-3" data-testid="trend-chart-card">
        <div className="flex items-center justify-between mb-1">
          <div>
            <div className="eyebrow">Arus Kas</div>
            <h3 className="font-display text-base font-semibold text-[#0F172A] mt-0.5">6 Bulan Terakhir</h3>
          </div>
        </div>
        <div className="h-44 mt-3 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats?.trend || []} margin={{ left: 0, right: 5, top: 5, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#21BE7C" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#21BE7C" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EE4B5C" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#EE4B5C" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={axisTick} tickFormatter={(m) => m?.split("-")[1]} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={{ color: "#FF8A00", fontWeight: 700 }}
                formatter={(v, n) => [formatRupiah(v), n === "income" ? "Pemasukan" : "Pengeluaran"]}
              />
              <Area type="monotone" dataKey="income" stroke="#21BE7C" strokeWidth={2} fill="url(#incomeColor)" />
              <Area type="monotone" dataKey="expense" stroke="#EE4B5C" strokeWidth={2} fill="url(#expenseColor)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="bg-white rounded-2xl border border-[#E5E9F0] p-5 fade-up fade-up-4" data-testid="recent-transactions-card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="eyebrow">Aktivitas</div>
            <h3 className="font-display text-base font-semibold text-[#0F172A] mt-0.5">Transaksi Terbaru</h3>
          </div>
          <Link to="/transactions" className="text-xs font-semibold text-[#118EEA] hover:text-[#FF8A00]" data-testid="link-all-transactions">
            Lihat semua
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="text-center py-8 text-[#9AA5B8] text-sm">Belum ada transaksi</div>
        ) : (
          <div className="divide-y divide-[#EDF2F7]">
            {recent.slice(0, 5).map((t) => (
              <div key={t.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0" data-testid={`recent-tx-${t.id}`}>
                <div className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 ${t.type === "income" ? "bg-[#21BE7C]/15 text-[#21BE7C]" : "bg-[#EE4B5C]/15 text-[#EE4B5C]"}`}>
                  {t.type === "income" ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-[#0F172A] truncate">{t.description || t.category}</div>
                  <div className="text-[11px] text-[#5C677D] mt-0.5">{t.category} · {formatDateID(t.date)}</div>
                </div>
                <div className={`text-sm font-bold tabular shrink-0 ${t.type === "income" ? "text-[#21BE7C]" : "text-[#EE4B5C]"}`}>
                  {t.type === "income" ? "+" : "-"}{formatRupiahShort(t.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddTransactionDialog
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        onSuccess={() => { setOpenAdd(false); refresh(); }}
      />
    </div>
  );
}

function QuickAction({ icon, label, accent, onClick, testid }) {
  return (
    <button
      onClick={onClick}
      data-testid={testid}
      type="button"
      className={`flex flex-col items-center justify-center gap-1.5 h-20 rounded-2xl active:scale-95 transition ${accent}`}
    >
      <span className="grid place-items-center">{icon}</span>
      <span className="text-[11px] font-semibold">{label}</span>
    </button>
  );
}

function ArrowLeftRightTiny() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3 4 7l4 4" />
      <path d="M4 7h16" />
      <path d="m16 21 4-4-4-4" />
      <path d="M20 17H4" />
    </svg>
  );
}
