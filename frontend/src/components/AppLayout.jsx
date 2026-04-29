import { Outlet, useLocation } from "react-router-dom";
import { MobileNav } from "./Sidebar";
import VoiceMicFAB from "./VoiceMicFAB";
import InstallBanner from "./InstallBanner";
import useSwipeNav, { getTabIndex } from "../hooks/useSwipeNav";
import { useEffect, useRef, useState } from "react";

export default function AppLayout() {
  const [refreshKey, setRefreshKey] = useState(0);
  const { pathname } = useLocation();
  const swipeRef = useSwipeNav();

  // Track navigation direction for slide animation
  const prevIdxRef = useRef(getTabIndex(pathname));
  const [direction, setDirection] = useState("right");
  useEffect(() => {
    const cur = getTabIndex(pathname);
    if (cur !== -1 && prevIdxRef.current !== -1) {
      setDirection(cur >= prevIdxRef.current ? "right" : "left");
    }
    prevIdxRef.current = cur;
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[#1E3F32] flex justify-center">
      {/* Mobile phone frame */}
      <div className="relative w-full max-w-[460px] min-h-screen bg-[#F7F5F0] shadow-2xl overflow-hidden">
        <main ref={swipeRef} className="pb-28">
          <div
            key={pathname}
            className={`px-5 pt-7 pb-5 ${direction === "right" ? "page-slide-in-right" : "page-slide-in-left"}`}
          >
            <Outlet context={{ refreshKey, refresh: () => setRefreshKey(k => k + 1) }} />
          </div>
        </main>
        <MobileNav />
        <VoiceMicFAB onTransactionAdded={() => setRefreshKey(k => k + 1)} />
        <InstallBanner />
      </div>
    </div>
  );
}
