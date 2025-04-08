import { useState } from "react";
import BottomNavigation from "@/components/BottomNavigation";
import CreatePostModal from "@/components/CreatePostModal";
import { Card, CardContent } from "@/components/ui/card";
import { BellOff, ThumbsUp, MessageSquare, AlertCircle, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock notifications for the UI - will be replaced with real data in the future
const mockNotifications = [
  {
    id: 1,
    type: "kudos",
    message: "Sarah Johnson gave kudos to your post",
    time: "2 hours ago",
    read: false,
  },
  {
    id: 2,
    type: "comment",
    message: "Michael Chen commented on your post",
    time: "5 hours ago",
    read: false,
  },
  {
    id: 3,
    type: "update",
    message: "Your post has been updated with an item marked as taken",
    time: "1 day ago",
    read: true,
  },
  {
    id: 4,
    type: "system",
    message: "Welcome to StreetFinds! Post your first find to get started.",
    time: "2 days ago",
    read: true,
  },
];

export default function Notifications() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);

  const openCreateModal = () => setIsCreateModalOpen(true);
  const closeCreateModal = () => setIsCreateModalOpen(false);

  const markAsRead = (id: number) => {
    setNotifications(
      notifications.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(
      notifications.map((notification) => ({ ...notification, read: true }))
    );
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "kudos":
        return <ThumbsUp className="h-5 w-5 text-primary" />;
      case "comment":
        return <MessageSquare className="h-5 w-5 text-blue-500" />;
      case "update":
        return <Check className="h-5 w-5 text-green-500" />;
      case "system":
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      default:
        return <BellOff className="h-5 w-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Notifications</h1>
          {notifications.some(n => !n.read) && (
            <button 
              onClick={markAllAsRead}
              className="text-sm text-primary hover:underline"
            >
              Mark all as read
            </button>
          )}
        </div>

        {notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={cn(
                  "transition-colors",
                  !notification.read && "bg-primary/5 border-primary/20"
                )}
                onClick={() => markAsRead(notification.id)}
              >
                <CardContent className="p-4 flex items-start space-x-3">
                  <div className="bg-background rounded-full p-2 flex-shrink-0">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <p className={cn(
                      "text-sm",
                      !notification.read && "font-medium"
                    )}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notification.time}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <BellOff className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No notifications</h3>
              <p className="text-muted-foreground mt-2">
                You don't have any notifications yet. We'll notify you when someone interacts with your posts.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <BottomNavigation active="notifications" onCreateClick={openCreateModal} />
      
      <CreatePostModal isOpen={isCreateModalOpen} onClose={closeCreateModal} />
    </div>
  );
}
