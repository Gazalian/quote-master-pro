import { memo } from "react";
import { Pencil } from "lucide-react";
import type { ChatMessage } from "@/types/quote";

interface Props {
  msg: ChatMessage;
  isDesktop: boolean;
  canEdit: boolean;
  editing: boolean;
  editValue: string;
  setEditValue: (v: string) => void;
  onStartEdit: (msg: ChatMessage) => void;
  onCancelEdit: () => void;
  onSubmitEdit: (id: string) => void;
  progressLabel: string;
  quoteSlot: React.ReactNode;
}

/**
 * Single message row. Memoised so typing in the composer (which only changes
 * the input state, not the messages array) doesn't re-render every bubble in
 * a 100-message chat.
 *
 * Equality check is shallow on the message object — message identity (`id`)
 * is the canonical signal that content changed.
 */
function MessageBubbleImpl({
  msg, isDesktop, canEdit, editing, editValue, setEditValue,
  onStartEdit, onCancelEdit, onSubmitEdit, progressLabel, quoteSlot,
}: Props) {
  // Quote bubble — rendered by the parent (it needs access to QuoteCard
  // bindings that aren't worth threading through props).
  if (msg.type === "quote" && !isDesktop) {
    return (
      <Row align={msg.role === "user" ? "right" : "left"} avatarSpacer={msg.role === "ai" && msg.type === "quote"}>
        <div className="flex-1 min-w-0">{quoteSlot}</div>
      </Row>
    );
  }
  if (msg.type === "quote" && isDesktop) {
    return (
      <Row align="left">
        <div className="max-w-[min(75%,34rem)] px-4 py-3 rounded-2xl rounded-bl-sm text-[14px] bg-white text-gray-700 shadow-sm border border-gray-100">
          Quote generated and updated in the preview panel. 👉
        </div>
      </Row>
    );
  }

  if (msg.type === "image") {
    return (
      <Row align={msg.role === "user" ? "right" : "left"}>
        <div className="max-w-[min(78%,22rem)]">
          <img
            src={msg.imageUrl}
            alt="Uploaded"
            className="rounded-2xl border border-white/50 shadow-md max-h-[260px] w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </div>
      </Row>
    );
  }

  if (msg.id.endsWith("-ai-loading")) {
    return (
      <Row align="left" showAvatar>
        <div className="px-4 py-3 bg-white rounded-2xl rounded-bl-sm shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 h-5">
            <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
            <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
            <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
            <span className="text-[11px] text-gray-500 ml-1">{progressLabel}</span>
          </div>
        </div>
      </Row>
    );
  }

  return (
    <Row align={msg.role === "user" ? "right" : "left"} showAvatar={msg.role === "ai"}>
      <div
        className={`max-w-[min(82%,34rem)] min-w-0 rounded-2xl text-[14px] leading-relaxed relative break-words ${
          msg.role === "user"
            ? "bg-[#0056D2] text-white shadow-sm rounded-br-sm px-4 py-3"
            : "bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm px-4 py-3"
        }`}
      >
        {editing ? (
          <div className="flex w-[min(72vw,28rem)] flex-col gap-2">
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full bg-white/15 text-white p-2 rounded-xl resize-none outline-none border border-white/25 focus:border-white/60 text-sm min-h-[80px]"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={onCancelEdit}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors min-h-[36px]"
              >
                Cancel
              </button>
              <button
                onClick={() => onSubmitEdit(msg.id)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white text-[#0056D2] hover:bg-gray-50 transition-colors min-h-[36px]"
              >
                Update
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="whitespace-pre-wrap">{msg.content}</p>
            {msg.role === "user" && canEdit && (
              <div className="flex items-center justify-end gap-2 mt-1.5">
                {msg.isEdited && <span className="text-[10px] text-white/60">edited</span>}
                <button
                  onClick={() => onStartEdit(msg)}
                  className="flex items-center gap-1 text-white/60 hover:text-white/90 transition-colors min-h-[24px]"
                  title="Edit message"
                  aria-label="Edit message"
                >
                  <Pencil size={11} />
                  <span className="text-[10px]">Edit</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Row>
  );
}

function Row({
  children, align, showAvatar = false, avatarSpacer = false,
}: {
  children: React.ReactNode;
  align: "left" | "right";
  showAvatar?: boolean;
  avatarSpacer?: boolean;
}) {
  return (
    <div className={`flex items-end gap-2 ${align === "right" ? "justify-end" : "justify-start"}`}>
      {showAvatar && (
        <div className="w-7 h-7 rounded-full bg-[#0056D2] flex items-center justify-center shrink-0 mb-0.5 shadow-sm">
          <span className="text-white text-[9px] font-black">OQ</span>
        </div>
      )}
      {avatarSpacer && <div className="w-7 shrink-0" />}
      {children}
    </div>
  );
}

/**
 * Skip re-render if the message identity is stable and external props that
 * matter (editing target, progress label) haven't shifted. The chat list
 * mutates the array on every keystroke in the composer (via setMessages
 * elsewhere); without this memo, every keystroke re-renders every bubble.
 */
export const MessageBubble = memo(MessageBubbleImpl, (prev, next) => {
  if (prev.msg !== next.msg) return false;
  if (prev.editing !== next.editing) return false;
  if (prev.editing && prev.editValue !== next.editValue) return false;
  if (prev.canEdit !== next.canEdit) return false;
  if (prev.isDesktop !== next.isDesktop) return false;
  if (prev.msg.id.endsWith("-ai-loading") && prev.progressLabel !== next.progressLabel) return false;
  if (prev.msg.type === "quote" && prev.quoteSlot !== next.quoteSlot) return false;
  return true;
});
