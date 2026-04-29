import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LayoutDashboard, ArrowLeftRight, Wallet, Target, BarChart3, LogOut } from "lucide-react";

const navItems = [
  { to: "/dashboard", label: "Beranda", icon: LayoutDashboard, testid: "nav-dashboard" },
  { to: "/transactions", label: "Transaksi", icon: ArrowLeftRight, testid: "nav-transactions" },
  { to: "/budgets", label: "Anggaran", icon: Wallet, testid: "nav-budgets" },
  { to: "/goals", label: "Target", icon: Target, testid: "nav-goals" },
  { to: "/reports", label: "Laporan", icon: BarChart3, testid: "nav-reports" },
];

export function MobileNav() {
  return (
    <nav
      className="absolute bottom-0 inset-x-0 bg-white/90 backdrop-blur-md border-t border-[#E5E2DC] z-30"
      data-testid="mobile-nav"
    >
      <div className="flex items-center justify-around py-2.5 pb-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              data-testid={item.testid}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
                  isActive ? "text-[#2C3D30]" : "text-[#8A9A86]"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`relative ${isActive ? "scale-110" : ""} transition-transform`}>
                    <Icon className="w-5 h-5" strokeWidth={isActive ? 2.2 : 1.6} />
                  </div>
                  <span className={`text-[10px] ${isActive ? "font-bold" : "font-semibold"}`}>{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

export function TopBar({ title, subtitle, rightSlot }) {
  return (
    <div className="flex items-center justify-between mb-5 fade-up" data-testid="topbar">
      <div>
        {subtitle && <div className="eyebrow">{subtitle}</div>}
        <h1 className="font-display text-2xl font-bold text-[#1E3F32] tracking-tight mt-1">{title}</h1>
      </div>
      {rightSlot}
    </div>
  );
}

export function HeaderUser() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const onLogout = async () => { await logout(); navigate("/login"); };

  return (
    <div className="flex items-center justify-between mb-5 fade-up">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-[#2C3D30] text-white grid place-items-center font-display font-semibold">
          {(user?.name || "U").charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="text-xs text-[#697A6E]">Halo,</div>
          <div className="font-display font-bold text-[#1E3F32] leading-tight" data-testid="header-user-name">
            {user?.name?.split(" ")[0] || "Sahabat"}
          </div>
        </div>
      </div>
      <button
        onClick={onLogout}
        data-testid="logout-button"
        className="w-10 h-10 rounded-full bg-white border border-[#E5E2DC] grid place-items-center text-[#697A6E] hover:text-[#C86753] hover:border-[#C86753] active:scale-95 transition"
        aria-label="Keluar"
      >
        <LogOut className="w-4 h-4" strokeWidth={1.8} />
      </button>
    </div>
  );
}

export default function Sidebar() {
  // Kept for backwards-compat but no longer rendered (mobile-only app)
  return null;
}
