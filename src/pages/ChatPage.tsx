import { useState, useRef, useEffect } from "react";
import { Send, Mic, Image, Menu, Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { QuoteCard } from "@/components/QuoteCard";
import { ChatHistoryDrawer } from "@/components/ChatHistoryDrawer";
import { useIsDesktop } from "@/hooks/use-mobile";
import { ChatMessage, Quote } from "@/types/quote";
import { useAuth } from "@/lib/AuthContext";
import { quoteAPI } from "@/lib/api";

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
  const [isGenerating, setIsGenerating] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDesktop = useIsDesktop();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const generateMockQuote = async (prompt: string): Promise<Quote> => {
    if (!user) throw new Error("Must be logged in to create a quote");
    
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Create a structured mock quote based on arbitrary inputs
    const mockRef = `OQ-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    
    const newQuote: Partial<Quote> = {
      ref: mockRef,
      client: "New Client (Generated)",
      description: prompt.substring(0, 50) + "...",
      status: "APPROVED",
      templateStyle: "modern",
      groups: [
        {
          id: "g-mock",
          name: "Generated Items",
          items: [
            { id: "i-mock", name: "AI Estimated Item", qty: 1, unit: "unit", unitPrice: 25000, total: 25000, source: "ai_estimate" }
          ]
        }
      ],
      grandTotal: 25000
    };

    // Save to Supabase
    const savedQuote = await quoteAPI.createQuote(newQuote, user.id);
    return savedQuote;
  };

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;
    
    const prompt = input;
    setInput("");
    
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: "user", content: prompt, type: "text" },
    ]);
    
    setIsGenerating(true);
    
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString() + "-ai-loading", role: "ai", content: "Analyzing your request and generating quote...", type: "text" }
    ]);

    try {
      const generated = await generateMockQuote(prompt);
      setActiveQuote(generated);
      
      setMessages((prev) => {
        const next = prev.filter(m => !m.id.endsWith("-ai-loading"));
        return [
          ...next,
          { id: Date.now().toString() + "-ai-response", role: "ai", content: "I've generated a draft quote based on your requirements. You can review and edit it in the preview panel.", type: "text" },
          { id: Date.now().toString() + "-ai-quote", role: "ai", content: "", type: "quote" }
        ];
      });
      toast.success("Quote generated and saved!");
    } catch (error: any) {
      toast.error(error.message || "Failed to generate quote");
      setMessages((prev) => {
        const next = prev.filter(m => !m.id.endsWith("-ai-loading"));
        return [
          ...next,
          { id: Date.now().toString() + "-ai-error", role: "ai", content: "Sorry, I ran into an error generating that quote. Please try again.", type: "text" }
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
      // Create a brand new quote in DB representing the edit
      const generated = await generateMockQuote(newPrompt);
      setActiveQuote(generated);
      
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

  const ChatContent = (
    <div className="flex flex-col h-full bg-background relative">
      <ChatHistoryDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

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
            {msg.type === "quote" && !isDesktop ? (
               <div className="w-full max-w-[95%]">
                 {activeQuote ? (
                   <QuoteCard quote={activeQuote} />
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
                className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-[15px] leading-relaxed relative group ${
                  msg.role === "user"
                    ? "bg-chat-bubble-user text-chat-bubble-user-fg rounded-br-md shadow-sm"
                    : "bg-chat-bubble-ai text-chat-bubble-ai-fg rounded-bl-md shadow-sm border border-border"
                }`}
              >
                {editingMessageId === msg.id ? (
                  <div className="flex flex-col gap-2 min-w-[200px]">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full bg-secondary text-foreground p-2 rounded-lg resize-none outline-none border border-primary/30 focus:border-primary text-sm min-h-[80px]"
                      autoFocus
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingMessageId(null)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-black/10 text-chat-bubble-user-fg"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEdit(msg.id)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-md bg-white text-primary hover:bg-white/90"
                      >
                        Update
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      {msg.id.endsWith("-ai-loading") && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    {msg.role === "user" && !isGenerating && (
                      <button
                        onClick={() => startEditing(msg)}
                        className="absolute -left-10 top-2 p-1.5 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity rounded-full hover:bg-secondary"
                        title="Edit prompt"
                      >
                        <Pencil size={16} />
                      </button>
                    )}
                    {msg.isEdited && (
                       <span className="text-[10px] opacity-70 absolute -bottom-4 right-1 text-muted-foreground">Edited</span>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input bar */}
      <div className="flex items-center gap-2 px-3 py-3 bg-card border-t border-border shrink-0">
        <button 
          onClick={() => toast.info("Image upload (mock): Device camera/gallery opens here.")}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-muted-foreground hover:bg-secondary rounded-full transition-colors"
          disabled={isGenerating}
        >
          <Image size={22} className={isGenerating ? "opacity-50" : ""} />
        </button>
        <div className="flex-1 relative">
           <input
             value={input}
             onChange={(e) => setInput(e.target.value)}
             onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
             placeholder="Describe the job, attach a photo, or send a voice note..."
             className="w-full bg-secondary rounded-full px-4 py-2.5 pr-12 text-[15px] text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary transition-colors disabled:opacity-50"
             disabled={isGenerating}
           />
           {input.trim() ? (
             <button
               onClick={handleSend}
               disabled={isGenerating}
               className="absolute right-1 top-1 bottom-1 aspect-square flex items-center justify-center bg-primary text-primary-foreground rounded-full shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
             >
               {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-0.5" />}
             </button>
           ) : (
             <button 
               onClick={() => toast.info("Voice recording (mock): Starts listening...")}
               className="absolute right-1 top-1 bottom-1 aspect-square flex items-center justify-center text-muted-foreground hover:bg-black/5 rounded-full transition-colors disabled:opacity-50"
               disabled={isGenerating}
             >
               <Mic size={20} />
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
      <Panel defaultSize={40} minSize={30} className="h-full">
        {ChatContent}
      </Panel>
      <PanelResizeHandle className="w-2 bg-border flex items-center justify-center cursor-col-resize hover:bg-primary/20 transition-colors">
        <div className="w-1 h-8 bg-muted-foreground/30 rounded-full" />
      </PanelResizeHandle>
      <Panel defaultSize={60} minSize={30} className="h-full bg-secondary/30 p-6 overflow-y-auto">
        <div className="max-w-3xl mx-auto h-full flex flex-col justify-center">
          {activeQuote ? (
            <QuoteCard quote={activeQuote} />
          ) : (
            <div className="text-center p-8 border-2 border-dashed border-border rounded-xl bg-card">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Menu className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">No Quote Generated</h3>
              <p className="text-muted-foreground">Describe a job in the chat to generate a professional quotation.</p>
            </div>
          )}
        </div>
      </Panel>
    </PanelGroup>
  );
};

export default ChatPage;
