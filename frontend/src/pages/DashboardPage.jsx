import { useEffect, useState } from "react";
import { useOutletContext, Link } from "react-router-dom";
import api, { formatRupiah, formatRupiahShort, formatDateID } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, Plus } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import AddTransactionDialog from "../components/AddTransactionDialog";

export default function DashboardPage() {
  const { user } = useAuth();
  const { refreshKey, refresh } = useOutletContext();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [openAdd, setOpenAdd] = useState(false);

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

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4 fade-up">
        <div>
          <div className="eyebrow">Halo, {user?.name?.split(" ")[0] || "Sahabat"}</div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-[#1E3F32] tracking-tight mt-2">
            Dasbor Keuangan
          </h1>
          <p className="text-[#697A6E] mt-2">Ringkasan untuk {monthLabel}</p>
        </div>
        <button
          onClick={() => setOpenAdd(true)}
          data-testid="dashboard-add-transaction-btn"
          className="flex items-center gap-2 px-5 h-12 rounded-xl bg-[#2C3D30] text-white font-semibold hover:bg-[#3A5240] active:scale-95 transition"
        >
          <Plus className="w-4 h-4" /> Tambah Transaksi
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <SummaryCard
          testid="stat-balance"
          label="Saldo Total"
          value={formatRupiah(stats?.balance ?? 0)}
          icon={<Wallet className="w-5 h-5" strokeWidth={1.5} />}
          accent="primary"
          delay="fade-up-1"
        />
        <SummaryCard
          testid="stat-income"
          label="Pemasukan Bulan Ini"
          value={formatRupiah(stats?.total_income ?? 0)}
          icon={<TrendingUp className="w-5 h-5" strokeWidth={1.5} />}
          accent="income"
          delay="fade-up-2"
        />
        <SummaryCard
          testid="stat-expense"
          label="Pengeluaran Bulan Ini"
          value={formatRupiah(stats?.total_expense ?? 0)}
          icon={<TrendingDown className="w-5 h-5" strokeWidth={1.5} />}
          accent="expense"
          delay="fade-up-3"
        />
      </div>

      {/* Trend Chart + Recent transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E5E2DC] p-6 fade-up fade-up-3" data-testid="trend-chart-card">
          <div className="flex items-center justify-between mb-1">
            <div>
              <div className="eyebrow">Tren 6 Bulan</div>
              <h3 className="font-display text-xl font-semibold text-[#1E3F32] mt-1">Arus Kas</h3>
            </div>
          </div>
          <div className="h-72 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.trend || []} margin={{ left: -10, right: 5, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5F8575" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#5F8575" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C86753" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#C86753" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="#E5E2DC" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#697A6E" }} tickFormatter={(m) => m?.split("-")[1]} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#697A6E" }} tickFormatter={(v) => formatRupiahShort(v)} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#1E3F32", border: "none", borderRadius: 12, color: "#fff" }}
                  labelStyle={{ color: "#D99B58", fontWeight: 700 }}
                  formatter={(v, n) => [formatRupiah(v), n === "income" ? "Pemasukan" : "Pengeluaran"]}
                />
                <Area type="monotone" dataKey="income" stroke="#5F8575" strokeWidth={2.5} fill="url(#incomeColor)" />
                <Area type="monotone" dataKey="expense" stroke="#C86753" strokeWidth={2.5} fill="url(#expenseColor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E2DC] p-6 fade-up fade-up-4" data-testid="recent-transactions-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="eyebrow">Aktivitas</div>
              <h3 className="font-display text-xl font-semibold text-[#1E3F32] mt-1">Transaksi Terbaru</h3>
            </div>
            <Link to="/transactions" className="text-xs font-semibold text-[#2C3D30] hover:text-[#D99B58]" data-testid="link-all-transactions">
              Lihat semua
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="text-center py-10 text-[#8A9A86]">Belum ada transaksi</div>
          ) : (
            <div className="space-y-2">
              {recent.slice(0, 6).map((t) => (
                <div key={t.id} className="flex items-center gap-3 py-2 border-b border-[#F0EDE5] last:border-0" data-testid={`recent-tx-${t.id}`}>
                  <div className={`w-9 h-9 rounded-xl grid place-items-center ${t.type === "income" ? "bg-[#5F8575]/15 text-[#5F8575]" : "bg-[#C86753]/15 text-[#C86753]"}`}>
                    {t.type === "income" ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-[#1E3F32] truncate">{t.description || t.category}</div>
                    <div className="text-xs text-[#697A6E]">{t.category} · {formatDateID(t.date)}</div>
                  </div>
                  <div className={`text-sm font-bold tabular ${t.type === "income" ? "text-[#5F8575]" : "text-[#C86753]"}`}>
                    {t.type === "income" ? "+" : "-"}{formatRupiahShort(t.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AddTransactionDialog
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        onSuccess={() => { setOpenAdd(false); refresh(); }}
      />
    </div>
  );
}

function SummaryCard({ label, value, icon, accent = "primary", testid, delay = "" }) {
  const colors = {
    primary: "bg-[#2C3D30] text-white",
    income: "bg-[#5F8575]/12 text-[#5F8575]",
    expense: "bg-[#C86753]/12 text-[#C86753]",
  };
  return (
    <div className={`bg-white rounded-2xl border border-[#E5E2DC] p-6 fade-up ${delay}`} data-testid={testid}>
      <div className="flex items-center justify-between">
        <div className="eyebrow">{label}</div>
        <div className={`w-9 h-9 rounded-xl grid place-items-center ${colors[accent]}`}>{icon}</div>
      </div>
      <div className="mt-4 font-display text-2xl sm:text-[1.7rem] font-bold text-[#1E3F32] tabular tracking-tight">
        {value}
      </div>
    </div>
  );
}
