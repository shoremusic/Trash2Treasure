import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/authProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ImageCarousel from "@/components/ImageCarousel";
import ItemsList from "@/components/ItemsList";
import { PostWithDetails } from "@shared/schema";
import { ThumbsUp, MessageSquare, Share, Edit, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

type PostCardProps = {
  post: PostWithDetails;
};

export default function PostCard({ post }: PostCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userKudos, setUserKudos] = useState(post.userKudos);
  const [kudosCount, setKudosCount] = useState(post.kudosCount);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "available":
        return "status-available";
      case "partial":
        return "status-partial";
      case "taken":
        return "status-taken";
      default:
        return "";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "available":
        return "Available";
      case "partial":
        return "Partial";
      case "taken":
        return "Taken";
      default:
        return status;
    }
  };

  const getTimeAgo = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  // Toggle kudos mutation
  const toggleKudosMutation = useMutation({
    mutationFn: async () => {
      if (userKudos) {
        await apiRequest("DELETE", `/api/posts/${post.id}/kudos`, {});
      } else {
        await apiRequest("POST", `/api/posts/${post.id}/kudos`, {});
      }
    },
    onMutate: async () => {
      // Optimistic update
      setUserKudos(!userKudos);
      setKudosCount(userKudos ? kudosCount - 1 : kudosCount + 1);
    },
    onSuccess: () => {
      // Show success toast
      toast({
        title: userKudos ? "Kudos removed" : "Kudos given",
        description: userKudos 
          ? "You have removed your kudos" 
          : "You have given kudos to this post",
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${post.id}`] });
    },
    onError: (error) => {
      // Revert optimistic update on error
      setUserKudos(!userKudos);
      setKudosCount(userKudos ? kudosCount + 1 : kudosCount - 1);
      
      toast({
        title: "Error",
        description: "Failed to update kudos",
        variant: "destructive",
      });
    },
  });

  const handleToggleKudos = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to give kudos",
        variant: "destructive",
      });
      return;
    }
    
    toggleKudosMutation.mutate();
  };

  const handleUpdatePost = () => {
    // This would navigate to the update post page or open the update modal
    toast({
      title: "Coming soon",
      description: "Post updating feature is coming soon",
    });
  };

  const handleShare = () => {
    // In a real implementation, this would use the Web Share API
    toast({
      title: "Coming soon",
      description: "Sharing feature is coming soon",
    });
  };

  return (
    <div className="mb-4">
      {/* User info and status */}
      <div className="flex items-center mb-2">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-primary text-primary-foreground">
            {post.user.username.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="ml-2">
          <p className="font-medium">{post.user.username}</p>
          <p className="text-xs text-muted-foreground">{getTimeAgo(post.createdAt)}</p>
        </div>
        
        <div className="ml-auto">
          <Badge className={getStatusBadgeVariant(post.status)}>
            {getStatusLabel(post.status)}
          </Badge>
        </div>
      </div>
      
      {/* Location */}
      <div className="flex items-center text-sm text-muted-foreground mb-2">
        <MapPin className="h-4 w-4 mr-1" />
        <span>{post.location}</span>
      </div>
      
      {/* Image carousel */}
      <div className="mb-4">
        <ImageCarousel images={post.images} />
      </div>
      
      {/* Item list */}
      <div className="mb-4">
        <h3 className="font-medium mb-2">Items:</h3>
        <ItemsList items={post.items} />
      </div>
      
      {/* Description */}
      {post.description && (
        <p className="text-sm mb-4">{post.description}</p>
      )}
      
      {/* Action buttons */}
      <div className="flex justify-between">
        <div className="flex space-x-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center space-x-1 p-0"
            onClick={handleToggleKudos}
          >
            <ThumbsUp 
              className={`h-4 w-4 ${userKudos ? 'text-primary fill-primary' : 'text-muted-foreground'}`} 
            />
            <span>{kudosCount}</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center space-x-1 p-0"
          >
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <span>{post.comments.length}</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center p-0"
            onClick={handleShare}
          >
            <Share className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center space-x-1 p-0 text-primary"
          onClick={handleUpdatePost}
        >
          <Edit className="h-4 w-4 mr-1" />
          <span>Update</span>
        </Button>
      </div>
    </div>
  );
}
