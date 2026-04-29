import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import api, { formatRupiah, formatRupiahShort } from "../lib/api";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";

const COLORS = ["#D99B58", "#5F8575", "#C86753", "#2C3D30", "#8A9A86", "#697A6E", "#E5C5A0", "#3A5240", "#B5715E"];

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function ReportsPage() {
  const { refreshKey } = useOutletContext();
  const [stats, setStats] = useState(null);
  const [month, setMonth] = useState(currentMonth());

  useEffect(() => {
    api.get("/stats/summary", { params: { month } }).then((r) => setStats(r.data)).catch(() => {});
  }, [month, refreshKey]);

  const monthLabel = new Date(month + "-01").toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4 fade-up">
        <div>
          <div className="eyebrow">Analisis</div>
          <h1 className="font-display text-4xl font-bold text-[#1E3F32] tracking-tight mt-2">Laporan</h1>
          <p className="text-[#697A6E] mt-2">{monthLabel}</p>
        </div>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          data-testid="reports-month-picker"
          className="h-12 px-4 rounded-xl bg-white border border-[#E5E2DC] focus:border-[#2C3D30] outline-none"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-[#E5E2DC] p-6 fade-up fade-up-1" data-testid="report-summary">
          <div className="eyebrow">Ringkasan</div>
          <h3 className="font-display text-xl font-semibold text-[#1E3F32] mt-1">Bulan Ini</h3>
          <div className="mt-5 space-y-4">
            <Row label="Pemasukan" value={stats?.total_income || 0} color="text-[#5F8575]" testid="report-income" />
            <Row label="Pengeluaran" value={stats?.total_expense || 0} color="text-[#C86753]" testid="report-expense" />
            <div className="border-t border-[#E5E2DC] pt-4">
              <Row label="Selisih" value={(stats?.total_income || 0) - (stats?.total_expense || 0)} color="text-[#1E3F32]" big testid="report-net" />
            </div>
            <div className="text-xs text-[#697A6E]">Transaksi: {stats?.transaction_count || 0}</div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E5E2DC] p-6 fade-up fade-up-2" data-testid="report-category-chart">
          <div className="eyebrow">Distribusi</div>
          <h3 className="font-display text-xl font-semibold text-[#1E3F32] mt-1">Pengeluaran per Kategori</h3>
          <div className="h-72 mt-4">
            {stats?.by_category?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.by_category}
                    dataKey="amount"
                    nameKey="category"
                    cx="40%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={95}
                    paddingAngle={2}
                  >
                    {stats.by_category.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#1E3F32", border: "none", borderRadius: 12, color: "#fff" }}
                    formatter={(v) => formatRupiah(v)}
                  />
                  <Legend
                    verticalAlign="middle"
                    align="right"
                    layout="vertical"
                    iconType="circle"
                    wrapperStyle={{ fontSize: 12, paddingLeft: 10 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full grid place-items-center text-[#8A9A86]">Belum ada data pengeluaran</div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E5E2DC] p-6 fade-up fade-up-3" data-testid="report-monthly-chart">
        <div className="eyebrow">Perbandingan</div>
        <h3 className="font-display text-xl font-semibold text-[#1E3F32] mt-1">Pemasukan vs Pengeluaran (6 Bulan)</h3>
        <div className="h-80 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats?.trend || []} margin={{ left: -10, right: 5, top: 10, bottom: 0 }} barGap={4}>
              <CartesianGrid strokeDasharray="2 4" stroke="#E5E2DC" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#697A6E" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#697A6E" }} tickFormatter={(v) => formatRupiahShort(v)} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#1E3F32", border: "none", borderRadius: 12, color: "#fff" }}
                formatter={(v, n) => [formatRupiah(v), n === "income" ? "Pemasukan" : "Pengeluaran"]}
                cursor={{ fill: "#F0EDE5" }}
              />
              <Bar dataKey="income" fill="#5F8575" radius={[8, 8, 0, 0]} />
              <Bar dataKey="expense" fill="#C86753" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, color = "text-[#1E3F32]", big = false, testid }) {
  return (
    <div className="flex items-center justify-between" data-testid={testid}>
      <div className="eyebrow">{label}</div>
      <div className={`${color} font-display ${big ? "text-2xl" : "text-lg"} font-bold tabular`}>{formatRupiah(value)}</div>
    </div>
  );
}
