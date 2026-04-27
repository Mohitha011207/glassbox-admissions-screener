import React, { useMemo } from 'react';
import { AppState } from '../types';
import { Target, Star, BrainCircuit, Activity, BarChart3, Users, Scale } from 'lucide-react';
import Plot from 'react-plotly.js';

interface DashboardProps {
  appState: AppState;
}

const Dashboard: React.FC<DashboardProps> = ({ appState }) => {
  const metrics = useMemo(() => {
    if (!appState.model || !appState.trainingData) return null;

    const { model, trainingData } = appState;
    const { X, y, featureNames } = trainingData;
    const { coefficients, intercept } = model;

    // Calculate accuracy using explicit feature mapping
    let correct = 0;
    X.forEach((row, i) => {
        let z = intercept;
        featureNames.forEach((name, j) => {
            z += (row[j] || 0) * (coefficients[name] || 0);
        });
        const pred = 1 / (1 + Math.exp(-z)) >= 0.5 ? 1 : 0;
        if (pred === y[i]) correct++;
    });
    const accuracy = (correct / (X.length || 1)) * 100;

    // Most important feature
    const features = Object.entries(coefficients).sort((a, b) => Math.abs(b[1] as number) - Math.abs(a[1] as number));
    const topFeature = (features[0] || ['None', 0]) as [string, number];

    // Fairness (Disparate Impact Ratio)
    const incomeFeat = ('Income' in appState.data[0]) ? 'Income' : ('Income_Level' in appState.data[0] ? 'Income_Level' : null);
    const lowIncome = incomeFeat ? appState.data.filter(d => String(d[incomeFeat]).toLowerCase().includes('low')) : [];
    const highIncome = incomeFeat ? appState.data.filter(d => String(d[incomeFeat]).toLowerCase().includes('high')) : [];
    const lowRate = lowIncome.filter(d => d.Admit === 1).length / (lowIncome.length || 1);
    const highRate = highIncome.filter(d => d.Admit === 1).length / (highIncome.length || 1);
    const fairness = highRate > 0 ? (lowRate / highRate) * 100 : 100;

    return {
      accuracy,
      topFeature,
      fairness,
      totalStudents: appState.data.length,
      admitCount: appState.data.filter(d => d.Admit === 1).length
    };
  }, [appState.model, appState.trainingData, appState.data]);

  if (!metrics) return (
    <div className="max-w-4xl mx-auto py-20 text-center text-slate-400">
        <Activity size={48} className="mx-auto mb-4 opacity-20" />
        <h3 className="text-xl font-bold">Dashboard Insights Pending</h3>
        <p>Please train the model to view live performance metrics.</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Grid Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card-minimal p-6 border-l-4 border-l-blue-600">
           <div className="flex items-center gap-3 mb-2">
             <Target size={16} className="text-blue-600" />
             <p className="stat-label uppercase tracking-widest font-black">Model Accuracy</p>
           </div>
           <h3 className="text-3xl font-black text-slate-900">{metrics.accuracy.toFixed(1)}%</h3>
           <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">Predictive Reliability Score</p>
        </div>
        <div className="card-minimal p-6 border-l-4 border-l-emerald-500">
           <div className="flex items-center gap-3 mb-2">
             <Scale size={16} className="text-emerald-500" />
             <p className="stat-label uppercase tracking-widest font-black">Fairness Score</p>
           </div>
           <h3 className="text-3xl font-black text-emerald-600">{metrics.fairness.toFixed(2)}%</h3>
           <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">Group Parity Dashboard</p>
        </div>
        <div className="card-minimal p-6 border-l-4 border-l-indigo-500">
           <div className="flex items-center gap-3 mb-2">
             <BrainCircuit size={16} className="text-indigo-500" />
             <p className="stat-label uppercase tracking-widest font-black">Key Driver</p>
           </div>
           <h3 className="text-2xl font-black text-slate-900 truncate" title={metrics.topFeature[0].replace(/_/g, ' ') === 'Entrance Score' ? 'Assessment Score' : metrics.topFeature[0].replace(/_/g, ' ')}>
             {metrics.topFeature[0].replace(/_/g, ' ') === 'Entrance Score' ? 'Assessment Score' : metrics.topFeature[0].replace(/_/g, ' ')}
           </h3>
           <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">Primary Weight Coefficient</p>
        </div>
        <div className="card-minimal p-6 border-l-4 border-l-slate-800">
           <div className="flex items-center gap-3 mb-2">
             <Activity size={16} className="text-slate-800" />
             <p className="stat-label uppercase tracking-widest font-black">Decision Bias</p>
           </div>
           <h3 className="text-3xl font-black text-slate-800">Minimal</h3>
           <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">System Feedback Loop</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Feature Importance Plot */}
          <div className="lg:col-span-2 card-minimal overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800">Primary Feature Importance</h3>
                  <BarChart3 size={16} className="text-slate-400" />
              </div>
              <div className="p-6 h-[340px]">
                  <Plot
                    data={[{
                        y: Object.keys(appState.model?.coefficients || {}).map(k => k.replace('_', ' ')),
                        x: Object.values(appState.model?.coefficients || {}),
                        type: 'bar',
                        orientation: 'h',
                        marker: { color: '#3B82F6' }
                    }]}
                    layout={{
                        autosize: true,
                        margin: { t: 0, b: 40, l: 120, r: 20 },
                        xaxis: { title: 'Impact Weight', gridcolor: '#F1F5F9' },
                        yaxis: { gridcolor: '#F1F5F9' },
                        paper_bgcolor: 'rgba(0,0,0,0)',
                        plot_bgcolor: 'rgba(0,0,0,0)',
                    }}
                    config={{ responsive: true, displayModeBar: false }}
                    className="w-full h-full"
                  />
              </div>
          </div>

          <div className="space-y-6">
             <div className="card-minimal p-6 bg-blue-600 border-none text-white overflow-hidden relative">
                <div className="relative z-10">
                    <h3 className="text-lg font-bold mb-2">Admissions Outlook</h3>
                    <p className="text-blue-100 text-sm leading-relaxed">
                        The model shows a strong reliance on <strong>{metrics.topFeature[0].replace('_', ' ')}</strong> as the primary predictor. 
                        Fairness metrics indicate a <strong>{metrics.fairness.toFixed(0)}%</strong> parity between disparate groups.
                    </p>
                </div>
                <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full"></div>
             </div>

             <div className="card-minimal p-6">
                 <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Quick Stats</h4>
                 <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                        <span className="text-sm text-slate-600 flex items-center gap-2"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> Total Students</span>
                        <span className="text-sm font-bold text-slate-900 font-mono">{metrics.totalStudents}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                        <span className="text-sm text-slate-600 flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> Admits</span>
                        <span className="text-sm font-bold text-slate-900 font-mono">{metrics.admitCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600 flex items-center gap-2"><div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div> Rejects</span>
                        <span className="text-sm font-bold text-slate-900 font-mono">{metrics.totalStudents - metrics.admitCount}</span>
                    </div>
                 </div>
             </div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;
