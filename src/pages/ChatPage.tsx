import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Send, Mic, Image, Menu, Loader2, X, StopCircle } from "lucide-react";
import { toast } from "sonner";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import { QuoteCard } from "@/components/QuoteCard";
import { ChatHistoryDrawer } from "@/components/ChatHistoryDrawer";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { ChatSkeleton } from "@/components/skeletons";
import { useIsDesktop } from "@/hooks/use-mobile";
import { useBootstrap } from "@/hooks/useBootstrap";
import { useSessions, useSessionMeta, useSessionMessages, useUpsertSession } from "@/hooks/useSessions";
import { useGenerateQuote } from "@/hooks/useQuotes";
import { useAuth } from "@/lib/AuthContext";
import type { ChatMessage, Quote } from "@/types/quote";

// We intentionally show no greeting on first paint for a returning user with
// no sessions — keeps the surface clean. For a brand-new chat we inject this.
const initialMessages: ChatMessage[] = [
  {
    id: "1",
    role: "ai",
    content:
      "👋 I'm OtoQuote AI. Tell me about the job you want to quote — type it, or attach a photo of the site.",
    type: "text",
  },
];

const newId = () => globalThis.crypto.randomUUID();

// ─── Image compression: 4MB phone photo → ~120KB JPEG ──────────────────────
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

// Stage labels keyed by time elapsed; the AI call returns in 5-12s typically.
const PROGRESS_STAGES = [
  "Reading your job description…",
  "Looking up material prices…",
  "Calculating quantities…",
  "Building your quote…",
  "Finalising the quotation…",
] as const;

