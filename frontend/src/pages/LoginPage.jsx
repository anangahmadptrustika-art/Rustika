import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Wallet, Loader2 } from "lucide-react";
import { toast } from "sonner";

const HERO_IMG = "https://static.prod-images.emergentagent.com/jobs/0d3bbc79-c3cb-43ec-8dab-45e35b4d6e20/images/9036828ad026447cc50c26d485eea03de251c3a484478ff5bd65321915538589.png";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await login(email.trim().toLowerCase(), password);
    setLoading(false);
    if (res.ok) {
      toast.success("Selamat datang kembali!");
      navigate("/dashboard");
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#F7F5F0]">
      {/* Left visual */}
      <div className="hidden lg:block relative">
        <img src={HERO_IMG} alt="Sakuku finance" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-tr from-[#1E3F32]/60 via-[#1E3F32]/15 to-transparent" />
        <div className="relative z-10 h-full flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur grid place-items-center">
              <Wallet className="w-5 h-5 text-[#D99B58]" strokeWidth={1.8} />
            </div>
            <div className="font-display font-bold text-lg">Sakuku</div>
          </div>
          <div>
            <div className="eyebrow text-white/70 mb-3">Keuangan Pribadi</div>
            <h1 className="font-display font-bold text-5xl leading-tight max-w-md">
              Atur uangmu, capai impianmu.
            </h1>
            <p className="mt-5 text-white/80 max-w-md leading-relaxed">
              Catat pengeluaran cukup dengan suara. Pantau anggaran dan target tabungan dalam satu dasbor yang tenang dan elegan.
            </p>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[#2C3D30] grid place-items-center">
              <Wallet className="w-5 h-5 text-[#D99B58]" strokeWidth={1.8} />
            </div>
            <div className="font-display font-bold text-lg text-[#1E3F32]">Sakuku</div>
          </div>

          <div className="eyebrow mb-2">Selamat Datang</div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#1E3F32] tracking-tight">
            Masuk ke akunmu
          </h2>
          <p className="mt-2 text-[#697A6E]">Lanjutkan perjalanan keuanganmu.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4" data-testid="login-form">
            <div>
              <label className="eyebrow block mb-2">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="kamu@email.com"
                data-testid="login-email-input"
                className="w-full h-12 px-4 rounded-xl bg-white border border-[#E5E2DC] focus:border-[#2C3D30] outline-none transition"
              />
            </div>
            <div>
              <label className="eyebrow block mb-2">Kata Sandi</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                data-testid="login-password-input"
                className="w-full h-12 px-4 rounded-xl bg-white border border-[#E5E2DC] focus:border-[#2C3D30] outline-none transition"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-[#C86753]/10 border border-[#C86753]/30 text-sm text-[#C86753]" data-testid="login-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              data-testid="login-submit-button"
              className="w-full h-12 rounded-xl bg-[#2C3D30] text-white font-semibold hover:bg-[#3A5240] active:scale-[0.98] transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Masuk
            </button>
          </form>

          <p className="mt-6 text-sm text-[#697A6E]">
            Belum punya akun?{" "}
            <Link to="/register" className="font-semibold text-[#2C3D30] hover:text-[#D99B58]" data-testid="link-to-register">
              Daftar sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
