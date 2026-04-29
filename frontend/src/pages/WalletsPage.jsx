import { useCallback, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import api, { formatRupiah } from "../lib/api";
import { Plus, Trash2, X, Loader2, Pencil, Wallet, CreditCard, Smartphone, Banknote, Package } from "lucide-react";
import { toast } from "sonner";
import { TopBar } from "../components/Sidebar";

const PRESETS = {
  bank: [
    { name: "BCA", color: "#0060AF" },
    { name: "Mandiri", color: "#003D79" },
    { name: "BRI", color: "#003D79" },
    { name: "BNI", color: "#F37021" },
    { name: "BSI", color: "#00A39D" },
    { name: "CIMB", color: "#A41E22" },
    { name: "Permata", color: "#1E3F8B" },
  ],
  ewallet: [
    { name: "DANA", color: "#118EEA" },
    { name: "OVO", color: "#4C2A86" },
    { name: "GoPay", color: "#00AED6" },
    { name: "ShopeePay", color: "#EE4D2D" },
    { name: "LinkAja", color: "#E72C26" },
    { name: "Jenius", color: "#26A8DE" },
  ],
  cash: [
    { name: "Tunai", color: "#21BE7C" },
    { name: "Dompet", color: "#16A06A" },
  ],
  other: [{ name: "Lainnya", color: "#5C677D" }],
};

const TYPE_LABEL = {
  bank: "Bank",
  ewallet: "E-Wallet",
  cash: "Tunai",
  other: "Lainnya",
};

const TYPE_ICONS = {
  bank: CreditCard,
  ewallet: Smartphone,
  cash: Banknote,
  other: Package,
};

export default function WalletsPage() {
  const { refreshKey, refresh } = useOutletContext();
  const [wallets, setWallets] = useState([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/wallets");
      setWallets(data);
    } catch (e) {
      console.error("Failed to load wallets", e);
    }
  }, []);

  useEffect(() => { load(); }, [load, refreshKey]);

  const totalBalance = wallets.reduce((sum, w) => sum + (w.balance || 0), 0);

  const onDelete = async (w) => {
    if (!confirm(`Hapus dompet "${w.name}"?`)) return;
    try {
      await api.delete(`/wallets/${w.id}`);
      toast.success("Dompet terhapus");
      load();
      refresh();
    } catch {
      toast.error("Gagal menghapus");
    }
  };

  return (
    <div className="space-y-5">
      <TopBar
        subtitle="Saldo Saya"
        title="Dompet"
        rightSlot={
          <button
            onClick={() => { setEditing(null); setOpenAdd(true); }}
            data-testid="add-wallet-btn"
            className="flex items-center gap-1.5 px-4 h-10 rounded-xl bg-[#118EEA] text-white text-sm font-semibold hover:bg-[#0E7BC9] active:scale-95 transition"
          >
            <Plus className="w-4 h-4" /> Tambah
          </button>
        }
      />

      {/* Total card */}
      <div
        className="relative rounded-2xl p-5 text-white overflow-hidden fade-up fade-up-1 shadow-lg shadow-[#118EEA]/20"
        style={{ background: "linear-gradient(135deg, #118EEA 0%, #0E7BC9 60%, #0A5091 100%)" }}
        data-testid="wallets-total-card"
      >
        <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-12 -left-10 w-36 h-36 rounded-full bg-[#FF8A00]/15 blur-2xl" />
        <div className="relative flex items-center gap-2">
          <Wallet className="w-4 h-4" strokeWidth={2} />
          <div className="text-[10px] tracking-[0.22em] uppercase font-bold">Total Saldo</div>
        </div>
        <div className="relative mt-2 font-display text-3xl font-bold tabular tracking-tight" data-testid="wallets-total">
          {formatRupiah(totalBalance)}
        </div>
        <div className="relative text-xs text-white/70 mt-1">{wallets.length} dompet aktif</div>
      </div>

      {/* Empty / List */}
      {wallets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E5E9F0] p-8 text-center fade-up fade-up-2" data-testid="empty-wallets">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#118EEA]/10 grid place-items-center text-[#118EEA] mb-4">
            <Wallet className="w-6 h-6" strokeWidth={1.6} />
          </div>
          <div className="font-display text-lg font-bold text-[#0F172A]">Belum ada dompet</div>
          <p className="text-sm text-[#5C677D] mt-2 max-w-xs mx-auto">
            Tambahkan rekening bank, e-wallet, atau uang tunai. Pantau saldo dari semua sumber dalam satu app.
          </p>
          <button
            onClick={() => setOpenAdd(true)}
            className="mt-5 inline-flex items-center gap-2 px-5 h-11 rounded-xl bg-[#FF8A00] text-white text-sm font-semibold hover:opacity-90"
          >
            <Plus className="w-4 h-4" /> Tambah dompet pertama
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {wallets.map((w, i) => (
            <WalletCard
              key={w.id}
              wallet={w}
              delay={i * 0.04}
              onEdit={() => { setEditing(w); setOpenAdd(true); }}
              onDelete={() => onDelete(w)}
            />
          ))}
        </div>
      )}

      {openAdd && (
        <WalletDialog
          initial={editing}
          onClose={() => setOpenAdd(false)}
          onSuccess={() => { setOpenAdd(false); load(); refresh(); }}
        />
      )}
    </div>
  );
}

