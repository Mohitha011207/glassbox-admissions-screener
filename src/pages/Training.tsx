import React, { useState, useEffect } from 'react';
import { 
  BarChart3,
  Zap,
  Loader2,
  AlertCircle,
  TrendingDown
} from 'lucide-react';
import { AppState, ModelWeights } from '../types';
import { preprocessData, trainTestSplit } from '../lib/data-utils';
import { LogisticRegression } from '../lib/model';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import Plot from 'react-plotly.js';

interface TrainingProps {
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
}

const Training: React.FC<TrainingProps> = ({ appState, setAppState }) => {
  const [isTraining, setIsTraining] = useState(false);
  const [trainingComplete, setTrainingComplete] = useState(false);
  const [metrics, setMetrics] = useState<{ trainAcc: number, testAcc: number } | null>(null);
  
  const runTraining = () => {
    if (appState.data.length === 0) return;
    
    setIsTraining(true);
    
    // Simulate training delay for UX
    setTimeout(() => {
      const { X, y, featureNames, scaler } = preprocessData(appState.data);
      
      // Train/Test Split
      const { X_train, y_train, X_test, y_test } = trainTestSplit(X, y, 0.2);
      
      const lr = new LogisticRegression(featureNames);
      const weights = lr.fit(X_train, y_train, 0.1, 1500, 0.05); // Using L2 regularization
      
      // Evaluate
      const calculateAcc = (xs: number[][], ys: number[]) => {
          let correct = 0;
          xs.forEach((x, i) => {
              const prob = lr.predictProba(x);
              const pred = prob >= 0.5 ? 1 : 0;
              if (pred === ys[i]) correct++;
          });
          return (correct / ys.length) * 100;
      };

      const trainAcc = calculateAcc(X_train, y_train);
      const testAcc = calculateAcc(X_test, y_test);
      
      setMetrics({ trainAcc, testAcc });
      
      setAppState(prev => ({
        ...prev,
        trainingData: { X, y, featureNames, scaler },
        model: weights
      }));
      
      setIsTraining(false);
      setTrainingComplete(true);
    }, 1500);
  };

  const calculateCorrelations = () => {
    if (appState.data.length === 0) return null;
    const numericCols = ['GPA', 'Entrance_Score', 'Projects', 'Internships', 'ZipCode', 'Admit'];
    
    // Filter columns that actually exist in the data
    const existingCols = numericCols.filter(col => col in appState.data[0]);
    if (existingCols.length < 2) return null;

    const matrix: number[][] = [];
    
    existingCols.forEach((col1) => {
      const row: number[] = [];
      existingCols.forEach((col2) => {
        const x = appState.data.map(d => {
          const val = parseFloat(String(d[col1]));
          return isNaN(val) ? 0 : val;
        });
        const y = appState.data.map(d => {
          const val = parseFloat(String(d[col2]));
          return isNaN(val) ? 0 : val;
        });
        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
        const sumX2 = x.reduce((a, b) => a + b * b, 0);
        const sumY2 = y.reduce((a, b) => a + b * b, 0);
        
        const num = (n * sumXY) - (sumX * sumY);
        const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
        row.push(den === 0 ? 0 : parseFloat((num / den).toFixed(2)));
      });
      matrix.push(row);
    });

    return { z: matrix, x: existingCols, y: existingCols };
  };

  const correlationData = calculateCorrelations();
  const correlationsList = correlationData ? correlationData.z.flatMap((row, i) => 
    row.map((val, j) => ({ val, i, j }))
       .filter(item => item.i < item.j) // only upper triangle
  ) : [];
  
  const maxCorr = correlationsList.length > 0 
    ? correlationsList.reduce((prev, current) => (Math.abs(prev.val) > Math.abs(current.val)) ? prev : current)
    : { val: 0, i: 0, j: 0 };

  const formatLabel = (s: string) => s.replace(/_/g, ' ') === 'Entrance Score' ? 'Assessment Score' : s.replace(/_/g, ' ');

  const maxCorrLabel = correlationData 
    ? `${formatLabel(correlationData.x[maxCorr.i])} vs ${formatLabel(correlationData.x[maxCorr.j])}`
    : 'No Data';

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-1 space-y-6">
            <div className="card-minimal p-8 bg-slate-900 border-none text-white relative overflow-hidden">
                <div className="relative z-10 space-y-6">
                    <div>
                        <h3 className="text-xl font-black tracking-tight mb-1">Audit Configuration</h3>
                        <p className="text-[10px] text-blue-400 font-black uppercase tracking-[0.2em]">Neural Engine v2.1-Beta</p>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Iterations</span>
                            <span className="text-xs font-mono font-bold text-white">1,500</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Weight Decay</span>
                            <span className="text-xs font-mono font-bold text-white">0.001</span>
                        </div>
                        {metrics && (
                            <div className="grid grid-cols-2 gap-3 mt-4">
                                <div className="p-3 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm text-center">
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Train Acc</p>
                                    <p className="text-sm font-black text-emerald-400">{metrics.trainAcc.toFixed(1)}%</p>
                                </div>
                                <div className="p-3 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm text-center">
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Test Acc</p>
                                    <p className="text-sm font-black text-blue-400">{metrics.testAcc.toFixed(1)}%</p>
                                </div>
                            </div>
                        )}
                        <button 
                            onClick={runTraining}
                            disabled={isTraining || appState.data.length === 0}
                            className={cn(
                                "w-full py-4 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 mt-4",
                                isTraining 
                                    ? "bg-white/10 text-slate-400 cursor-not-allowed" 
                                    : "bg-blue-600 text-white hover:bg-blue-500 shadow-xl shadow-blue-600/20 active:scale-[0.98]"
                            )}
                        >
                            {isTraining ? <Loader2 className="animate-spin" size={16} /> : <Zap size={14} fill="currentColor" />}
                            {isTraining ? 'Processing...' : 'Deploy Audit'}
                        </button>
                    </div>
                </div>
                <div className="absolute right-0 top-0 p-8 opacity-10">
                    <Zap size={120} fill="white" />
                </div>
            </div>

            <div className="card-minimal p-8 space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Ethical Constraints</h4>
                <div className="space-y-4">
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl relative overflow-hidden group">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
                        <p className="text-xs text-slate-600 leading-relaxed font-bold italic">
                            "The system must enforce meritocratic weighting while suppressing proxy variables (e.g., zip code) that artificially mask socio-economic status."
                        </p>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
                        <p className="text-xs text-slate-600 leading-relaxed font-bold italic">
                            "Bias mitigation active: Gradient descent adjusted for subgroup parity."
                        </p>
                    </div>
                </div>
            </div>
         </div>

         <div className="lg:col-span-2 space-y-8">
            <div className="card-minimal overflow-hidden transition-all hover:shadow-xl">
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Collinearity Audit</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Cross-Feature Interaction Map</p>
                    </div>
                    <div className={cn(
                        "flex items-center gap-2 px-3 py-1 rounded-full",
                        Math.abs(maxCorr.val) > 0.7 ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                    )}>
                        <AlertCircle size={14} className={Math.abs(maxCorr.val) > 0.7 ? "animate-pulse" : ""} />
                        <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                            {Math.abs(maxCorr.val) > 0.7 ? 'Leakage Detected' : 'Clean Scan'}
                        </span>
                    </div>
                </div>
                <div className="p-8 h-[450px]">
                    {correlationData ? (
                        <Plot
                            data={[{
                                z: correlationData.z,
                                x: correlationData.x.map(formatLabel),
                                y: correlationData.y.map(formatLabel),
                                type: 'heatmap',
                                colorscale: [
                                    [0, '#F8FAFC'],
                                    [0.5, '#3B82F6'],
                                    [1, '#1D4ED8']
                                ],
                                showscale: true,
                                colorbar: {
                                    tickfont: { size: 10, color: '#64748B', weight: 'bold' },
                                    thickness: 15
                                }
                            }]}
                            layout={{
                                autosize: true,
                                margin: { t: 0, b: 60, l: 120, r: 0 },
                                xaxis: { tickangle: 45, tickfont: { size: 10, color: '#64748B', weight: 'black' } },
                                yaxis: { tickfont: { size: 10, color: '#64748B', weight: 'black' } },
                                paper_bgcolor: 'rgba(0,0,0,0)',
                                plot_bgcolor: 'rgba(0,0,0,0)',
                            }}
                            config={{ responsive: true, displayModeBar: false }}
                            className="w-full h-full"
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-4">
                            <TrendingDown size={48} className="opacity-10" />
                            <p className="font-black text-xs uppercase tracking-widest">Connect Data Stream To Audit</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
                <div className="card-minimal p-8 border-t-2 border-t-blue-600">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Peak Correlation</p>
                    <h4 className={cn(
                        "text-4xl font-black tracking-tighter",
                        Math.abs(maxCorr.val) > 0.7 ? "text-rose-500" : "text-slate-950"
                    )}>{maxCorr.val.toFixed(3)}</h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2 truncate" title={maxCorrLabel}>
                        Vector: <span className="text-blue-600">{maxCorrLabel}</span>
                    </p>
                </div>
                <div className="card-minimal p-8 border-t-2 border-t-emerald-500">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Risk Assessment</p>
                    <h4 className={cn(
                        "text-4xl font-black tracking-tighter",
                        Math.abs(maxCorr.val) > 0.8 ? "text-rose-500" : "text-emerald-500"
                    )}>
                        {Math.abs(maxCorr.val) > 0.8 ? 'Critical' : (Math.abs(maxCorr.val) > 0.5 ? 'Moderate' : 'Stable')}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">Structural Integrity</p>
                </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Training;
