import React from 'react';
import { ShieldCheck, ArrowRight, Zap, Database, Globe, Lock, Cpu, BarChart3, Users } from 'lucide-react';
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
            <button onClick={() => navigate('/login')} className="text-sm font-bold text-slate-600 hover:text-emerald-600 transition-colors uppercase tracking-widest">الدخول للنظام</button>
            <button onClick={() => navigate('/login')} className="px-6 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-full hover:bg-emerald-600 transition-all shadow-lg shadow-slate-200 active:scale-95">ابدأ الآن</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-widest mb-8 animate-fade-in">
            <Zap className="w-3 h-3" />
            المعايير الدولية - السيادة الرقمية الجزائرية
          </div>
          <h1 className="text-6xl md:text-8xl font-black text-slate-900 leading-[0.9] tracking-tighter mb-8">
            نظام الإدارة <br/> <span className="text-emerald-600">الذكي المتكامل</span>
          </h1>
          <p className="max-w-2xl mx-auto text-slate-500 text-lg md:text-xl font-medium mb-12 leading-relaxed">
            منصة "سيريب واحات الربط التقني" المطورة بمعايير أمنية سبرانية عالية وفقاً للتشريعات الجزائرية 15-04 و 20-403 لحماية البيانات والسيادة الرقمية.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => navigate('/login')} className="w-full sm:w-auto px-10 py-5 bg-emerald-600 text-white text-lg font-black rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 flex items-center justify-center gap-3 active:scale-95 group">
              ابدأ تجربتك المجانية
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <a href="https://startup-research-lab.replit.app/" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto px-10 py-5 bg-white text-slate-900 text-lg font-black rounded-2xl border-2 border-slate-100 hover:border-emerald-200 transition-all flex items-center justify-center gap-3">
              استكشف المزايا التقنية
            </a>
          </div>
        </div>
      </section>

      {/* Security Banner */}
      <section className="py-20 bg-slate-900 overflow-hidden relative">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:20px_20px]"></div>
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="text-right" dir="rtl">
              <h2 className="text-3xl font-black text-white mb-6">أمن معلوماتي بمعايير سيادية</h2>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-emerald-400 font-bold">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                  القانون 15-04 (حماية البيانات الشخصية)
                </li>
                <li className="flex items-center gap-3 text-emerald-400 font-bold">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                  المرسوم 20-403 (أمن أنظمة المعلومات)
                </li>
                <li className="flex items-center gap-3 text-emerald-400 font-bold">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                  براءة اختراع INAPI رقم 5893/2025
                </li>
              </ul>
            </div>
            <div className="flex justify-center">
              <div className="w-64 h-64 bg-emerald-500/10 rounded-full flex items-center justify-center border-4 border-emerald-500/20 backdrop-blur-sm">
                <ShieldCheck className="w-32 h-32 text-emerald-400" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-slate-500 text-sm font-medium italic">
            &copy; 2026 SIREP OASIS NEXUS TECH DZ. جميع الحقوق محفوظة للمؤسس: بلقاسم محروق الراس.
          </div>
          <div className="flex gap-8 text-xs font-black text-slate-900 uppercase tracking-widest">
            <button onClick={() => navigate('/login')} className="hover:text-emerald-600 transition-colors">الدخول</button>
            <a href="https://startup-research-lab.replit.app/" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600 transition-colors">عن الشركة</a>
            <a href="https://github.com/skacimo1985-star" className="hover:text-emerald-600 transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
