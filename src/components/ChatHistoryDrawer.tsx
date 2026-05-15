import { X, MessageSquare, Plus } from "lucide-react";
import { ChatSession } from "@/types/quote";
import { SessionListSkeleton } from "./skeletons";

interface Props {
  open?: boolean;
  variant?: "drawer" | "sidebar";
  sessions?: ChatSession[];
  isLoading?: boolean;
  onClose?: () => void;
  onSelectSession?: (id: string) => void;
  onNewChat?: () => void;
}

export const ChatHistoryDrawer = ({ open = true, variant = "drawer", sessions = [], isLoading = false, onClose, onSelectSession, onNewChat }: Props) => {
  const innerContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-border shrink-0">
        <h2 className="font-bold text-foreground">Chat History</h2>
        {variant === "drawer" && onClose && (
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* New Chat button */}
      <div className="px-3 pt-3 pb-1">
        <button
          onClick={() => { onNewChat?.(); onClose?.(); }}
          className="w-full flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-semibold"
        >
          <Plus size={18} />
          New Chat
        </button>
      </div>

      {/* Sessions list */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {isLoading ? (
          <SessionListSkeleton />
        ) : sessions.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8 px-4">
            No chats yet. Start a new conversation to generate your first quote.
          </p>
        ) : sessions.map((session) => (
          <button
            key={session.id}
            onClick={() => { onSelectSession?.(session.id); onClose?.(); }}
            className="w-full text-left px-3 py-3 rounded-xl hover:bg-muted transition-colors group relative"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <MessageSquare size={16} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{session.title}</p>
                <p className="text-xs text-muted-foreground truncate">{session.client || 'No client'}</p>
              </div>
              <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground shrink-0 mt-1">{session.date}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  if (variant === "sidebar") {
    return <div className="h-full bg-card">{innerContent}</div>;
  }
  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-[85%] max-w-[320px] bg-card shadow-xl transform transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {innerContent}
      </div>
    </>
  );
};
