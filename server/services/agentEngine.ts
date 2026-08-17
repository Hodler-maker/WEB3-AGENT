import { eq, desc, and } from "drizzle-orm";
import { getDb } from "../db";
import { rssSources, publishedPosts, appSettings, agentLogs } from "../../drizzle/schema";
import FeedParser from "feedparser";
import request from "request";
import crypto from "crypto";

const ENCRYPTION_KEY = (process.env.JWT_SECRET || "default_impact_secret_32_bytes_long").padEnd(32, '0').slice(0, 32);
const IV_LENGTH = 16;

function encrypt(text: string): string {
  if (!text) return "";
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text: string): string {
  if (!text || !text.includes(':')) return text;
  try {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts[0], 'hex');
    const encryptedText = Buffer.from(textParts[1], 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (e) {
    return text;
  }
}

export async function logAgent(userId: number | null, level: "info" | "error" | "success", message: string) {
  try {
    const db = await getDb();
    if (db) {
      await db.insert(agentLogs).values({ userId: userId || 1, level, message });
    }
  } catch (e) {
    console.error("[Agent Log Error]", e);
  }
  console.log(`[Agent] [User ${userId}] [${level.toUpperCase()}] ${message}`);
}

export async function getSetting(userId: number, keyName: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const res = await db.select().from(appSettings).where(and(eq(appSettings.userId, userId), eq(appSettings.keyName, keyName))).limit(1);
  if (res.length === 0) return null;
  return decrypt(res[0].keyValue);
}

export async function setSetting(userId: number, keyName: string, keyValue: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const encryptedValue = encrypt(keyValue);
  
  await db.insert(appSettings).values({
    userId,
    keyName,
    keyValue: encryptedValue
  }).onDuplicateKeyUpdate({
    set: {
      keyValue: encryptedValue,
      updatedAt: new Date()
    }
  });
}

export async function fetchRssFeed(feedUrl: string): Promise<Array<{ title: string; link: string; summary: string; pubDate?: Date }>> {
  return new Promise((resolve) => {
    const articles: Array<{ title: string; link: string; summary: string; pubDate?: Date }> = [];
    const req = request(feedUrl, { timeout: 10000 });
    const feedparser = new FeedParser({});

    req.on('error', (err: any) => {
      console.error(`RSS Error for ${feedUrl}:`, err);
      resolve([]);
    });

    req.on('response', (res: any) => {
      if (res.statusCode !== 200) {
        resolve([]);
        return;
      }
      res.pipe(feedparser);
    });

    feedparser.on('error', (err: any) => {
      console.error(`Feedparser error for ${feedUrl}:`, err);
    });

    feedparser.on('readable', function (this: any) {
      let item;
      while ((item = this.read())) {
        if (item.title && item.link) {
          articles.push({
            title: item.title,
            link: item.link,
            summary: item.summary || item.description || item.title,
            pubDate: item.pubDate || item.date || new Date()
          });
        }
      }
    });

    feedparser.on('end', () => {
      resolve(articles);
    });
  });
}

export async function generateMasterClassContent(userId: number, article: { title: string; summary: string; sourceName: string; isEnglish?: boolean }): Promise<{ content: string; conceptOfDay: string; impactTip: string }> {
  const groqKey = await getSetting(userId, "groq_api_key");
  
  const translationInstruction = article.isEnglish 
    ? "NOTE : L'article source est en anglais. Traduis-le et développe-le en une tribune longue, experte et approfondie en français."
    : "Rédige une tribune longue, approfondie et experte en français.";

  if (!groqKey) {
    return {
      content: `🚀 Analyse approfondie : ${article.title}\n\nDans un contexte où l'écosystème évolue à un rythme fulgurant, les récents développements rapportés par ${article.sourceName} soulignent une transformation structurelle majeure.\n\nL'adoption de ces technologies ne se limite pas à une simple transition spéculative ; elle redéfinit les fondements de la souveraineté numérique et de l'interopérabilité mondiale. Les acteurs institutionnels et les développeurs doivent désormais intégrer ces paramètres pour anticiper les standards de demain.`,
      conceptOfDay: "Souveraineté Numérique : Maîtrise des infrastructures décentralisées et indépendance technologique.",
      impactTip: "Auditez vos architectures actuelles pour identifier les points de friction face aux nouveaux standards."
    };
  }

  const prompt = `
Tu es un expert mondial en technologies blockchain, Web3 et cryptographie (style Tine Antonio Etche).
Analyse l'actualité suivante et rédige une **tribune longue, très détaillée et approfondie** (entre 800 et 1000 mots) en français.
${translationInstruction}

Titre de l'actualité : ${article.title}
Source : ${article.sourceName}
Résumé : ${article.summary}

Structure obligatoire :
1. Accroche visionnaire et percutante (150 mots).
2. Analyse stratégique et technique en plusieurs paragraphes développés (400 mots).
3. Enjeux économiques et impact sur l'adoption globale (250 mots).
4. 🧠 CONCEPT DU JOUR : Choisis un terme technique complexe lié à l'article et explique-le de façon magistrale et pédagogique.
5. 💡 IMPACT TIP : Propose un conseil stratégique ou une feuille de route actionnable pour l'audience.
6. Hashtags professionnels pertinents.

Renvoie ta réponse au format JSON strict avec les clés exactes suivantes :
{
  "content": "Texte principal long et détaillé...",
  "conceptOfDay": "Explication approfondie du concept...",
  "impactTip": "Conseil actionnable..."
}
`;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 3500
      })
    });

    const data = await res.json() as any;
    if (data.choices && data.choices[0]) {
      let rawText = data.choices[0].message.content.trim();
      if (rawText.startsWith("```json")) {
        rawText = rawText.replace(/^```json/, "").replace(/```$/, "").trim();
      } else if (rawText.startsWith("```")) {
        rawText = rawText.replace(/^```/, "").replace(/```$/, "").trim();
      }
      const parsed = JSON.parse(rawText);
      return {
        content: parsed.content || article.title,
        conceptOfDay: parsed.conceptOfDay || "Concept Web3",
        impactTip: parsed.impactTip || "Conseil stratégique"
      };
    }
  } catch (e) {
    console.error("Groq generation error:", e);
  }

  return {
    content: `🚀 Tribune technique : ${article.title}\n\nLes innovations relayées par ${article.sourceName} ouvrent la voie à une nouvelle ère pour les protocoles décentralisés.`,
    conceptOfDay: "Interopérabilité : Capacité des réseaux à communiquer sans friction.",
    impactTip: "Maintenez une veille technologique rigoureuse."
  };
}

