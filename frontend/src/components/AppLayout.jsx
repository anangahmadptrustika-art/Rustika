import { Outlet } from "react-router-dom";
import Sidebar, { MobileNav } from "./Sidebar";
import VoiceMicFAB from "./VoiceMicFAB";
import { useState } from "react";

export default function AppLayout() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="min-h-screen bg-[#F7F5F0]">
      <Sidebar />
      <main className="md:pl-64 pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-7">
          <Outlet context={{ refreshKey, refresh: () => setRefreshKey(k => k + 1) }} />
        </div>
      </main>
      <MobileNav />
      <VoiceMicFAB onTransactionAdded={() => setRefreshKey(k => k + 1)} />
    </div>
  );
}
