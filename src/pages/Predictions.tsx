import React, { useMemo } from 'react';
import { AppState } from '../types';
import { cn } from '../lib/utils';
import { Search, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { extractFeatures } from '../lib/data-utils';

interface PredictionsProps {
  appState: AppState;
}

const Predictions: React.FC<PredictionsProps> = ({ appState }) => {
  const predictions = useMemo(() => {
    if (!appState.model || !appState.trainingData) return [];

    const { model, trainingData, data } = appState;
    const { coefficients, intercept } = model;
    const { scaler, featureNames } = trainingData;

    return data.map(student => {
      // Use robust helper
      const rawRow = extractFeatures(student, featureNames);

      // Scale
      const scaledRow = rawRow.map((val, i) => {
        const m = scaler.mean[i] || 0;
        const s = scaler.std[i] || 1;
        return (val - m) / s;
      });

      // Predict
      let z = intercept;
      let topContribution = { name: '', impact: 0 };

      featureNames.forEach((name, i) => {
        const impact = (scaledRow[i] || 0) * (coefficients[name] || 0);
        z += impact;
        
        if (Math.abs(impact) > Math.abs(topContribution.impact)) {
          topContribution = { name, impact };
        }
      });

      const proba = 1 / (1 + Math.exp(-z));
      
      return {
        ...student,
        prediction: proba >= 0.5 ? 1 : 0,
        confidence: proba >= 0.5 ? proba : 1 - proba,
        topFeature: topContribution
      };
    });
  }, [appState.model, appState.trainingData, appState.data]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {!appState.model || appState.data.length === 0 ? (
        <div className="card-minimal p-20 text-center space-y-6 bg-slate-900 border-none text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-10 opacity-10">
             <Search size={140} />
          </div>
          <div className="relative z-10 space-y-4">
            <h3 className="text-2xl font-black tracking-tight">
              {!appState.model ? "Model Engine Offline" : "Diagnostic Data Required"}
            </h3>
            <p className="text-slate-400 max-w-md mx-auto font-medium">
              {!appState.model 
                ? "Predictive audits cannot be generated because no trained model was found. Please proceed to the Audit Configuration page to initialize calculations."
                : "The predictive stream is empty. Please upload a valid candidate dataset in the Audit Dataset section to begin the audit process."}
            </p>
          </div>
        </div>
      ) : (
        <div className="card-minimal overflow-hidden border-none shadow-2xl">
          <div className="px-8 py-6 border-b border-slate-100 bg-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Outcome Audit Stream</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-widest">Model: LogisticRegression v2.1-STABLE</p>
              </div>
              <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                <Search size={14} className="text-slate-400" />
                <input type="text" placeholder="Filter Candidates..." className="text-[10px] font-black uppercase tracking-widest outline-none bg-transparent w-40 placeholder:text-slate-300" />
              </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Applicant Identity</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Academic Merit (GPA)</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Assessment Score</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Confidence Index</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Final Prediction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 bg-white">
                {predictions.map((row) => (
                  <tr key={row.Student_ID} className="hover:bg-blue-50/30 transition-colors group cursor-default">
                    <td className="px-8 py-5">
                       <div className="flex flex-col">
                          <span className="font-black text-slate-900 text-sm tracking-tight">{row.Student_Name || row.Student_ID}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ref: {String(row.Student_ID).slice(0,12)}</span>
                       </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="inline-flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-lg">
                        <span className="font-mono text-xs font-bold text-slate-700">
                          {row.GPA ? Number(row.GPA).toFixed(2) : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 font-mono text-xs font-bold text-slate-600">
                      {row.Entrance_Score || 'N/A'}
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{(row.confidence * 100).toFixed(1)}% Match</span>
                        <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${row.confidence * 100}%` }}
                            className={cn("h-full rounded-full", row.prediction === 1 ? "bg-blue-600" : "bg-slate-300")} 
                          ></motion.div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className={cn(
                        "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] inline-block shadow-sm",
                        row.prediction === 1 
                          ? "bg-emerald-500 text-white shadow-emerald-500/20" 
                          : "bg-slate-900 text-white shadow-slate-900/20"
                      )}>
                        {row.prediction === 1 ? 'Admitted' : 'Rejected'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Predictions;
