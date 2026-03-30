export type PriceSource = "my_price" | "ai_estimate";

export interface QuoteItem {
  id: string;
  name: string;
  qty: number;
  unit: string;
  unitPrice: number;
  total: number;
  source: PriceSource;
}

export interface QuoteGroup {
  id: string;
  name: string;
  items: QuoteItem[];
}

export type QuoteStatus = "APPROVED" | "INVOICED" | "ARCHIVED";

export type TemplateStyle = "classic" | "modern" | "minimal";

export interface Quote {
  id: string;
  user_id: string;
  ref: string;
  date: string;
  client: string;
  description: string;
  groups: QuoteGroup[];
  grandTotal: number;
  status: QuoteStatus;
  templateStyle: TemplateStyle;
  isDraft?: boolean;
  session_id?: string;
  version: number;
  created_at?: string;
  updated_at?: string;
}

export interface BrandSettings {
  companyName: string;
  tagline: string;
  address: string;
  contactPerson: string;
  phone: string;
  whatsapp: string;
  email: string;
  rcNumber: string;
  logoUrl: string | null;
  docPrimary: string; // HSL values e.g. "170 75% 31%"
  docSecondary: string;
  templateStyle: TemplateStyle;
  bankDetails?: BankDetails;
}

export interface BankDetails {
  bankName: string;
  accountName: string;
  accountNumber: string; // 10-digit NUBAN
  paymentTerms?: string;
}

export interface Invoice {
  id: string;
  quotation_id: string;
  user_id: string;
  invoice_number: string;
  client_name: string;
  total_amount: number;
  status: "PENDING" | "PAID" | "OVERDUE";
  payment_details: BankDetails;
  data: any; // Entire quote data snapshot
  created_at: string;
  updated_at: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  last_message?: string;
  created_at: string;
  updated_at: string;
  // For UI convenience
  client?: string;
  date?: string;
  preview?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "ai";
  content: string;
  type: "text" | "quote" | "image";
  imageUrl?: string;
  isEdited?: boolean;
}

export interface PriceLogEntry {
  id: string;
  name: string;
  category?: string;
  unit: string;
  unitPrice: number;
  supplier?: string;
  lastUpdated?: string;
  type?: string;
}



