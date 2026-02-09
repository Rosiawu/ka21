export interface FeaturedConfig {
  version: string;
  order: string[];
  categories: Record<string, FeaturedCategory>;
}

export interface FeaturedCategory {
  title: string;
  subtitle: string;
  icon: string;
  featured_tools: string[];
  backup_tags: string[];
  backup_categories?: string[];
  view_all_href: string;
  order?: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface FeaturedTools {
  ai_creation: FeaturedCategory;
  productivity: FeaturedCategory;
  learning: FeaturedCategory;
}