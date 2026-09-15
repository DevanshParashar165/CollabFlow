import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="py-24 text-center space-y-6">
      <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-slate-900 border border-slate-800 text-indigo-400 text-3xl font-bold font-mono">
        404
      </div>
      <div className="space-y-2 max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-white">Page Not Found</h2>
        <p className="text-sm text-slate-400">
          The requested page does not exist or has been moved.
        </p>
      </div>
      <div>
        <Link
          to="/"
          className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-lg shadow-indigo-600/20"
        >
          Return to Overview
        </Link>
      </div>
    </div>
  );
}
