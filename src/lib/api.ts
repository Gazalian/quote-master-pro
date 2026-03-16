import { supabase } from './supabase';
import { Quote } from '@/types/quote';

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

    // Map database snake_case fields back to camelCase Quote type
    return data.map((q: any) => ({
      id: q.id,
      ref: q.ref,
      date: new Date(q.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      client: q.client_name,
      description: q.description,
      status: q.status,
      templateStyle: q.template_style,
      grandTotal: q.grand_total,
      groups: q.data.groups || [], // Assuming 'data' JSONB stores { groups: [...] }
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
      id: data.id,
      ref: data.ref,
      date: new Date(data.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      client: data.client_name,
      description: data.description,
      status: data.status,
      templateStyle: data.template_style,
      grandTotal: data.grand_total,
      groups: data.data.groups || [],
    };
  },

  /**
   * Create a new quote
   */
  async createQuote(quote: Partial<Quote>, userId: string): Promise<Quote> {
    const { data, error } = await supabase
      .from('quotations')
      .insert({
        user_id: userId,
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
      id: data.id,
      ref: data.ref,
      date: new Date(data.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      client: data.client_name,
      description: data.description,
      status: data.status,
      templateStyle: data.template_style,
      grandTotal: data.grand_total,
      groups: data.data.groups || [],
    };
  },

  /**
   * Update an existing quote (or convert to invoice by changing status)
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

    if (error) {
      console.error('Error deleting quote:', error);
      throw error;
    }
  }
};
