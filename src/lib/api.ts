import { supabase } from './supabase';
import { Quote, ChatSession, Invoice, PriceLogEntry } from '@/types/quote';

export const quoteAPI = {
  /**
   * Fetch all quotes for the current authenticated user
   */
  async getQuotes(): Promise<Quote[]> {
    const { data, error } = await supabase
      .from('quotations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching quotes:', error);
      throw error;
    }

    return data.map((q: any) => ({
      ...q,
      date: new Date(q.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      client: q.client_name,
      templateStyle: q.template_style,
      grandTotal: q.grand_total,
      groups: q.data.groups || [],
    }));
  },

  /**
   * Fetch quotes for a specific session
   */
  async getQuotesBySession(sessionId: string): Promise<Quote[]> {
    const { data, error } = await supabase
      .from('quotations')
      .select('*')
      .eq('session_id', sessionId)
      .order('version', { ascending: false });

    if (error) {
      console.error('Error fetching session quotes:', error);
      throw error;
    }

    return data.map((q: any) => ({
      ...q,
      date: new Date(q.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      client: q.client_name,
      templateStyle: q.template_style,
      grandTotal: q.grand_total,
      groups: q.data.groups || [],
    }));
  },

  /**
   * Fetch a single quote by ID
   */
  async getQuote(id: string): Promise<Quote | null> {
    const { data, error } = await supabase
      .from('quotations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching quote:', error);
      return null;
    }

    return {
      ...data,
      date: new Date(data.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      client: data.client_name,
      templateStyle: data.template_style,
      grandTotal: data.grand_total,
      groups: data.data.groups || [],
    };
  },

  /**
   * Create a new quote version or a brand new quote
   */
  async createQuote(quote: Partial<Quote>, userId: string): Promise<Quote> {
    const { data, error } = await supabase
      .from('quotations')
      .insert({
        user_id: userId,
        session_id: quote.session_id,
        version: quote.version || 1,
        ref: quote.ref,
        client_name: quote.client,
        description: quote.description,
        status: quote.status || 'APPROVED',
        template_style: quote.templateStyle || 'classic',
        grand_total: quote.grandTotal,
        data: { groups: quote.groups || [] },
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating quote:', error);
      throw error;
    }

    return {
      ...data,
      date: new Date(data.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      client: data.client_name,
      templateStyle: data.template_style,
      grandTotal: data.grand_total,
      groups: data.data.groups || [],
    };
  },

  /**
   * Update an existing quote
   */
  async updateQuote(id: string, updates: Partial<Quote>): Promise<void> {
    const payload: any = { updated_at: new Date().toISOString() };
    
    if (updates.client !== undefined) payload.client_name = updates.client;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.templateStyle !== undefined) payload.template_style = updates.templateStyle;
    if (updates.grandTotal !== undefined) payload.grand_total = updates.grandTotal;
    if (updates.groups !== undefined) payload.data = { groups: updates.groups };

    const { error } = await supabase
      .from('quotations')
      .update(payload)
      .eq('id', id);

    if (error) {
      console.error('Error updating quote:', error);
      throw error;
    }
  },

  /**
   * Delete a quote
   */
  async deleteQuote(id: string): Promise<void> {
    const { error } = await supabase
      .from('quotations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

export const chatAPI = {
  async getSessions(): Promise<ChatSession[]> {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async createSession(userId: string, title?: string): Promise<ChatSession> {
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({ user_id: userId, title: title || 'New Session' })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateSessionLastMessage(id: string, message: string): Promise<void> {
    await supabase
      .from('chat_sessions')
      .update({ last_message: message, updated_at: new Date().toISOString() })
      .eq('id', id);
  }
};

export const invoiceAPI = {
  async createInvoice(invoice: Partial<Invoice>): Promise<Invoice> {
    const { data, error } = await supabase
      .from('invoices')
      .insert({
        quotation_id: invoice.quotation_id,
        user_id: invoice.user_id,
        invoice_number: invoice.invoice_number,
        client_name: invoice.client_name,
        total_amount: invoice.total_amount,
        status: invoice.status || 'PENDING',
        payment_details: invoice.payment_details,
        data: invoice.data
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getInvoices(): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
};

export const brandAPI = {
  async getBrandSettings(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;

    return {
      companyName: data.company_name || "",
      tagline: "",
      address: data.address || "",
      contactPerson: data.contact_person || "",
      phone: data.phone || "",
      whatsapp: data.whatsapp || "",
      email: data.email || "",
      rcNumber: data.cac_number || "",
      logoUrl: data.logo_url || null,
      docPrimary: data.brand_primary_color || "170 75% 31%",
      docSecondary: data.brand_secondary_color || "213 27% 34%",
      templateStyle: "classic" as const,
      bankDetails: {
        bankName: data.bank_name || "",
        accountName: data.account_name || "",
        accountNumber: data.account_number || "",
        paymentTerms: data.default_payment_terms || ""
      }
    };
  },

  async updateBrandSettings(userId: string, settings: any) {
    const { error } = await supabase
      .from('profiles')
      .update({
        company_name: settings.companyName,
        email: settings.email,
        phone: settings.phone,
        whatsapp: settings.whatsapp,
        address: settings.address,
        contact_person: settings.contactPerson,
        cac_number: settings.rcNumber,
        logo_url: settings.logoUrl,
        brand_primary_color: settings.docPrimary,
        brand_secondary_color: settings.docSecondary,
        bank_name: settings.bankDetails?.bankName,
        account_name: settings.bankDetails?.accountName,
        account_number: settings.bankDetails?.accountNumber,
        default_payment_terms: settings.bankDetails?.paymentTerms,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw error;
  }
};

export const priceLogAPI = {
  async getEntries() {
    const { data, error } = await supabase
      .from('price_log')
      .select('*')
      .order('last_used_at', { ascending: false });

    if (error) throw error;

    return data.map((item: any) => ({
      id: item.id,
      name: item.item_name,
      unit: item.unit,
      unitPrice: item.price,
      type: item.type || 'MATERIALS',
      category: item.category,
      supplier: item.supplier,
      lastUpdated: new Date(item.last_used_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    }));
  },

  async createEntry(entry: any, userId: string) {
    const { data, error } = await supabase
      .from('price_log')
      .upsert({
        user_id: userId,
        item_name: entry.name,
        unit: entry.unit,
        price: entry.unitPrice,
        type: entry.type || 'MATERIALS',
        category: entry.category,
        supplier: entry.supplier,
        last_used_at: new Date().toISOString()
      }, { onConflict: 'user_id,item_name' })
      .select()
      .single();

    if (error) {
       console.error("Error creating price entry:", error);
       throw error;
    }

    return {
      id: data.id,
      name: data.item_name,
      unit: data.unit,
      unitPrice: data.price,
      type: data.type || 'MATERIALS',
      category: data.category,
      supplier: data.supplier,
      lastUpdated: new Date(data.last_used_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    };
  },

  async updateEntry(id: string, entry: any) {
    const { data, error } = await supabase
      .from('price_log')
      .update({
        item_name: entry.name,
        unit: entry.unit,
        price: entry.unitPrice,
        type: entry.type || 'MATERIALS',
        category: entry.category,
        supplier: entry.supplier,
        last_used_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
       if (error.code === '23505') {
          throw new Error(`An item named "${entry.name}" already exists in your log.`);
       }
       throw error;
    }

    return {
      id: data.id,
      name: data.item_name,
      unit: data.unit,
      unitPrice: data.price,
      type: data.type || 'MATERIALS',
      category: data.category,
      supplier: data.supplier,
      lastUpdated: new Date(data.last_used_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    };
  },

  async upsertEntry(entry: any, userId: string) {
    const { data, error } = await supabase
      .from('price_log')
      .upsert({
        user_id: userId,
        item_name: entry.name,
        unit: entry.unit,
        price: entry.unitPrice,
        last_used_at: new Date().toISOString()
      }, { onConflict: 'user_id,item_name' })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteEntry(id: string) {
    const { error } = await supabase.from('price_log').delete().eq('id', id);
    if (error) throw error;
  }
};

