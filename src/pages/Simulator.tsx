import React, { useState, useMemo } from 'react';
import { AppState } from '../types';
import { cn } from '../lib/utils';
import { Sparkles, Lightbulb, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { extractFeatures } from '../lib/data-utils';

interface SimulatorProps {
  appState: AppState;
}

const Simulator: React.FC<SimulatorProps> = ({ appState }) => {
  const [inputs, setInputs] = useState({
    GPA: 3.5,
    Entrance_Score: 1200,
    Projects: 2,
    Internships: 1,
    ZipCode: 50210,
    IncomeValue: 'Medium',
    GenderValue: 'Male'
  });

  const prediction = useMemo(() => {
    if (!appState.model || !appState.trainingData) return null;

    const { model, trainingData } = appState;
    const { coefficients, intercept } = model;
    const { scaler, featureNames } = trainingData;

    // Detect which column names were used
    const incomeCol = ('Income' in (appState.data[0] || {})) ? 'Income' : 'Income_Level';
    const genderCol = 'Gender';

    // Map simulator inputs to pseudo StudentData row
    const pseudoRow: any = {
      GPA: inputs.GPA,
      Entrance_Score: inputs.Entrance_Score,
      Projects: inputs.Projects,
      Internships: inputs.Internships,
      ZipCode: inputs.ZipCode,
      [incomeCol]: inputs.IncomeValue,
      [genderCol]: inputs.GenderValue,
      Student_ID: 'SIM',
      Student_Name: 'Simulated',
      Admit: 0
    };

    // Use robust helper
    const rawRow = extractFeatures(pseudoRow, featureNames);

    // Scale
    const scaledRow = rawRow.map((val, i) => {
      const m = scaler.mean[i] || 0;
      const s = scaler.std[i] || 1;
      return (val - m) / s;
    });

    // Predict
    let z = intercept;
    featureNames.forEach((name, i) => {
      z += (scaledRow[i] || 0) * (coefficients[name] || 0);
    });

    const proba = 1 / (1 + Math.exp(-z));
    
    // Find what to improve (roadmap)
    const improvements: { feat: string, amount: string }[] = [];
    const targetZ = Math.log(0.8 / 0.2); // Log-odds for 80% probability

    if (proba < 0.8) {
        const deltaZ = targetZ - z;
        
        // Helper to estimate required feature value to hit target Z
        const getTarget = (featName: string, currentVal: number) => {
            const idx = featureNames.indexOf(featName);
            if (idx === -1) return null;
            
            const weight = coefficients[featName] || 0;
            const std = scaler.std[idx] || 1;
            
            if (weight <= 0) return null; // Can't improve by increasing if weight is negative
            
            const neededIncrease = (deltaZ * std) / weight;
            return currentVal + neededIncrease;
        };

        // GPA
        const targetGPA = getTarget('GPA', inputs.GPA);
        if (targetGPA && targetGPA > inputs.GPA && targetGPA <= 4.0) {
            improvements.push({ 
                feat: 'GPA', 
                amount: `Boost GPA to ${targetGPA.toFixed(2)} (current: ${inputs.GPA})` 
            });
        } else if (targetGPA && targetGPA > 4.0) {
           improvements.push({ 
               feat: 'GPA', 
               amount: `Focus on extracurriculars; current GPA improvement alone is mathematically insufficient.` 
           });
        }

        // Projects
        const targetProjects = getTarget('Projects', inputs.Projects);
        if (targetProjects && targetProjects > inputs.Projects) {
            const rounded = Math.ceil(targetProjects);
            improvements.push({ 
                feat: 'Projects', 
                amount: `Add ${rounded - inputs.Projects} more major projects to reach a total of ${rounded}` 
            });
        }

        // Assessment Score
        const targetScore = getTarget('Entrance_Score', inputs.Entrance_Score);
        if (targetScore && targetScore > inputs.Entrance_Score && targetScore <= 1600) {
            const rounded = Math.ceil(targetScore / 10) * 10;
            improvements.push({ 
                feat: 'Assessment Score', 
                amount: `Retake tests to achieve a score of ${rounded} (current: ${inputs.Entrance_Score})` 
            });
        }
    }

    return { 
        proba, 
        admit: proba >= 0.5,
        roadmap: improvements
    };
  }, [appState.model, appState.trainingData, inputs]);

  const Slider = ({ label, min, max, step, value, onChange, prefix = "" }: any) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center px-1">
        <label className="text-sm font-bold text-slate-600">{label}</label>
        <span className="text-sm font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-blue-600">{prefix}{value}</span>
      </div>
      <input 
        type="range" min={min} max={max} step={step} value={value} 
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
      />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Controls */}
        <aside className="lg:col-span-1 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-8 flex flex-col h-fit sticky top-24">
          <div className="space-y-2">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Scenario Builder</h3>
            <p className="text-[10px] text-slate-500 leading-relaxed font-bold uppercase tracking-widest">Adjust Variables & Observe Impact</p>
          </div>
          
          <div className="space-y-6">
            <Slider label="GPA (4.0 Scale)" min={2.0} max={4.0} step={0.01} value={inputs.GPA} onChange={(v: any) => setInputs(p => ({...p, GPA: v}))} />
            <Slider label="Assessment Score" min={800} max={1600} step={10} value={inputs.Entrance_Score} onChange={(v: any) => setInputs(p => ({...p, Entrance_Score: v}))} />
            <Slider label="Portfolio Projects" min={0} max={10} step={1} value={inputs.Projects} onChange={(v: any) => setInputs(p => ({...p, Projects: v}))} />
            <Slider label="Industry Internships" min={0} max={5} step={1} value={inputs.Internships} onChange={(v: any) => setInputs(p => ({...p, Internships: v}))} />
            <Slider label="Regional ZipCode" min={10000} max={99999} step={1} value={inputs.ZipCode} onChange={(v: any) => setInputs(p => ({...p, ZipCode: v}))} />
          </div>

          <div className="space-y-3 pt-6 border-t border-slate-50">
            <label className="text-xs font-black text-slate-800 uppercase tracking-widest">Socio-Economic Bracket</label>
            <div className="grid grid-cols-3 gap-1">
                {['Low', 'Medium', 'High'].map(level => (
                    <button 
                        key={level}
                        onClick={() => setInputs(p => ({...p, IncomeValue: level}))}
                        className={cn(
                            "py-2 text-[10px] font-black rounded-lg border transition-all uppercase tracking-widest",
                            inputs.IncomeValue === level ? "bg-slate-900 border-slate-900 text-white shadow-md" : "bg-white border-slate-200 text-slate-500 hover:border-slate-400"
                        )}
                    >
                        {level}
                    </button>
                ))}
            </div>
          </div>
        </aside>

        {/* Prediction Display */}
        <div className="lg:col-span-3 space-y-8">
           {!appState.model ? (
                <div className="card-minimal p-20 text-center text-slate-400 border-dashed border-2 bg-slate-50/50">
                    <Sparkles className="mx-auto mb-6 opacity-30" size={64} />
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Simulation Engine Locked</h3>
                    <p className="text-sm font-medium max-w-sm mx-auto">Please complete model training in the Audit Lab to generate the weights required for real-time scenario simulation.</p>
                </div>
           ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <AnimatePresence mode="wait">
                        <motion.div 
                            key={prediction?.admit ? 'admit' : 'reject'}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.2 }}
                            className="bg-slate-900 border border-slate-800 p-10 rounded-2xl text-center flex flex-col justify-center gap-6 shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Zap size={100} fill="white" />
                            </div>
                            <div className="relative z-10 space-y-2">
                                <div className="text-xs font-black text-blue-500 uppercase tracking-[0.2em]">Admission Probability</div>
                                <div className="text-7xl font-black text-white tracking-tighter">
                                    {Math.round((prediction?.proba || 0) * 100)}<span className="text-3xl text-slate-500">%</span>
                                </div>
                            </div>
                            
                            <div className="relative z-10 w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                                <motion.div 
                                    className="h-full bg-blue-600"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(prediction?.proba || 0) * 100}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>

                            <button 
                                onClick={() => setInputs({ GPA: 3.5, Entrance_Score: 1200, Projects: 2, Internships: 1, ZipCode: 50210, IncomeValue: 'Medium', GenderValue: 'Male' })}
                                className="relative z-10 mt-4 w-full bg-slate-800 text-slate-300 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-700 transition-all border border-slate-700 hover:text-white"
                            >
                                Reset To Baseline
                            </button>
                        </motion.div>
                    </AnimatePresence>

                    {prediction?.admit === false ? (
                      <motion.div 
                           initial={{ opacity: 0, x: 20 }}
                           animate={{ opacity: 1, x: 0 }}
                           className="card-minimal p-10 flex flex-col bg-white"
                      >
                          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-600 rounded-full" />
                              Strategic Recommendations
                          </h3>
                          <div className="space-y-4">
                              {prediction.roadmap.map((item, idx) => (
                                  <div key={idx} className="flex items-start gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-all">
                                      <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5">
                                          {idx + 1}
                                      </div>
                                      <span className="font-bold text-sm text-slate-800 leading-relaxed">{item.amount}</span>
                                  </div>
                              ))}
                              {prediction.roadmap.length === 0 && (
                                  <div className="text-sm font-bold text-slate-500 italic p-6 bg-slate-50 rounded-2xl border border-slate-100 border-dashed text-center">
                                      Subject is currently at a critical decision boundary.
                                  </div>
                              )}
                          </div>
                      </motion.div>
                    ) : (
                      <motion.div 
                           initial={{ opacity: 0, x: 20 }}
                           animate={{ opacity: 1, x: 0 }}
                           className="card-minimal p-10 flex flex-col items-center justify-center text-center space-y-6"
                      >
                         <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center shadow-inner">
                            <Sparkles size={40} />
                         </div>
                         <div className="space-y-2">
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Competitive Profile</h3>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed">This simulated applicant meets the essential criteria established by the current model weights for a positive outcome.</p>
                         </div>
                      </motion.div>
                    )}
                </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default Simulator;
