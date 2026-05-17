import { LogOut, User, ChevronDown, Network } from 'lucide-react';
import { useState } from 'react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';

export function TopBar() {
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="h-14 bg-axilog-primary flex items-center justify-between px-4 shadow-md z-50 flex-shrink-0">
      {/* Left: Logo + product name */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
          <Network className="w-5 h-5 text-white" />
        </div>
        <div className="hidden sm:block">
          <span className="text-white font-bold text-base leading-none">NetTopoSuite</span>
          <span className="block text-white/60 text-[10px] leading-none uppercase tracking-wider">by Axilog</span>
        </div>
      </div>

      {/* Right: theme toggle + user menu */}
      <div className="flex items-center gap-2">
        <ThemeToggle />

        {/* User dropdown */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(o => !o)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full
                       bg-white/10 hover:bg-white/20 text-white transition-colors text-sm"
          >
            <User className="w-4 h-4" />
            <span className="hidden md:inline">{user?.displayName ?? user?.email}</span>
            <ChevronDown className="w-3 h-3 opacity-70" />
          </button>

          {userMenuOpen && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />

              <div className="absolute right-0 top-full mt-2 w-52 z-20
                              bg-white dark:bg-dark-surface
                              border border-gray-200 dark:border-dark-border
                              rounded-xl shadow-xl overflow-hidden">
                {/* User info */}
                <div className="px-4 py-3 border-b border-gray-100 dark:border-dark-border">
                  <p className="text-sm font-semibold text-gray-900 dark:text-dark-text truncate">
                    {user?.displayName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-dark-muted truncate">{user?.email}</p>
                  <span className="mt-1 inline-block text-[10px] font-bold uppercase tracking-wider
                                   px-2 py-0.5 rounded-full
                                   bg-axilog-primary/10 text-axilog-primary
                                   dark:bg-axilog-primary-light/20 dark:text-axilog-primary-light">
                    {user?.role}
                  </span>
                </div>

                {/* Sign out */}
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-4 py-3
                             text-sm text-gray-700 dark:text-dark-text
                             hover:bg-gray-50 dark:hover:bg-dark-elevated transition-colors"
                >
                  <LogOut className="w-4 h-4 text-axilog-accent" />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
