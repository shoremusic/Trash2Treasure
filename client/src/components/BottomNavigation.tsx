import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { MapPin, Search, Bell, User, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type BottomNavigationProps = {
  active: "discover" | "search" | "notifications" | "profile";
  onCreateClick: () => void;
};

export default function BottomNavigation({ active, onCreateClick }: BottomNavigationProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white h-16 flex items-center justify-around border-t border-neutral-200 z-30">
      <Link href="/">
        <a className="flex flex-col items-center p-1">
          <MapPin className={cn(
            "h-5 w-5",
            active === "discover" ? "text-primary" : "text-muted-foreground"
          )} />
          <span className={cn(
            "text-xs",
            active === "discover" ? "text-primary" : "text-muted-foreground"
          )}>
            Discover
          </span>
        </a>
      </Link>
      
      <Link href="/search">
        <a className="flex flex-col items-center p-1">
          <Search className={cn(
            "h-5 w-5",
            active === "search" ? "text-primary" : "text-muted-foreground"
          )} />
          <span className={cn(
            "text-xs",
            active === "search" ? "text-primary" : "text-muted-foreground"
          )}>
            Search
          </span>
        </a>
      </Link>
      
      {/* Floating action button */}
      <div className="relative -top-6">
        <Button 
          className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-full w-14 h-14 flex items-center justify-center shadow-lg"
          onClick={onCreateClick}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
      
      <Link href="/notifications">
        <a className="flex flex-col items-center p-1">
          <Bell className={cn(
            "h-5 w-5",
            active === "notifications" ? "text-primary" : "text-muted-foreground"
          )} />
          <span className={cn(
            "text-xs",
            active === "notifications" ? "text-primary" : "text-muted-foreground"
          )}>
            Alerts
          </span>
        </a>
      </Link>
      
      <Link href="/profile">
        <a className="flex flex-col items-center p-1">
          <User className={cn(
            "h-5 w-5",
            active === "profile" ? "text-primary" : "text-muted-foreground"
          )} />
          <span className={cn(
            "text-xs",
            active === "profile" ? "text-primary" : "text-muted-foreground"
          )}>
            Profile
          </span>
        </a>
      </Link>
    </div>
  );
}
