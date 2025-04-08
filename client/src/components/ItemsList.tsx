import { Item } from "@shared/schema";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ItemsListProps = {
  items: Item[];
};

export default function ItemsList({ items }: ItemsListProps) {
  return (
    <ul className="grid grid-cols-2 gap-2">
      {items.length === 0 ? (
        <li className="col-span-2 text-sm text-muted-foreground">No items listed</li>
      ) : (
        items.map((item) => (
          <li key={item.id} className={cn(
            "flex items-center",
            item.status === "taken" && "text-muted-foreground"
          )}>
            {item.status === "available" ? (
              <Check className="text-primary mr-1 h-4 w-4" />
            ) : (
              <X className="text-destructive mr-1 h-4 w-4" />
            )}
            <span className={item.status === "taken" ? "line-through" : ""}>
              {item.name}
            </span>
          </li>
        ))
      )}
    </ul>
  );
}
