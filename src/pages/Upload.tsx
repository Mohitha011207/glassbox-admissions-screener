import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Upload as UploadIcon, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { StudentData } from '../types';
import { cn } from '../lib/utils';
import { generateSyntheticData } from '../lib/data-utils';

interface UploadProps {
  onDataLoaded: (data: StudentData[]) => void;
  currentDataLength: number;
}

const Upload: React.FC<UploadProps> = ({ onDataLoaded, currentDataLength }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateData = (data: any[]) => {
    if (data.length === 0) return { error: 'The file is empty.', warnings: [] };
    
    // Core columns strictly needed for training
    const essentialColumns = ['Admit'];
    // Standard feature columns
    const featureColumns = ['GPA', 'Entrance_Score', 'Projects', 'Internships', 'Income', 'Gender'];
    
    const firstRow = data[0];
    const missingEssential = essentialColumns.filter(col => !(col in firstRow));
    const missingFeatures = featureColumns.filter(col => !(col in firstRow));

    // Backup checks
    const incomePresent = ('Income' in firstRow) || ('Income_Level' in firstRow);
    const updatedMissingFeatures = missingFeatures.filter(f => {
      if (f === 'Income') return !incomePresent;
      if (f === 'Student_ID' || f === 'Student_Name') return false;
      return true;
    });
    
    if (missingEssential.length > 0) {
      return { 
        error: `Missing required target column: ${missingEssential.join(', ')}. The model needs a label to learn.`, 
        warnings: [] 
      };
    }
    
    return { 
      error: null, 
      warnings: updatedMissingFeatures.length > 0 
        ? [`Standard columns not found: ${updatedMissingFeatures.join(', ')}. The model will skip these features.`] 
        : [] 
    };
  };

  const processLoadedData = (data: any[]): StudentData[] => {
    return data.map((row, index) => ({
      ...row,
      Student_ID: row.Student_ID || `STU-${1000 + index}`,
      Student_Name: row.Student_Name || `Applicant ${1000 + index}`,
    })) as StudentData[];
  };

  const handleFileUpload = (file: File) => {
    setError(null);
    setWarnings([]);
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'csv') {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          const { error, warnings } = validateData(results.data);
          if (error) {
            setError(error);
          } else {
            setWarnings(warnings);
            onDataLoaded(processLoadedData(results.data));
          }
        },
        error: (err) => setError(`Error parsing CSV: ${err.message}`)
      });
    } else if (extension === 'xlsx' || extension === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const ab = e.target?.result;
          const wb = XLSX.read(ab, { type: 'array' });
          const firstSheetName = wb.SheetNames[0];
          const worksheet = wb.Sheets[firstSheetName];
          const data = XLSX.utils.sheet_to_json(worksheet);
          
          const { error, warnings } = validateData(data);
          if (error) {
            setError(error);
          } else {
            setWarnings(warnings);
            onDataLoaded(processLoadedData(data));
          }
        } catch (err) {
          setError('Error parsing Excel file.');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      setError('Unsupported file type. Please upload CSV or Excel.');
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const useSyntheticData = () => {
    const data = generateSyntheticData(200);
    onDataLoaded(data);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="card-minimal p-8">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Ingest Data</h4>
            <div 
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[220px] gap-4 relative overflow-hidden group",
                isDragging ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-blue-400 hover:bg-slate-50 shadow-inner"
              )}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".csv,.xlsx,.xls"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              />
              <div className="w-12 h-12 bg-white text-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <UploadIcon size={24} />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Release CSV / XLSX</p>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest leading-none">Limit: 50MB per vector</p>
              </div>
            </div>
          </div>

          <div className="card-minimal p-8 space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Stream Integrity</h4>
              {currentDataLength > 0 ? (
                <div className="flex items-center gap-4 bg-slate-950 p-4 rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-600/20">
                        <FileText size={18} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-black text-white tracking-widest uppercase truncate">{currentDataLength} Records</p>
                        <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest mt-0.5">Verified Sync</p>
                    </div>
                </div>
              ) : (
                <div className="text-center p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                   <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Null Signal Detected</p>
                </div>
              )}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-8">
          {error && (
            <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-6 bg-rose-50 border border-rose-100 rounded-3xl flex items-center gap-4 text-rose-700 shadow-lg shadow-rose-950/5"
            >
              <div className="w-10 h-10 bg-rose-500 text-white rounded-xl flex items-center justify-center shadow-lg shrink-0">
                <AlertCircle size={24} />
              </div>
              <span className="text-xs font-black uppercase tracking-widest leading-relaxed">{error}</span>
            </motion.div>
          )}

          {warnings.length > 0 && (
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 bg-amber-50 border border-amber-100 rounded-3xl space-y-4 shadow-lg shadow-amber-950/5"
            >
              <div className="flex items-center gap-3">
                 <AlertCircle size={18} className="text-amber-500" />
                 <span className="text-[10px] font-black text-amber-900 uppercase tracking-widest">Heuristic Warnings</span>
              </div>
              <div className="space-y-3">
                {warnings.map((warning, i) => (
                  <div key={i} className="flex items-start gap-4 text-amber-800">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span className="text-xs font-bold leading-relaxed">{warning}</span>
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-amber-600 font-black uppercase tracking-widest ml-5 italic">System adaptation engaged: Missing vectors will be ignored during training.</p>
            </motion.div>
          )}

          <div className="card-minimal p-10 bg-slate-900 border-none overflow-hidden relative shadow-2xl">
            <div className="relative z-10">
              <h3 className="text-xl font-black text-white tracking-tight mb-2">Simulated Initialization</h3>
              <p className="text-sm text-slate-400 mb-8 max-w-lg font-medium leading-relaxed">Lack of raw telemetry? Initialize a pre-calibrated synthetic stream containing 200 high-fidelity applicant profiles to explore the neural engine.</p>
              <button 
                onClick={useSyntheticData}
                className="px-8 py-3 bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl shadow-xl shadow-blue-600/30 hover:bg-blue-500 transition-all active:scale-95"
              >
                Inject Synthetic Signal
              </button>
            </div>
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px]"></div>
          </div>

          <div className="card-minimal p-10 overflow-hidden shadow-xl bg-white border-none transition-all hover:shadow-2xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                   <h3 className="text-sm font-black text-slate-950 uppercase tracking-widest">Protocol Schema</h3>
                   <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-widest">Target Mapping Requirements</p>
                </div>
                <div className="w-8 h-8 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center">
                   <FileText size={16} />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div className="space-y-3">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Critical Vector</p>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                         <span className="text-xs font-bold text-slate-700">Admit</span>
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest tracking-widest px-2 py-1 bg-white border rounded shadow-sm">Binary (0|1)</span>
                    </div>
                </div>
              </div>
              <div className="space-y-6">
                 <div className="space-y-3">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Recommended Features</p>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                         <p className="text-xs text-slate-800 leading-relaxed font-bold">
                            GPA, Assessment_Score, Projects, Internships
                         </p>
                         <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                            Assessment Score represents standardized testing (e.g., Entrance Score) which functions as a high-variance performance metric alongside academic GPA.
                         </p>
                    </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;
