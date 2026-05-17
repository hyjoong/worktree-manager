import { Moon, Sun } from 'lucide-react';
import { Button } from './ui/button';
import { useThemeStore } from '../stores/theme-store';

export function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();
  const Icon = theme === 'dark' ? Moon : Sun;

  return (
    <Button type="button" variant="ghost" size="icon" onClick={toggleTheme} title="Toggle theme">
      <Icon className="size-4" />
    </Button>
  );
}
