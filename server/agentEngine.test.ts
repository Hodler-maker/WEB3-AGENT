import { describe, it, expect } from "vitest";
import { fetchRssFeed } from "./services/agentEngine";

describe("Agent Engine RSS Fetcher", () => {
  it("should be able to fetch a valid RSS feed", async () => {
    // Test avec un flux RSS public stable
    const articles = await fetchRssFeed("https://journalducoin.com/feed/");
    expect(Array.isArray(articles)).toBe(true);
    if (articles.length > 0) {
      expect(articles[0]).toHaveProperty("title");
      expect(articles[0]).toHaveProperty("link");
    }
  });
});
