import {
  Factory,
  FileText,
  IndianRupee,
  LayoutGrid,
  ShieldCheck,
} from 'lucide-react';
import { NavTab } from '../types/climate';

interface HeaderProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenBoardView: () => void;
}

const NAV_ITEMS: {
  id: NavTab;
  label: string;
  shortLabel: string;
  icon: typeof LayoutGrid;
}[] = [
  { id: 'overview', label: 'Overview', shortLabel: 'Overview', icon: LayoutGrid },
  { id: 'exposure', label: '₹ Exposure', shortLabel: 'Exposure', icon: IndianRupee },
  { id: 'plants', label: 'Plants', shortLabel: 'Plants', icon: Factory },
  { id: 'checks', label: 'Checks & Assumptions', shortLabel: 'Checks', icon: ShieldCheck },
];

export function Header({ activeTab, onSelectTab, onOpenBoardView }: HeaderProps) {
  return (
    <>
      <header className="no-print bg-white border-b border-[#DADCE0] md:sticky md:top-0 z-30">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-14 md:h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <button
            type="button"
            onClick={() => onSelectTab('overview')}
            className="text-[17px] font-semibold tracking-tight text-[#202124] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#1A73E8] rounded-sm cursor-pointer"
          >
            Nimbus Climate
          </button>

          {/* Zone 2: 4 concise single-line text navigation links */}
          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-7 h-full"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={`relative h-full inline-flex items-center text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#1A73E8] ${
                    isActive
                      ? 'text-[#1A73E8]'
                      : 'text-[#5F6368] hover:text-[#202124]'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute bottom-0 inset-x-0 h-[2px] bg-[#1A73E8]"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={onOpenBoardView}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#1A73E8] hover:bg-[#1765CC] active:bg-[#1557B0] rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1A73E8]"
            >
              <FileText className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Board View</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile One-Thumb Bottom Navigation Bar */}
      <nav
        aria-label="Mobile navigation"
        className="no-print md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-[#DADCE0] h-16 px-2 grid grid-cols-4 items-center"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`min-h-[48px] flex flex-col items-center justify-center gap-1 rounded-lg transition-colors cursor-pointer ${
                isActive ? 'text-[#1A73E8] font-semibold' : 'text-[#5F6368] font-medium'
              }`}
            >
              <Icon className="w-5 h-5" aria-hidden="true" />
              <span className="text-[11px] leading-none whitespace-nowrap">
                {item.shortLabel}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
