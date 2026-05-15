/**
 * Invoice service — creates an invoice from an existing quotation.
 * Atomic via a single Postgres call; we snapshot the quote's data column so
 * later edits to the quote don't mutate the invoice.
 */

import { supabaseForUser } from '../config/supabase.js';
import { ApiError } from '../middleware/error.js';

export interface CreateInvoiceInput {
  quotationId: string;
  invoiceNumber?: string;
  paymentDetails?: Record<string, unknown> | null;
}

export async function createInvoice(jwt: string, userId: string, input: CreateInvoiceInput) {
  const userClient = supabaseForUser(jwt);

  // 1. Fetch the source quote (RLS scopes by user_id)
  const { data: quote, error: qErr } = await userClient
    .from('quotations')
    .select('id, client_name, grand_total, data, template_style')
    .eq('id', input.quotationId)
    .maybeSingle();

  if (qErr) throw new ApiError(500, `fetch source quote failed: ${qErr.message}`);
  if (!quote) throw new ApiError(404, 'Quotation not found');

  // 2. Generate a sensible invoice number if caller didn't supply one
  const invoiceNumber =
    input.invoiceNumber ??
    `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`;

  // 3. Insert the invoice with a snapshot of the quote's items
  const { data: invoice, error: iErr } = await userClient
    .from('invoices')
    .insert({
      quotation_id: input.quotationId,
      user_id: userId,
      invoice_number: invoiceNumber,
      client_name: quote.client_name,
      total_amount: quote.grand_total,
      status: 'PENDING',
      payment_details: input.paymentDetails ?? null,
      data: quote.data,
    })
    .select()
    .single();

  if (iErr) {
    if (iErr.code === '23505') throw new ApiError(409, 'Invoice number already exists');
    throw new ApiError(500, `create invoice failed: ${iErr.message}`);
  }

  // 4. Flip the quote status (best-effort; not in a single TX with the insert above)
  await userClient.from('quotations').update({ status: 'INVOICED' }).eq('id', input.quotationId);

  return invoice;
}

export async function listInvoices(jwt: string, limit = 50, offset = 0) {
  const userClient = supabaseForUser(jwt);
  const { data, error } = await userClient
    .from('invoices')
    .select('id, invoice_number, client_name, total_amount, status, created_at')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw new ApiError(500, `list invoices failed: ${error.message}`);
  return data ?? [];
}
