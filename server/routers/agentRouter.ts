import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { rssSources, publishedPosts, appSettings, agentLogs } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { runAgentCycleForUser, getSetting, setSetting } from "../services/agentEngine";

export const agentRouter = router({
  // Statistiques utilisateur
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const userId = ctx.user.id;
    if (!db) return { totalPosts: 0, activeSources: 0, lastLog: null };

    const posts = await db.select().from(publishedPosts).where(eq(publishedPosts.userId, userId));
    const sources = await db.select().from(rssSources).where(and(eq(rssSources.userId, userId), eq(rssSources.active, true)));
    const logs = await db.select().from(agentLogs).where(eq(agentLogs.userId, userId)).orderBy(desc(agentLogs.createdAt)).limit(1);

    return {
      totalPosts: posts.length,
      activeSources: sources.length,
      lastLog: logs.length > 0 ? logs[0] : null
    };
  }),

  // Historique utilisateur
  listPosts: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const userId = ctx.user.id;
    if (!db) return [];
    return await db.select().from(publishedPosts).where(eq(publishedPosts.userId, userId)).orderBy(desc(publishedPosts.publishedAt)).limit(50);
  }),

  // Sources RSS utilisateur
  listSources: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const userId = ctx.user.id;
    if (!db) return [];
    
    // Si l'utilisateur n'a pas de sources, initialiser les sources par défaut pour lui
    const existing = await db.select().from(rssSources).where(eq(rssSources.userId, userId));
    if (existing.length === 0) {
      await db.insert(rssSources).values([
        { userId, name: "Journal du Coin", url: "https://journalducoin.com/feed/", language: "FR", active: true },
        { userId, name: "Cryptoast", url: "https://cryptoast.fr/feed/", language: "FR", active: true },
        { userId, name: "CoinDesk", url: "https://www.coindesk.com/arc/outboundfeeds/rss/", language: "EN", active: true },
        { userId, name: "Cointelegraph", url: "https://cointelegraph.com/rss", language: "EN", active: true },
        { userId, name: "Agence Ecofin (Afrique)", url: "https://www.agenceecofin.com/rss/finance", language: "FR", active: true }
      ]);
      return await db.select().from(rssSources).where(eq(rssSources.userId, userId)).orderBy(desc(rssSources.createdAt));
    }

    return existing;
  }),

  // Ajouter source RSS
  addSource: protectedProcedure
    .input(z.object({ name: z.string(), url: z.string(), language: z.string().default("FR") }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const userId = ctx.user.id;
      if (!db) throw new Error("DB not available");
      await db.insert(rssSources).values({
        userId,
        name: input.name,
        url: input.url,
        language: input.language,
        active: true
      });
      return { success: true };
    }),

  // Supprimer source RSS
  deleteSource: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const userId = ctx.user.id;
      if (!db) throw new Error("DB not available");
      await db.delete(rssSources).where(and(eq(rssSources.id, input.id), eq(rssSources.userId, userId)));
      return { success: true };
    }),

  // Paramètres utilisateur
  getSettings: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const linkedinToken = await getSetting(userId, "linkedin_token");
    const groqKey = await getSetting(userId, "groq_api_key");
    const scheduleCron = await getSetting(userId, "schedule_cron") || "0 9 * * *";

    return {
      hasLinkedinToken: !!linkedinToken,
      linkedinTokenMasked: linkedinToken ? linkedinToken.substring(0, 6) + "..." : "",
      hasGroqKey: !!groqKey,
      groqKeyMasked: groqKey ? groqKey.substring(0, 6) + "..." : "",
      scheduleCron
    };
  }),

  // Sauvegarder paramètres utilisateur
  saveSettings: protectedProcedure
    .input(z.object({
      linkedinToken: z.string().optional(),
      groqKey: z.string().optional(),
      scheduleCron: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      if (input.linkedinToken !== undefined && input.linkedinToken !== "") {
        await setSetting(userId, "linkedin_token", input.linkedinToken);
      }
      if (input.groqKey !== undefined && input.groqKey !== "") {
        await setSetting(userId, "groq_api_key", input.groqKey);
      }
      if (input.scheduleCron !== undefined) {
        await setSetting(userId, "schedule_cron", input.scheduleCron);
      }
      return { success: true };
    }),

  // Déclencher manuellement pour l'utilisateur
  triggerRunNow: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.user.id;
    const result = await runAgentCycleForUser(userId);
    return result;
  }),

  // Logs utilisateur
  listLogs: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const userId = ctx.user.id;
    if (!db) return [];
    return await db.select().from(agentLogs).where(eq(agentLogs.userId, userId)).orderBy(desc(agentLogs.createdAt)).limit(100);
  })
});
