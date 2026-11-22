import React from 'react';
import { LayoutDashboard, ReceiptText, BarChart3, History } from 'lucide-react';
import { triggerHaptic } from '../lib/supabase';

export type TabType = 'overview' | 'entries' | 'analytics' | 'activity';

interface NavigationProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  unpaidCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onChangeTab,
  unpaidCount,
}) => {
  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: LayoutDashboard },
    { id: 'entries' as TabType, label: 'Entries', icon: ReceiptText, badge: unpaidCount },
    { id: 'analytics' as TabType, label: 'Analytics', icon: BarChart3 },
    { id: 'activity' as TabType, label: 'Activity', icon: History },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#ffffff]/95 dark:bg-[#181816]/95 backdrop-blur-lg border-t border-[#e4e2da] dark:border-[#2b2a26] pb-safe transition-colors">
      <div className="max-w-2xl mx-auto grid grid-cols-4 h-16 items-center px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                triggerHaptic(8);
                onChangeTab(tab.id);
              }}
              className={`relative flex flex-col items-center justify-center h-full min-h-[48px] w-full transition-colors ${
                isActive
                  ? 'text-[#1f5f4a] dark:text-[#5cc0a0] font-semibold'
                  : 'text-[#6c6b65] dark:text-[#9b998f] hover:text-[#1b1b19] dark:hover:text-[#efeee9]'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110' : 'scale-100'
                  }`}
                />
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1 tracking-tight leading-none">
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute top-0 w-8 h-0.5 rounded-full bg-[#1f5f4a] dark:bg-[#5cc0a0]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
