import { Link } from 'react-router-dom';
import { APP_NAME } from '../../utils/constants';

export default function Navbar() {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link to="/" className="flex items-center space-x-2.5">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <span className="text-white font-bold text-lg tracking-wider">CF</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              {APP_NAME}
            </span>
          </Link>
          <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            Foundation v0.1
          </span>
        </div>

        <nav className="flex items-center space-x-6 text-sm">
          <Link
            to="/"
            className="text-slate-300 hover:text-white transition-colors duration-200 font-medium"
          >
            Overview
          </Link>
          <a
            href="#architecture"
            className="text-slate-400 hover:text-slate-200 transition-colors duration-200"
          >
            Architecture
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-slate-200 transition-colors duration-200"
          >
            Docs
          </a>
        </nav>
      </div>
    </header>
  );
}
