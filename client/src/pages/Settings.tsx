import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { trpc } from "@/lib/trpc";
import { Key, Shield, CheckCircle2, Lock } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const utils = trpc.useUtils();
  const settingsQuery = trpc.agent.getSettings.useQuery();

  const [linkedinToken, setLinkedinToken] = useState("");
  const [groqKey, setGroqKey] = useState("");
  const [scheduleCron, setScheduleCron] = useState("0 9 * * *");

  useEffect(() => {
    if (settingsQuery.data) {
      setScheduleCron(settingsQuery.data.scheduleCron || "0 9 * * *");
    }
  }, [settingsQuery.data]);

  const saveMutation = trpc.agent.saveSettings.useMutation({
    onSuccess: () => {
      toast.success("Paramètres et clés API enregistrés avec succès !");
      setLinkedinToken("");
      setGroqKey("");
      utils.agent.getSettings.invalidate();
    },
    onError: (err) => {
      toast.error(`Erreur : ${err.message}`);
    }
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({
      linkedinToken: linkedinToken.trim() || undefined,
      groqKey: groqKey.trim() || undefined,
      scheduleCron
    });
  };

  const settings = settingsQuery.data;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto p-6 space-y-8">
        <div className="editorial-card p-8 bg-white shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Key className="w-6 h-6 text-blue-600" /> Configuration des Clés API
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gérez vos identifiants sécurisés pour l'accès LinkedIn et l'intelligence artificielle Groq.
          </p>
        </div>

        <div className="editorial-card p-8 space-y-6 bg-white shadow-sm">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-center gap-3 text-xs text-blue-800">
            <Lock className="w-5 h-5 flex-shrink-0 text-blue-600" />
            <span>Sécurité serveur : Vos jetons sont chiffrés et stockés en base de données de manière totalement étanche.</span>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jeton d'accès LinkedIn (OAuth 2.0 / w_member_social)
              </label>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-slate-500">Statut actuel :</span>
                {settings?.hasLinkedinToken ? (
                  <span className="text-xs text-emerald-600 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Configuré ({settings.linkedinTokenMasked})
                  </span>
                ) : (
                  <span className="text-xs text-amber-600 font-medium">Non configuré</span>
                )}
              </div>
              <input
                type="password"
                value={linkedinToken}
                onChange={(e) => setLinkedinToken(e.target.value)}
                placeholder="Entrer un nouveau jeton LinkedIn..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Clé API Groq (Llama 3.3 Versatile)
              </label>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-slate-500">Statut actuel :</span>
                {settings?.hasGroqKey ? (
                  <span className="text-xs text-emerald-600 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Configuré ({settings.groqKeyMasked})
                  </span>
                ) : (
                  <span className="text-xs text-amber-600 font-medium">Non configuré</span>
                )}
              </div>
              <input
                type="password"
                value={groqKey}
                onChange={(e) => setGroqKey(e.target.value)}
                placeholder="gsk_..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fréquence d'exécution (Cron Expression)
              </label>
              <input
                type="text"
                value={scheduleCron}
                onChange={(e) => setScheduleCron(e.target.value)}
                placeholder="0 9 * * *"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Format standard (par défaut : 0 9 * * * pour chaque jour à 9h00).</p>
            </div>

            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 text-xs tracking-wide rounded-xl transition-all shadow-sm"
            >
              {saveMutation.isPending ? "Enregistrement..." : "Sauvegarder les paramètres"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
