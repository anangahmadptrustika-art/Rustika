import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import api, { formatRupiah, formatRupiahShort } from "../lib/api";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { TopBar } from "../components/Sidebar";

const COLORS = ["#FF8A00", "#21BE7C", "#EE4B5C", "#118EEA", "#9AA5B8", "#5C677D", "#FFC078", "#0E7BC9", "#D44A56"];

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
    <div className="space-y-5">
      <TopBar subtitle="Analisis" title="Laporan" />

      <input
        type="month"
        value={month}
        onChange={(e) => setMonth(e.target.value)}
        data-testid="reports-month-picker"
        className="w-full h-11 px-4 rounded-xl bg-white border border-[#E5E9F0] focus:border-[#118EEA] outline-none text-sm fade-up fade-up-1"
      />

      <div className="grid gap-4">
        <div className="bg-white rounded-2xl border border-[#E5E9F0] p-5 fade-up fade-up-1" data-testid="report-summary">
          <div className="eyebrow">Ringkasan</div>
          <h3 className="font-display text-base font-semibold text-[#0F172A] mt-1">{monthLabel}</h3>
          <div className="mt-4 space-y-3.5">
            <Row label="Pemasukan" value={stats?.total_income || 0} color="text-[#21BE7C]" testid="report-income" />
            <Row label="Pengeluaran" value={stats?.total_expense || 0} color="text-[#EE4B5C]" testid="report-expense" />
            <div className="border-t border-[#E5E9F0] pt-4">
              <Row label="Selisih" value={(stats?.total_income || 0) - (stats?.total_expense || 0)} color="text-[#0F172A]" big testid="report-net" />
            </div>
            <div className="text-xs text-[#5C677D]">Transaksi: {stats?.transaction_count || 0}</div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E5E9F0] p-5 fade-up fade-up-2" data-testid="report-category-chart">
          <div className="eyebrow">Distribusi</div>
          <h3 className="font-display text-base font-semibold text-[#0F172A] mt-1">Pengeluaran per Kategori</h3>
          <div className="h-64 mt-3">
            {stats?.by_category?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.by_category}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="45%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={2}
                  >
                    {stats.by_category.map((entry, i) => (
                      <Cell key={entry.category} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#0F172A", border: "none", borderRadius: 12, color: "#fff" }}
                    formatter={(v) => formatRupiah(v)}
                  />
                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    iconType="circle"
                    wrapperStyle={{ fontSize: 10, paddingTop: 8 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full grid place-items-center text-[#9AA5B8]">Belum ada data pengeluaran</div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E5E9F0] p-5 fade-up fade-up-3" data-testid="report-monthly-chart">
        <div className="eyebrow">Perbandingan</div>
        <h3 className="font-display text-base font-semibold text-[#0F172A] mt-1">6 Bulan</h3>
        <div className="h-64 mt-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats?.trend || []} margin={{ left: -10, right: 5, top: 10, bottom: 0 }} barGap={4}>
              <CartesianGrid strokeDasharray="2 4" stroke="#E5E9F0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#5C677D" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#5C677D" }} tickFormatter={(v) => formatRupiahShort(v)} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#0F172A", border: "none", borderRadius: 12, color: "#fff" }}
                formatter={(v, n) => [formatRupiah(v), n === "income" ? "Pemasukan" : "Pengeluaran"]}
                cursor={{ fill: "#EDF2F7" }}
              />
              <Bar dataKey="income" fill="#21BE7C" radius={[8, 8, 0, 0]} />
              <Bar dataKey="expense" fill="#EE4B5C" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, color = "text-[#0F172A]", big = false, testid }) {
  return (
    <div className="flex items-center justify-between" data-testid={testid}>
      <div className="eyebrow">{label}</div>
      <div className={`${color} font-display ${big ? "text-2xl" : "text-lg"} font-bold tabular`}>{formatRupiah(value)}</div>
    </div>
  );
}
