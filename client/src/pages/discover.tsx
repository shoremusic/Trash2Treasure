import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/authProvider";
import { useMap } from "@/lib/mapProvider";
import Map from "@/components/Map";
import BottomSheet from "@/components/BottomSheet";
import BottomNavigation from "@/components/BottomNavigation";
import CreatePostModal from "@/components/CreatePostModal";
import { PostWithDetails } from "@shared/schema";

type ViewMode = "near" | "recent" | "favorites";

export default function Discover() {
  const { user } = useAuth();
  const { currentLocation, isLoadingLocation } = useMap();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("near");
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);

  // Query for nearby posts
  const nearbyPostsQuery = useQuery({
    queryKey: [
      `/api/posts/nearby`, 
      currentLocation?.latitude, 
      currentLocation?.longitude
    ],
    enabled: !!currentLocation,
  });

  // Query for recent posts
  const recentPostsQuery = useQuery({
    queryKey: [`/api/posts/recent`],
  });

  // Query for user's favorite posts (we'll implement this feature later)
  const favoritesQuery = useQuery({
    queryKey: [`/api/favorites`],
    enabled: false, // Disable for now since we haven't implemented favorites
  });

  // Get posts based on view mode
  const getPosts = (): PostWithDetails[] => {
    if (viewMode === "near" && nearbyPostsQuery.data) {
      return nearbyPostsQuery.data;
    } else if (viewMode === "recent" && recentPostsQuery.data) {
      return recentPostsQuery.data;
    } else if (viewMode === "favorites" && favoritesQuery.data) {
      return favoritesQuery.data;
    }
    return [];
  };

  const isLoading = 
    (viewMode === "near" && nearbyPostsQuery.isLoading) || 
    (viewMode === "recent" && recentPostsQuery.isLoading) || 
    (viewMode === "favorites" && favoritesQuery.isLoading);

  const openCreateModal = () => setIsCreateModalOpen(true);
  const closeCreateModal = () => setIsCreateModalOpen(false);

  const handleSelectPost = (id: number) => {
    setSelectedPostId(id);
  };

  const posts = getPosts();

  return (
    <div className="relative h-screen overflow-hidden bg-background">
      <Map 
        posts={posts} 
        isLoading={isLoading || isLoadingLocation}
        selectedPostId={selectedPostId}
        onSelectPost={handleSelectPost}
      />
      
      <BottomSheet 
        title="Nearby Finds"
        isLoading={isLoading}
        posts={posts}
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
        selectedPostId={selectedPostId}
        onSelectPost={handleSelectPost}
      />
      
      <BottomNavigation 
        active="discover" 
        onCreateClick={openCreateModal}
      />
      
      <CreatePostModal 
        isOpen={isCreateModalOpen} 
        onClose={closeCreateModal} 
      />
    </div>
  );
}
