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
import { useGenerateQuote, useUpdateQuote, type GeneratedQuoteDraft } from "@/hooks/useQuotes";
import { useUploadChatImage } from "@/hooks/useImageUpload";
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

function buildConversationHistory(messages: ChatMessage[]) {
  return messages
    .filter((m) => m.type === "text" && !m.id.endsWith("-ai-loading") && m.content.trim())
    .map((m) => ({
      role: m.role === "user" ? ("user" as const) : ("ai" as const),
      content: m.content,
    }));
}

function isSavedQuote(quote: Quote | null): quote is Quote {
  return !!quote && !quote.isDraft && !!quote.id && !quote.id.startsWith("draft-");
}

function quotePatchFromQuote(quote: Quote): Record<string, unknown> {
  return {
    client_name: quote.client,
    description: quote.description,
    status: quote.status,
    template_style: quote.templateStyle,
    grand_total: quote.grandTotal,
    data: { groups: quote.groups },
  };
}

function getErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

const ChatPage = () => {
  const { user } = useAuth();
  const isDesktop = useIsDesktop();

  // Server-driven state
  const { data: sessionsList, isLoading: isLoadingSessions } = useSessions();
  const upsertSession = useUpsertSession();
  const generate = useGenerateQuote();
  const updateQuote = useUpdateQuote();
  const uploadImage = useUploadChatImage();
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
    () =>
      messagePages?.pages
        .slice()
        .sort((a, b) => a.range.start - b.range.start)
        .flatMap((p) => p.messages as ChatMessage[]) ?? null,
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
  }, [sessionMeta]);

  // Hydrate messages from the paginated endpoint
  useEffect(() => {
    if (!loadedMessages) return;
    setMessages(loadedMessages.length > 0 ? loadedMessages : initialMessages);
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
  }, [messages, activeQuote, quoteHistory, pendingQuestions, currentSessionId, user, upsertSession]);

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
  const canSend = input.trim().length > 0 || selectedImages.length > 0;

  const conversationHistory = useMemo(
    () => buildConversationHistory(messages),
    [messages],
  );

  const commitActiveQuote = useCallback((quote: Quote, replaceId?: string | null) => {
    setActiveQuote(quote);
    setQuoteHistory((prev) => {
      const idx = prev.findIndex((q) => q.id === quote.id || (!!replaceId && q.id === replaceId));
      if (idx === -1) return [...prev, quote];
      const next = [...prev];
      next[idx] = quote;
      return next;
    });
  }, []);

  const quoteFromDraft = useCallback(
    (draft: GeneratedQuoteDraft, sessionId: string | null, previousQuote: Quote | null): Quote => ({
      id: isSavedQuote(previousQuote) ? previousQuote.id : `draft-${newId()}`,
      user_id: previousQuote?.user_id || user?.id || "",
      ref: draft.ref,
      date:
        previousQuote?.date ??
        new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      client: draft.client,
      description: draft.description,
      groups: draft.groups,
      grandTotal: draft.grandTotal,
      status: previousQuote?.status ?? "APPROVED",
      templateStyle: draft.templateStyle ?? previousQuote?.templateStyle ?? "modern",
      isDraft: isSavedQuote(previousQuote) ? undefined : true,
      session_id: sessionId ?? previousQuote?.session_id,
      version: previousQuote?.version ?? 1,
      created_at: previousQuote?.created_at,
      updated_at: previousQuote?.updated_at,
    }),
    [user?.id],
  );

  // ─── Generate ─────────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    if ((!input.trim() && selectedImages.length === 0) || generate.isPending) return;

    let sessionId = currentSessionId;
    if (!sessionId) {
      sessionId = newId();
      setCurrentSessionId(sessionId);
    }

    const prompt = input.trim() || "Please generate a quotation from the attached image(s).";
    setInput("");

    // ── Image pipeline ──────────────────────────────────────────────────────
    // 1. Compress in canvas (already non-blocking-ish via image decode)
    // 2. Upload to backend → Supabase Storage → get a permanent URL
    // 3. Also build the in-memory base64 for the AI call (Gemini needs bytes)
    // The upload runs in parallel with the AI generation kickoff so the user
    // never waits on the upload twice.
    const rawImages = selectedImages;
    const compressed = await Promise.all(rawImages.map(compressImage));

    // Compute base64 for Gemini AND kick off uploads in parallel
    const [apiImages, uploaded] = await Promise.all([
      Promise.all(compressed.map(fileToBase64Data)),
      Promise.all(
        compressed.map((file) =>
          uploadImage
            .mutateAsync({ file, sessionId })
            .catch((err) => {
              console.warn("[ChatPage] image upload failed, falling back to in-memory only", err);
              return null;
            }),
        ),
      ),
    ]);

    const now = new Date().toISOString();
    const userMessage: ChatMessage = {
      id: newId(),
      role: "user",
      content: prompt,
      type: "text",
      timestamp: now,
      user_id: user?.id,
      session_id: sessionId,
    };
    const imageBubbles: ChatMessage[] = uploaded.map((u, idx) => {
      // Persisted message uses the Storage URL when available. If upload
      // failed (e.g. backend offline) we still show the image inline using
      // the base64 data URL — the user sees it locally, but the bubble is
      // skipped on save by the backend's defensive strip-data-URL logic.
      const fallback = apiImages[idx];
      const url = u?.url ?? `data:${fallback.mimeType};base64,${fallback.data}`;
      return {
        id: newId(),
        role: "user",
        content: "",
        type: "image",
        imageUrl: url,
        timestamp: now,
        user_id: user?.id,
        session_id: sessionId,
      };
    });
    const loadingId = `${newId()}-ai-loading`;

    setMessages((prev) => [
      ...prev,
      userMessage,
      ...imageBubbles,
      { id: loadingId, role: "ai", content: PROGRESS_STAGES[0], type: "text", timestamp: now },
    ]);
    setSelectedImages([]);

    // Wire up cancellation
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    const quoteBeforeRequest = activeQuote;

    try {
      const res = await generate.mutateAsync({
        userMessage: prompt,
        sessionId,
        conversationHistory,
        currentQuote: quoteBeforeRequest,
        pendingQuestions,
        images: apiImages,
        signal: ac.signal,
      });

      const draft = res.draft;
      const generated = quoteFromDraft(draft, sessionId, quoteBeforeRequest);
      if (isSavedQuote(quoteBeforeRequest)) {
        await updateQuote.mutateAsync({
          id: quoteBeforeRequest.id,
          patch: quotePatchFromQuote(generated),
        });
      }

      commitActiveQuote(generated, isSavedQuote(quoteBeforeRequest) ? quoteBeforeRequest.id : null);
      setPendingQuestions((draft.clarifyingQuestions ?? []).slice(0, 2));

      setMessages((prev) => {
        const next = prev.filter((m) => !m.id.endsWith("-ai-loading"));
        const ts = new Date().toISOString();
        const meta = { timestamp: ts, user_id: user?.id, session_id: sessionId };
        const aiBubbles: ChatMessage[] = [];
        if (draft.reasoning) {
          aiBubbles.push({ id: newId(), role: "ai", content: draft.reasoning, type: "text", ...meta });
        }
        aiBubbles.push({
          id: newId(),
          role: "ai",
          content: isDesktop
            ? "Quote ready. Review the items and update any prices you know better."
            : "Quote ready — review the items below and adjust if needed.",
          type: "text",
          ...meta,
        });
        aiBubbles.push({ id: newId(), role: "ai", content: "", type: "quote", ...meta });

        const newQs: string[] = (draft.clarifyingQuestions ?? []).slice(0, 2);
        if (newQs.length > 0) {
          aiBubbles.push({
            id: newId(),
            role: "ai",
            content: `To sharpen this quote, let me know:\n\n${newQs.map((q: string, i: number) => `${i + 1}. ${q}`).join("\n")}`,
            type: "text",
            ...meta,
          });
        }
        return [...next, ...aiBubbles];
      });

      toast.success(isSavedQuote(quoteBeforeRequest) ? "Quote updated" : "Quote generated");
    } catch (err: unknown) {
      if ((err instanceof Error && err.name === "AbortError") || ac.signal.aborted) {
        setMessages((prev) => prev.filter((m) => !m.id.endsWith("-ai-loading")));
        toast.info("Cancelled");
        return;
      }
      console.error("Quote generation error:", err);
      toast.error(getErrorMessage(err, "Failed to generate quote"));
      setMessages((prev) => {
        const next = prev.filter((m) => !m.id.endsWith("-ai-loading"));
        return [
          ...next,
          {
            id: newId(),
            role: "ai",
            content: `Sorry — that didn't work. ${getErrorMessage(err, "Please try again.")}`,
            type: "text",
          },
        ];
      });
    }
  }, [
    input, currentSessionId, selectedImages, conversationHistory, pendingQuestions,
    activeQuote, isDesktop, user, generate, uploadImage, updateQuote, quoteFromDraft, commitActiveQuote,
  ]);

  const handleCancelGenerate = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const handleSaveEdit = useCallback(
    async (id: string) => {
      if (!editContent.trim() || generate.isPending) return;
      const newPrompt = editContent;
      setEditingMessageId(null);

      const editedMessages = messages.map((m) =>
        m.id === id ? { ...m, content: newPrompt, isEdited: true } : m,
      );

      setMessages([
        ...editedMessages,
        {
          id: `${newId()}-ai-loading`,
          role: "ai",
          content: "Understood! Updating the quote...",
          type: "text",
        },
      ]);

      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      const quoteBeforeRequest = activeQuote;
      const editedConversationHistory = buildConversationHistory(editedMessages);

      try {
        const res = await generate.mutateAsync({
          userMessage: newPrompt,
          sessionId: currentSessionId,
          conversationHistory: editedConversationHistory,
          currentQuote: quoteBeforeRequest,
          pendingQuestions,
          signal: ac.signal,
        });

        const draft = res.draft;
        const generated = quoteFromDraft(draft, currentSessionId, quoteBeforeRequest);
        if (isSavedQuote(quoteBeforeRequest)) {
          await updateQuote.mutateAsync({
            id: quoteBeforeRequest.id,
            patch: quotePatchFromQuote(generated),
          });
        }

        commitActiveQuote(generated, isSavedQuote(quoteBeforeRequest) ? quoteBeforeRequest.id : null);
        setPendingQuestions((draft.clarifyingQuestions ?? []).slice(0, 2));

        setMessages((prev) => {
          const next = prev.filter((m) => !m.id.endsWith("-ai-loading"));
          const meta = {
            timestamp: new Date().toISOString(),
            user_id: user?.id,
            session_id: currentSessionId ?? undefined,
          };
          return [
            ...next,
            { id: newId(), role: "ai", content: "Updated based on your new instructions.", type: "text", ...meta },
            { id: newId(), role: "ai", content: "", type: "quote", ...meta },
          ];
        });
        toast.success("Quote updated");
      } catch (err: unknown) {
        if ((err instanceof Error && err.name === "AbortError") || ac.signal.aborted) {
          setMessages((prev) => prev.filter((m) => !m.id.endsWith("-ai-loading")));
          return;
        }
        toast.error(getErrorMessage(err, "Failed to update quote"));
        setMessages((prev) => prev.filter((m) => !m.id.endsWith("-ai-loading")));
      }
    },
    [
      editContent, messages, activeQuote, currentSessionId, pendingQuestions, user,
      generate, updateQuote, quoteFromDraft, commitActiveQuote,
    ],
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
    setMessages([]);
    setActiveQuote(null);
    setQuoteHistory([]);
    setPendingQuestions([]);
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
    return (
      <QuoteCard
        quote={activeQuote}
        onQuoteSaved={(saved) => commitActiveQuote(saved, activeQuote.id)}
        mode="chat"
      />
    );
  }, [activeQuote, commitActiveQuote]);

  // ─── Render: chat surface ────────────────────────────────────────────────
  const ChatContent = (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-background relative overscroll-none">
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
        <div className="flex items-center justify-between px-3 h-14 bg-white border-b border-gray-100 shrink-0 shadow-sm lg:hidden">
          <div className="flex min-w-0 items-center gap-2">
            <button
              onClick={() => setDrawerOpen(true)}
              className="touch-target -ml-1 flex items-center justify-center rounded-xl text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors"
              aria-label="Open chat history"
            >
              <Menu size={20} />
            </button>
            <div className="flex min-w-0 items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#0056D2] flex items-center justify-center shrink-0">
                <span className="text-white text-[10px] font-black">OQ</span>
              </div>
              <span className="truncate font-semibold text-gray-900 text-[15px]">OtoQuote AI</span>
            </div>
          </div>
          <button
            onClick={startNewChat}
            className="touch-target -mr-1 flex items-center justify-center rounded-xl text-[#0056D2] hover:bg-blue-50 active:bg-blue-100 transition-colors"
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
        className="mobile-scroll flex-1 bg-[#f0f2f5] px-3 py-4 space-y-3"
        style={{ scrollPaddingBottom: "calc(7rem + env(safe-area-inset-bottom, 0px))" }}
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
        className="keyboard-aware-bottom px-3 pt-3 bg-white border-t border-gray-100 shrink-0"
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

        <div className="flex min-w-0 items-end gap-2">
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
              className="touch-target flex items-center justify-center rounded-2xl bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300 transition-colors disabled:opacity-40"
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
          <div className="min-w-0 flex-1 flex items-end bg-gray-100 rounded-[22px] px-4 py-2 border border-transparent focus-within:border-[#0056D2]/30 focus-within:bg-white transition-all duration-200">
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
              className="min-w-0 flex-1 bg-transparent text-gray-900 placeholder:text-gray-400 outline-none resize-none"
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
              className="touch-target shrink-0 flex items-center justify-center bg-destructive/10 text-destructive rounded-full shadow-sm hover:bg-destructive/20 active:scale-95 transition-all"
              title="Cancel"
              aria-label="Cancel generation"
            >
              <StopCircle size={20} />
            </button>
          ) : canSend ? (
            <button
              onClick={handleSend}
              className="touch-target shrink-0 flex items-center justify-center bg-[#0056D2] text-white rounded-full shadow-md hover:bg-[#0056D2]/90 active:scale-95 transition-all"
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
              className="touch-target shrink-0 flex items-center justify-center bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 active:bg-gray-300 transition-colors"
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
                  onQuoteSaved={(saved) => commitActiveQuote(saved, activeQuote.id)}
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
