import React from 'react';
import { 
  Upload, 
  Play, 
  Search, 
  BarChart3, 
  UserRound, 
  LayoutDashboard,
  ShieldCheck,
  Scale
} from 'lucide-react';
import { Page, AppState } from '../types';
import { cn } from '../lib/utils';

interface SidebarProps {
  currentPage: Page;
  setPage: (page: Page) => void;
  appState: AppState;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setPage, appState }) => {
  const menuItems = [
    { id: 'home', label: 'Mission Engine', icon: ShieldCheck },
    { id: 'upload', label: 'Audit Dataset', icon: Upload },
    { id: 'training', label: 'Audit Configuration', icon: Play },
    { id: 'dashboard', label: 'Performance Dashboard', icon: LayoutDashboard },
    { id: 'predictions', label: 'Outcome Audits', icon: Search },
    { id: 'explain', label: 'SHAP Deconstruction', icon: BarChart3 },
    { id: 'simulator', label: 'Scenario Simulator', icon: UserRound },
  ];

  return (
    <div className="w-[240px] bg-slate-950 border-r border-slate-800 h-screen fixed left-0 top-0 flex flex-col z-10 transition-all">
      <div className="p-8">
        <h1 className="text-xl font-black text-white flex items-center gap-2 tracking-tighter">
          <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center shrink-0">
             <ShieldCheck size={12} strokeWidth={3} />
          </div>
          Glass Box<span className="text-blue-600">.ai</span>
        </h1>
      </div>
      
      <nav className="px-4 mt-2 flex-1">
        {menuItems.map((item) => {
          // Only show certain items if model is ready, or if it's pre-model pages
          const isModelRequired = ['dashboard', 'predictions', 'explain', 'simulator', 'bias'].includes(item.id);
          const isDisabled = isModelRequired && !appState.model;
          
          if (item.id === 'upload' || item.id === 'home' || item.id === 'training' || !isDisabled) {
            return (
              <button
                key={item.id}
                onClick={() => setPage(item.id as Page)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all group mb-1",
                  currentPage === item.id 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" 
                    : "text-slate-500 hover:bg-slate-900 hover:text-slate-300"
                )}
              >
                <item.icon size={14} strokeWidth={currentPage === item.id ? 3 : 2} />
                {item.label}
              </button>
            );
          }
          return null;
        })}
      </nav>
      
      <div className="p-6 border-t border-slate-800">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
          Model Status
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-500">
          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
          Active: LogReg_v2.1
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
