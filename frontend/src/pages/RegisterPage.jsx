import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Wallet, Loader2 } from "lucide-react";
import { toast } from "sonner";

const HERO_IMG = "https://static.prod-images.emergentagent.com/jobs/0d3bbc79-c3cb-43ec-8dab-45e35b4d6e20/images/9036828ad026447cc50c26d485eea03de251c3a484478ff5bd65321915538589.png";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("Kata sandi minimal 6 karakter");
      return;
    }
    setError("");
    setLoading(true);
    const res = await register(name.trim(), email.trim().toLowerCase(), password);
    setLoading(false);
    if (res.ok) {
      toast.success("Akun berhasil dibuat!");
      navigate("/dashboard");
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex justify-center">
      <div className="relative w-full max-w-[460px] min-h-screen bg-[#F5F7FA] overflow-hidden flex flex-col">
        <div className="relative h-44 shrink-0">
          <img src={HERO_IMG} alt="Sakuku" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A]/30 via-[#0F172A]/35 to-[#F5F7FA]" />
          <div className="relative z-10 px-6 pt-7 text-white">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur grid place-items-center">
                <Wallet className="w-5 h-5 text-[#FF8A00]" strokeWidth={1.8} />
              </div>
              <div className="font-display font-bold text-lg">Sakuku</div>
            </div>
          </div>
        </div>

        <div className="flex-1 px-5 pb-10 -mt-10 relative z-10">
          <div className="bg-white rounded-3xl border border-[#E5E9F0] p-6 shadow-xl">
            <div className="eyebrow mb-2">Buat Akun</div>
            <h2 className="font-display text-2xl font-bold text-[#0F172A] tracking-tight">
              Mulai gratis
            </h2>
            <p className="mt-1.5 text-sm text-[#5C677D]">Hanya butuh 30 detik untuk memulai.</p>

            <form onSubmit={onSubmit} className="mt-5 space-y-3.5" data-testid="register-form">
            <div>
              <label className="eyebrow block mb-2">Nama</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama lengkap"
                data-testid="register-name-input"
                className="w-full h-12 px-4 rounded-xl bg-[#F5F7FA] border border-[#E5E9F0] focus:border-[#118EEA] outline-none transition"
              />
            </div>
            <div>
              <label className="eyebrow block mb-2">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="kamu@email.com"
                data-testid="register-email-input"
                className="w-full h-12 px-4 rounded-xl bg-[#F5F7FA] border border-[#E5E9F0] focus:border-[#118EEA] outline-none transition"
              />
            </div>
            <div>
              <label className="eyebrow block mb-2">Kata Sandi</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                data-testid="register-password-input"
                className="w-full h-12 px-4 rounded-xl bg-[#F5F7FA] border border-[#E5E9F0] focus:border-[#118EEA] outline-none transition"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-[#EE4B5C]/10 border border-[#EE4B5C]/30 text-sm text-[#EE4B5C]" data-testid="register-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              data-testid="register-submit-button"
              className="w-full h-12 rounded-xl bg-[#118EEA] text-white font-semibold hover:bg-[#0E7BC9] active:scale-[0.98] transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Buat Akun
            </button>
          </form>

          <p className="mt-5 text-sm text-center text-[#5C677D]">
            Sudah punya akun?{" "}
            <Link to="/login" className="font-semibold text-[#118EEA] hover:text-[#FF8A00]" data-testid="link-to-login">
              Masuk
            </Link>
          </p>
          </div>
        </div>
      </div>
    </div>
  );
}