export async function generateCoverImage(title: string): Promise<string> {
  try {
    const prompt = `Professional editorial tech cover image for LinkedIn 1200x627, clean modern minimalist business tech aesthetic, high contrast typography space for title: "${title}"`;
    const res = await fetch("https://api.manus.im/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.BUILT_IN_FORGE_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt: prompt,
        n: 1,
        size: "1200x627"
      })
    });
    const data = await res.json() as any;
    if (data.data && data.data[0] && data.data[0].url) {
      return data.data[0].url;
    }
  } catch (e) {
    console.error("Image generation API error, using fallback:", e);
  }
  
  return "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=627&fit=crop";
}

export async function publishToLinkedIn(userId: number, postData: { title: string; content: string; conceptOfDay: string; impactTip: string; originalUrl: string; sourceName: string; imageUrl: string }): Promise<{ success: boolean; urn?: string; error?: string }> {
  const token = await getSetting(userId, "linkedin_token");
  if (!token) {
    return { success: false, error: "Jeton LinkedIn manquant dans la configuration utilisateur." };
  }

  const fullText = `${postData.content}\n\n🧠 CONCEPT DU JOUR :\n${postData.conceptOfDay}\n\n💡 IMPACT TIP :\n${postData.impactTip}\n\n#Web3 #Blockchain #Innovation #Tech #Leadership`;

  try {
    const userRes = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const userData = await userRes.json() as any;
    const userUrn = userData.sub;
    if (!userUrn) {
      return { success: false, error: "Impossible de récupérer l'identifiant utilisateur LinkedIn." };
    }

    let assetUrn: string | null = null;
    try {
      const regRes = await fetch("https://api.linkedin.com/v2/assets?action=registerUpload", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "X-Restli-Protocol-Version": "2.0.0",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          registerUploadRequest: {
            recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
            owner: `urn:li:person:${userUrn}`,
            serviceRelationships: [{
              relationshipType: "OWNER",
              identifier: "urn:li:userGeneratedContent"
            }]
          }
        })
      });
      const regData = await regRes.json() as any;
      const uploadUrl = regData.value?.uploadMechanism?.["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"]?.uploadUrl;
      assetUrn = regData.value?.asset;

      if (uploadUrl && postData.imageUrl) {
        const imgBlob = await fetch(postData.imageUrl).then(r => r.arrayBuffer());
        await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Authorization": `Bearer ${token}` },
          body: imgBlob
        });
      }
    } catch (imgErr) {
      console.error("LinkedIn image upload warning:", imgErr);
    }

    const mediaList = assetUrn ? [{
      status: "READY",
      description: { text: postData.title },
      media: assetUrn,
      title: { text: postData.title }
    }] : [];

    const payload = {
      author: `urn:li:person:${userUrn}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: fullText },
          shareMediaCategory: assetUrn ? "IMAGE" : "NONE",
          media: mediaList
        }
      },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" }
    };

    const postRes = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "X-Restli-Protocol-Version": "2.0.0",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (postRes.status !== 201) {
      const errText = await postRes.text();
      return { success: false, error: `Erreur LinkedIn API (${postRes.status}): ${errText}` };
    }

    const postResult = await postRes.json() as any;
    const postUrn = postResult.id;

    const commentText = `🔗 Source & Vérification :\n${postData.sourceName} - ${postData.originalUrl}`;
    const encodedUrn = encodeURIComponent(postUrn);
    
    const commentRes = await fetch(`https://api.linkedin.com/v2/socialActions/${encodedUrn}/comments`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "X-Restli-Protocol-Version": "2.0.0",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        actor: `urn:li:person:${userUrn}`,
        object: postUrn,
        message: { text: commentText }
      })
    });

    if (!commentRes.ok && commentRes.status !== 201) {
      return { success: false, error: "Le post a été publié mais l'ajout du commentaire source a échoué." };
    }

    return { success: true, urn: postUrn };
  } catch (e: any) {
    return { success: false, error: e.message || "Erreur inconnue lors de la publication LinkedIn." };
  }
}

