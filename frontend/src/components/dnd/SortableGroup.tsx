import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ReactNode } from "react";
import { GripHorizontal } from "lucide-react";

interface Props {
  id: string;
  children: ReactNode;
}

export const SortableGroup = ({ id, children }: Props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    scale: isDragging ? 1.01 : 1,
    boxShadow: isDragging ? "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" : "none",
    zIndex: isDragging ? 40 : "auto",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative bg-card rounded-xl border border-border overflow-hidden ${
        isDragging ? "ring-2 ring-primary relative z-50" : ""
      }`}
    >
      <div 
        {...attributes} 
        {...listeners}
        className="absolute top-0 inset-x-0 h-4 flex items-center justify-center cursor-grab hover:bg-secondary/50 transition-colors z-20 group"
      >
        <GripHorizontal size={14} className="text-muted-foreground opacity-30 group-hover:opacity-100" />
      </div>
      <div className="pt-2">
        {children}
      </div>
    </div>
  );
};
