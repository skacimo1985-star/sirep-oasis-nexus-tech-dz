import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>

        {/* Footer */}
        <footer className="px-6 py-2 border-t border-slate-200 bg-white text-xs text-slate-400 flex items-center justify-between shrink-0">
          <span>SIREP OASIS NEXUS TECH DZ © {new Date().getFullYear()}</span>
          <span className="arabic-inline text-xs">منصة واحة الصحراء الذكية</span>
        </footer>
      </div>
    </div>
  );
}
