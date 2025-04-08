import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMap } from "@/lib/mapProvider";
import BottomNavigation from "@/components/BottomNavigation";
import CreatePostModal from "@/components/CreatePostModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PostCard from "@/components/PostCard";
import { PostWithDetails } from "@shared/schema";
import { Search as SearchIcon, MapPin, Filter } from "lucide-react";

export default function Search() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLocation, setSearchLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { searchLocation: performLocationSearch } = useMap();

  // Search for posts based on location
  const { data: posts, isLoading } = useQuery({
    queryKey: [
      `/api/posts/nearby`, 
      searchLocation?.latitude, 
      searchLocation?.longitude
    ],
    enabled: !!searchLocation,
  });

  const handleSearch = async () => {
    const location = await performLocationSearch(searchQuery);
    if (location) {
      setSearchLocation(location);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const openCreateModal = () => setIsCreateModalOpen(true);
  const closeCreateModal = () => setIsCreateModalOpen(false);

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="p-4">
        <div className="mb-4">
          <h1 className="text-2xl font-semibold mb-2">Search</h1>
          <p className="text-muted-foreground">Find hard rubbish near a location</p>
        </div>

        <div className="bg-white rounded-lg shadow-md flex items-center p-2 mb-4">
          <SearchIcon className="text-muted-foreground ml-2 h-5 w-5" />
          <Input
            type="text"
            placeholder="Search for locations"
            className="p-2 w-full border-none shadow-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyPress}
          />
          <Button variant="ghost" size="icon" onClick={handleSearch}>
            <MapPin className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Filter className="h-5 w-5" />
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center my-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : posts && posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post: PostWithDetails) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : searchLocation ? (
          <Card className="my-8">
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <SearchIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No items found</h3>
              <p className="text-muted-foreground mt-2">
                There are no hard rubbish items posted in this location yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="my-8">
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Search for a location</h3>
              <p className="text-muted-foreground mt-2">
                Enter a location to find hard rubbish items near you.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <BottomNavigation active="search" onCreateClick={openCreateModal} />
      
      <CreatePostModal isOpen={isCreateModalOpen} onClose={closeCreateModal} />
    </div>
  );
}
