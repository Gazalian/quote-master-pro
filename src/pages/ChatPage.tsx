import { useState, useRef, useEffect } from "react";
import { Send, Mic, Image, Menu, Pencil, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { QuoteCard } from "@/components/QuoteCard";
import { ChatHistoryDrawer } from "@/components/ChatHistoryDrawer";
import { useIsDesktop } from "@/hooks/use-mobile";
import { ChatMessage, Quote, ChatSession } from "@/types/quote";
import { useAuth } from "@/lib/AuthContext";
import { quoteAPI } from "@/lib/api";
import { generateQuoteWithGemini } from "@/lib/geminiService";
import {
  getRegionalPricesForState,
  recordPriceObservation,
  type RegionalPriceEntry,
} from "@/lib/regionalPriceAPI";
import { getUserPreferences, type UserPreferences } from "@/lib/behaviorEngine";
import { supabase } from "@/lib/supabase";

const initialMessages: ChatMessage[] = [
  {
    id: "1",
    role: "ai",
    content: "Good morning! 👋 I'm OtoQuote AI. Tell me about the job you want to quote — you can type, send a voice note, or attach a photo of the site.",
    type: "text",
  }
];

const ChatPage = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  
  // State for the currently generated/active quote
  const [activeQuote, setActiveQuote] = useState<Quote | null>(null);
  const [quoteHistory, setQuoteHistory] = useState<Quote[]>([]); // All quotes in current session
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Image upload state
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // User profile: state + trade (for regional price lookup)
  const [userState, setUserState]   = useState<string>("");
  const [userTrade, setUserTrade]   = useState<string>("general");
  const [regionalPrices, setRegionalPrices] = useState<RegionalPriceEntry[]>([]);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const isDesktop = useIsDesktop();

  useEffect(() => {
    const saved = localStorage.getItem('otoquote_sessions');
    if (saved) {
      try { setSessions(JSON.parse(saved)); } catch(e) {}
    }
  }, []);

  useEffect(() => {
    if (currentSessionId && messages.length > 1) { // >1 to not save initial placeholder
      const sessionData = { messages, activeQuote, quoteHistory };
      localStorage.setItem(`otoquote_chat_${currentSessionId}`, JSON.stringify(sessionData));
      
      setSessions(prev => {
        const next = [...prev];
        const idx = next.findIndex(s => s.id === currentSessionId);
        const titleMatch = messages.find(m => m.role === 'user');
        const title = titleMatch ? titleMatch.content.substring(0, 30) + '...' : "New Session";
        const client = activeQuote?.client || "No client yet";
        
        if (idx === -1) {
          next.unshift({
             id: currentSessionId,
             title,
             client,
             date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
             preview: `${messages.length} messages`
          });
        } else {
          next[idx] = { ...next[idx], title, client, preview: `${messages.length} messages` };
        }
        localStorage.setItem('otoquote_sessions', JSON.stringify(next));
        return next;
      });
    }
  }, [messages, activeQuote, quoteHistory, currentSessionId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  // Fetch user profile → state + trade, then load regional prices + learned preferences
  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('state_operation, trade_type')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (!data) return;
        const state = data.state_operation || '';
        const trade = data.trade_type || 'general';
        setUserState(state);
        setUserTrade(trade);
        if (state) getRegionalPricesForState(state).then(setRegionalPrices);
      });
    // Fetch learned behavior preferences (fire-and-forget)
    getUserPreferences(user.id).then(setUserPreferences);
  }, [user]);

  const generateMockQuote = async (prompt: string): Promise<Quote> => {
    if (!user) throw new Error("Must be logged in to create a quote");
    
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Determine generic client name if none exists
    const clientName = "Client X";

    // 1. Fetch available price log entries
    const priceLog = await quoteAPI.getQuotes().then(() => []).catch(() => []); // placeholder
    let matchedItems: any[] = [];
    
    try {
      const { priceLogAPI } = await import('@/lib/api');
      const allPrices = await priceLogAPI.getEntries();
      const lowerPrompt = prompt.toLowerCase();
      
      matchedItems = allPrices.filter((p: any) => lowerPrompt.includes(p.name.toLowerCase()));
    } catch(e) { console.error(e) }

    const items = [];
    
    // 2. If matched items from Price Log exist in the prompt
    if (matchedItems.length > 0) {
       matchedItems.forEach((match, idx) => {
         items.push({
           id: `i-mock-${Date.now()}-${idx}`,
           name: match.name,
           qty: 1,
           unit: match.unit || "unit",
           unitPrice: Number(match.unitPrice),
           total: Number(match.unitPrice),
           source: "my_price"
         });
       });
    } else {
       // 3. Fallback: AI Estimate based on available data online
       items.push({ 
         id: `i-mock-${Date.now()}`, 
         name: "AI Estimated Item", 
         qty: 1, 
         unit: "job", 
         unitPrice: 45000, 
         total: 45000, 
         source: "ai_estimate" 
       });
    }

    const calculatedTotal = items.reduce((sum, item) => sum + item.total, 0);

    const mockRef = `OQ-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    const newQuote: Quote = {
      id: "draft-" + Date.now().toString(),
      user_id: user.id,
      ref: mockRef,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      client: clientName,
      description: prompt.substring(0, 50) + "...",
      status: "APPROVED", // AI-generated drafts are implicitly approved to export
      templateStyle: "modern",
      isDraft: true,
      groups: [
        {
          id: `g-mock-${Date.now()}`,
          name: "Generated Items",
          items: items as any
        }
      ],
      grandTotal: calculatedTotal,
      version: 1
    };

    return newQuote;
  };

  const generateQuoteWithAI = async (prompt: string, images: File[] = []): Promise<Quote> => {
    if (!user) throw new Error("Must be logged in to create a quote");

    console.log("=== Starting AI Quote Generation ===");
    console.log("Prompt:", prompt);
    console.log("Images:", images.length);
    console.log("User ID:", user.id);

    try {
      // Fetch price log entries to send to AI
      let priceLogEntries: any[] = [];
      try {
        const { priceLogAPI } = await import('@/lib/api');
        priceLogEntries = await priceLogAPI.getEntries();
        console.log("Price log entries loaded:", priceLogEntries.length);
      } catch (e) {
        console.error("Failed to load price log:", e);
      }

      // Call Gemini API with the prompt and images
      console.log("Calling generateQuoteWithGemini...");
      const response = await generateQuoteWithGemini(
        {
          userMessage: prompt,
          images: images.length > 0 ? images : undefined,
          conversationHistory: messages
            .filter(m => m.type === "text" && !m.id.includes("loading"))
            .map(m => ({
              role: m.role === "user" ? "user" : "model",
              content: m.content
            })),
          userLocation: userState,
          userTrade,
          priceLogEntries,
          regionalPrices,
          userPreferences,
        },
        user.id
      );

      // If Gemini asks clarifying questions, handle them
      if (response.clarifyingQuestions && response.clarifyingQuestions.length > 0) {
        // Display questions to user
        setMessages((prev) => {
          const next = prev.filter(m => !m.id.endsWith("-ai-loading"));
          return [
            ...next,
            {
              id: Date.now().toString() + "-ai-questions",
              role: "ai",
              content: `I need a bit more information:\n\n${response.clarifyingQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`,
              type: "text"
            }
          ];
        });
        throw new Error("CLARIFYING_QUESTIONS_NEEDED");
      }

      console.log("Gemini response received:", response);

      // Check if generation was successful
      if (!response.success || !response.quote) {
        throw new Error(response.error || "Failed to generate quote");
      }

      // Convert Gemini response to Quote format
      const quote = response.quote as Quote;

      console.log("Generated quote:", quote);
      console.log("AI Reasoning:", response.reasoning);

      // Store reasoning in a ref or state so we can display it
      if (response.reasoning) {
        // We'll pass this reasoning to the message display
        (quote as any).aiReasoning = response.reasoning;
      }

      // Display confidence level if available
      if (response.confidence && response.confidence !== "high") {
        toast.info(`AI Confidence: ${response.confidence}`, {
          description: "Please review the quote carefully and adjust as needed."
        });
      }

      return quote;
    } catch (error: any) {
      if (error.message === "CLARIFYING_QUESTIONS_NEEDED") {
        throw error;
      }

      // Log error details
      console.error("Gemini API Error:", error);

      // Provide helpful error message
      if (error.message?.includes("API key")) {
        throw new Error("Gemini API key not configured. Please add your API key to .env file.");
      } else if (error.message?.includes("quota")) {
        throw new Error("API quota exceeded. Please try again later.");
      } else {
        throw new Error(error.message || "Failed to generate quote with AI. Please try again.");
      }
    }
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;

    if (!currentSessionId) {
      setCurrentSessionId(Date.now().toString());
    }

    const prompt = input;
    const imagesToSend = [...selectedImages]; // Keep reference to images
    setInput("");

    // Convert images to base64 so they persist in localStorage sessions
    const imageBase64s = await Promise.all(imagesToSend.map(fileToBase64));

    // Add user message with images if any
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: prompt,
      type: "text"
    };

    setMessages((prev) => [
      ...prev,
      userMessage,
      // Add image messages using base64 URLs (persistent across reloads)
      ...imageBase64s.map((dataUrl, idx) => ({
        id: Date.now().toString() + `-img-${idx}`,
        role: "user" as const,
        content: "",
        type: "image" as const,
        imageUrl: dataUrl
      }))
    ]);

    setIsGenerating(true);
    
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString() + "-ai-loading", role: "ai", content: "Analyzing your request and generating quote...", type: "text" }
    ]);

    try {
      const generated = await generateQuoteWithAI(prompt, imagesToSend);
      setActiveQuote(generated);
      setQuoteHistory(prev => [...prev, generated]); // Add to history
      setSelectedImages([]); // Clear images after successful generation

      setMessages((prev) => {
        const next = prev.filter(m => !m.id.endsWith("-ai-loading"));
        const aiMessages: ChatMessage[] = [];

        // Add AI reasoning if available
        if ((generated as any).aiReasoning) {
          aiMessages.push({
            id: Date.now().toString() + "-ai-reasoning",
            role: "ai",
            content: `💡 **My Analysis:**\n\n${(generated as any).aiReasoning}`,
            type: "text"
          });
        }

        // Add success message
        aiMessages.push({
          id: Date.now().toString() + "-ai-response",
          role: "ai",
          content: "I've generated a draft quote based on your requirements. You can review and edit it in the preview panel.",
          type: "text"
        });

        // Add quote
        aiMessages.push({
          id: Date.now().toString() + "-ai-quote",
          role: "ai",
          content: "",
          type: "quote"
        });

        return [...next, ...aiMessages];
      });
      toast.success("Quote generated!");
    } catch (error: any) {
      // Clarifying questions are a normal AI flow — not an error
      if (error.message === "CLARIFYING_QUESTIONS_NEEDED") return;

      console.error("Quote generation error:", error);
      toast.error(error.message || "Failed to generate quote");
      setMessages((prev) => {
        const next = prev.filter(m => !m.id.endsWith("-ai-loading"));
        return [
          ...next,
          { id: Date.now().toString() + "-ai-error", role: "ai", content: `Sorry, I ran into an error: ${error.message}. Please try again.`, type: "text" }
        ];
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const startEditing = (msg: ChatMessage) => {
    setEditingMessageId(msg.id);
    setEditContent(msg.content);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editContent.trim() || isGenerating) return;
    
    const newPrompt = editContent;
    setEditingMessageId(null);
    setIsGenerating(true);
    
    setMessages((prev) => {
      const idx = prev.findIndex(m => m.id === id);
      if (idx === -1) return prev;
      
      const next = [...prev];
      next[idx] = { ...next[idx], content: newPrompt, isEdited: true };
      next.push({ id: Date.now().toString() + "-ai-loading", role: "ai", content: "Understood! Updating the quote based on your new instructions...", type: "text" });
      return next;
    });
    
    try {
      // Generate a brand new draft representing the edit
      const generated = await generateQuoteWithAI(newPrompt);
      setActiveQuote(generated);
      setQuoteHistory(prev => [...prev, generated]); // Add to history

      // If the updated quote contains regional_price items, record observations
      const allItems = generated.groups.flatMap(g => g.items);
      const regionalItems = allItems.filter(item => item.source === 'regional_price');
      for (const item of regionalItems) {
        if (user && userState) {
          recordPriceObservation({
            userId: user.id,
            materialName: item.name,
            priceNgn: item.unitPrice,
            unit: item.unit,
            state: userState,
            sourceType: 'quote_override',
          });
        }
      }
      if (regionalItems.length > 0) {
        toast.info(`Price updated. Your input helps keep ${userState} estimates accurate for all tradespeople.`);
      }

      setMessages((prev) => {
        const next = prev.filter(m => !m.id.endsWith("-ai-loading"));
        return [
          ...next,
          { id: Date.now().toString() + "-ai-response", role: "ai", content: "I've updated the draft quote based on your new instructions. You can review it in the preview panel.", type: "text" },
          { id: Date.now().toString() + "-ai-quote", role: "ai", content: "", type: "quote" }
        ];
      });
      toast.success("Quote updated and saved!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update quote");
      setMessages((prev) => {
        const next = prev.filter(m => !m.id.endsWith("-ai-loading"));
        return [
           ...next,
           { id: Date.now().toString() + "-ai-error", role: "ai", content: "Sorry, I ran into an error updating that quote. Please try again.", type: "text" }
        ];
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const loadSession = (id: string) => {
    const data = localStorage.getItem(`otoquote_chat_${id}`);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        setMessages(parsed.messages || initialMessages);
        setActiveQuote(parsed.activeQuote || null);
        setQuoteHistory(parsed.quoteHistory || []); // Load quote history
        setCurrentSessionId(id);
      } catch(e) { console.error(e); }
    }
  };

  const startNewChat = () => {
    setMessages(initialMessages);
    setActiveQuote(null);
    setQuoteHistory([]); // Clear quote history
    setCurrentSessionId(null);
  };

  const ChatContent = (
    <div className="flex flex-col h-full bg-background relative">
      {!isDesktop && (
        <ChatHistoryDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          sessions={sessions}
          onSelectSession={loadSession}
          onNewChat={startNewChat}
        />
      )}

      {/* ── Mobile top bar ──────────────────────────────────────── */}
      {!isDesktop && (
        <div className="flex items-center justify-between px-4 h-14 bg-white border-b border-gray-100 shrink-0 shadow-sm lg:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawerOpen(true)}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 active:bg-gray-200 transition-colors"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#0056D2] flex items-center justify-center">
                <span className="text-white text-[10px] font-black">OQ</span>
              </div>
              <span className="font-semibold text-gray-900 text-[15px]">OtoQuote AI</span>
            </div>
          </div>
          {/* New chat shortcut */}
          <button
            onClick={startNewChat}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-[#0056D2] hover:bg-blue-50 active:bg-blue-100 transition-colors"
            title="New chat"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </button>
        </div>
      )}

      {/* ── Chat body ───────────────────────────────────────────── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-[#f0f2f5] px-3 py-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-end gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {/* AI avatar dot */}
            {msg.role === "ai" && msg.type !== "quote" && (
              <div className="w-7 h-7 rounded-full bg-[#0056D2] flex items-center justify-center shrink-0 mb-0.5 shadow-sm">
                <span className="text-white text-[9px] font-black">OQ</span>
              </div>
            )}
            {/* Spacer so AI quote cards align left without avatar */}
            {msg.role === "ai" && msg.type === "quote" && !isDesktop && (
              <div className="w-7 shrink-0" />
            )}

            {msg.type === "image" ? (
              <div className="max-w-[65%]">
                <img
                  src={msg.imageUrl}
                  alt="Uploaded"
                  className="rounded-2xl border border-white/50 shadow-md max-h-[260px] w-full object-cover"
                />
              </div>
            ) : msg.type === "quote" && !isDesktop ? (
              <div className="flex-1 min-w-0">
                {activeQuote ? (
                  <QuoteCard
                    quote={activeQuote}
                    onQuoteSaved={(saved) => setActiveQuote(saved)}
                    mode="chat"
                  />
                ) : (
                  <div className="text-sm bg-destructive/10 text-destructive p-4 rounded-2xl border border-destructive/20">
                    Quote data unavailable.
                  </div>
                )}
              </div>
            ) : msg.type === "quote" && isDesktop ? (
              <div className="max-w-[75%] px-4 py-3 rounded-2xl rounded-bl-sm text-[14px] bg-white text-gray-700 shadow-sm border border-gray-100">
                Quote generated and updated in the preview panel. 👉
              </div>
            ) : msg.id.endsWith("-ai-loading") ? (
              /* Typing indicator */
              <div className="px-4 py-3 bg-white rounded-2xl rounded-bl-sm shadow-sm border border-gray-100">
                <div className="flex items-center gap-1.5 h-5">
                  <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
                  <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            ) : (
              <div
                className={`max-w-[78%] rounded-2xl text-[14px] leading-relaxed relative ${
                  msg.role === "user"
                    ? "bg-[#0056D2] text-white shadow-sm rounded-br-sm px-4 py-3"
                    : "bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm px-4 py-3"
                }`}
              >
                {editingMessageId === msg.id ? (
                  <div className="flex flex-col gap-2 min-w-[220px]">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full bg-white/15 text-white p-2 rounded-xl resize-none outline-none border border-white/25 focus:border-white/60 text-sm min-h-[80px]"
                      autoFocus
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingMessageId(null)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEdit(msg.id)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white text-[#0056D2] hover:bg-gray-50 transition-colors"
                      >
                        Update
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    {/* Edit + Edited row — always visible on mobile, no hover needed */}
                    {msg.role === "user" && !isGenerating && (
                      <div className="flex items-center justify-end gap-2 mt-1.5">
                        {msg.isEdited && (
                          <span className="text-[10px] text-white/60">edited</span>
                        )}
                        <button
                          onClick={() => startEditing(msg)}
                          className="flex items-center gap-1 text-white/60 hover:text-white/90 transition-colors"
                          title="Edit message"
                        >
                          <Pencil size={11} />
                          <span className="text-[10px]">Edit</span>
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        ))}
        {/* Bottom padding so last message clears the input bar */}
        <div className="h-2" />
      </div>

      {/* ── Input bar ───────────────────────────────────────────── */}
      <div className="px-3 py-3 bg-white border-t border-gray-100 shrink-0">
        {/* Image previews */}
        {selectedImages.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-2 px-1">
            {selectedImages.map((img, idx) => (
              <div key={idx} className="relative">
                <img
                  src={URL.createObjectURL(img)}
                  alt={`Upload ${idx + 1}`}
                  className="w-14 h-14 object-cover rounded-xl border border-gray-200 shadow-sm"
                />
                {/* Always-visible remove button for touch devices */}
                <button
                  onClick={() => setSelectedImages(prev => prev.filter((_, i) => i !== idx))}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-sm"
                >
                  <X size={11} strokeWidth={3} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          {/* Attachment */}
          <div className="relative shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                setSelectedImages(prev => [...prev, ...files].slice(0, 5));
                e.target.value = "";
              }}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isGenerating}
              className="w-10 h-10 flex items-center justify-center rounded-2xl bg-gray-100 text-gray-500 active:bg-gray-200 transition-colors disabled:opacity-40"
              title="Attach image"
            >
              <Image size={19} />
              {selectedImages.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#0056D2] text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                  {selectedImages.length}
                </span>
              )}
            </button>
          </div>

          {/* Textarea pill */}
          <div className="flex-1 flex items-end bg-gray-100 rounded-[22px] px-4 py-2 border border-transparent focus-within:border-[#0056D2]/30 focus-within:bg-white transition-all duration-200">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type your job description..."
              className="flex-1 bg-transparent text-[14px] text-gray-900 placeholder:text-gray-400 outline-none resize-none"
              disabled={isGenerating}
              rows={1}
              style={{ minHeight: '24px', maxHeight: '120px', lineHeight: '1.5' }}
              onInput={(e) => {
                const t = e.target as HTMLTextAreaElement;
                t.style.height = '24px';
                t.style.height = Math.min(t.scrollHeight, 120) + 'px';
                t.style.overflowY = t.scrollHeight > 120 ? 'auto' : 'hidden';
              }}
            />
          </div>

          {/* Send / Mic */}
          {input.trim() || isGenerating ? (
            <button
              onClick={handleSend}
              disabled={isGenerating}
              className="w-10 h-10 shrink-0 flex items-center justify-center bg-[#0056D2] text-white rounded-full shadow-md active:scale-95 transition-all disabled:opacity-60"
            >
              {isGenerating
                ? <Loader2 size={17} className="animate-spin" />
                : <Send size={17} className="ml-0.5" />}
            </button>
          ) : (
            <button
              onClick={() => toast.info("Voice input coming soon!", { description: "Please type your message for now." })}
              disabled={isGenerating}
              className="w-10 h-10 shrink-0 flex items-center justify-center bg-gray-100 text-gray-500 rounded-full active:bg-gray-200 transition-colors"
            >
              <Mic size={19} />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (!isDesktop) {
    return ChatContent;
  }

  return (
    <PanelGroup direction="horizontal" className="h-full w-full">
      <Panel defaultSize={25} minSize={20} className="h-full border-r border-border">
        <ChatHistoryDrawer 
          variant="sidebar" 
          sessions={sessions}
          onSelectSession={loadSession}
          onNewChat={startNewChat}
        />
      </Panel>
      <PanelResizeHandle className="w-2 bg-border flex items-center justify-center cursor-col-resize hover:bg-primary/20 transition-colors">
        <div className="w-1 h-8 bg-muted-foreground/30 rounded-full" />
      </PanelResizeHandle>
      <Panel defaultSize={35} minSize={30} className="h-full">
        {ChatContent}
      </Panel>
      <PanelResizeHandle className="w-2 bg-border flex items-center justify-center cursor-col-resize hover:bg-primary/20 transition-colors">
        <div className="w-1 h-8 bg-muted-foreground/30 rounded-full" />
      </PanelResizeHandle>
      <Panel defaultSize={40} minSize={30} className="h-full bg-white overflow-hidden flex flex-col relative">
        {/* Subtle background decoration */}
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none"></div>
        <div className="absolute top-0 right-0 left-0 h-40 bg-gradient-to-b from-gray-50/80 to-transparent pointer-events-none"></div>

        {/* Quote History Tabs */}
        {quoteHistory.length > 0 && (
          <div className="relative z-10 flex-shrink-0 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 overflow-x-auto">
            <div className="flex gap-2">
              {quoteHistory.map((quote, index) => (
                <button
                  key={quote.id}
                  onClick={() => setActiveQuote(quote)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    activeQuote?.id === quote.id
                      ? 'bg-blue-50 text-[#0056D2] shadow-sm border border-blue-100'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  Quote {index + 1} - {quote.ref}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quote Display */}
        <div className="relative z-10 flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-4xl mx-auto h-full flex flex-col justify-center">
            {activeQuote ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 pb-12">
                <QuoteCard
                  quote={activeQuote}
                  onQuoteSaved={(saved) => {
                    setActiveQuote(saved);
                    // Update in history as well
                    setQuoteHistory(prev =>
                      prev.map(q => q.id === saved.id ? saved : q)
                    );
                  }}
                  mode="chat"
                />
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
                <div className="max-w-[420px] w-full mx-auto bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_40px_rgb(0,0,0,0.06)] border border-gray-100 p-10 flex flex-col items-center text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-[#0056D2] to-[#F58220]"></div>
                  
                  <div className="w-20 h-20 bg-gradient-to-tr from-blue-50 to-indigo-50 text-[#0056D2] rounded-3xl flex items-center justify-center mb-8 shadow-inner ring-1 ring-blue-100/50 transform -rotate-3 transition-transform hover:rotate-0 duration-300">
                    <Menu className="w-10 h-10" strokeWidth={1.5} />
                  </div>
                  
                  <h3 className="text-[22px] font-semibold mb-3 text-gray-900 tracking-tight">No Quote Generated</h3>
                  <p className="text-gray-500 text-[15px] leading-relaxed mb-8">
                    Start a conversation to generate your first professional quotation with AI. You can easily adjust prices and details later.
                  </p>
                  
                  <div className="w-full bg-gradient-to-br from-gray-50 to-white rounded-2xl p-4 border border-gray-100 text-left flex items-start gap-4">
                    <span className="text-xl pt-0.5">💡</span>
                    <p className="text-[13px] text-gray-600 font-medium leading-relaxed">
                      <span className="text-gray-900 font-semibold block mb-0.5">Pro Tip</span>
                      Describe the project clearly, specify measurements, or simply upload site photos for more accurate estimates.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Panel>
    </PanelGroup>
  );
};

export default ChatPage;
