import React from 'react';
import { ShieldCheck, ArrowRight, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600 rounded-xl shadow-lg shadow-emerald-200">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-black tracking-tighter text-slate-900">SIREP OASIS-NEXUS</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => navigate('/login')} 
              className="text-sm font-bold text-slate-600 hover:text-emerald-600 transition-colors uppercase tracking-widest"
            >
              الدخول للنظام
            </button>
            <button 
              onClick={() => navigate('/login')} 
              className="px-6 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-full hover:bg-emerald-600 transition-all shadow-lg shadow-slate-200 active:scale-95"
            >
              ابدأ الآن
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-widest mb-8 animate-fade-in">
            <Zap className="w-3 h-3" /> المعايير الدولية - السيادة الرقمية الجزائرية
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black text-slate-900 leading-[0.9] tracking-tighter mb-8">
            نظام الإدارة <br /> 
            <span className="text-emerald-600">الذكي المتكامل</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg text-slate-600 mb-12 font-medium leading-relaxed">
            الحل التقني الجزائري الأكثر تطوراً لإدارة العمليات، التقارير، والبيانات بأعلى مستويات الأمان والكفاءة.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => navigate('/login')}
              className="group w-full sm:w-auto px-8 py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              استكشف المنصة
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              className="w-full sm:w-auto px-8 py-4 bg-white text-slate-900 font-bold rounded-2xl border-2 border-slate-100 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
            >
              مشاهدة العرض التجريبي
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
