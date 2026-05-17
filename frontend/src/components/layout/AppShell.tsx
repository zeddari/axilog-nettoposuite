import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { AlarmBanner } from './AlarmBanner';

export function AppShell() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-axilog-gray dark:bg-dark-base">
      {/* Fixed top bar */}
      <TopBar />

      {/* Alarm severity ribbon (renders only when alarms exist) */}
      <AlarmBanner />

      {/* Sidebar + content */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
