import { Outlet } from "react-router-dom";
import { MobileNav } from "./Sidebar";
import VoiceMicFAB from "./VoiceMicFAB";
import { useState } from "react";

export default function AppLayout() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="min-h-screen bg-[#1E3F32] flex justify-center">
      {/* Mobile phone frame */}
      <div className="relative w-full max-w-[460px] min-h-screen bg-[#F7F5F0] shadow-2xl overflow-hidden">
        <main className="pb-28">
          <div className="px-5 pt-7 pb-5">
            <Outlet context={{ refreshKey, refresh: () => setRefreshKey(k => k + 1) }} />
          </div>
        </main>
        <MobileNav />
        <VoiceMicFAB onTransactionAdded={() => setRefreshKey(k => k + 1)} />
      </div>
    </div>
  );
}
