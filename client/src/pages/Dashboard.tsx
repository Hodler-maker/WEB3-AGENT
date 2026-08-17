import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import { trpc } from "@/lib/trpc";
import { Play, Activity, CheckCircle2, AlertCircle, Rss, ExternalLink, RefreshCw, Cpu, Database, Sparkles, FileText } from "lucide-react";
import { toast } from "sonner";

export default function Dashboard() {
  const utils = trpc.useUtils();
  const statsQuery = trpc.agent.getStats.useQuery(undefined, { refetchInterval: 10000 });
  const postsQuery = trpc.agent.listPosts.useQuery(undefined, { refetchInterval: 10000 });

  const [isExecuting, setIsExecuting] = useState(false);

  const runNowMutation = trpc.agent.triggerRunNow.useMutation({
    onSuccess: (res) => {
      setIsExecuting(false);
      if (res.success) {
        toast.success(res.message);
        utils.agent.getStats.invalidate();
        utils.agent.listPosts.invalidate();
      } else {
        toast.error(`Erreur d'exécution : ${res.message}`);
      }
    },
    onError: (err) => {
      setIsExecuting(false);
      toast.error(`Échec de l'agent : ${err.message}`);
    }
  });

  const handleTriggerRun = () => {
    setIsExecuting(true);
    toast.info("Initialisation du cycle de veille et rédaction d'article long...");
    runNowMutation.mutate();
  };

  const stats = statsQuery.data;
  const posts = postsQuery.data || [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-8">
        {/* Banner header */}
        <div className="editorial-card p-8 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 text-white shadow-xl">
          <div className="absolute top-0 right-0 p-6 opacity-10 text-white pointer-events-none">
            <Activity className="w-48 h-48" />
          </div>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 px-3 py-1 rounded-full text-xs text-blue-300 font-medium mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Autonomous AI Agent Active
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              LinkedIn Impact Agent Pro
            </h1>
            <p className="text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
              Veille mondiale intelligente, déduplication anti-doublons rigoureuse et génération de tribunes d'expert longues (800-1000 mots) prêtes pour LinkedIn.
            </p>
          </div>

          <button
            onClick={handleTriggerRun}
            disabled={isExecuting}
            className="relative z-10 flex items-center gap-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3.5 text-sm rounded-xl transition-all shadow-lg shadow-blue-600/30 disabled:opacity-50 cursor-pointer"
          >
            {isExecuting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Rédaction en cours...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" /> Lancer un article maintenant
              </>
            )}
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="editorial-card p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tribunes Publiées</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">{stats?.totalPosts || 0}</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
          </div>

          <div className="editorial-card p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sources RSS Actives</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">{stats?.activeSources || 0}</h3>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Rss className="w-6 h-6" />
            </div>
          </div>

          <div className="editorial-card p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dernier Statut</p>
              <h3 className="text-sm font-bold text-slate-900 mt-3 flex items-center gap-2">
                {stats?.lastLog?.level === "success" ? (
                  <span className="text-emerald-600 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Succès</span>
                ) : stats?.lastLog?.level === "error" ? (
                  <span className="text-red-600 flex items-center gap-1.5"><AlertCircle className="w-4 h-4" /> Erreur</span>
                ) : (
                  <span className="text-blue-600">En attente</span>
                )}
              </h3>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Activity className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Recent Posts Table */}
        <div className="editorial-card p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" /> Historique des Publications
            </h2>
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              {posts.length} articles enregistrés
            </span>
          </div>

          {posts.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <p className="font-medium">Aucun article publié pour le moment.</p>
              <p className="text-xs mt-2 text-slate-400">Cliquez sur "Lancer un article maintenant" pour tester le premier cycle.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs font-semibold text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="p-4">Date</th>
                    <th className="p-4">Titre & Source</th>
                    <th className="p-4">Concept du Jour</th>
                    <th className="p-4">Statut</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {posts.map((post) => (
                    <tr key={post.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 text-xs text-slate-500 whitespace-nowrap font-medium">
                        {new Date(post.publishedAt).toLocaleString()}
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-900 max-w-md truncate" title={post.title}>
                          {post.title}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 font-medium">
                          Source : {post.sourceName}
                        </div>
                      </td>
                      <td className="p-4 text-xs text-slate-600 max-w-xs truncate" title={post.conceptOfDay || ""}>
                        {post.conceptOfDay || "N/A"}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {post.status === "success" ? (
                          <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2.5 py-1 rounded-full font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Publié
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 border border-red-200 text-xs px-2.5 py-1 rounded-full font-medium" title={post.errorDetails || ""}>
                            <AlertCircle className="w-3.5 h-3.5" /> Échec
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <a
                          href={post.originalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Source <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