export async function runAgentCycleForUser(userId: number): Promise<{ success: boolean; message: string }> {
  const db = await getDb();
  if (!db) return { success: false, message: "Base de données indisponible." };

  try {
    await logAgent(userId, "info", "Démarrage du cycle utilisateur multi-tenant...");
    
    const sources = await db.select().from(rssSources).where(and(eq(rssSources.userId, userId), eq(rssSources.active, true)));
    if (sources.length === 0) {
      await logAgent(userId, "error", "Aucune source RSS active trouvée pour cet utilisateur.");
      return { success: false, message: "Aucune source RSS active. Veuillez en ajouter dans l'onglet Flux RSS." };
    }

    const existingPosts = await db.select().from(publishedPosts).where(eq(publishedPosts.userId, userId)).orderBy(desc(publishedPosts.publishedAt)).limit(100);

    let selectedArticle: { title: string; link: string; summary: string; sourceName: string; isEnglish: boolean } | null = null;

    for (const source of sources) {
      const articles = await fetchRssFeed(source.url);
      for (const art of articles) {
        const exactUrlMatch = existingPosts.some(p => p.originalUrl === art.link);
        if (exactUrlMatch) continue;

        const normalizedTitle = art.title.toLowerCase().trim();
        const exactTitleMatch = existingPosts.some(p => p.title.toLowerCase().trim() === normalizedTitle);
        if (exactTitleMatch) continue;

        const artWords = Array.from(new Set(normalizedTitle.split(/\s+/).filter(w => w.length > 3)));
        let isDuplicateSimilarity = false;
        for (const post of existingPosts) {
          const postWords = Array.from(new Set(post.title.toLowerCase().trim().split(/\s+/).filter(w => w.length > 3)));
          let commonCount = 0;
          for (const w of artWords) {
            if (postWords.includes(w)) commonCount++;
          }
          const similarityRatio = commonCount / Math.max(1, artWords.length);
          if (similarityRatio > 0.6) {
            isDuplicateSimilarity = true;
            break;
          }
        }

        if (isDuplicateSimilarity) continue;

        selectedArticle = {
          title: art.title,
          link: art.link,
          summary: art.summary,
          sourceName: source.name,
          isEnglish: source.language === "EN"
        };
        break;
      }
      if (selectedArticle) break;
    }

    if (!selectedArticle) {
      await logAgent(userId, "info", "Aucun nouvel article inédit détecté.");
      return { success: true, message: "Veille terminée : aucun nouvel article inédit." };
    }

    await logAgent(userId, "info", `Article validé : "${selectedArticle.title}" (${selectedArticle.sourceName})`);

    const masterClass = await generateMasterClassContent(userId, selectedArticle);
    const imageUrl = await generateCoverImage(selectedArticle.title);

    const pubResult = await publishToLinkedIn(userId, {
      title: selectedArticle.title,
      content: masterClass.content,
      conceptOfDay: masterClass.conceptOfDay,
      impactTip: masterClass.impactTip,
      originalUrl: selectedArticle.link,
      sourceName: selectedArticle.sourceName,
      imageUrl: imageUrl
    });

    if (pubResult.success) {
      await db.insert(publishedPosts).values({
        userId,
        title: selectedArticle.title,
        originalUrl: selectedArticle.link,
        sourceName: selectedArticle.sourceName,
        content: masterClass.content,
        conceptOfDay: masterClass.conceptOfDay,
        impactTip: masterClass.impactTip,
        imageUrl: imageUrl,
        linkedinUrn: pubResult.urn || null,
        status: "success"
      });
      await logAgent(userId, "success", `Tribune publiée avec succès ! URN: ${pubResult.urn}`);
      return { success: true, message: `Article publié avec succès : ${selectedArticle.title}` };
    } else {
      await db.insert(publishedPosts).values({
        userId,
        title: selectedArticle.title,
        originalUrl: selectedArticle.link,
        sourceName: selectedArticle.sourceName,
        content: masterClass.content,
        conceptOfDay: masterClass.conceptOfDay,
        impactTip: masterClass.impactTip,
        imageUrl: imageUrl,
        status: "failed",
        errorDetails: pubResult.error
      });
      await logAgent(userId, "error", `Échec de publication LinkedIn : ${pubResult.error}`);
      return { success: false, message: pubResult.error || "Échec de publication" };
    }
  } catch (e: any) {
    await logAgent(userId, "error", `Erreur critique dans le cycle agent : ${e.message}`);
    return { success: false, message: e.message };
  }
}
