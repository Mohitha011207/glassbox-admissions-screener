import React from 'react';
import { ShieldCheck, Scale, Eye, BarChart3, Users, Zap } from 'lucide-react';
import { motion } from 'motion/react';

const Home: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-20 pb-20">
      {/* Hero Section */}
      <div className="relative">
        <div className="max-w-3xl space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest"
          >
            <Zap size={12} fill="currentColor" />
            Empowering Equitable Admissions
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl font-black text-slate-900 leading-[1.1] tracking-tight"
          >
            Auditing the <span className="text-blue-600">Hidden Logic</span> of Opportunity.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-500 font-medium leading-relaxed max-w-2xl"
          >
            Glass Box AI is a professional diagnostic platform designed to dissect, audit, and explain automated university admission systems. We turn "Black Box" algorithms into transparent, accountable frameworks for equity.
          </motion.p>
        </div>
      </div>

      {/* Mission Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="group card-minimal p-8 space-y-6 hover:border-blue-200 transition-all">
          <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <ShieldCheck size={28} />
          </div>
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Algorithmic Integrity</h3>
            <p className="text-sm text-slate-500 leading-relaxed font-medium">
              We identify systemic bias by stress-testing models against sensitive attributes. Ensure that zip codes or income levels never outweigh academic potential.
            </p>
          </div>
        </div>

        <div className="group card-minimal p-8 space-y-6 hover:border-blue-200 transition-all">
          <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Eye size={28} />
          </div>
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Deep Explainability</h3>
            <p className="text-sm text-slate-500 leading-relaxed font-medium">
              Utilizing SHAP (SHapley Additive exPlanations) values to deconstruct every decision. Understand the exact weight each variable contributes to a student's outcome.
            </p>
          </div>
        </div>

        <div className="group card-minimal p-8 space-y-6 hover:border-blue-200 transition-all">
          <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Scale size={28} />
          </div>
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Balanced Compliance</h3>
            <p className="text-sm text-slate-500 leading-relaxed font-medium">
              Balance institutional rigor with diversity mandates. Our dashboard provides real-time parity scores to ensure compliance with modern equity standards.
            </p>
          </div>
        </div>
      </div>

      {/* Extended Features */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card-minimal p-10 bg-slate-100 border-none relative overflow-hidden">
          <BarChart3 className="absolute -right-8 -bottom-8 text-white w-48 h-48 opacity-50" />
          <div className="relative z-10 space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">Advanced Model Lab</h2>
            <p className="text-slate-600 font-medium leading-relaxed">
              Upload your raw applicant data and watch as we map correlations, analyze feature importance, and train interpretable logistic regression headers in real-time.
            </p>
            <ul className="space-y-2 pt-4">
              {['Real-time Correlation Matrix', 'Feature Impact Analysis', 'Binary Classification Audits'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-xs font-bold text-slate-500 uppercase tracking-widest">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="card-minimal p-10 bg-slate-900 text-white border-none relative overflow-hidden">
          <Users className="absolute -right-8 -bottom-8 text-blue-900 w-48 h-48 opacity-20" />
          <div className="relative z-10 space-y-4">
            <h2 className="text-2xl font-bold">Policy Simulation</h2>
            <p className="text-slate-400 font-medium leading-relaxed">
              Don't just predict—explore. Use our "What-If" simulator to see how changes in GPA, projects, or socio-economic factors alter admission probabilities instantly.
            </p>
            <div className="pt-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer">
                Explore Simulation Logic
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer / Stats */}
      <div className="border-t border-slate-200 pt-12 flex flex-col md:flex-row justify-between items-center gap-8">
         <div className="space-y-1">
            <p className="text-lg font-bold text-slate-900">Transparency is a Requirement.</p>
            <p className="text-sm text-slate-500 font-medium">Built for Institutional Leaders, Ethicists, and Data Scientists.</p>
         </div>
         <div className="flex gap-12">
            <div>
               <p className="text-2xl font-black text-blue-600">0.94</p>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Accuracy Target</p>
            </div>
            <div>
               <p className="text-2xl font-black text-blue-600">SHAP</p>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Explainability Engine</p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Home;
