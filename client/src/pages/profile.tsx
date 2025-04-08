import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/authProvider";
import BottomNavigation from "@/components/BottomNavigation";
import CreatePostModal from "@/components/CreatePostModal";
import PostCard from "@/components/PostCard";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { User, LogOut, MessageSquare, Heart, Package } from "lucide-react";

export default function Profile() {
  const { user, logout } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Query user's posts
  const { data: userPosts, isLoading: isLoadingPosts } = useQuery({
    queryKey: [`/api/posts/user/${user?.id}`],
    enabled: !!user,
  });

  const openCreateModal = () => setIsCreateModalOpen(true);
  const closeCreateModal = () => setIsCreateModalOpen(false);

  const handleLogout = () => {
    logout();
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Profile</h1>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex items-center space-x-4 mb-6">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-primary text-primary-foreground text-lg">
              {user.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-semibold">{user.username}</h2>
            <p className="text-muted-foreground">{user.email}</p>
            <div className="flex items-center mt-1 text-sm">
              <Heart className="h-4 w-4 mr-1 text-primary" />
              <span>{user.kudos} kudos received</span>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            {user.canViewImmediately ? (
              <span className="text-primary">
                Active contributor - You can see all posts immediately
              </span>
            ) : (
              <span>
                Inactive - Post to see recent finds without delay
              </span>
            )}
          </div>
        </div>

        <Tabs defaultValue="posts" className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="posts">My Posts</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
          
          <TabsContent value="posts" className="mt-4">
            {isLoadingPosts ? (
              <div className="flex justify-center my-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : userPosts && userPosts.length > 0 ? (
              <div className="space-y-4">
                {userPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No posts yet</h3>
                  <p className="text-muted-foreground mt-2 mb-4">
                    You haven't posted any hard rubbish findings yet. Share your first find!
                  </p>
                  <Button onClick={openCreateModal}>Create a Post</Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="activity" className="mt-4">
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Activity Coming Soon</h3>
                <p className="text-muted-foreground mt-2">
                  We'll track your comments, kudos, and other activity here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <BottomNavigation active="profile" onCreateClick={openCreateModal} />
      
      <CreatePostModal isOpen={isCreateModalOpen} onClose={closeCreateModal} />
    </div>
  );
}
