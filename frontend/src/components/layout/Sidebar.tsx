import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Network, Layers, Map, LayoutDashboard, Bell, Activity,
  Search, Radio, Server, BookOpen, Settings, GitBranch, Share2,
  Users, Ticket, Database, ChevronRight, Menu, MessageSquare,
} from 'lucide-react';
import { clsx } from 'clsx';

interface NavItem { id: string; label: string; icon: React.ReactNode; badge?: number; }
interface NavCategory { id: string; label: string; icon: React.ReactNode; items: NavItem[]; }

const menuCategories: NavCategory[] = [
  {
    id: 'network', label: 'Network', icon: <Network className="w-4 h-4" />,
    items: [
      { id: '/topologies', label: 'Topologies',  icon: <Layers className="w-4 h-4" /> },
      { id: '/map',        label: 'Map',          icon: <Map className="w-4 h-4" /> },
      { id: '/dashboard',  label: 'Dashboard',    icon: <LayoutDashboard className="w-4 h-4" /> },
      { id: '/alarms',     label: 'Alarms',       icon: <Bell className="w-4 h-4" /> },
    ],
  },
  {
    id: 'operations', label: 'Operations', icon: <Activity className="w-4 h-4" />,
    items: [
      { id: '/discovery', label: 'Discovery',       icon: <Search className="w-4 h-4" /> },
      { id: '/5g',        label: '5G Private',      icon: <Radio className="w-4 h-4" /> },
      { id: '/zabbix',    label: 'Zabbix Sources',  icon: <Server className="w-4 h-4" /> },
    ],
  },
  {
    id: 'catalogue', label: 'Service Catalogue', icon: <BookOpen className="w-4 h-4" />,
    items: [
      { id: '/catalogue',        label: 'Services',        icon: <Settings className="w-4 h-4" /> },
      { id: '/catalogue/flows',  label: 'Service Flows',   icon: <GitBranch className="w-4 h-4" /> },
      { id: '/catalogue/deps',   label: 'Dependencies',    icon: <Share2 className="w-4 h-4" /> },
      { id: '/catalogue/tmf',    label: 'TMF Touchpoints', icon: <Users className="w-4 h-4" /> },
    ],
  },
  {
    id: 'management', label: 'Management', icon: <LayoutDashboard className="w-4 h-4" />,
    items: [
      { id: '/tickets',  label: 'Tickets',   icon: <Ticket className="w-4 h-4" /> },
      { id: '/clusters', label: 'Clusters',  icon: <Database className="w-4 h-4" /> },
      { id: '/settings', label: 'Settings',  icon: <Settings className="w-4 h-4" /> },
    ],
  },
];

export function Sidebar() {
  const [collapsed, setCollapsed]    = useState(false);
  const [openCats,  setOpenCats]     = useState<Record<string, boolean>>({ network: true });
  const [assistantOpen, setAssistantOpen] = useState(false);

  const toggleCat = (id: string) =>
    setOpenCats(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <aside
      className={clsx(
        'flex flex-col flex-shrink-0 transition-all duration-200 overflow-hidden',
        'bg-white dark:bg-dark-surface shadow-lg',
        'border-r border-gray-200 dark:border-dark-border',
        collapsed ? 'w-14' : 'w-64'
      )}
    >
      {/* Collapse toggle */}
      <div className="flex items-center justify-end p-3 border-b border-gray-100 dark:border-dark-border">
        <button
          onClick={() => setCollapsed(c => !c)}
          className="p-1.5 rounded-lg text-gray-500 dark:text-dark-muted
                     hover:bg-gray-100 dark:hover:bg-dark-elevated transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-2">
        {menuCategories.map(cat => (
          <div key={cat.id} className="mb-1">
            {/* Category header */}
            <button
              onClick={() => toggleCat(cat.id)}
              className={clsx(
                'w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors',
                'text-gray-500 dark:text-dark-muted hover:text-gray-700 dark:hover:text-dark-text',
                collapsed && 'justify-center'
              )}
            >
              <span className="flex-shrink-0">{cat.icon}</span>
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">{cat.label}</span>
                  <ChevronRight
                    className={clsx('w-3 h-3 transition-transform', openCats[cat.id] && 'rotate-90')}
                  />
                </>
              )}
            </button>

            {/* Items */}
            {(openCats[cat.id] || collapsed) && (
              <div className={collapsed ? '' : 'ml-2'}>
                {cat.items.map(item => (
                  <NavLink
                    key={item.id}
                    to={item.id}
                    className={({ isActive }) =>
                      clsx(
                        'flex items-center gap-3 px-3 py-2 rounded-lg mx-1 text-sm transition-colors',
                        isActive
                          ? 'bg-axilog-primary text-white font-medium'
                          : 'text-gray-700 dark:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-elevated',
                        collapsed && 'justify-center px-2'
                      )
                    }
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    {!collapsed && (
                      <>
                        <span className="flex-1">{item.label}</span>
                        {item.badge != null && item.badge > 0 && (
                          <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* AI Assistant toggle */}
      <div className="border-t border-gray-100 dark:border-dark-border p-2">
        <button
          onClick={() => setAssistantOpen(o => !o)}
          className={clsx(
            'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
            assistantOpen
              ? 'bg-axilog-primary text-white'
              : 'text-gray-600 dark:text-dark-muted hover:bg-gray-100 dark:hover:bg-dark-elevated',
            collapsed && 'justify-center px-2'
          )}
          title="AI Assistant"
        >
          <MessageSquare className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>AI Assistant</span>}
        </button>
      </div>
    </aside>
  );
}
