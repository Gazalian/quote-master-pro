// Shared domain types — kept tiny on purpose. The frontend has its own copy.

export type PriceSource = 'my_price' | 'regional_price' | 'ai_estimate';

export interface QuoteItem {
  id: string;
  name: string;
  qty: number;
  unit: string;
  unitPrice: number;
  total: number;
  source: PriceSource;
  regionName?: string;
}

export interface QuoteGroup {
  id: string;
  name: string;
  items: QuoteItem[];
}

export type QuoteStatus = 'APPROVED' | 'INVOICED' | 'ARCHIVED';
export type TemplateStyle = 'classic' | 'modern' | 'minimal';

export interface QuoteDraft {
  ref: string;
  client: string;
  description: string;
  groups: QuoteGroup[];
  grandTotal: number;
  templateStyle: TemplateStyle;
  reasoning?: string;
  confidence?: 'high' | 'medium' | 'low';
  clarifyingQuestions?: string[];
}

export interface RegionalPriceEntry {
  material_id: string;
  material_name: string;
  state: string;
  median_price_ngn: number;
  contributor_count: number;
  is_consensus: boolean;
  confidence: 'high' | 'medium' | 'low';
}

export interface PriceLogEntry {
  id: string;
  item_name: string;
  unit: string;
  price: number;
  type?: string;
  category?: string;
  supplier?: string;
}

export interface UserPreferences {
  wastageRules: Record<string, number>;
  documentFlow: string[];
  negativePreferences: string[];
  brandLoyalty: Record<string, string>;
}

export interface BootstrapPayload {
  profile: Record<string, unknown> | null;
  preferences: UserPreferences | null;
  regional_prices: RegionalPriceEntry[];
  price_log: PriceLogEntry[];
}

export interface ConversationTurn {
  role: 'user' | 'ai';
  content: string;
}
