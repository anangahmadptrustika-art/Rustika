import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LayoutDashboard, ArrowLeftRight, Wallet, Target, BarChart3, LogOut, User } from "lucide-react";

const navItems = [
  { to: "/dashboard", label: "Dasbor", icon: LayoutDashboard, testid: "nav-dashboard" },
  { to: "/transactions", label: "Transaksi", icon: ArrowLeftRight, testid: "nav-transactions" },
  { to: "/budgets", label: "Anggaran", icon: Wallet, testid: "nav-budgets" },
  { to: "/goals", label: "Target", icon: Target, testid: "nav-goals" },
  { to: "/reports", label: "Laporan", icon: BarChart3, testid: "nav-reports" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <aside
      className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 bg-[#F0EDE5] border-r border-[#E5E2DC]"
      data-testid="sidebar"
    >
      <div className="px-6 py-7">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#2C3D30] grid place-items-center">
            <Wallet className="w-5 h-5 text-[#D99B58]" strokeWidth={1.8} />
          </div>
          <div>
            <div className="font-display font-bold text-[#1E3F32] leading-none">Sakuku</div>
            <div className="eyebrow mt-1">Keuangan Pribadi</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              data-testid={item.testid}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-colors ${
                  isActive
                    ? "bg-[#2C3D30] text-white"
                    : "text-[#4A5D53] hover:bg-[#E5E2DC]"
                }`
              }
            >
              <Icon className="w-[18px] h-[18px]" strokeWidth={1.6} />
              <span className="text-sm font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-[#E5E2DC] px-4 py-4">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-9 h-9 rounded-full bg-[#2C3D30] text-white grid place-items-center font-display font-semibold">
            {(user?.name || "U").charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-[#1E3F32] truncate" data-testid="sidebar-user-name">
              {user?.name || "Pengguna"}
            </div>
            <div className="text-xs text-[#697A6E] truncate">{user?.email}</div>
          </div>
        </div>
        <button
          onClick={onLogout}
          data-testid="logout-button"
          className="mt-2 w-full flex items-center gap-2 px-3 py-2.5 text-sm text-[#4A5D53] hover:bg-white hover:text-[#C86753] rounded-lg transition-colors active:scale-95"
        >
          <LogOut className="w-4 h-4" strokeWidth={1.6} />
          Keluar
        </button>
      </div>
    </aside>
  );
}

export function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-[#F0EDE5] border-t border-[#E5E2DC] z-30" data-testid="mobile-nav">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              data-testid={`mobile-${item.testid}`}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg ${
                  isActive ? "text-[#2C3D30]" : "text-[#697A6E]"
                }`
              }
            >
              <Icon className="w-5 h-5" strokeWidth={1.6} />
              <span className="text-[10px] font-semibold">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
