import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemeName = "beige" | "light" | "dark";
export const THEMES: { value: ThemeName; label: string }[] = [
  { value: "beige", label: "Beige" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const STORAGE_KEY = "shiftmate-theme";

type ThemeContextValue = { theme: ThemeName; setTheme: (t: ThemeName) => void };
const ThemeContext = createContext<ThemeContextValue>({ theme: "beige", setTheme: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>("beige");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeName | null;
    if (stored === "beige" || stored === "light" || stored === "dark") {
      setThemeState(stored);
      document.documentElement.setAttribute("data-theme", stored);
    }
  }, []);

  const setTheme = useCallback((next: ThemeName) => {
    setThemeState(next);
    document.documentElement.setAttribute("data-theme", next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

/** Applies the stored theme before first paint to avoid a flash. */
export const themeInitScript = `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}');if(t==='light'||t==='dark'||t==='beige'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;
