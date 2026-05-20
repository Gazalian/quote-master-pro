import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ReactNode } from "react";
import { GripVertical } from "lucide-react";

interface Props {
  id: string;
  children: ReactNode;
}

export const SortableItem = ({ id, children }: Props) => {
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
    opacity: isDragging ? 0.4 : 1,
    scale: isDragging ? 1.02 : 1,
    zIndex: isDragging ? 50 : "auto",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group ${isDragging ? "shadow-md" : ""}`}
    >
      <div 
        {...attributes} 
        {...listeners} 
        className="absolute left-1.5 top-3 cursor-grab opacity-30 hover:opacity-100 flex items-center justify-center h-8 w-6 z-10"
      >
        <GripVertical size={16} />
      </div>
      <div className="pl-6">
        {children}
      </div>
    </div>
  );
};
