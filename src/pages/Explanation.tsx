import React, { useMemo, useState } from 'react';
import { AppState } from '../types';
import { cn } from '../lib/utils';
import Plot from 'react-plotly.js';
import { User, Info } from 'lucide-react';
import { motion } from 'motion/react';
import { extractFeatures } from '../lib/data-utils';

interface ExplanationProps {
  appState: AppState;
}

const Explanation: React.FC<ExplanationProps> = ({ appState }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const students = appState.data;
  const currentStudent = students.find(s => s.Student_ID === selectedId) || null;

  const shapData = useMemo(() => {
    if (!appState.model || !appState.trainingData || !currentStudent) return null;

    const { model, trainingData } = appState;
    const { coefficients, intercept } = model;
    const { scaler, featureNames } = trainingData;

    // Feature prep using robust helper
    const rawRow = extractFeatures(currentStudent, featureNames);

    // Scale
    const scaledRow = rawRow.map((val, i) => {
      const m = scaler.mean[i] || 0;
      const s = scaler.std[i] || 1;
      return (val - m) / s;
    });

    // Calculate contributions
    const formatFeatureName = (name: string) => {
      const clean = name.replace(/_/g, ' ');
      if (clean === 'Entrance Score') return 'Assessment Score';
      return clean;
    };

    const contributions = featureNames.map((name, i) => ({
      name: formatFeatureName(name),
      value: (scaledRow[i] || 0) * (coefficients[name] || 0),
      originalValue: rawRow[i] || 0
    })).filter(c => Math.abs(c.value) > 1e-4); // Filter out zero contributions for cleaner plot

    // Sort by absolute impact
    const sortedContribs = contributions.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

    // Prepare for Waterfall
    const x = ['Intercept', ...sortedContribs.map(c => c.name), 'Total (Logit)'];
    const y = [intercept, ...sortedContribs.map(c => c.value)];
    const totals = intercept + sortedContribs.reduce((sum, c) => sum + c.value, 0);

    return {
      labels: x,
      values: y,
      total: totals,
      probability: 1 / (1 + Math.exp(-totals)),
      features: sortedContribs
    };
  }, [appState.model, appState.trainingData, currentStudent]);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {!appState.model ? (
        <div className="card-minimal p-16 text-center space-y-4">
           <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto">
             <Info size={32} />
           </div>
           <h3 className="text-xl font-bold text-slate-800">Model Training Required</h3>
           <p className="text-slate-500 max-w-sm mx-auto">Please go to the Bias Audit page and train the screener before generating deconstructed logic.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1 space-y-6">
                <div className="card-minimal p-6">
                    <h3 className="text-sm font-bold text-slate-800 mb-4">Subject Selector</h3>
                    <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                        {students.map(student => (
                            <button
                                key={student.Student_ID}
                                onClick={() => setSelectedId(student.Student_ID)}
                                className={cn(
                                    "w-full text-left p-3 rounded-lg border transition-all flex flex-col gap-0.5",
                                    selectedId === student.Student_ID ? "bg-blue-600 border-blue-600 text-white shadow-sm" : "bg-white border-slate-100 text-slate-600 hover:border-blue-400"
                                )}
                            >
                                <span className={cn("text-xs font-bold truncate", selectedId === student.Student_ID ? "text-white" : "text-slate-800")}>{student.Student_Name || student.Student_ID}</span>
                                <span className={cn("text-[10px] font-bold uppercase tracking-widest", selectedId === student.Student_ID ? "text-blue-100" : "text-slate-400")}>ID: {String(student.Student_ID).slice(0,8)}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="lg:col-span-3 space-y-6">
                {shapData && currentStudent ? (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="card-minimal p-6 bg-slate-900 border-none text-white relative overflow-hidden">
                                <div className="relative z-10">
                                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Subject Context</h4>
                                    <h3 className="text-2xl font-bold mb-4">{currentStudent.Student_Name || currentStudent.Student_ID}</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">GPA</p>
                                            <p className="text-lg font-mono font-bold text-blue-400">
                                                {currentStudent.GPA ? Number(currentStudent.GPA).toFixed(2) : 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">ZipCode</p>
                                            <p className="text-lg font-mono font-bold text-blue-400">
                                                {currentStudent.ZipCode || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute right-0 top-0 p-6">
                                     <div className={cn(
                                         "px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest shadow-lg",
                                         shapData.probability >= 0.5 ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                                     )}>
                                         {shapData.probability >= 0.5 ? 'Admitted' : 'Rejected'}
                                     </div>
                                </div>
                             </div>

                             <div className="card-minimal p-10 flex flex-col justify-center gap-6 border-none shadow-xl bg-white relative overflow-hidden">
                                <div className="relative z-10 space-y-6">
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-3">
                                        <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                                        Analytical Audit
                                    </h3>
                                    
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Logic Deconstruction</p>
                                            <p className="text-sm text-slate-700 leading-relaxed font-medium">
                                                The neural weights have processed this applicant's profile and generated a composite log-odds score of <span className="font-black text-slate-900">{shapData.total.toFixed(4)}</span>.
                                            </p>
                                        </div>

                                        <div className="p-6 bg-slate-950 rounded-2xl space-y-4 shadow-2xl relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                                <Info size={80} color="white" />
                                            </div>
                                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Causal Determinants</p>
                                            <p className="text-xs text-slate-300 leading-relaxed font-bold z-10 relative">
                                                The audit identifies <span className="text-white underline decoration-blue-500 decoration-2 underline-offset-4">{shapData.features[0]?.name}</span> as the primary vector for this decision, contributing a <span className={shapData.features[0]?.value > 0 ? "text-emerald-400" : "text-rose-400"}>{Math.abs(shapData.features[0]?.value).toFixed(3)} unit {shapData.features[0]?.value > 0 ? 'boost' : 'penalty'}</span> to the baseline.
                                                {shapData.features[1] && (
                                                    <> Secondary logic was driven by <span className="text-white">{shapData.features[1]?.name}</span>, which {shapData.features[1].value > 0 ? 'positively reinforced' : 'negatively counteracted'} the primary driver by {Math.abs(shapData.features[1]?.value).toFixed(3)} units.</>
                                                )}
                                            </p>
                                        </div>

                                        <div className="space-y-3 pt-2">
                                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                <span>Probability Index</span>
                                                <span>{(shapData.probability * 100).toFixed(1)}%</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${shapData.probability * 100}%` }}
                                                    className={cn("h-full rounded-full transition-all duration-1000", shapData.probability >= 0.5 ? "bg-emerald-500" : "bg-rose-500")}
                                                />
                                            </div>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                                                Metric: SHAP (SHapley Additive exPlanations) values represent deviations from the population base rate.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                             </div>
                        </div>

                        <div className="card-minimal overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-sm font-bold text-slate-800">SHAP Waterfall Analysis (Feature Contribution)</h3>
                                <div className="flex gap-4">
                                     <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-blue-500 rounded-full"></div><span className="text-[10px] font-bold text-slate-500 uppercase">Positive</span></div>
                                     <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-rose-500 rounded-full"></div><span className="text-[10px] font-bold text-slate-500 uppercase">Negative</span></div>
                                </div>
                            </div>
                            <div className="p-6 h-[400px]">
                                <Plot
                                    data={[{
                                        type: 'waterfall',
                                        orientation: 'v',
                                        measure: ['relative', ...shapData.values.slice(1).map(() => 'relative'), 'total'] as any,
                                        x: shapData.labels,
                                        textposition: 'outside',
                                        text: [...shapData.values, shapData.total].map(v => v > 0 ? `+${v.toFixed(2)}` : v.toFixed(2)),
                                        y: [...shapData.values, 0],
                                        connector: { line: { color: '#E2E8F0', dash: 'dot' } },
                                        increasing: { marker: { color: '#3B82F6' } },
                                        decreasing: { marker: { color: '#F43F5E' } },
                                        totals: { marker: { color: '#0F172A' } }
                                    }]}
                                    layout={{
                                        autosize: true,
                                        margin: { t: 20, b: 60, l: 40, r: 20 },
                                        xaxis: { tickfont: { size: 10, color: '#64748B', weight: 'bold' } },
                                        yaxis: { showgrid: true, gridcolor: '#F1F5F9' },
                                        paper_bgcolor: 'rgba(0,0,0,0)',
                                        plot_bgcolor: 'rgba(0,0,0,0)',
                                    }}
                                    config={{ responsive: true, displayModeBar: false }}
                                    className="w-full h-full"
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="card-minimal p-16 text-center text-slate-300 h-full flex flex-col items-center justify-center">
                        <User size={48} className="opacity-20 mb-4" />
                        <p className="font-bold">Select a subject to view deconstructed logic.</p>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default Explanation;
