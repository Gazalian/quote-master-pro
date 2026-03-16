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
  ref: string;
  date: string;
  client: string;
  description: string;
  groups: QuoteGroup[];
  grandTotal: number;
  status: QuoteStatus;
  templateStyle: TemplateStyle;
}

export interface BrandSettings {
  companyName: string;
  tagline: string;
  address: string;
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

export interface Invoice extends Quote {
  invoiceRef: string;
  sourceQuoteId: string;
  bank: BankDetails;
  paymentTerms: string;
  depositPercent: number;
  dueDate: string;
}

export interface ChatSession {
  id: string;
  title: string;
  client: string;
  date: string;
  preview: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "ai";
  content: string;
  type: "text" | "quote" | "image";
  imageUrl?: string;
  isEdited?: boolean;
}
