import { ShieldAlert } from "lucide-react";

export default function DataRetentionNotice() {
  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-3 text-center md:text-left mt-12 py-6 border-t border-slate-200">
      <div className="text-slate-400">
        <ShieldAlert size={20} />
      </div>
      <p className="text-xs text-slate-500 max-w-lg">
        <strong className="font-bold text-slate-700 font-headline uppercase tracking-wider text-[10px] mr-1">Privacy First:</strong> 
        Your financial data is only stored in your local browser storage via PocketBase. We do not transmit or sell your personal snapshots to third parties. Clear your cache or log out to reset your session.
      </p>
    </div>
  );
}