function WalletCard({ wallet, onEdit, onDelete, delay = 0 }) {
  const Icon = TYPE_ICONS[wallet.type] || Wallet;
  return (
    <div
      className="relative rounded-2xl p-5 text-white overflow-hidden fade-up shadow-md"
      style={{
        background: `linear-gradient(135deg, ${wallet.color} 0%, ${shade(wallet.color, -18)} 100%)`,
        animationDelay: `${delay}s`,
      }}
      data-testid={`wallet-card-${wallet.id}`}
    >
      <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/15 blur-xl" />
      <div className="relative flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur grid place-items-center">
            <Icon className="w-5 h-5" strokeWidth={1.8} />
          </div>
          <div>
            <div className="text-[10px] tracking-widest uppercase font-bold text-white/70">
              {TYPE_LABEL[wallet.type]}
            </div>
            <div className="font-display text-lg font-bold leading-tight mt-0.5">{wallet.name}</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            data-testid={`edit-wallet-${wallet.id}`}
            className="w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 grid place-items-center transition"
            aria-label="Edit"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            data-testid={`delete-wallet-${wallet.id}`}
            className="w-8 h-8 rounded-lg bg-white/15 hover:bg-[#EE4B5C] grid place-items-center transition"
            aria-label="Hapus"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="relative mt-5">
        <div className="text-[10px] tracking-widest uppercase font-bold text-white/60">Saldo</div>
        <div className="font-display text-2xl font-bold tabular mt-0.5" data-testid={`wallet-balance-${wallet.id}`}>
          {formatRupiah(wallet.balance)}
        </div>
      </div>
    </div>
  );
}

function WalletDialog({ initial, onClose, onSuccess }) {
  const [type, setType] = useState(initial?.type || "bank");
  const [name, setName] = useState(initial?.name || "");
  const [balance, setBalance] = useState(initial ? String(initial.balance) : "");
  const [color, setColor] = useState(initial?.color || "#118EEA");
  const [submitting, setSubmitting] = useState(false);

  const presets = PRESETS[type] || [];

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Nama dompet wajib diisi"); return; }
    const bal = parseFloat(balance || "0");
    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        type,
        balance: isNaN(bal) ? 0 : bal,
        color,
        icon: name.trim().slice(0, 4).toUpperCase(),
      };
      if (initial?.id) {
        await api.put(`/wallets/${initial.id}`, payload);
        toast.success("Dompet diperbarui");
      } else {
        await api.post("/wallets", payload);
        toast.success("Dompet ditambahkan");
      }
      onSuccess?.();
    } catch {
      toast.error("Gagal menyimpan");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="absolute inset-0 z-50 grid place-items-center bg-[#0F172A]/50 backdrop-blur-sm p-4"
      onClick={onClose}
      data-testid="wallet-dialog"
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="bg-white rounded-3xl border border-[#E5E9F0] w-full max-w-md p-6 shadow-2xl max-h-[85vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="eyebrow">{initial ? "Edit" : "Baru"}</div>
            <h3 className="font-display text-2xl font-bold text-[#0F172A] mt-1">
              {initial ? "Edit Dompet" : "Tambah Dompet"}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#EDF2F7] text-[#5C677D]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Type tabs */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-[#EDF2F7] rounded-xl mb-4">
          {Object.entries(TYPE_LABEL).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => { setType(key); }}
              data-testid={`wallet-type-${key}`}
              className={`py-2 rounded-lg text-xs font-semibold transition ${
                type === key ? "bg-white text-[#118EEA] shadow-sm" : "text-[#5C677D]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Presets */}
        {presets.length > 0 && !initial && (
          <div className="mb-4">
            <div className="eyebrow mb-2">Pilih cepat</div>
            <div className="flex flex-wrap gap-2">
              {presets.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => { setName(p.name); setColor(p.color); }}
                  data-testid={`preset-${p.name}`}
                  className="px-3 h-9 rounded-lg border border-[#E5E9F0] hover:border-[#118EEA] text-xs font-semibold flex items-center gap-2 transition"
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3.5">
          <div>
            <label className="eyebrow block mb-2">Nama Dompet</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mis. BCA, DANA, Tunai..."
              data-testid="wallet-name-input"
              className="w-full h-12 px-4 rounded-xl bg-[#F5F7FA] border border-[#E5E9F0] focus:border-[#118EEA] outline-none"
            />
          </div>

          <div>
            <label className="eyebrow block mb-2">Saldo (Rp)</label>
            <input
              type="number"
              min="0"
              step="any"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="0"
              data-testid="wallet-balance-input"
              className="w-full h-12 px-4 rounded-xl bg-[#F5F7FA] border border-[#E5E9F0] focus:border-[#118EEA] outline-none tabular text-lg font-semibold"
            />
          </div>

          <div>
            <label className="eyebrow block mb-2">Warna kartu</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                data-testid="wallet-color-input"
                className="w-14 h-12 rounded-xl border border-[#E5E9F0] cursor-pointer bg-[#F5F7FA]"
              />
              <div className="flex-1 h-12 rounded-xl flex items-center px-4 text-white font-semibold text-sm" style={{ background: color }}>
                {name || "Preview Dompet"}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            data-testid="wallet-submit-button"
            className="w-full h-12 rounded-xl bg-[#118EEA] text-white font-semibold hover:bg-[#0E7BC9] active:scale-95 transition flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {initial ? "Simpan Perubahan" : "Tambah Dompet"}
          </button>
        </div>
      </form>
    </div>
  );
}

// shade a hex color by percent (-100..100). Negative = darker.
function shade(hex, percent) {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  const adjust = (c) => {
    const n = Math.round(c + (percent / 100) * (percent < 0 ? c : 255 - c));
    return Math.max(0, Math.min(255, n));
  };
  const toHex = (n) => n.toString(16).padStart(2, "0");
  return `#${toHex(adjust(r))}${toHex(adjust(g))}${toHex(adjust(b))}`;
}