const ChatPage = () => {
  const { user } = useAuth();
  const isDesktop = useIsDesktop();

  // Server-driven state
  const { data: sessionsList, isLoading: isLoadingSessions } = useSessions();
  const upsertSession = useUpsertSession();
  const generate = useGenerateQuote();
  useBootstrap(); // prime the cache — referenced by QuoteCard

  // Local UI state
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
  // AbortController for the in-flight AI request — lets us cancel on session
  // switch or via the explicit Cancel button.
  const abortRef = useRef<AbortController | null>(null);

  // Progressive load: metadata first (instant), messages second (paginated).
  const { data: sessionMeta } = useSessionMeta(currentSessionId);
  const { data: messagePages, isFetching: isFetchingMessages } = useSessionMessages(currentSessionId);
  const loadedMessages = useMemo(
    () => messagePages?.pages.flatMap((p) => p.messages as ChatMessage[]) ?? null,
    [messagePages],
  );

  const showChatSkeleton =
    !!currentSessionId && !loadedMessages && isFetchingMessages;

  // Hydrate header state from the lightweight meta call
  useEffect(() => {
    if (!sessionMeta) return;
    setActiveQuote((sessionMeta.active_quote as Quote) ?? null);
    setQuoteHistory((sessionMeta.quote_history as Quote[]) ?? []);
    setPendingQuestions((sessionMeta.pending_questions as string[]) ?? []);
  }, [sessionMeta?.id]);

  // Hydrate messages from the paginated endpoint
  useEffect(() => {
    if (loadedMessages && loadedMessages.length > 0) setMessages(loadedMessages);
  }, [loadedMessages]);

  // ─── Cancel in-flight AI when user switches sessions ─────────────────────
  useEffect(() => {
    return () => {
      // Component unmount or session id change: abort any pending call
      abortRef.current?.abort();
    };
  }, [currentSessionId]);

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

  // ─── Scroll to bottom on new messages (rAF: avoid layout-thrash) ──────────
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const id = requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    });
    return () => cancelAnimationFrame(id);
  }, [messages]);

  // ─── Image preview URLs (revoked on cleanup) ──────────────────────────────
  useEffect(() => {
    const urls = selectedImages.map((f) => URL.createObjectURL(f));
    setImagePreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [selectedImages]);

  // ─── Progress animation while AI runs ────────────────────────────────────
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

  const progressLabel = PROGRESS_STAGES[progressStage];

  const conversationHistory = useMemo(
    () =>
      messages
        .filter((m) => m.type === "text" && !m.id.endsWith("-ai-loading"))
        .map((m) => ({
          role: m.role === "user" ? ("user" as const) : ("ai" as const),
          content: m.content,
        })),
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

    const rawImages = selectedImages;
    const compressed = await Promise.all(rawImages.map(compressImage));
    const apiImages = await Promise.all(compressed.map(fileToBase64Data));

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
      { id: loadingId, role: "ai", content: PROGRESS_STAGES[0], type: "text" },
    ]);
    setSelectedImages([]);

    // Wire up cancellation
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const res = await generate.mutateAsync({
        userMessage: prompt,
        sessionId,
        conversationHistory,
        pendingQuestions,
        images: apiImages,
        signal: ac.signal,
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

      toast.success("Quote generated");
    } catch (err: any) {
      if (err?.name === "AbortError" || ac.signal.aborted) {
        setMessages((prev) => prev.filter((m) => !m.id.endsWith("-ai-loading")));
        toast.info("Cancelled");
        return;
      }
      console.error("Quote generation error:", err);
      toast.error(err?.message ?? "Failed to generate quote");
      setMessages((prev) => {
        const next = prev.filter((m) => !m.id.endsWith("-ai-loading"));
        return [
          ...next,
          {
            id: newId(),
            role: "ai",
            content: `Sorry — that didn't work. ${err?.message ?? "Please try again."}`,
            type: "text",
          },
        ];
      });
    }
  }, [
    input, currentSessionId, selectedImages, conversationHistory, pendingQuestions,
    isDesktop, user, generate,
  ]);

  const handleCancelGenerate = useCallback(() => {
    abortRef.current?.abort();
  }, []);

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
        next.push({
          id: `${newId()}-ai-loading`,
          role: "ai",
          content: "Understood! Updating the quote…",
          type: "text",
        });
        return next;
      });

      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      try {
        const res = await generate.mutateAsync({
          userMessage: newPrompt,
          sessionId: currentSessionId,
          conversationHistory,
          pendingQuestions,
          signal: ac.signal,
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
            { id: newId(), role: "ai", content: "Updated based on your new instructions.", type: "text" },
            { id: newId(), role: "ai", content: "", type: "quote" },
          ];
        });
        toast.success("Quote updated");
      } catch (err: any) {
        if (err?.name === "AbortError" || ac.signal.aborted) {
          setMessages((prev) => prev.filter((m) => !m.id.endsWith("-ai-loading")));
          return;
        }
        toast.error(err?.message ?? "Failed to update quote");
        setMessages((prev) => prev.filter((m) => !m.id.endsWith("-ai-loading")));
      }
    },
    [editContent, currentSessionId, conversationHistory, pendingQuestions, quoteHistory, user, generate],
  );

  const startNewChat = useCallback(() => {
    abortRef.current?.abort();
    setMessages(initialMessages);
    setActiveQuote(null);
    setQuoteHistory([]);
    setCurrentSessionId(null);
    setPendingQuestions([]);
    setDrawerOpen(false);
  }, []);

  const startEditing = useCallback((msg: ChatMessage) => {
    setEditingMessageId(msg.id);
    setEditContent(msg.content);
  }, []);

  const cancelEditing = useCallback(() => setEditingMessageId(null), []);

  const onSwitchSession = useCallback((id: string) => {
    abortRef.current?.abort();
    setCurrentSessionId(id);
  }, []);

  const handleFileSelect: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const files = Array.from(e.target.files ?? []);
    setSelectedImages((prev) => [...prev, ...files].slice(0, 5));
    e.target.value = "";
  };

  const removeImage = useCallback(
    (idx: number) => setSelectedImages((prev) => prev.filter((_, i) => i !== idx)),
    [],
  );

  // Memoised quote slot — referenced by mobile quote bubbles; recomputed only
  // when the active quote identity changes, so MessageBubble's quoteSlot prop
  // stays stable for non-quote bubbles.
  const quoteSlot = useMemo<React.ReactNode>(() => {
    if (!activeQuote) {
      return (
        <div className="text-sm bg-destructive/10 text-destructive p-4 rounded-2xl border border-destructive/20">
          Quote data unavailable.
        </div>
      );
    }
    return <QuoteCard quote={activeQuote} onQuoteSaved={(saved) => setActiveQuote(saved)} mode="chat" />;
  }, [activeQuote]);

  // ─── Render: chat surface ────────────────────────────────────────────────
  const ChatContent = (
    <div className="flex flex-col h-full bg-background relative overscroll-none">
      {!isDesktop && (
        <ChatHistoryDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          sessions={sessionsList ?? []}
          isLoading={isLoadingSessions}
          onSelectSession={onSwitchSession}
          onNewChat={startNewChat}
        />
      )}

      {/* ── Mobile top bar ──────────────────────────────────────── */}
      {!isDesktop && (
        <div className="flex items-center justify-between px-4 h-14 bg-white border-b border-gray-100 shrink-0 shadow-sm lg:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawerOpen(true)}
              className="w-11 h-11 -ml-2 flex items-center justify-center rounded-xl text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors"
              aria-label="Open chat history"
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
            className="w-11 h-11 -mr-2 flex items-center justify-center rounded-xl text-[#0056D2] hover:bg-blue-50 active:bg-blue-100 transition-colors"
            title="New chat"
            aria-label="Start new chat"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
      )}

      {/* ── Chat body ───────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overscroll-contain bg-[#f0f2f5] px-3 py-4 space-y-3"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {showChatSkeleton ? (
          <ChatSkeleton />
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              isDesktop={isDesktop}
              canEdit={!generate.isPending}
              editing={editingMessageId === msg.id}
              editValue={editContent}
              setEditValue={setEditContent}
              onStartEdit={startEditing}
              onCancelEdit={cancelEditing}
              onSubmitEdit={handleSaveEdit}
              progressLabel={progressLabel}
              quoteSlot={quoteSlot}
            />
          ))
        )}
        <div className="h-2" />
      </div>

      {/* ── Input bar ───────────────────────────────────────────── */}
      <div
        className="px-3 pt-3 bg-white border-t border-gray-100 shrink-0"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
      >
        {selectedImages.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-2 px-1">
            {imagePreviews.map((url, idx) => (
              <div key={url} className="relative">
                <img
                  src={url}
                  alt={`Upload ${idx + 1}`}
                  className="w-14 h-14 object-cover rounded-xl border border-gray-200 shadow-sm"
                  loading="lazy"
                  decoding="async"
                />
                <button
                  onClick={() => removeImage(idx)}
                  className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-sm"
                  aria-label="Remove image"
                >
                  <X size={12} strokeWidth={3} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2">
          {/* Attach */}
          <div className="relative shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={generate.isPending}
              className="w-11 h-11 flex items-center justify-center rounded-2xl bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300 transition-colors disabled:opacity-40"
              title="Attach image"
              aria-label="Attach image"
            >
              <Image size={19} />
              {selectedImages.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#0056D2] text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                  {selectedImages.length}
                </span>
              )}
            </button>
          </div>

          {/* Composer */}
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
              placeholder="Describe the job…"
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

          {/* Send / Cancel / Mic */}
          {generate.isPending ? (
            <button
              onClick={handleCancelGenerate}
              className="w-11 h-11 shrink-0 flex items-center justify-center bg-destructive/10 text-destructive rounded-full shadow-sm hover:bg-destructive/20 active:scale-95 transition-all"
              title="Cancel"
              aria-label="Cancel generation"
            >
              <StopCircle size={20} />
            </button>
          ) : input.trim() ? (
            <button
              onClick={handleSend}
              className="w-11 h-11 shrink-0 flex items-center justify-center bg-[#0056D2] text-white rounded-full shadow-md hover:bg-[#0056D2]/90 active:scale-95 transition-all"
              aria-label="Send message"
            >
              <Send size={17} className="ml-0.5" />
            </button>
          ) : (
            <button
              onClick={() =>
                toast.info("Voice input coming soon!", {
                  description: "Type your message for now.",
                })
              }
              className="w-11 h-11 shrink-0 flex items-center justify-center bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 active:bg-gray-300 transition-colors"
              aria-label="Voice input"
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
          onSelectSession={onSwitchSession}
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
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all min-h-[36px] ${
                    activeQuote?.id === quote.id
                      ? "bg-blue-50 text-[#0056D2] shadow-sm border border-blue-100"
                      : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                  }`}
                >
                  Quote {index + 1} • {quote.ref}
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
                  <h3 className="text-[22px] font-semibold mb-3 text-gray-900 tracking-tight">
                    No quote yet
                  </h3>
                  <p className="text-gray-500 text-[15px] leading-relaxed">
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
