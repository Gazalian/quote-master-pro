import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Send, Mic, Image, Menu, Pencil, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import { QuoteCard } from "@/components/QuoteCard";
import { ChatHistoryDrawer } from "@/components/ChatHistoryDrawer";
import { useIsDesktop } from "@/hooks/use-mobile";
import { useBootstrap } from "@/hooks/useBootstrap";
import { useSessions, useSessionMeta, useSessionMessages, useUpsertSession } from "@/hooks/useSessions";
import { useGenerateQuote } from "@/hooks/useQuotes";
import { useAuth } from "@/lib/AuthContext";
import type { ChatMessage, Quote } from "@/types/quote";

const initialMessages: ChatMessage[] = [
  {
    id: "1",
    role: "ai",
    content:
      "Good morning! 👋 I'm OtoQuote AI. Tell me about the job you want to quote — you can type or attach a photo of the site.",
    type: "text",
  },
];

const newId = () => globalThis.crypto.randomUUID();

// ─── Client-side image compression (kept in the browser to save upload size) ─
async function compressImage(file: File): Promise<File> {
  if (file.size < 500_000) return file;
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 1280;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("compression failed"));
          resolve(new File([blob], file.name, { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.82,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image load failed"));
    };
    img.src = url;
  });
}

function fileToBase64Data(file: File): Promise<{ mimeType: string; data: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const comma = result.indexOf(",");
      resolve({ mimeType: file.type, data: result.slice(comma + 1) });
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

const PROGRESS_STAGES: [number, string][] = [
  [0, "Reading your job description..."],
  [800, "Looking up material prices..."],
  [1800, "Calculating quantities..."],
  [3200, "Building your quote..."],
  [5000, "Finalising the quotation..."],
];

const ChatPage = () => {
  const { user } = useAuth();
  const isDesktop = useIsDesktop();

  // Server-driven state
  const { data: sessionsList, isLoading: isLoadingSessions } = useSessions();
  const upsertSession = useUpsertSession();
  const generate = useGenerateQuote();
  const { data: bootstrap } = useBootstrap();

  // Local UI state — scoped to the user via React Query (cleared on signout)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [activeQuote, setActiveQuote] = useState<Quote | null>(null);
  const [quoteHistory, setQuoteHistory] = useState<Quote[]>([]);
  const [pendingQuestions, setPendingQuestions] = useState<string[]>([]);

  const [input, setInput] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [progressStage, setProgressStage] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Progressive load: metadata first (instant paint), then newest messages page.
  const { data: sessionMeta } = useSessionMeta(currentSessionId);
  const { data: messagePages } = useSessionMessages(currentSessionId);
  const loadedMessages = useMemo(
    () => messagePages?.pages.flatMap((p) => p.messages as ChatMessage[]) ?? null,
    [messagePages],
  );

  // ─── Restore session from server when one is selected ────────────────────
  useEffect(() => {
    if (!sessionMeta) return;
    setActiveQuote((sessionMeta.active_quote as Quote) ?? null);
    setQuoteHistory((sessionMeta.quote_history as Quote[]) ?? []);
    setPendingQuestions((sessionMeta.pending_questions as string[]) ?? []);
  }, [sessionMeta?.id]);

  useEffect(() => {
    if (loadedMessages && loadedMessages.length > 0) {
      setMessages(loadedMessages);
    }
  }, [loadedMessages]);

  // ─── Debounced session save (1.5s after last change) ─────────────────────
  useEffect(() => {
    if (!currentSessionId || messages.length <= 1 || !user) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);

    saveTimer.current = setTimeout(() => {
      const firstUser = messages.find((m) => m.role === "user");
      const title = firstUser ? firstUser.content.substring(0, 50) : "New Session";
      const lastAiText = [...messages].reverse().find((m) => m.type === "text" && m.role === "ai");
      const lastMessage = lastAiText?.content?.substring(0, 120) ?? "";

      upsertSession.mutate({
        id: currentSessionId,
        title,
        client: activeQuote?.client ?? "",
        last_message: lastMessage,
        messages,
        active_quote: activeQuote,
        quote_history: quoteHistory,
        pending_questions: pendingQuestions,
      });
    }, 1500);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [messages, activeQuote, quoteHistory, pendingQuestions, currentSessionId, user]);

  // ─── Scroll to bottom on new messages ─────────────────────────────────────
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  // ─── Image preview URLs (with proper cleanup) ─────────────────────────────
  useEffect(() => {
    const urls = selectedImages.map((f) => URL.createObjectURL(f));
    setImagePreviews(urls);
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [selectedImages]);

  // ─── Progress label animation while AI runs ──────────────────────────────
  useEffect(() => {
    if (!generate.isPending) {
      if (progressTimer.current) clearInterval(progressTimer.current);
      setProgressStage(0);
      return;
    }
    setProgressStage(0);
    progressTimer.current = setInterval(() => {
      setProgressStage((s) => Math.min(s + 1, PROGRESS_STAGES.length - 1));
    }, 1800);
    return () => {
      if (progressTimer.current) clearInterval(progressTimer.current);
    };
  }, [generate.isPending]);

  const progressLabel = useMemo(() => PROGRESS_STAGES[progressStage][1], [progressStage]);

  const conversationHistory = useMemo(
    () =>
      messages
        .filter((m) => m.type === "text" && !m.id.endsWith("-ai-loading"))
        .map((m) => ({ role: m.role === "user" ? ("user" as const) : ("ai" as const), content: m.content })),
    [messages],
  );

  // ─── Generate ─────────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    if (!input.trim() || generate.isPending) return;

    let sessionId = currentSessionId;
    if (!sessionId) {
      sessionId = newId();
      setCurrentSessionId(sessionId);
    }

    const prompt = input;
    setInput("");

    // Compress images off the main thread (canvas), then convert to base64
    const rawImages = selectedImages;
    const compressed = await Promise.all(rawImages.map(compressImage));
    const apiImages = await Promise.all(compressed.map(fileToBase64Data));

    // Optimistic chat append: user bubble + image bubbles + loading bubble
    const userMessage: ChatMessage = { id: newId(), role: "user", content: prompt, type: "text" };
    const imageBubbles: ChatMessage[] = apiImages.map((img) => ({
      id: newId(),
      role: "user",
      content: "",
      type: "image",
      imageUrl: `data:${img.mimeType};base64,${img.data}`,
    }));
    const loadingId = `${newId()}-ai-loading`;

    setMessages((prev) => [
      ...prev,
      userMessage,
      ...imageBubbles,
      { id: loadingId, role: "ai", content: PROGRESS_STAGES[0][1], type: "text" },
    ]);
    setSelectedImages([]);

    try {
      const res = await generate.mutateAsync({
        userMessage: prompt,
        sessionId,
        conversationHistory,
        pendingQuestions,
        images: apiImages,
      });

      const draft = res.draft;
      const generated: Quote = {
        id: `draft-${newId()}`,
        user_id: user?.id ?? "",
        ref: draft.ref,
        date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
        client: draft.client,
        description: draft.description,
        groups: draft.groups,
        grandTotal: draft.grandTotal,
        status: "APPROVED",
        templateStyle: draft.templateStyle ?? "modern",
        isDraft: true,
        session_id: sessionId,
        version: 1,
      };

      setActiveQuote(generated);
      setQuoteHistory((prev) => [...prev, generated]);
      setPendingQuestions((draft.clarifyingQuestions ?? []).slice(0, 2));

      setMessages((prev) => {
        const next = prev.filter((m) => !m.id.endsWith("-ai-loading"));
        const aiBubbles: ChatMessage[] = [];
        if (draft.reasoning) {
          aiBubbles.push({ id: newId(), role: "ai", content: draft.reasoning, type: "text" });
        }
        aiBubbles.push({
          id: newId(),
          role: "ai",
          content: isDesktop
            ? "Quote ready. Review the items and update any prices you know better."
            : "Quote ready — review the items below and adjust if needed.",
          type: "text",
        });
        aiBubbles.push({ id: newId(), role: "ai", content: "", type: "quote" });

        const newQs: string[] = (draft.clarifyingQuestions ?? []).slice(0, 2);
        if (newQs.length > 0) {
          aiBubbles.push({
            id: newId(),
            role: "ai",
            content: `To sharpen this quote, let me know:\n\n${newQs.map((q: string, i: number) => `${i + 1}. ${q}`).join("\n")}`,
            type: "text",
          });
        }
        return [...next, ...aiBubbles];
      });

      toast.success("Quote generated!");
    } catch (err: any) {
      console.error("Quote generation error:", err);
      toast.error(err?.message ?? "Failed to generate quote");
      setMessages((prev) => {
        const next = prev.filter((m) => !m.id.endsWith("-ai-loading"));
        return [
          ...next,
          { id: newId(), role: "ai", content: `Error: ${err?.message ?? "Please try again."}`, type: "text" },
        ];
      });
    }
  }, [input, currentSessionId, selectedImages, conversationHistory, pendingQuestions, isDesktop, user, generate]);

  const handleSaveEdit = useCallback(
    async (id: string) => {
      if (!editContent.trim() || generate.isPending) return;
      const newPrompt = editContent;
      setEditingMessageId(null);

      setMessages((prev) => {
        const idx = prev.findIndex((m) => m.id === id);
        if (idx === -1) return prev;
        const next = [...prev];
        next[idx] = { ...next[idx], content: newPrompt, isEdited: true };
        next.push({ id: `${newId()}-ai-loading`, role: "ai", content: "Understood! Updating the quote...", type: "text" });
        return next;
      });

      try {
        const res = await generate.mutateAsync({
          userMessage: newPrompt,
          sessionId: currentSessionId,
          conversationHistory,
          pendingQuestions,
        });

        const draft = res.draft;
        const generated: Quote = {
          id: `draft-${newId()}`,
          user_id: user?.id ?? "",
          ref: draft.ref,
          date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
          client: draft.client,
          description: draft.description,
          groups: draft.groups,
          grandTotal: draft.grandTotal,
          status: "APPROVED",
          templateStyle: draft.templateStyle ?? "modern",
          isDraft: true,
          session_id: currentSessionId ?? undefined,
          version: (quoteHistory.length || 0) + 1,
        };

        setActiveQuote(generated);
        setQuoteHistory((prev) => [...prev, generated]);
        setPendingQuestions((draft.clarifyingQuestions ?? []).slice(0, 2));

        setMessages((prev) => {
          const next = prev.filter((m) => !m.id.endsWith("-ai-loading"));
          return [
            ...next,
            { id: newId(), role: "ai", content: "I've updated the quote based on your new instructions.", type: "text" },
            { id: newId(), role: "ai", content: "", type: "quote" },
          ];
        });
        toast.success("Quote updated!");
      } catch (err: any) {
        toast.error(err?.message ?? "Failed to update quote");
        setMessages((prev) => prev.filter((m) => !m.id.endsWith("-ai-loading")));
      }
    },
    [editContent, currentSessionId, conversationHistory, pendingQuestions, quoteHistory, user, generate],
  );

  const startNewChat = useCallback(() => {
    setMessages(initialMessages);
    setActiveQuote(null);
    setQuoteHistory([]);
    setCurrentSessionId(null);
    setPendingQuestions([]);
  }, []);

  const startEditing = (msg: ChatMessage) => {
    setEditingMessageId(msg.id);
    setEditContent(msg.content);
  };

  const handleFileSelect: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const files = Array.from(e.target.files ?? []);
    setSelectedImages((prev) => [...prev, ...files].slice(0, 5));
    e.target.value = "";
  };

  const removeImage = (idx: number) =>
    setSelectedImages((prev) => prev.filter((_, i) => i !== idx));

  // ─── Render ──────────────────────────────────────────────────────────────
  const ChatContent = (
    <div className="flex flex-col h-full bg-background relative overscroll-none">
      {!isDesktop && (
        <ChatHistoryDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          sessions={sessionsList ?? []}
          isLoading={isLoadingSessions}
          onSelectSession={setCurrentSessionId}
          onNewChat={startNewChat}
        />
      )}

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
          <button
            onClick={startNewChat}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-[#0056D2] hover:bg-blue-50 active:bg-blue-100 transition-colors"
            title="New chat"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
      )}

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overscroll-contain bg-[#f0f2f5] px-3 py-4 space-y-3"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-end gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "ai" && msg.type !== "quote" && (
              <div className="w-7 h-7 rounded-full bg-[#0056D2] flex items-center justify-center shrink-0 mb-0.5 shadow-sm">
                <span className="text-white text-[9px] font-black">OQ</span>
              </div>
            )}
            {msg.role === "ai" && msg.type === "quote" && !isDesktop && <div className="w-7 shrink-0" />}

            {msg.type === "image" ? (
              <div className="max-w-[65%]">
                <img src={msg.imageUrl} alt="Uploaded" className="rounded-2xl border border-white/50 shadow-md max-h-[260px] w-full object-cover" />
              </div>
            ) : msg.type === "quote" && !isDesktop ? (
              <div className="flex-1 min-w-0">
                {activeQuote ? (
                  <QuoteCard quote={activeQuote} onQuoteSaved={(saved) => setActiveQuote(saved)} mode="chat" />
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
              <div className="px-4 py-3 bg-white rounded-2xl rounded-bl-sm shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 h-5">
                  <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
                  <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
                  <span className="text-[11px] text-gray-500 ml-1">{progressLabel}</span>
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
                      <button onClick={() => setEditingMessageId(null)} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors">
                        Cancel
                      </button>
                      <button onClick={() => handleSaveEdit(msg.id)} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white text-[#0056D2] hover:bg-gray-50 transition-colors">
                        Update
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    {msg.role === "user" && !generate.isPending && (
                      <div className="flex items-center justify-end gap-2 mt-1.5">
                        {msg.isEdited && <span className="text-[10px] text-white/60">edited</span>}
                        <button onClick={() => startEditing(msg)} className="flex items-center gap-1 text-white/60 hover:text-white/90 transition-colors" title="Edit message">
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
        <div className="h-2" />
      </div>

      <div
        className="px-3 pt-3 bg-white border-t border-gray-100 shrink-0"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
      >
        {selectedImages.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-2 px-1">
            {imagePreviews.map((url, idx) => (
              <div key={url} className="relative">
                <img src={url} alt={`Upload ${idx + 1}`} className="w-14 h-14 object-cover rounded-xl border border-gray-200 shadow-sm" />
                <button
                  onClick={() => removeImage(idx)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-sm"
                >
                  <X size={11} strokeWidth={3} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          <div className="relative shrink-0">
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={generate.isPending}
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

          <div className="flex-1 flex items-end bg-gray-100 rounded-[22px] px-4 py-2 border border-transparent focus-within:border-[#0056D2]/30 focus-within:bg-white transition-all duration-200">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (isDesktop && e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type your job description..."
              className="flex-1 bg-transparent text-gray-900 placeholder:text-gray-400 outline-none resize-none"
              disabled={generate.isPending}
              rows={1}
              style={{ minHeight: "24px", maxHeight: "120px", lineHeight: "1.5", fontSize: "16px" }}
              onInput={(e) => {
                const t = e.target as HTMLTextAreaElement;
                t.style.height = "24px";
                t.style.height = Math.min(t.scrollHeight, 120) + "px";
                t.style.overflowY = t.scrollHeight > 120 ? "auto" : "hidden";
              }}
            />
          </div>

          {input.trim() || generate.isPending ? (
            <button
              onClick={handleSend}
              disabled={generate.isPending}
              className="w-10 h-10 shrink-0 flex items-center justify-center bg-[#0056D2] text-white rounded-full shadow-md active:scale-95 transition-all disabled:opacity-60"
            >
              {generate.isPending ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} className="ml-0.5" />}
            </button>
          ) : (
            <button
              onClick={() => toast.info("Voice input coming soon!", { description: "Please type your message for now." })}
              disabled={generate.isPending}
              className="w-10 h-10 shrink-0 flex items-center justify-center bg-gray-100 text-gray-500 rounded-full active:bg-gray-200 transition-colors"
            >
              <Mic size={19} />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (!isDesktop) return ChatContent;

  return (
    <PanelGroup direction="horizontal" className="h-full w-full">
      <Panel defaultSize={25} minSize={20} className="h-full border-r border-border">
        <ChatHistoryDrawer
          variant="sidebar"
          sessions={sessionsList ?? []}
          isLoading={isLoadingSessions}
          onSelectSession={setCurrentSessionId}
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
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none" />
        <div className="absolute top-0 right-0 left-0 h-40 bg-gradient-to-b from-gray-50/80 to-transparent pointer-events-none" />

        {quoteHistory.length > 0 && (
          <div className="relative z-10 flex-shrink-0 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 overflow-x-auto">
            <div className="flex gap-2">
              {quoteHistory.map((quote, index) => (
                <button
                  key={quote.id}
                  onClick={() => setActiveQuote(quote)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    activeQuote?.id === quote.id
                      ? "bg-blue-50 text-[#0056D2] shadow-sm border border-blue-100"
                      : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                  }`}
                >
                  Quote {index + 1} - {quote.ref}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="relative z-10 flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-4xl mx-auto h-full flex flex-col justify-center">
            {activeQuote ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 pb-12">
                <QuoteCard
                  quote={activeQuote}
                  onQuoteSaved={(saved) => {
                    setActiveQuote(saved);
                    setQuoteHistory((prev) => prev.map((q) => (q.id === saved.id ? saved : q)));
                  }}
                  mode="chat"
                />
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
                <div className="max-w-[420px] w-full mx-auto bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_40px_rgb(0,0,0,0.06)] border border-gray-100 p-10 flex flex-col items-center text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-[#0056D2] to-[#F58220]" />
                  <div className="w-20 h-20 bg-gradient-to-tr from-blue-50 to-indigo-50 text-[#0056D2] rounded-3xl flex items-center justify-center mb-8 shadow-inner ring-1 ring-blue-100/50 transform -rotate-3 transition-transform hover:rotate-0 duration-300">
                    <Menu className="w-10 h-10" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-[22px] font-semibold mb-3 text-gray-900 tracking-tight">No Quote Generated</h3>
                  <p className="text-gray-500 text-[15px] leading-relaxed mb-8">
                    Start a conversation to generate your first professional quotation with AI.
                  </p>
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
