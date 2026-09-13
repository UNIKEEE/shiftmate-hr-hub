import { Moon, Palette, Sun } from "lucide-react";
import { THEMES, useTheme, type ThemeName } from "@/lib/theme";
import { cn } from "@/lib/utils";

const ICONS: Record<ThemeName, typeof Sun> = { beige: Palette, light: Sun, dark: Moon };

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-card p-1">
      {THEMES.map((t) => {
        const Icon = ICONS[t.value];
        const active = theme === t.value;
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => setTheme(t.value)}
            aria-label={`${t.label} theme`}
            aria-pressed={active}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
