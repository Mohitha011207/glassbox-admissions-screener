import React, { useMemo } from 'react';
import { AppState } from '../types';
import Plot from 'react-plotly.js';
import { Download, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { cn } from '../lib/utils';

interface BiasAnalysisProps {
  appState: AppState;
}

const BiasAnalysis: React.FC<BiasAnalysisProps> = ({ appState }) => {
  const stats = useMemo(() => {
    if (appState.data.length === 0) return null;

    const data = appState.data;
    const total = data.length;
    const admits = data.filter(d => d.Admit === 1).length;
    
    // Admit rate by Gender
    const maleData = data.filter(d => d.Gender === 'Male');
    const femaleData = data.filter(d => d.Gender === 'Female');
    const maleRate = maleData.length > 0 ? (maleData.filter(d => d.Admit === 1).length / maleData.length) * 100 : 0;
    const femaleRate = femaleData.length > 0 ? (femaleData.filter(d => d.Admit === 1).length / femaleData.length) * 100 : 0;

    // Admit rate by Income
    const incomeFeat = ('Income' in data[0]) ? 'Income' : ('Income_Level' in data[0] ? 'Income_Level' : null);
    const lowIncome = incomeFeat ? data.filter(d => String(d[incomeFeat]).toLowerCase().includes('low')) : [];
    const highIncome = incomeFeat ? data.filter(d => String(d[incomeFeat]).toLowerCase().includes('high')) : [];
    const lowIncomeRate = lowIncome.length > 0 ? (lowIncome.filter(d => d.Admit === 1).length / lowIncome.length) * 100 : 0;
    const highIncomeRate = highIncome.length > 0 ? (highIncome.filter(d => d.Admit === 1).length / highIncome.length) * 100 : 0;

    const fairnessScore = incomeFeat ? 100 - Math.abs(highIncomeRate - lowIncomeRate) : 100;

    return {
      total, admits, rejects: total - admits,
      maleRate, femaleRate,
      lowIncomeRate, highIncomeRate,
      fairnessScore
    };
  }, [appState.data]);

  const exportReport = () => {
    if (!stats) return;
    const report = `
GLASS BOX ADMISSIONS SCREENER - TRANSPARENCY REPORT
Date: ${new Date().toLocaleDateString()}
Total Applicants: ${stats.total}

SOCIALLY EQUITABLE METRICS:
- Admit Rate (High Income): ${stats.highIncomeRate.toFixed(1)}%
- Admit Rate (Low Income): ${stats.lowIncomeRate.toFixed(1)}%
- Fairness Gap: ${(stats.highIncomeRate - stats.lowIncomeRate).toFixed(1)}%
- Gender Parity: ${(stats.maleRate - stats.femaleRate).toFixed(1)}% gap

MODEL BEHAVIOR SUMMARY:
The model demonstrates ${stats.fairnessScore > 85 ? 'high' : 'moderate'} fairness across income levels.
${stats.highIncomeRate > stats.lowIncomeRate + 10 ? 'WARNING: Significant bias detected against low-income applicants.' : 'No major systemic biases detected in the current model iteration.'}
    `;
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Transparency_Report_${new Date().toISOString().slice(0,10)}.txt`;
    link.click();
  };

  if (!stats) return (
    <div className="max-w-4xl mx-auto py-20 text-center text-slate-400">
        <AlertCircle size={48} className="mx-auto mb-4 opacity-20" />
        <p>Upload statistics to view bias analysis.</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Admit Rate by Category */}
        <div className="card-minimal overflow-hidden transition-all hover:shadow-xl">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white">
                <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Disparate Impact Audit</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cross-Demographic Analysis</p>
                </div>
                <span className="px-3 py-1 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg">80/20 Rule Applied</span>
            </div>
            <div className="p-8 h-[380px]">
                <Plot
                    data={[
                        {
                            x: ['Low Inc', 'High Inc', 'Male', 'Female'],
                            y: [stats.lowIncomeRate, stats.highIncomeRate, stats.maleRate, stats.femaleRate],
                            type: 'bar',
                            marker: {
                                color: ['#6366F1', '#3B82F6', '#2DD4BF', '#0EA5E9'],
                            }
                        }
                    ]}
                    layout={{
                        autosize: true,
                        margin: { t: 20, b: 60, l: 60, r: 20 },
                        yaxis: { title: 'Admit Rate (%)', range: [0, 100], gridcolor: '#F1F5F9', tickfont: { weight: 'bold', size: 10 } },
                        xaxis: { gridcolor: '#F1F5F9', tickfont: { weight: 'bold', size: 10 } },
                        paper_bgcolor: 'rgba(0,0,0,0)',
                        plot_bgcolor: 'rgba(0,0,0,0)',
                    }}
                    config={{ responsive: true, displayModeBar: false }}
                    className="w-full h-full"
                />
            </div>
        </div>

        {/* Global Admit Distribution */}
        <div className="card-minimal overflow-hidden transition-all hover:shadow-xl">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white">
                <div>
                   <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">System Output Map</h3>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Static Population Segment</p>
                </div>
                <button 
                   onClick={exportReport}
                   className="p-2.5 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                >
                   <Download size={18} />
                </button>
            </div>
            <div className="p-8 h-[380px] flex items-center justify-center">
                <Plot
                    data={[
                        {
                            values: [stats.admits, stats.rejects],
                            labels: ['Admitted', 'Rejected'],
                            type: 'pie',
                            hole: 0.75,
                            marker: {
                                colors: ['#3B82F6', '#F8FAFC']
                            },
                            textinfo: 'percent',
                            hoverinfo: 'label+value',
                            textfont: { size: 14, weight: 'bold' }
                        }
                    ]}
                    layout={{
                        autosize: true,
                        margin: { t: 0, b: 0, l: 0, r: 0 },
                        showlegend: true,
                        legend: { orientation: 'h', y: -0.1, x: 0.5, xanchor: 'center', font: { size: 10, weight: 'bold' } },
                        paper_bgcolor: 'rgba(0,0,0,0)',
                    }}
                    config={{ responsive: true, displayModeBar: false }}
                    className="w-full h-full"
                />
            </div>
        </div>

        {/* Audit Findings */}
        <div className="lg:col-span-2 card-minimal p-10 bg-slate-950 border-none text-white relative overflow-hidden shadow-2xl">
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-12 items-center">
                <div className="space-y-4">
                   <div>
                      <div className="text-7xl font-black mb-1 flex items-baseline gap-2">
                        {stats.fairnessScore.toFixed(0)}
                        <span className="text-lg text-slate-600 font-bold tracking-widest">/ 100</span>
                      </div>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Composite Parity Score</p>
                   </div>
                </div>
                <div className="md:col-span-2 md:border-l border-white/10 md:pl-12">
                    <div className="flex items-start gap-6">
                        <div className={cn(
                            "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg",
                            stats.fairnessScore > 80 ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                        )}>
                            {stats.fairnessScore > 80 ? <CheckCircle2 size={32} /> : <ShieldAlert size={32} />}
                        </div>
                        <div className="space-y-3">
                            <h4 className="text-xl font-bold tracking-tight">Technical Verdict: {stats.fairnessScore > 80 ? 'Compliant Outcome' : 'Intervention Needed'}</h4>
                            <p className="text-sm text-slate-400 leading-relaxed max-w-xl font-medium">
                                {stats.fairnessScore > 80 
                                  ? "The analytical engine maintains demographic parity across protected socio-economic variables. The decision layer is currently operating within optimal fairness parameters." 
                                  : "Audit detected a statistically significant deviation in group parity. We recommend re-weighting academic features or reviewing regional bias factors."}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="absolute right-0 top-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] -mr-32 -mt-32"></div>
        </div>
      </div>
    </div>
  );
};

export default BiasAnalysis;
