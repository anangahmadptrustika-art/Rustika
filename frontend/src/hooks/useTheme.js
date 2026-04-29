import { useEffect, useState, useCallback } from "react";

const KEY = "sakuku_theme"; // "light" | "dark"

function readInitial() {
  if (typeof window === "undefined") return "light";
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === "dark" || saved === "light") return saved;
  } catch {
    // localStorage may throw in private mode
  }
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

/**
 * Theme hook. Returns { theme, toggle, setTheme }.
 * Sets data-theme attribute on <html> AND on the mobile phone frame for scoping.
 */
export default function useTheme() {
  const [theme, setTheme] = useState(readInitial);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
    try { localStorage.setItem(KEY, theme); } catch {
      // ignore (private mode)
    }
    // Update theme-color meta for browser chrome
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#0B1220" : "#118EEA");
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }, []);

  return { theme, toggle, setTheme };
}
