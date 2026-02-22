import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  decimal,
  jsonb,
  boolean,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type { AdapterAccount } from "next-auth/adapters";

// ============================================
// NextAuth Tables
// ============================================

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccount["type"]>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

// ============================================
// Search & Results Tables
// ============================================

export const searches = pgTable(
  "searches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    inputType: text("input_type").notNull(), // 'keyword' | 'url' | 'phone' | 'business'
    inputValue: text("input_value").notNull(),
    normalizedValue: text("normalized_value"), // cleaned/standardized input
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("searches_user_id_idx").on(table.userId),
    inputTypeIdx: index("searches_input_type_idx").on(table.inputType),
    normalizedValueIdx: index("searches_normalized_value_idx").on(table.normalizedValue),
    createdAtIdx: index("searches_created_at_idx").on(table.createdAt),
    userCreatedIdx: index("searches_user_created_idx").on(table.userId, table.createdAt),
  })
);

export const keywordData = pgTable(
  "keyword_data",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    searchId: uuid("search_id")
      .notNull()
      .references(() => searches.id, { onDelete: "cascade" }),
    keyword: text("keyword").notNull(),
    searchVolume: integer("search_volume"),
    cpcLow: decimal("cpc_low", { precision: 10, scale: 2 }),
    cpcHigh: decimal("cpc_high", { precision: 10, scale: 2 }),
    cpcAvg: decimal("cpc_avg", { precision: 10, scale: 2 }),
    competition: decimal("competition", { precision: 5, scale: 4 }),
    difficulty: integer("difficulty"),
    searchIntent: text("search_intent"), // informational | commercial | transactional | navigational
    trendData: jsonb("trend_data"), // monthly trend array
    serpFeatures: jsonb("serp_features"), // featured snippets, PAA, etc.
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    searchIdIdx: index("keyword_data_search_id_idx").on(table.searchId),
    keywordIdx: index("keyword_data_keyword_idx").on(table.keyword),
    createdAtIdx: index("keyword_data_created_at_idx").on(table.createdAt),
  })
);

export const relatedKeywords = pgTable("related_keywords", {
  id: uuid("id").defaultRandom().primaryKey(),
  keywordDataId: uuid("keyword_data_id")
    .notNull()
    .references(() => keywordData.id, { onDelete: "cascade" }),
  keyword: text("keyword").notNull(),
  searchVolume: integer("search_volume"),
  cpc: decimal("cpc", { precision: 10, scale: 2 }),
  relevanceScore: decimal("relevance_score", { precision: 5, scale: 4 }),
  keywordType: text("keyword_type"), // related | question | long_tail | autocomplete
});

export const domainData = pgTable(
  "domain_data",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    searchId: uuid("search_id")
      .notNull()
      .references(() => searches.id, { onDelete: "cascade" }),
    domain: text("domain").notNull(),
    domainRank: integer("domain_rank"),
    backlinkCount: integer("backlink_count"),
    referringDomains: integer("referring_domains"),
    organicTraffic: integer("organic_traffic"),
    organicKeywordsCount: integer("organic_keywords_count"),
    competitorDomains: jsonb("competitor_domains"), // array of competing domains
    whoisData: jsonb("whois_data"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    searchIdIdx: index("domain_data_search_id_idx").on(table.searchId),
    domainIdx: index("domain_data_domain_idx").on(table.domain),
    createdAtIdx: index("domain_data_created_at_idx").on(table.createdAt),
  })
);

export const rankedKeywords = pgTable("ranked_keywords", {
  id: uuid("id").defaultRandom().primaryKey(),
  domainDataId: uuid("domain_data_id")
    .notNull()
    .references(() => domainData.id, { onDelete: "cascade" }),
  keyword: text("keyword").notNull(),
  position: integer("position"),
  searchVolume: integer("search_volume"),
  url: text("url"),
  previousPosition: integer("previous_position"),
});

