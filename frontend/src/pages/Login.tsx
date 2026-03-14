import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import LoginForm from '@/components/Auth/LoginForm';

export default function Login() {
  const { isAuthenticated } = useAuthStore();
  const navigate             = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 oasis-gradient flex-col items-center justify-center p-12 text-white relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 text-center max-w-md">
          <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-8 backdrop-blur-sm">
            <Leaf className="w-14 h-14 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2">SIREP OASIS</h1>
          <p className="text-xl font-light tracking-widest mb-1">NEXUS TECH DZ</p>
          <div className="h-px bg-white/30 my-6 mx-auto w-24" />
          <p className="text-lg font-medium arabic text-center leading-loose">
            منصة واحة الصحراء الذكية
          </p>
          <p className="mt-2 text-oasis-200 text-sm">
            Plateforme Smart Saharienne
          </p>
          <div className="mt-12 grid grid-cols-3 gap-4 text-center">
            {[
              { value: '24/7', label: 'Surveillance', labelAr: 'مراقبة' },
              { value: 'IoT', label: 'Connecté', labelAr: 'متصل' },
              { value: 'AI', label: 'Intelligent', labelAr: 'ذكي' },
            ].map((item) => (
              <div key={item.value} className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                <p className="text-2xl font-bold">{item.value}</p>
                <p className="text-xs text-oasis-200">{item.label}</p>
                <p className="text-[10px] text-oasis-300 arabic-inline">{item.labelAr}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="p-2 oasis-gradient rounded-xl">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-slate-900">SIREP OASIS NEXUS TECH DZ</p>
              <p className="text-xs text-slate-500 arabic-inline">منصة واحة الصحراء الذكية</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-1">
            Connexion
          </h2>
          <p className="text-slate-500 text-sm mb-8">
            Accédez à votre tableau de bord ·{' '}
            <span className="arabic-inline">الوصول إلى لوحة التحكم</span>
          </p>

          <LoginForm />

          <p className="mt-8 text-center text-xs text-slate-400">
            SIREP OASIS NEXUS TECH DZ © {new Date().getFullYear()} — Algérie 🇩🇿
          </p>
        </div>
      </div>
    </div>
  );
}
