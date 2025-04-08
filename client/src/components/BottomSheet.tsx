import { useState, useRef, useEffect } from "react";
import PostCard from "@/components/PostCard";
import { Button } from "@/components/ui/button";
import { Filter, SortDesc } from "lucide-react";
import { cn } from "@/lib/utils";
import { PostWithDetails } from "@shared/schema";

type Position = "minimized" | "half" | "expanded";
type ViewMode = "near" | "recent" | "favorites";

type BottomSheetProps = {
  title: string;
  isLoading: boolean;
  posts: PostWithDetails[];
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
  selectedPostId: number | null;
  onSelectPost: (id: number) => void;
};

export default function BottomSheet({
  title,
  isLoading,
  posts,
  viewMode,
  onChangeViewMode,
  selectedPostId,
  onSelectPost
}: BottomSheetProps) {
  const [position, setPosition] = useState<Position>("half");
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sheet = sheetRef.current;
    const dragHandle = dragHandleRef.current;
    if (!sheet || !dragHandle) return;

    let startY = 0;
    let startTranslate = 0;
    let currentTranslate = getPositionPercentage(position);

    const handleDragStart = (e: MouseEvent | TouchEvent) => {
      startY = "touches" in e ? e.touches[0].clientY : e.clientY;
      
      // Get the current translation percentage
      const transform = getComputedStyle(sheet).transform;
      const matrix = new DOMMatrixReadOnly(transform);
      const translateY = matrix.m42;
      startTranslate = (translateY / window.innerHeight) * 100;
      currentTranslate = startTranslate;
      
      document.addEventListener("mousemove", handleDrag);
      document.addEventListener("touchmove", handleDrag);
      document.addEventListener("mouseup", handleDragEnd);
      document.addEventListener("touchend", handleDragEnd);
    };

    const handleDrag = (e: MouseEvent | TouchEvent) => {
      const y = "touches" in e ? e.touches[0].clientY : e.clientY;
      const diff = y - startY;
      const newTranslate = Math.max(0, Math.min(80, startTranslate + (diff / window.innerHeight) * 100));
      
      sheet.style.transform = `translateY(${newTranslate}%)`;
      currentTranslate = newTranslate;
    };

    const handleDragEnd = () => {
      document.removeEventListener("mousemove", handleDrag);
      document.removeEventListener("touchmove", handleDrag);
      document.removeEventListener("mouseup", handleDragEnd);
      document.removeEventListener("touchend", handleDragEnd);
      
      // Snap to positions
      let newPosition: Position;
      
      if (currentTranslate < 20) {
        newPosition = "expanded";
      } else if (currentTranslate < 60) {
        newPosition = "half";
      } else {
        newPosition = "minimized";
      }
      
      setPosition(newPosition);
      sheet.style.transform = `translateY(${getPositionPercentage(newPosition)}%)`;
    };

    dragHandle.addEventListener("mousedown", handleDragStart);
    dragHandle.addEventListener("touchstart", handleDragStart);

    return () => {
      dragHandle.removeEventListener("mousedown", handleDragStart);
      dragHandle.removeEventListener("touchstart", handleDragStart);
      document.removeEventListener("mousemove", handleDrag);
      document.removeEventListener("touchmove", handleDrag);
      document.removeEventListener("mouseup", handleDragEnd);
      document.removeEventListener("touchend", handleDragEnd);
    };
  }, [position]);

  // Function to get the translation percentage for each position
  const getPositionPercentage = (pos: Position): number => {
    switch (pos) {
      case "expanded": return 0;
      case "half": return 40;
      case "minimized": return 70;
    }
  };

  // Update the sheet position based on the position state
  useEffect(() => {
    if (sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${getPositionPercentage(position)}%)`;
    }
  }, [position]);

  // If a post is selected, expand the sheet
  useEffect(() => {
    if (selectedPostId !== null && position === "minimized") {
      setPosition("half");
    }
  }, [selectedPostId]);

  return (
    <div 
      ref={sheetRef}
      className="bottom-sheet absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-lg"
      style={{ 
        transform: `translateY(${getPositionPercentage(position)}%)`, 
        maxHeight: "90vh", 
        minHeight: "8rem",
        zIndex: 20
      }}
    >
      {/* Drag handle */}
      <div ref={dragHandleRef} className="flex justify-center py-2 cursor-grab">
        <div className="w-10 h-1 bg-neutral-300 rounded-full"></div>
      </div>
      
      {/* Content header with tabs */}
      <div className="px-4 pb-2">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">{title}</h2>
          <div className="flex space-x-2">
            <Button variant="ghost" size="icon">
              <Filter className="h-5 w-5 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon">
              <SortDesc className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex space-x-4 mt-4 border-b border-neutral-200">
          <Button
            variant="link"
            className={cn(
              "pb-2 px-1",
              viewMode === "near" 
                ? "text-primary border-b-2 border-primary font-medium" 
                : "text-muted-foreground"
            )}
            onClick={() => onChangeViewMode("near")}
          >
            Near Me
          </Button>
          <Button
            variant="link"
            className={cn(
              "pb-2 px-1",
              viewMode === "recent" 
                ? "text-primary border-b-2 border-primary font-medium" 
                : "text-muted-foreground"
            )}
            onClick={() => onChangeViewMode("recent")}
          >
            Recent
          </Button>
          <Button
            variant="link"
            className={cn(
              "pb-2 px-1",
              viewMode === "favorites" 
                ? "text-primary border-b-2 border-primary font-medium" 
                : "text-muted-foreground"
            )}
            onClick={() => onChangeViewMode("favorites")}
          >
            Favorites
          </Button>
        </div>
      </div>
      
      {/* Scrollable content */}
      <div 
        className="overflow-y-auto overflow-x-hidden"
        style={{ maxHeight: "calc(90vh - 8rem)" }}
      >
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : posts.length > 0 ? (
          posts.map((post) => (
            <div 
              key={post.id} 
              className={cn(
                "p-4 border-b border-neutral-200",
                selectedPostId === post.id && "bg-secondary/20"
              )}
              onClick={() => onSelectPost(post.id)}
            >
              <PostCard post={post} />
            </div>
          ))
        ) : (
          <div className="text-center py-8 px-4">
            <p className="text-muted-foreground">No posts found in this area</p>
            {viewMode === "near" && (
              <Button
                variant="link"
                className="mt-2"
                onClick={() => onChangeViewMode("recent")}
              >
                View recent posts instead
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
