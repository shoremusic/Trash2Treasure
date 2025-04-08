import { useEffect, useRef, useState } from "react";
import { useMap } from "@/lib/mapProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Settings } from "lucide-react";
import { PostWithDetails } from "@shared/schema";
import { cn } from "@/lib/utils";

type MapProps = {
  posts: PostWithDetails[];
  isLoading: boolean;
  selectedPostId: number | null;
  onSelectPost: (id: number) => void;
};

export default function Map({ posts, isLoading, selectedPostId, onSelectPost }: MapProps) {
  const { currentLocation, getLocation } = useMap();
  const [searchQuery, setSearchQuery] = useState("");
  const mapRef = useRef<HTMLDivElement>(null);

  // In a real implementation, we would use a mapping library like Leaflet or Google Maps
  // For this demo, we'll use a placeholder with simulated pins

  useEffect(() => {
    // Initialize map when component mounts
    // This would be where we'd initialize Leaflet/Google Maps in a real implementation
  }, []);

  // Function to handle map recentering to current location
  const handleRecenterMap = () => {
    getLocation();
    // In a real implementation, this would pan the map to the user's location
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-primary";
      case "partial":
        return "bg-accent";
      case "taken":
        return "bg-destructive";
      default:
        return "bg-muted";
    }
  };

  return (
    <div className="map-container relative w-full bg-neutral-200">
      {/* Map container - in a real implementation, this would be the Leaflet/Google Maps container */}
      <div ref={mapRef} className="h-full w-full relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-100">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          // Placeholder map image
          <div className="h-full w-full bg-neutral-200 flex items-center justify-center">
            {/* This would be replaced with an actual map in a real implementation */}
            <div className="absolute inset-0 bg-neutral-200"></div>
            
            {/* Simulated map pins */}
            {posts.map((post) => (
              <div 
                key={post.id}
                className={cn(
                  "absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 z-10",
                  selectedPostId === post.id && "scale-125 z-20"
                )}
                style={{
                  top: `${30 + Math.random() * 40}%`,
                  left: `${20 + Math.random() * 60}%`,
                }}
                onClick={() => onSelectPost(post.id)}
              >
                <div className={cn(
                  "text-white rounded-full p-1 shadow-lg",
                  getStatusColor(post.status),
                  selectedPostId === post.id && "animate-pulse"
                )}>
                  <MapPin size={20} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Search bar */}
      <div className="absolute top-4 left-0 right-0 mx-4">
        <div className="bg-white rounded-lg shadow-lg flex items-center p-2">
          <Search className="text-muted-foreground ml-2 h-5 w-5" />
          <Input
            type="text"
            placeholder="Search for locations"
            className="p-2 w-full border-none shadow-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>
      </div>
      
      {/* Current location button */}
      <Button 
        variant="secondary" 
        size="icon" 
        className="absolute bottom-40 right-4 rounded-full shadow-md"
        onClick={handleRecenterMap}
      >
        <MapPin className="h-5 w-5" />
      </Button>
    </div>
  );
}
