/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Upload from './pages/Upload';
import Training from './pages/Training';
import Predictions from './pages/Predictions';
import Explanation from './pages/Explanation';
import BiasAnalysis from './pages/BiasAnalysis';
import Simulator from './pages/Simulator';
import Dashboard from './pages/Dashboard';
import { AppState, Page, StudentData } from './types';
import { generateSyntheticData } from './lib/data-utils';

export default function App() {
  const [appState, setAppState] = useState<AppState>({
    data: [],
    trainingData: null,
    model: null,
    currentPage: 'home',
    selectedStudentId: null,
  });

  // Load initial synthetic data so app is not empty
  useEffect(() => {
    const initialData = generateSyntheticData(50);
    setAppState(prev => ({ ...prev, data: initialData }));
  }, []);

  const setPage = (page: Page) => {
    setAppState(prev => ({ ...prev, currentPage: page }));
  };

  const handleDataLoaded = (data: StudentData[]) => {
    setAppState(prev => ({
      ...prev,
      data,
      trainingData: null, // Reset model if new data loaded
      model: null,
      currentPage: 'training' // Auto navigate to training
    }));
  };

  const renderPage = () => {
    switch (appState.currentPage) {
      case 'home': return <Home />;
      case 'upload': return <Upload onDataLoaded={handleDataLoaded} currentDataLength={appState.data.length} />;
      case 'training': return <Training appState={appState} setAppState={setAppState} />;
      case 'predictions': return <Predictions appState={appState} />;
      case 'explain': return <Explanation appState={appState} />;
      case 'bias': return <BiasAnalysis appState={appState} />;
      case 'simulator': return <Simulator appState={appState} />;
      case 'dashboard': return <Dashboard appState={appState} />;
      default: return <Home />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar currentPage={appState.currentPage} setPage={setPage} appState={appState} />
      <main className="flex-1 ml-[240px] min-h-screen flex flex-col transition-all">
        <header className="bg-white border-b border-slate-200 px-8 py-6 sticky top-0 z-20 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              {appState.currentPage.charAt(0).toUpperCase() + appState.currentPage.slice(1).replace('-', ' ')}
            </h1>
            <p className="text-sm text-slate-500 font-medium">Transparency-first algorithmic decision support</p>
          </div>
          <div className="hidden md:flex items-center gap-4 text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full uppercase tracking-widest">
             <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
             Live Analysis Active
          </div>
        </header>

        <div className="p-8 flex-1 animate-in fade-in duration-500">
          {renderPage()}
        </div>

        <footer className="px-8 py-4 border-t border-slate-200 bg-white flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
           <div>© 2026 Glass Box Technical Institute</div>
           <div className="flex gap-4">
              <span>Algorithmic Transparency Initiative</span>
              <span className="text-blue-500">v1.2.0-STABLE</span>
           </div>
        </footer>
      </main>
    </div>
  );
}

