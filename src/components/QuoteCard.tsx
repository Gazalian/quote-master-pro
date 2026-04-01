import { useState, useEffect } from "react";
import { QuoteEditor } from "./QuoteEditor";
import { Quote, BrandSettings } from "@/types/quote";
import { ClassicTemplate } from "./templates/ClassicTemplate";
import { ModernTemplate } from "./templates/ModernTemplate";
import { MinimalTemplate } from "./templates/MinimalTemplate";
import { Loader2, Download } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import { quoteAPI } from "@/lib/api";
import { toast } from "sonner";
import { exportToPDF } from "@/lib/pdfExport";
import { accumulateEditDelta } from "@/lib/behaviorEngine";

export const QuoteCard = ({ quote, onQuoteSaved, mode = "dashboard" }: { quote: Quote, onQuoteSaved?: (quote: Quote) => void, mode?: "chat" | "dashboard" }) => {
  const { user } = useAuth();
  const [currentQuote, setCurrentQuote] = useState(quote);
  const [editing, setEditing] = useState(false);
  const [brand, setBrand] = useState<BrandSettings | null>(null);
  const [isLoadingBrand, setIsLoadingBrand] = useState(true);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  useEffect(() => {
    setCurrentQuote(quote);
  }, [quote]);

  useEffect(() => {
    const fetchBrand = async () => {
      if (!user || mode === "chat") return;
      try {
        setIsLoadingBrand(true);
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) throw error;
        
        if (data) {
           setBrand({
             companyName: data.company_name || "Company Name",
             tagline: "", // unused for now
             address: data.address || "",
             contactPerson: data.contact_person || "",
             phone: data.phone || "",
             whatsapp: data.whatsapp || "",
             email: data.email || "",
             rcNumber: data.cac_number || "",
             logoUrl: data.logo_url || null,
             docPrimary: data.brand_primary_color || "170 75% 31%",
             docSecondary: data.brand_secondary_color || "213 27% 34%",
             templateStyle: quote.templateStyle,
             bankDetails: {
                bankName: data.bank_name || "GTBank",
                accountName: data.account_name || "Example Name",
                accountNumber: data.account_number || "0123456789",
                paymentTerms: data.default_payment_terms || "Payment due upon completion."
             }
           });
        }
      } catch (e) {
        console.error("Failed to load brand for quote card", e);
      } finally {
        setIsLoadingBrand(false);
      }
    };
    
    fetchBrand();
  }, [user, quote.templateStyle, mode]);

  if (editing) {
    return (
      <QuoteEditor
        quote={currentQuote}
        onClose={() => setEditing(false)}
        onSave={async (updated) => {
          // If the quote is not a draft and has an ID, update it in the database
          if (!updated.isDraft && updated.id) {
            try {
              // we don't want to override generated dates when updating content
              const payload = { ...updated };
              delete (payload as any).date;
              await quoteAPI.updateQuote(updated.id, payload);
            } catch (e) {
              console.error("Failed to update quote in database", e);
            }
          }
          // Fire-and-forget: capture the diff between original draft and user's edits
          if (user) {
            accumulateEditDelta(user.id, currentQuote, updated);
          }
          setCurrentQuote(updated);
          onQuoteSaved?.(updated);
          setEditing(false);
        }}
      />
    );
  }

  const handleSaveDraft = async () => {
    if (!user) return;
    try {
      const payload: Partial<Quote> = { ...currentQuote };
      delete payload.id;
      delete payload.isDraft;
      delete payload.date; // Let API set the date based on creation

      const savedQuote = await quoteAPI.createQuote(payload, user.id);

      // Deduct 3 points locally for visual feedback immediately
      await supabase.rpc('deduct_points', { user_id: user.id, points_to_deduct: 3 });

      setCurrentQuote(savedQuote);
      onQuoteSaved?.(savedQuote);
      toast.success("Quote successfully saved to Quotations!");
    } catch (e: any) {
      toast.error("Failed to save draft: " + (e.message || "Unknown error"));
    }
  };

  const handleExportPDF = async () => {
    try {
      setIsExportingPDF(true);
      toast.loading("Generating PDF...");

      // Wait a bit for toast to show
      await new Promise(resolve => setTimeout(resolve, 300));

      // The template element has a unique ID based on quote ID
      const elementId = `quote-template-${currentQuote.id}`;
      await exportToPDF(elementId, currentQuote);

      toast.dismiss();
      toast.success("PDF downloaded successfully!");
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.message || "Failed to export PDF");
    } finally {
      setIsExportingPDF(false);
    }
  };

  if (mode === "chat") {
    return (
      <div className="flex flex-col gap-2 w-full">
        {/* Quote summary card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Card header — ref + description */}
          <div className="flex items-start justify-between gap-2 px-4 pt-4 pb-3 border-b border-gray-100">
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-0.5">{currentQuote.ref}</p>
              <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">
                {currentQuote.description || "Untitled Quote"}
              </p>
              {currentQuote.client && currentQuote.client !== 'Client Name' && (
                <p className="text-xs text-gray-400 mt-0.5">{currentQuote.client}</p>
              )}
            </div>
          </div>

          {/* Line items — no artificial height cap; scrolls with the chat */}
          <div className="px-4 py-3 space-y-4">
            {currentQuote.groups.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-2">No items yet.</p>
            ) : currentQuote.groups.map(group => (
              <div key={group.id}>
                <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2">
                  {group.name}
                </p>
                <div className="space-y-2">
                  {group.items.map(item => (
                    <div key={item.id} className="flex justify-between items-baseline gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-gray-800 leading-tight truncate">{item.name}</p>
                        <p className="text-[11px] text-gray-400 mt-px">
                          {item.qty} {item.unit} × ₦{item.unitPrice.toLocaleString("en-NG")}
                        </p>
                      </div>
                      <span className="text-[13px] font-semibold text-gray-900 whitespace-nowrap shrink-0">
                        ₦{item.total.toLocaleString("en-NG")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Grand total bar */}
          <div className="mx-3 mb-3 flex justify-between items-center bg-primary/5 rounded-xl px-4 py-3 border border-primary/10">
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Grand Total</span>
            <span className="text-base font-black text-primary">₦{currentQuote.grandTotal.toLocaleString("en-NG")}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setEditing(true)}
            className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl text-sm font-semibold active:bg-gray-200 transition-colors"
          >
            Edit
          </button>
          {currentQuote.isDraft ? (
            <button
              onClick={handleSaveDraft}
              className="flex-[2] bg-primary text-white py-3 rounded-xl text-sm font-semibold active:opacity-90 transition-opacity"
            >
              Save to Dashboard
            </button>
          ) : (
            <div className="flex-[2] flex items-center justify-center gap-1.5 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-bold">
              ✓ Saved
            </div>
          )}
        </div>
      </div>
    );
  }

  const renderTemplate = () => {
    if (isLoadingBrand || !brand) {
      return (
        <div className="bg-card rounded-xl p-8 border border-border flex flex-col items-center justify-center space-y-3 min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-medium">Loading document template...</p>
        </div>
      );
    }

    const templateElement = (() => {
      switch (currentQuote.templateStyle) {
        case "modern":
          return <ModernTemplate quote={currentQuote} brand={brand} />;
        case "minimal":
          return <MinimalTemplate quote={currentQuote} brand={brand} />;
        case "classic":
        default:
          return <ClassicTemplate quote={currentQuote} brand={brand} />;
      }
    })();

    // Outer scroll wrapper so the template never breaks the mobile layout.
    // The inner div carries the PDF-export id.
    return (
      <div className="w-full overflow-x-auto rounded-xl border border-border shadow-sm bg-white">
        <div
          id={`quote-template-${currentQuote.id}`}
          style={{ minWidth: "320px" }}
        >
          {templateElement}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-3">
      {renderTemplate()}

      {/* Actions */}
      <div className="flex gap-2 p-3 bg-card border border-border rounded-xl shadow-sm">
        {currentQuote.isDraft ? (
           <button
             onClick={handleSaveDraft}
             className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 flex items-center justify-center gap-2"
           >
              Save to Quotations (Requires 3 Points)
           </button>
        ) : currentQuote.status === "APPROVED" ? (
          <>
            <button
              onClick={() => setEditing(true)}
              className="flex-1 bg-secondary text-secondary-foreground py-2.5 rounded-lg text-sm font-semibold hover:bg-secondary/80 transition-colors"
            >
              Edit Quote
            </button>
            <button
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isExportingPDF ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              Export PDF
            </button>
            <button
              onClick={async () => {
                await quoteAPI.updateQuote(currentQuote.id, { status: "INVOICED" });
                setCurrentQuote({ ...currentQuote, status: "INVOICED" });
                toast.success("Quote converted to Invoice!");
              }}
              className="flex-1 bg-doc-primary text-doc-primary-foreground py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              Generate Invoice
            </button>
          </>
        ) : currentQuote.status === "INVOICED" ? (
          <>
            <button
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isExportingPDF ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              Download PDF
            </button>
            <button
              onClick={async () => {
                await quoteAPI.updateQuote(currentQuote.id, { status: "ARCHIVED" });
                setCurrentQuote({ ...currentQuote, status: "ARCHIVED" });
                toast.success("Invoice marked as paid!");
              }}
              className="flex-1 bg-badge-approved text-badge-approved-fg py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Mark Paid
            </button>
          </>
        ) : (
          <button
            onClick={handleExportPDF}
            disabled={isExportingPDF}
            className="w-full bg-secondary text-secondary-foreground py-2.5 rounded-lg text-sm font-semibold hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isExportingPDF ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            View Archived PDF
          </button>
        )}
      </div>
    </div>
  );
};

