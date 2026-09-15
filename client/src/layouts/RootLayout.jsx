import { Outlet } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import { APP_NAME } from '../utils/constants';

export default function RootLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-slate-900 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} {APP_NAME}. Real-Time Collaborative Platform.</p>
          <p className="text-slate-600">Enterprise Ready • Modular Architecture • Full-Stack</p>
        </div>
      </footer>
    </div>
  );
}
