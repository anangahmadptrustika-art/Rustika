import { useCallback, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import api, { formatRupiah, formatDateID } from "../lib/api";
import { Plus, Trash2, Edit3, ArrowUpRight, ArrowDownRight, Search } from "lucide-react";
import { toast } from "sonner";
import AddTransactionDialog from "../components/AddTransactionDialog";
import { TopBar } from "../components/Sidebar";

export default function TransactionsPage() {
  const { refreshKey, refresh } = useOutletContext();
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("all"); // all | income | expense
  const [search, setSearch] = useState("");
  const [openAdd, setOpenAdd] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    try {
      const params = {};
      if (filter !== "all") params.type = filter;
      const { data } = await api.get("/transactions", { params });
      setItems(data);
    } catch (e) {
      console.error("Failed to load transactions", e);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load, refreshKey]);

  const onDelete = async (id) => {
    if (!confirm("Hapus transaksi ini?")) return;
    try {
      await api.delete(`/transactions/${id}`);
      toast.success("Terhapus");
      load();
      refresh();
    } catch {
      toast.error("Gagal menghapus");
    }
  };

  const filtered = items.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (t.description || "").toLowerCase().includes(q) ||
      (t.category || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      <TopBar
        subtitle="Catatan"
        title="Transaksi"
        rightSlot={
          <button
            onClick={() => { setEditing(null); setOpenAdd(true); }}
            data-testid="add-transaction-btn"
            className="flex items-center gap-1.5 px-4 h-10 rounded-xl bg-[#118EEA] text-white text-sm font-semibold hover:bg-[#0E7BC9] active:scale-95 transition"
          >
            <Plus className="w-4 h-4" /> Tambah
          </button>
        }
      />

      <div className="bg-white rounded-2xl border border-[#E5E9F0] p-4 fade-up fade-up-1">
        {/* Filter & search */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="flex gap-1 p-1 bg-[#EDF2F7] rounded-xl">
            {[
              { v: "all", label: "Semua" },
              { v: "income", label: "Pemasukan" },
              { v: "expense", label: "Pengeluaran" },
            ].map((f) => (
              <button
                key={f.v}
                onClick={() => setFilter(f.v)}
                data-testid={`filter-${f.v}`}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${filter === f.v ? "bg-white text-[#0F172A] shadow-sm" : "text-[#5C677D]"}`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex-1 min-w-[200px] relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9AA5B8]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari catatan / kategori..."
              data-testid="transactions-search"
              className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#F5F7FA] border border-[#E5E9F0] focus:border-[#118EEA] outline-none text-sm"
            />
          </div>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-[#9AA5B8]" data-testid="empty-transactions">
            <div className="font-display text-xl text-[#0F172A] mb-1">Belum ada transaksi</div>
            Tambahkan transaksi pertamamu, atau gunakan tombol mikrofon untuk menambah via suara.
          </div>
        ) : (
          <div className="divide-y divide-[#EDF2F7]">
            {filtered.map((t) => (
              <div key={t.id} className="flex items-center gap-4 py-4 group" data-testid={`tx-row-${t.id}`}>
                <div className={`w-11 h-11 rounded-xl grid place-items-center ${t.type === "income" ? "bg-[#21BE7C]/15 text-[#21BE7C]" : "bg-[#EE4B5C]/15 text-[#EE4B5C]"}`}>
                  {t.type === "income" ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[#0F172A] truncate">{t.description || t.category}</div>
                  <div className="text-xs text-[#5C677D] mt-0.5">{t.category} · {formatDateID(t.date)}</div>
                </div>
                <div className={`font-display font-bold tabular ${t.type === "income" ? "text-[#21BE7C]" : "text-[#EE4B5C]"}`}>
                  {t.type === "income" ? "+" : "-"}{formatRupiah(t.amount)}
                </div>
                <div className="flex items-center gap-1 opacity-100 transition">
                  <button
                    onClick={() => { setEditing(t); setOpenAdd(true); }}
                    data-testid={`edit-tx-${t.id}`}
                    className="p-2 rounded-lg hover:bg-[#EDF2F7] text-[#5C677D]"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(t.id)}
                    data-testid={`delete-tx-${t.id}`}
                    className="p-2 rounded-lg hover:bg-[#EE4B5C]/10 text-[#EE4B5C]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddTransactionDialog
        open={openAdd}
        initial={editing}
        onClose={() => setOpenAdd(false)}
        onSuccess={() => { setOpenAdd(false); load(); refresh(); }}
      />
    </div>
  );
}
