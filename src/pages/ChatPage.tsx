import { useState, useRef, useEffect } from "react";
import { Send, Mic, Image, Plus } from "lucide-react";
import { QuoteCard } from "@/components/QuoteCard";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  type: "text" | "quote";
}

const sampleQuote = {
  ref: "OQ-2026-0047",
  date: "13 Mar 2026",
  client: "Alhaji Musa Bello",
  description: "3 Bedroom Flat, Wuse 2, Abuja",
  groups: [
    {
      name: "Wiring Materials",
      items: [
        { name: '2.5mm Twin Cable (Nigerchin)', qty: 10, unit: 'rolls', unitPrice: 4800, total: 48000, source: 'my_price' as const },
        { name: '4mm Single Cable', qty: 5, unit: 'rolls', unitPrice: 3200, total: 16000, source: 'ai_estimate' as const },
        { name: 'Conduit Pipe (20mm)', qty: 30, unit: 'lengths', unitPrice: 450, total: 13500, source: 'my_price' as const },
        { name: 'Junction Boxes', qty: 20, unit: 'pcs', unitPrice: 120, total: 2400, source: 'ai_estimate' as const },
      ],
    },
    {
      name: "DB Board & Protection",
      items: [
        { name: '6-way DB Board', qty: 1, unit: 'unit', unitPrice: 22000, total: 22000, source: 'my_price' as const },
        { name: '20A MCB Breakers', qty: 6, unit: 'pcs', unitPrice: 1800, total: 10800, source: 'ai_estimate' as const },
      ],
    },
    {
      name: "Labour",
      items: [
        { name: 'Point wiring (per point)', qty: 42, unit: 'points', unitPrice: 2500, total: 105000, source: 'my_price' as const },
        { name: 'DB Board installation', qty: 1, unit: 'job', unitPrice: 15000, total: 15000, source: 'ai_estimate' as const },
      ],
    },
  ],
  grandTotal: 232700,
};

const initialMessages: Message[] = [
  {
    id: "1",
    role: "ai",
    content: "Good morning! 👋 I'm OtoQuote AI. Tell me about the job you want to quote — you can type, send a voice note, or attach a photo of the site.",
    type: "text",
  },
  {
    id: "2",
    role: "user",
    content: "I need a quote for rewiring a 3 bedroom flat in Wuse 2, Abuja. Single phase, I'm supplying materials. Client is Alhaji Musa Bello.",
    type: "text",
  },
  {
    id: "3",
    role: "ai",
    content: "Got it! Rewiring a 3-bed flat in Wuse 2 for Alhaji Musa Bello. Single phase, you're supplying materials. Let me generate the quote...",
    type: "text",
  },
  {
    id: "4",
    role: "ai",
    content: "",
    type: "quote",
  },
];

const ChatPage = () => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: "user", content: input, type: "text" },
    ]);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 h-14 bg-primary shrink-0">
        <span className="text-primary-foreground font-semibold text-lg">OtoQuote AI</span>
        <button className="flex items-center gap-1.5 bg-primary-foreground/20 text-primary-foreground px-3 py-1.5 rounded-full text-sm font-medium">
          <Plus size={16} />
          New Chat
        </button>
      </div>

      {/* Chat body */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-chat-bg px-3 py-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.type === "quote" ? (
              <div className="w-full max-w-[95%]">
                <QuoteCard quote={sampleQuote} />
              </div>
            ) : (
              <div
                className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-[15px] leading-relaxed ${
                  msg.role === "user"
                    ? "bg-chat-bubble-user text-chat-bubble-user-fg rounded-br-md"
                    : "bg-chat-bubble-ai text-chat-bubble-ai-fg rounded-bl-md shadow-sm"
                }`}
              >
                {msg.content}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input bar */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-card border-t border-border shrink-0">
        <button className="min-w-[44px] min-h-[44px] flex items-center justify-center text-muted-foreground">
          <Image size={22} />
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type your message..."
          className="flex-1 bg-secondary rounded-full px-4 py-2.5 text-[15px] text-foreground placeholder:text-muted-foreground outline-none"
        />
        {input.trim() ? (
          <button
            onClick={handleSend}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center bg-primary text-primary-foreground rounded-full"
          >
            <Send size={20} />
          </button>
        ) : (
          <button className="min-w-[44px] min-h-[44px] flex items-center justify-center text-muted-foreground">
            <Mic size={22} />
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