export const pageData = pgTable("page_data", {
  id: uuid("id").defaultRandom().primaryKey(),
  searchId: uuid("search_id")
    .notNull()
    .references(() => searches.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  title: text("title"),
  metaDescription: text("meta_description"),
  h1Tags: jsonb("h1_tags"),
  wordCount: integer("word_count"),
  wordFrequency: jsonb("word_frequency"),
  internalLinks: integer("internal_links"),
  externalLinks: integer("external_links"),
  images: integer("images"),
  schemaTypes: jsonb("schema_types"),
  // Lighthouse scores
  lighthousePerformance: integer("lighthouse_performance"),
  lighthouseAccessibility: integer("lighthouse_accessibility"),
  lighthouseSeo: integer("lighthouse_seo"),
  lighthouseBestPractices: integer("lighthouse_best_practices"),
  coreWebVitals: jsonb("core_web_vitals"), // LCP, FID, CLS
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const businessData = pgTable(
  "business_data",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    searchId: uuid("search_id")
      .notNull()
      .references(() => searches.id, { onDelete: "cascade" }),
    businessName: text("business_name"),
    address: text("address"),
    city: text("city"),
    state: text("state"),
    zip: text("zip"),
    country: text("country"),
    phone: text("phone"),
    website: text("website"),
    category: text("category"),
    // Google Reviews
    googleRating: decimal("google_rating", { precision: 2, scale: 1 }),
    googleReviewCount: integer("google_review_count"),
    recentReviews: jsonb("recent_reviews"),
    reviewSentiment: jsonb("review_sentiment"), // positive/negative/neutral counts
    // Social
    linkedinUrl: text("linkedin_url"),
    socialProfiles: jsonb("social_profiles"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    searchIdIdx: index("business_data_search_id_idx").on(table.searchId),
    businessNameIdx: index("business_data_name_idx").on(table.businessName),
    phoneIdx: index("business_data_phone_idx").on(table.phone),
  })
);

// ============================================
// Historical Tracking Tables
// ============================================

export const serpHistory = pgTable(
  "serp_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    keyword: text("keyword").notNull(),
    domain: text("domain").notNull(),
    position: integer("position"),
    url: text("url"),
    recordedAt: timestamp("recorded_at").defaultNow().notNull(),
  },
  (table) => ({
    keywordDomainIdx: index("serp_history_keyword_domain_idx").on(table.keyword, table.domain),
    recordedAtIdx: index("serp_history_recorded_at_idx").on(table.recordedAt),
  })
);

export const domainRankHistory = pgTable(
  "domain_rank_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    domain: text("domain").notNull(),
    domainRank: integer("domain_rank"),
    organicTraffic: integer("organic_traffic"),
    recordedAt: timestamp("recorded_at").defaultNow().notNull(),
  },
  (table) => ({
    domainIdx: index("domain_rank_history_domain_idx").on(table.domain),
    recordedAtIdx: index("domain_rank_history_recorded_at_idx").on(table.recordedAt),
  })
);

// ============================================
// Rank Tracking Tables
// ============================================

export const trackedKeywords = pgTable(
  "tracked_keywords",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    keyword: text("keyword").notNull(),
    domain: text("domain").notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    lastPosition: integer("last_position"),
    lastCheckedAt: timestamp("last_checked_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    keywordDomainIdx: index("tracked_keywords_keyword_domain_idx").on(
      table.keyword,
      table.domain
    ),
    userIdIdx: index("tracked_keywords_user_id_idx").on(table.userId),
  })
);

// ============================================
// User Features Tables
// ============================================

export const savedSearches = pgTable(
  "saved_searches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    searchId: uuid("search_id")
      .notNull()
      .references(() => searches.id, { onDelete: "cascade" }),
    name: text("name"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("saved_searches_user_id_idx").on(table.userId),
    searchIdIdx: index("saved_searches_search_id_idx").on(table.searchId),
  })
);

export const alerts = pgTable(
  "alerts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    searchId: uuid("search_id")
      .notNull()
      .references(() => searches.id, { onDelete: "cascade" }),
    alertType: text("alert_type").notNull(), // rank_change | traffic_change | new_backlink
    threshold: integer("threshold"),
    isActive: boolean("is_active").default(true),
    lastTriggered: timestamp("last_triggered"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("alerts_user_id_idx").on(table.userId),
    searchIdIdx: index("alerts_search_id_idx").on(table.searchId),
    isActiveIdx: index("alerts_is_active_idx").on(table.isActive),
  })
);

// ============================================
// Relations
// ============================================

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  searches: many(searches),
  savedSearches: many(savedSearches),
  alerts: many(alerts),
}));

export const searchesRelations = relations(searches, ({ one, many }) => ({
  user: one(users, {
    fields: [searches.userId],
    references: [users.id],
  }),
  keywordData: many(keywordData),
  domainData: many(domainData),
  pageData: many(pageData),
  businessData: many(businessData),
}));

export const keywordDataRelations = relations(keywordData, ({ one, many }) => ({
  search: one(searches, {
    fields: [keywordData.searchId],
    references: [searches.id],
  }),
  relatedKeywords: many(relatedKeywords),
}));

export const domainDataRelations = relations(domainData, ({ one, many }) => ({
  search: one(searches, {
    fields: [domainData.searchId],
    references: [searches.id],
  }),
  rankedKeywords: many(rankedKeywords),
}));

export const relatedKeywordsRelations = relations(relatedKeywords, ({ one }) => ({
  keywordData: one(keywordData, {
    fields: [relatedKeywords.keywordDataId],
    references: [keywordData.id],
  }),
}));

export const rankedKeywordsRelations = relations(rankedKeywords, ({ one }) => ({
  domainData: one(domainData, {
    fields: [rankedKeywords.domainDataId],
    references: [domainData.id],
  }),
}));

export const pageDataRelations = relations(pageData, ({ one }) => ({
  search: one(searches, {
    fields: [pageData.searchId],
    references: [searches.id],
  }),
}));

export const businessDataRelations = relations(businessData, ({ one }) => ({
  search: one(searches, {
    fields: [businessData.searchId],
    references: [searches.id],
  }),
}));

export const savedSearchesRelations = relations(savedSearches, ({ one }) => ({
  user: one(users, {
    fields: [savedSearches.userId],
    references: [users.id],
  }),
  search: one(searches, {
    fields: [savedSearches.searchId],
    references: [searches.id],
  }),
}));

export const alertsRelations = relations(alerts, ({ one }) => ({
  user: one(users, {
    fields: [alerts.userId],
    references: [users.id],
  }),
  search: one(searches, {
    fields: [alerts.searchId],
    references: [searches.id],
  }),
}));
