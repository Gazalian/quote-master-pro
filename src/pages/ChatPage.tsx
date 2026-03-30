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
          userLocation: "Lagos", // Could be from user profile in future
          priceLogEntries, // Pass user's saved prices
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

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;
    
    if (!currentSessionId) {
      setCurrentSessionId(Date.now().toString());
    }

    const prompt = input;
    const imagesToSend = [...selectedImages]; // Keep reference to images
    setInput("");

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
      // Add image messages
      ...imagesToSend.map((img, idx) => ({
        id: Date.now().toString() + `-img-${idx}`,
        role: "user" as const,
        content: "",
        type: "image" as const,
        imageUrl: URL.createObjectURL(img)
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
      console.error("Quote generation error:", error);

      // Don't show error toast for clarifying questions
      if (error.message !== "CLARIFYING_QUESTIONS_NEEDED") {
        toast.error(error.message || "Failed to generate quote");
        setMessages((prev) => {
          const next = prev.filter(m => !m.id.endsWith("-ai-loading"));
          return [
            ...next,
            { id: Date.now().toString() + "-ai-error", role: "ai", content: `Sorry, I ran into an error: ${error.message}. Please try again.`, type: "text" }
          ];
        });
      }
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

      {/* Top bar (mobile only) */}
      {!isDesktop && (
        <div className="flex items-center justify-between px-4 h-14 bg-primary shrink-0 lg:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawerOpen(true)}
              className="text-primary-foreground"
            >
              <Menu size={22} />
            </button>
            <span className="text-primary-foreground font-semibold text-lg">OtoQuote AI</span>
          </div>
        </div>
      )}

      {/* Chat body */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-chat-bg px-3 py-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.type === "image" ? (
              <div className="max-w-[60%]">
                <img
                  src={msg.imageUrl}
                  alt="Uploaded"
                  className="rounded-xl border-2 border-border shadow-md max-h-[300px] object-cover"
                />
              </div>
            ) : msg.type === "quote" && !isDesktop ? (
               <div className="w-full max-w-[95%]">
                 {activeQuote ? (
                   <QuoteCard
                     quote={activeQuote}
                     onQuoteSaved={(saved) => setActiveQuote(saved)}
                     mode="chat"
                   />

                 ) : (
                   <div className="text-sm bg-destructive/10 text-destructive p-4 rounded-xl border border-destructive/20">
                     Quote data unavailable.
                   </div>
                 )}
               </div>
             ) : msg.type === "quote" && isDesktop ? (
              <div
                className="max-w-[80%] px-4 py-3 rounded-2xl text-[15px] bg-chat-bubble-ai text-chat-bubble-ai-fg rounded-bl-md shadow-sm border border-border"
              >
                Quote generated and updated in the preview panel. 👉
              </div>
            ) : (
              <div
                className={`max-w-[85%] px-4 py-3 rounded-2xl text-[15px] leading-relaxed relative group transition-all ${
                  msg.role === "user"
                    ? "bg-[#0056D2] text-white shadow-sm rounded-br-sm ml-auto"
                    : "bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm"
                }`}
              >
                {editingMessageId === msg.id ? (
                  <div className="flex flex-col gap-2 min-w-[200px]">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full bg-white/10 text-white p-2 rounded-lg resize-none outline-none border border-white/20 focus:border-white text-sm min-h-[80px]"
                      autoFocus
                    />
                    <div className="flex justify-end gap-2 text-white">
                      <button
                        onClick={() => setEditingMessageId(null)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-black/10 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEdit(msg.id)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-md bg-white text-[#0056D2] hover:bg-gray-50 transition-colors"
                      >
                        Update
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                       {msg.id.endsWith("-ai-loading") && <Loader2 className="w-4 h-4 animate-spin shrink-0 opacity-70" />}
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    {msg.role === "user" && !isGenerating && (
                      <button
                        onClick={() => startEditing(msg)}
                        className="absolute -left-10 top-2 p-1.5 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-all rounded-full hover:bg-white shadow-sm border border-transparent hover:border-gray-200"
                        title="Edit prompt"
                      >
                        <Pencil size={14} />
                      </button>
                    )}
                    {msg.isEdited && (
                       <span className={`text-[10px] opacity-70 absolute -bottom-5 right-1 ${msg.role === "user" ? "text-gray-400" : "text-gray-400"}`}>Edited</span>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input bar */}
      <div className="px-4 py-4 bg-white border-t border-gray-100 shrink-0">
        <div className="max-w-3xl mx-auto">
          {/* Image previews */}
          {selectedImages.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-3 px-1">
              {selectedImages.map((img, idx) => (
                <div key={idx} className="relative group">
                  <img
                    src={URL.createObjectURL(img)}
                    alt={`Upload ${idx + 1}`}
                    className="w-16 h-16 object-cover rounded-xl border border-gray-200 shadow-sm"
                  />
                  <button
                    onClick={() => setSelectedImages(prev => prev.filter((_, i) => i !== idx))}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  >
                    <X size={12} strokeWidth={3} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="relative flex items-end w-full bg-gray-50 border border-gray-200 rounded-[24px] shadow-sm focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all duration-200">
            {/* Hidden File Input */}
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
            {/* Attachment Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 mb-0.5 ml-1 text-gray-400 hover:text-gray-700 transition-colors shrink-0 relative rounded-full hover:bg-gray-100"
              disabled={isGenerating}
              title="Attach image"
            >
              <Image size={22} className={isGenerating ? "opacity-50" : ""} />
              {selectedImages.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white border-none">
                  {selectedImages.length}
                </span>
              )}
            </button>

            {/* Textarea */}
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Message OtoQuote AI..."
              className="flex-1 bg-transparent py-3.5 px-2 text-[15px] text-gray-900 placeholder:text-gray-400 outline-none resize-none"
              disabled={isGenerating}
              rows={1}
              style={{
                minHeight: '52px',
                maxHeight: '200px',
                height: '52px'
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = '52px';
                target.style.height = Math.min(target.scrollHeight, 200) + 'px';
                target.style.overflowY = target.scrollHeight > 200 ? 'auto' : 'hidden';
              }}
            />

            {/* Right Buttons group (Mic or Send) */}
            <div className="flex items-center justify-center p-2 mb-0.5 mr-0.5 shrink-0 min-w-[48px]">
              {input.trim() ? (
                <button
                  onClick={handleSend}
                  disabled={isGenerating}
                  className="w-10 h-10 flex items-center justify-center bg-[#0056D2] text-white rounded-full shadow-md hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-0.5" />}
                </button>
              ) : (
                <button 
                  onClick={() => toast.info("Voice recording (mock): Starts listening...")}
                  className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 rounded-full transition-colors disabled:opacity-50"
                  disabled={isGenerating}
                  title="Voice message"
                >
                  <Mic size={22} />
                </button>
              )}
            </div>
          </div>
          <div className="text-center mt-3 text-[11px] text-gray-400">
            OtoQuote AI can make mistakes. Check important info.
          </div>
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
