import { Skeleton } from "@/components/ui/skeleton";

/** Single chat history row in the sidebar / drawer. */
export const SessionListSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="space-y-1 px-3 py-2">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-start gap-3 px-3 py-3 rounded-xl">
        <Skeleton className="w-9 h-9 rounded-full shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-3 w-10 shrink-0" />
      </div>
    ))}
  </div>
);

/** Chat surface placeholder — used while session detail loads. */
export const ChatSkeleton = () => (
  <div className="flex flex-col gap-3 px-3 py-4">
    <BubbleSkeleton side="left" widthClass="w-2/3" />
    <BubbleSkeleton side="right" widthClass="w-1/2" />
    <BubbleSkeleton side="left" widthClass="w-3/4" />
    <BubbleSkeleton side="left" widthClass="w-1/3" />
  </div>
);

const BubbleSkeleton = ({ side, widthClass }: { side: "left" | "right"; widthClass: string }) => (
  <div className={`flex items-end gap-2 ${side === "right" ? "justify-end" : "justify-start"}`}>
    {side === "left" && <Skeleton className="w-7 h-7 rounded-full shrink-0" />}
    <Skeleton className={`h-10 rounded-2xl ${widthClass}`} />
  </div>
);

/** Quotes list row. */
export const QuoteRowSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-card rounded-xl p-5 border border-border/50">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 space-y-2">
            <div className="flex gap-2">
              <Skeleton className="h-4 w-16 rounded-md" />
              <Skeleton className="h-4 w-20 rounded-md" />
            </div>
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
        <div className="flex items-end justify-between mt-4 pt-4 border-t border-border/50">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-24" />
        </div>
      </div>
    ))}
  </div>
);

/** Brand or profile form. */
export const FormSectionSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="space-y-4">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-11 w-full rounded-xl" />
      </div>
    ))}
  </div>
);

/** Price log row. */
export const PriceRowSkeleton = ({ count = 5 }: { count?: number }) => (
  <div className="space-y-2">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-card rounded-xl p-3.5 border border-border flex items-center justify-between">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="h-6 w-20" />
      </div>
    ))}
  </div>
);
