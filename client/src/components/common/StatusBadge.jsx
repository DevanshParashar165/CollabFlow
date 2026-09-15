export default function StatusBadge({ status, label }) {
  const getStyles = () => {
    switch (status) {
      case 'succeeded':
      case 'online':
      case 'connected':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 ring-emerald-500/20';
      case 'loading':
      case 'connecting':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30 ring-amber-500/20';
      case 'failed':
      case 'disconnected':
      case 'offline':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30 ring-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30 ring-slate-500/20';
    }
  };

  const getDotStyles = () => {
    switch (status) {
      case 'succeeded':
      case 'online':
      case 'connected':
        return 'bg-emerald-400';
      case 'loading':
      case 'connecting':
        return 'bg-amber-400 animate-pulse';
      case 'failed':
      case 'disconnected':
      case 'offline':
        return 'bg-rose-400';
      default:
        return 'bg-slate-400';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ring-1 ${getStyles()}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${getDotStyles()}`} />
      {label}
    </span>
  );
}
