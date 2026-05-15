import { useState, useEffect, useMemo } from "react";
import { QuoteEditor } from "./QuoteEditor";
import { Quote, BrandSettings } from "@/types/quote";
import { ClassicTemplate } from "./templates/ClassicTemplate";
import { ModernTemplate } from "./templates/ModernTemplate";
import { MinimalTemplate } from "./templates/MinimalTemplate";
import { Loader2, Download } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "sonner";
import { useBootstrap } from "@/hooks/useBootstrap";
import { useSaveQuote, useUpdateQuote } from "@/hooks/useQuotes";

// Lazy-loaded so html2canvas + jspdf (~700 KB) don't ship in the main bundle —
// they're only fetched when the user actually clicks Export PDF.
const loadPdfExport = () => import("@/lib/pdfExport").then((m) => m.exportToPDF);

export const QuoteCard = ({ quote, onQuoteSaved, mode = "dashboard" }: { quote: Quote, onQuoteSaved?: (quote: Quote) => void, mode?: "chat" | "dashboard" }) => {
  const { user } = useAuth();
  const [currentQuote, setCurrentQuote] = useState(quote);
  const [editing, setEditing] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const { data: bootstrap, isLoading: isLoadingBootstrap } = useBootstrap();
  const saveQuote = useSaveQuote();
  const updateQuote = useUpdateQuote();

  // Derived brand from the cached bootstrap. No extra round-trip per QuoteCard.
  const brand: BrandSettings | null = useMemo(() => {
    const p = bootstrap?.profile;
    if (!p) return null;
    return {
      companyName: p.company_name || "Company Name",
      tagline: "",
      address: p.address || "",
      contactPerson: p.contact_person || "",
      phone: p.phone || "",
      whatsapp: p.whatsapp || "",
      email: p.email || "",
      rcNumber: p.cac_number || "",
      logoUrl: p.logo_url || null,
      docPrimary: p.brand_primary_color || "170 75% 31%",
      docSecondary: p.brand_secondary_color || "213 27% 34%",
      templateStyle: quote.templateStyle,
      bankDetails: {
        bankName: p.bank_name || "GTBank",
        accountName: p.account_name || "Example Name",
        accountNumber: p.account_number || "0123456789",
        paymentTerms: p.default_payment_terms || "Payment due upon completion.",
      },
    };
  }, [bootstrap, quote.templateStyle]);
  const isLoadingBrand = isLoadingBootstrap && mode !== "chat";

  useEffect(() => {
    setCurrentQuote(quote);
  }, [quote]);

  if (editing) {
    return (
      <QuoteEditor
        quote={currentQuote}
        onClose={() => setEditing(false)}
        onSave={async (updated) => {
          if (!updated.isDraft && updated.id) {
            try {
              const patch: Record<string, unknown> = {
                client_name: updated.client,
                description: updated.description,
                status: updated.status,
                template_style: updated.templateStyle,
                grand_total: updated.grandTotal,
                data: { groups: updated.groups },
              };
              await updateQuote.mutateAsync({ id: updated.id, patch });
            } catch (e) {
              console.error("Failed to update quote", e);
            }
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
      // One atomic backend call: save + deduct points + version assignment.
      // Replaces the previous client-side dance of insert + broken deduct_points RPC.
      const saved: any = await saveQuote.mutateAsync({
        sessionId: currentQuote.session_id ?? null,
        templateStyle: currentQuote.templateStyle,
        draft: {
          ref: currentQuote.ref,
          client: currentQuote.client,
          description: currentQuote.description,
          groups: currentQuote.groups,
          grandTotal: currentQuote.grandTotal,
          templateStyle: currentQuote.templateStyle,
        },
      });
      const savedQuote: Quote = {
        id: saved.id,
        user_id: saved.user_id,
        ref: saved.ref,
        date: new Date(saved.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        client: saved.client_name,
        description: saved.description,
        groups: (saved.data?.groups ?? []) as any,
        grandTotal: Number(saved.grand_total),
        status: saved.status,
        templateStyle: saved.template_style,
        version: saved.version,
        session_id: saved.session_id ?? undefined,
        created_at: saved.created_at,
        updated_at: saved.updated_at,
      };
      setCurrentQuote(savedQuote);
      onQuoteSaved?.(savedQuote);
      toast.success("Quote saved to Quotations!");
    } catch (e: any) {
      toast.error("Failed to save: " + (e?.message ?? "Unknown error"));
    }
  };

  const handleExportPDF = async () => {
    try {
      setIsExportingPDF(true);
      toast.loading("Generating PDF...");

      // Wait a bit for toast to show
      await new Promise(resolve => setTimeout(resolve, 300));

      // Lazy import: fetch the PDF dep bundle only on first export
      const exportToPDF = await loadPdfExport();
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
              Save to Quotations
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
                await updateQuote.mutateAsync({ id: currentQuote.id, patch: { status: "INVOICED" } });
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
                await updateQuote.mutateAsync({ id: currentQuote.id, patch: { status: "ARCHIVED" } });
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

