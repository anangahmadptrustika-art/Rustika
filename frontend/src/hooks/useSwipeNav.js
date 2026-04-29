import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const TAB_ORDER = ["/dashboard", "/transactions", "/wallets", "/goals", "/reports"];

/**
 * Returns ref + handlers for swipe navigation between tab routes.
 * Threshold: ~60px horizontal, vertical drift < 50px.
 */
export default function useSwipeNav() {
  const ref = useRef(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    let startX = 0, startY = 0, startT = 0, tracking = false;

    const onStart = (e) => {
      const t = e.touches ? e.touches[0] : e;
      // Ignore swipes starting on interactive elements (buttons, inputs, charts)
      const target = e.target;
      if (target.closest('button, input, select, textarea, a, .recharts-wrapper, [data-no-swipe]')) {
        tracking = false;
        return;
      }
      startX = t.clientX;
      startY = t.clientY;
      startT = Date.now();
      tracking = true;
    };
    const onEnd = (e) => {
      if (!tracking) return;
      tracking = false;
      const t = e.changedTouches ? e.changedTouches[0] : e;
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      const dt = Date.now() - startT;
      if (Math.abs(dy) > 60) return;
      if (Math.abs(dx) < 70) return;
      if (dt > 700) return; // too slow
      const idx = TAB_ORDER.indexOf(pathname);
      if (idx === -1) return;
      if (dx < 0 && idx < TAB_ORDER.length - 1) {
        navigate(TAB_ORDER[idx + 1]);
      } else if (dx > 0 && idx > 0) {
        navigate(TAB_ORDER[idx - 1]);
      }
    };

    node.addEventListener("touchstart", onStart, { passive: true });
    node.addEventListener("touchend", onEnd);
    return () => {
      node.removeEventListener("touchstart", onStart);
      node.removeEventListener("touchend", onEnd);
    };
  }, [pathname, navigate]);

  return ref;
}

export function getTabIndex(pathname) {
  return TAB_ORDER.indexOf(pathname);
}
