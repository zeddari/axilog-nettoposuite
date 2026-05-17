import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full
                 bg-white/10 hover:bg-white/20 text-white transition-colors
                 text-sm font-medium select-none"
    >
      {theme === 'light' ? (
        <Moon className="w-4 h-4" />
      ) : (
        <Sun className="w-4 h-4" />
      )}
      <span className="hidden sm:inline">
        {theme === 'light' ? 'Dark' : 'Light'}
      </span>
    </button>
  );
}
