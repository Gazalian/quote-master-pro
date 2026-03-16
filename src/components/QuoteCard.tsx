import { useState, useEffect } from "react";
import { QuoteEditor } from "./QuoteEditor";
import { Quote, BrandSettings } from "@/types/quote";
import { ClassicTemplate } from "./templates/ClassicTemplate";
import { ModernTemplate } from "./templates/ModernTemplate";
import { MinimalTemplate } from "./templates/MinimalTemplate";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";

export const QuoteCard = ({ quote }: { quote: Quote }) => {
  const { user } = useAuth();
  const [currentQuote, setCurrentQuote] = useState(quote);
  const [editing, setEditing] = useState(false);
  const [brand, setBrand] = useState<BrandSettings | null>(null);
  const [isLoadingBrand, setIsLoadingBrand] = useState(true);

  useEffect(() => {
    setCurrentQuote(quote);
  }, [quote]);

  useEffect(() => {
    const fetchBrand = async () => {
      if (!user) return;
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
             address: data.address || "", // unused for now
             phone: data.phone || "",
             whatsapp: "", // unused for now
             email: "", // unused for now
             rcNumber: "", // unused for now
             logoUrl: null,
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
  }, [user, quote.templateStyle]);

  if (editing) {
    return (
      <QuoteEditor
        quote={currentQuote}
        onClose={() => setEditing(false)}
        onSave={(updated) => { setCurrentQuote(updated); setEditing(false); }}
      />
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

    switch (currentQuote.templateStyle) {
      case "modern":
        return <ModernTemplate quote={currentQuote} brand={brand} />;
      case "minimal":
        return <MinimalTemplate quote={currentQuote} brand={brand} />;
      case "classic":
      default:
        return <ClassicTemplate quote={currentQuote} brand={brand} />;
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {renderTemplate()}

      {/* Actions (Consistent across all templates) */}
      <div className="flex gap-2 p-3 bg-card border border-border rounded-xl shadow-sm">
        {currentQuote.status === "APPROVED" ? (
          <>
            <button
              onClick={() => setEditing(true)}
              className="flex-1 bg-secondary text-secondary-foreground py-2.5 rounded-lg text-sm font-semibold hover:bg-secondary/80 transition-colors"
            >
              Edit Quote
            </button>
            <button
              onClick={() => setCurrentQuote({ ...currentQuote, status: "INVOICED" })}
              className="flex-1 bg-doc-primary text-doc-primary-foreground py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              Generate Invoice
            </button>
          </>
        ) : currentQuote.status === "INVOICED" ? (
          <>
            <button className="flex-1 bg-secondary text-secondary-foreground py-2.5 rounded-lg text-sm font-semibold hover:bg-secondary/80 transition-colors">
              Download PDF
            </button>
            <button
              onClick={() => setCurrentQuote({ ...currentQuote, status: "ARCHIVED" })}
              className="flex-1 bg-badge-approved text-badge-approved-fg py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Mark Paid
            </button>
          </>
        ) : (
          <button className="w-full bg-secondary text-secondary-foreground py-2.5 rounded-lg text-sm font-semibold hover:bg-secondary/80 transition-colors text-center">
            View Archived PDF
          </button>
        )}
      </div>
    </div>
  );
};
