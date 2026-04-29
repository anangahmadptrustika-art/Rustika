import { useCallback, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import api, { formatRupiah, formatDateID } from "../lib/api";
import { Plus, Trash2, X, Loader2, Target as TargetIcon } from "lucide-react";
import { toast } from "sonner";
import { TopBar } from "../components/Sidebar";

const EMPTY_IMG = "https://static.prod-images.emergentagent.com/jobs/0d3bbc79-c3cb-43ec-8dab-45e35b4d6e20/images/2f98cb9e878b4696c58366781b5971c2e12c037b240099abad4cc4f235556685.png";

export default function GoalsPage() {
  const { refreshKey } = useOutletContext();
  const [goals, setGoals] = useState([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("");
  const [deadline, setDeadline] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try { const { data } = await api.get("/goals"); setGoals(data); } catch (e) { console.error("Failed to load goals", e); }
  }, []);
  useEffect(() => { load(); }, [load, refreshKey]);

  const submit = async (e) => {
    e.preventDefault();
    if (!name || !target) return;
    setSubmitting(true);
    try {
      await api.post("/goals", {
        name, target_amount: parseFloat(target),
        current_amount: parseFloat(current || 0),
        deadline: deadline || null,
      });
      toast.success("Target ditambahkan");
      setOpenAdd(false);
      setName(""); setTarget(""); setCurrent(""); setDeadline("");
      load();
    } catch {
      toast.error("Gagal menyimpan");
    } finally { setSubmitting(false); }
  };

  const onDelete = async (id) => {
    if (!confirm("Hapus target ini?")) return;
    try { await api.delete(`/goals/${id}`); load(); toast.success("Terhapus"); } catch { toast.error("Gagal"); }
  };

  const onAddProgress = async (g, delta) => {
    const newAmt = Math.max(0, (g.current_amount || 0) + delta);
    try {
      await api.put(`/goals/${g.id}`, { current_amount: newAmt });
      load();
    } catch { toast.error("Gagal"); }
  };

  return (
    <div className="space-y-5">
      <TopBar
        subtitle="Impian"
        title="Target Tabungan"
        rightSlot={
          <button onClick={() => setOpenAdd(true)} data-testid="add-goal-btn" className="flex items-center gap-1.5 px-4 h-10 rounded-xl bg-[#2C3D30] text-white text-sm font-semibold hover:bg-[#3A5240] active:scale-95 transition">
            <Plus className="w-4 h-4" /> Tambah
          </button>
        }
      />

      {goals.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E5E2DC] p-6 fade-up fade-up-1" data-testid="empty-goals">
          <div className="flex flex-col items-center text-center gap-5">
            <img src={EMPTY_IMG} alt="" className="w-40 rounded-2xl object-cover" />
            <div>
              <div className="eyebrow">Mulai menabung</div>
              <h2 className="font-display text-xl font-bold text-[#1E3F32] mt-2">Belum ada target</h2>
              <p className="text-sm text-[#697A6E] mt-2 max-w-sm mx-auto">Tetapkan target seperti dana darurat, liburan, atau cicilan rumah.</p>
              <button onClick={() => setOpenAdd(true)} className="mt-4 inline-flex items-center gap-2 px-5 h-11 rounded-xl bg-[#D99B58] text-white text-sm font-semibold hover:opacity-90">
                <Plus className="w-4 h-4" /> Buat target pertama
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-3">
          {goals.map((g, i) => {
            const pct = Math.min(100, Math.round((g.current_amount / g.target_amount) * 100));
            const done = pct >= 100;
            return (
              <div key={g.id} className="bg-white rounded-2xl border border-[#E5E2DC] p-6 fade-up" style={{ animationDelay: `${0.05 * i}s` }} data-testid={`goal-card-${g.id}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#D99B58]/15 text-[#D99B58] grid place-items-center">
                      <TargetIcon className="w-5 h-5" strokeWidth={1.6} />
                    </div>
                    <div>
                      <div className="eyebrow">Target</div>
                      <div className="font-display text-xl font-bold text-[#1E3F32] mt-0.5">{g.name}</div>
                    </div>
                  </div>
                  <button onClick={() => onDelete(g.id)} data-testid={`delete-goal-${g.id}`} className="p-2 rounded-lg hover:bg-[#C86753]/10 text-[#697A6E]">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-5">
                  <div className="flex items-end justify-between mb-2">
                    <div className="font-display text-2xl font-bold text-[#1E3F32] tabular">{formatRupiah(g.current_amount)}</div>
                    <div className="text-sm text-[#697A6E]">/ {formatRupiah(g.target_amount)}</div>
                  </div>
                  <div className="h-2.5 rounded-full bg-[#F0EDE5] overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${done ? "bg-[#5F8575]" : "bg-[#D99B58]"}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-[#697A6E]">
                    <span className="font-semibold tabular">{pct}%</span>
                    {g.deadline && <span>Sampai {formatDateID(g.deadline)}</span>}
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2">
                  {[50000, 100000, 500000].map((v) => (
                    <button
                      key={v}
                      onClick={() => onAddProgress(g, v)}
                      data-testid={`add-${v}-goal-${g.id}`}
                      className="py-2 text-xs font-semibold rounded-lg bg-[#F0EDE5] hover:bg-[#E5E2DC] text-[#1E3F32]"
                    >
                      +{v >= 1000 ? `${v / 1000}rb` : v}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {openAdd && (
        <div className="absolute inset-0 z-50 grid place-items-center bg-[#1E3F32]/50 backdrop-blur-sm p-4" onClick={() => setOpenAdd(false)} data-testid="goal-dialog">
          <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="bg-white rounded-3xl border border-[#E5E2DC] w-full max-w-md p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="eyebrow">Baru</div>
                <h3 className="font-display text-2xl font-bold text-[#1E3F32] mt-1">Target Tabungan</h3>
              </div>
              <button type="button" onClick={() => setOpenAdd(false)} className="p-1.5 rounded-lg hover:bg-[#F0EDE5] text-[#697A6E]"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="eyebrow block mb-2">Nama Target</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required data-testid="goal-name-input" placeholder="Mis. Liburan ke Bali" className="w-full h-12 px-4 rounded-xl bg-[#F7F5F0] border border-[#E5E2DC] focus:border-[#2C3D30] outline-none" />
              </div>
              <div>
                <label className="eyebrow block mb-2">Jumlah Target (Rp)</label>
                <input type="number" min="0" value={target} onChange={(e) => setTarget(e.target.value)} required data-testid="goal-target-input" className="w-full h-12 px-4 rounded-xl bg-[#F7F5F0] border border-[#E5E2DC] focus:border-[#2C3D30] outline-none tabular text-lg font-semibold" />
              </div>
              <div>
                <label className="eyebrow block mb-2">Sudah Ditabung (Opsional)</label>
                <input type="number" min="0" value={current} onChange={(e) => setCurrent(e.target.value)} data-testid="goal-current-input" className="w-full h-12 px-4 rounded-xl bg-[#F7F5F0] border border-[#E5E2DC] focus:border-[#2C3D30] outline-none tabular" />
              </div>
              <div>
                <label className="eyebrow block mb-2">Batas Waktu (Opsional)</label>
                <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} data-testid="goal-deadline-input" className="w-full h-12 px-4 rounded-xl bg-[#F7F5F0] border border-[#E5E2DC] focus:border-[#2C3D30] outline-none" />
              </div>
              <button type="submit" disabled={submitting} data-testid="goal-submit-button" className="w-full h-12 rounded-xl bg-[#2C3D30] text-white font-semibold hover:bg-[#3A5240] active:scale-95 transition flex items-center justify-center gap-2 disabled:opacity-60">
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Simpan Target
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
