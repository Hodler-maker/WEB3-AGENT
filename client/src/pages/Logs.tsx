import React from "react";
import Navbar from "@/components/Navbar";
import { trpc } from "@/lib/trpc";
import { Database, CheckCircle2, AlertCircle, Info, RefreshCw } from "lucide-react";

export default function Logs() {
  const logsQuery = trpc.agent.listLogs.useQuery(undefined, { refetchInterval: 5000 });
  const logs = logsQuery.data || [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-8">
        <div className="editorial-card p-8 bg-white shadow-sm flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-6 h-6 text-blue-600" /> Journaux Système & Activité
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Suivi en temps réel des exécutions de l'agent et des publications LinkedIn.
            </p>
          </div>
          <button
            onClick={() => logsQuery.refetch()}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 text-xs font-semibold rounded-lg transition-all shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Actualiser
          </button>
        </div>

        <div className="editorial-card p-6 bg-white shadow-sm">
          {logs.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <p>Aucun journal enregistré pour le moment.</p>
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className={`p-3.5 border rounded-xl flex items-start gap-3 ${
                    log.level === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : log.level === 'error'
                      ? 'bg-red-50 border-red-200 text-red-800'
                      : 'bg-blue-50 border-blue-200 text-blue-800'
                  }`}
                >
                  <span className="text-slate-500 whitespace-nowrap font-medium">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </span>
                  <span className="uppercase font-bold tracking-wide px-2 py-0.5 bg-white/80 rounded text-[10px] shadow-2xs">
                    [{log.level}]
                  </span>
                  <span className="flex-1 break-all font-medium">{log.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
