import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Sparkles, Shield, Cpu, Key, Database, Rss, Play, LogOut, Wallet } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { toast } from "sonner";

export default function Navbar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const connectWallet = async () => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      try {
        const accounts = await (window as any).ethereum.request({ method: "eth_requestAccounts" });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          toast.success(`Wallet Web3 connecté : ${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`);
        }
      } catch (e: any) {
        toast.error("Connexion Wallet refusée.");
      }
    } else {
      const mockAddr = "0x71C...3A9f";
      setWalletAddress(mockAddr);
      toast.success("Wallet Web3 simulé connecté avec succès !");
    }
  };

  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
            AI
          </div>
          <Link href="/">
            <span className="font-bold text-base tracking-tight text-slate-900 cursor-pointer">
              Impact Agent <span className="text-blue-600 font-semibold">Pro</span>
            </span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <Link href="/">
            <span className={`cursor-pointer transition-colors flex items-center gap-1.5 ${location === "/" ? "text-blue-600 font-semibold border-b-2 border-blue-600 pb-1" : "text-slate-600 hover:text-slate-900"}`}>
              <Cpu className="w-4 h-4" /> Dashboard
            </span>
          </Link>
          <Link href="/sources">
            <span className={`cursor-pointer transition-colors flex items-center gap-1.5 ${location === "/sources" ? "text-blue-600 font-semibold border-b-2 border-blue-600 pb-1" : "text-slate-600 hover:text-slate-900"}`}>
              <Rss className="w-4 h-4" /> Flux RSS
            </span>
          </Link>
          <Link href="/settings">
            <span className={`cursor-pointer transition-colors flex items-center gap-1.5 ${location === "/settings" ? "text-blue-600 font-semibold border-b-2 border-blue-600 pb-1" : "text-slate-600 hover:text-slate-900"}`}>
              <Key className="w-4 h-4" /> Configuration API
            </span>
          </Link>
          <Link href="/logs">
            <span className={`cursor-pointer transition-colors flex items-center gap-1.5 ${location === "/logs" ? "text-blue-600 font-semibold border-b-2 border-blue-600 pb-1" : "text-slate-600 hover:text-slate-900"}`}>
              <Database className="w-4 h-4" /> Journaux Système
            </span>
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          {walletAddress ? (
            <div className="hidden sm:flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs text-emerald-700 font-medium rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}
            </div>
          ) : (
            <button
              onClick={connectWallet}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium px-3.5 py-2 text-xs rounded-lg transition-all shadow-sm"
            >
              <Wallet className="w-3.5 h-3.5 text-blue-400" /> Connect Wallet
            </button>
          )}

          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-slate-700 hidden lg:inline">{user.name || user.email}</span>
              <button
                onClick={() => logout()}
                className="text-slate-400 hover:text-red-500 transition-colors p-1"
                title="Déconnexion"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => startLogin()}
              className="border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
            >
              Connexion
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
