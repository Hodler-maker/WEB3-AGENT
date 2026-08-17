import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import { trpc } from "@/lib/trpc";
import { Rss, Plus, Trash2, Globe } from "lucide-react";
import { toast } from "sonner";

export default function Sources() {
  const utils = trpc.useUtils();
  const sourcesQuery = trpc.agent.listSources.useQuery();

  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [language, setLanguage] = useState("FR");

  const addSourceMutation = trpc.agent.addSource.useMutation({
    onSuccess: () => {
      toast.success("Source RSS ajoutée avec succès !");
      setName("");
      setUrl("");
      utils.agent.listSources.invalidate();
    },
    onError: (err) => {
      toast.error(`Erreur : ${err.message}`);
    }
  });

  const deleteSourceMutation = trpc.agent.deleteSource.useMutation({
    onSuccess: () => {
      toast.success("Source supprimée.");
      utils.agent.listSources.invalidate();
    },
    onError: (err) => {
      toast.error(`Erreur : ${err.message}`);
    }
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !url) {
      toast.error("Veuillez remplir tous les champs.");
      return;
    }
    addSourceMutation.mutate({ name, url, language });
  };

  const sources = sourcesQuery.data || [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-8">
        <div className="editorial-card p-8 bg-white shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Rss className="w-6 h-6 text-blue-600" /> Gestion des Flux RSS
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configurez et enrichissez les sources d'élite francophones et anglophones surveillées par l'agent.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="editorial-card p-6 space-y-5 bg-white lg:col-span-1 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Plus className="w-4 h-4 text-blue-600" /> Ajouter une source
            </h2>

            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nom du Média</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ex: Cointelegraph"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">URL du Flux RSS</label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Langue</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                >
                  <option value="FR">FR (Français)</option>
                  <option value="EN">EN (Anglais - Traduction auto)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={addSourceMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 text-xs tracking-wide rounded-lg transition-all shadow-sm"
              >
                {addSourceMutation.isPending ? "Ajout en cours..." : "Enregistrer la source"}
              </button>
            </form>
          </div>

          <div className="editorial-card p-6 space-y-5 bg-white lg:col-span-2 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Globe className="w-4 h-4 text-blue-600" /> Flux RSS Actifs ({sources.length})
            </h2>

            <div className="space-y-3">
              {sources.map((source) => (
                <div key={source.id} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{source.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${source.language === 'FR' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-purple-50 text-purple-700 border border-purple-200'}`}>
                        {source.language}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 truncate max-w-md">{source.url}</p>
                  </div>

                  <button
                    onClick={() => deleteSourceMutation.mutate({ id: source.id })}
                    className="text-slate-400 hover:text-red-600 p-2 transition-colors border border-slate-200 hover:border-red-200 rounded-lg bg-white shadow-xs"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
