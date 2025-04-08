import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMap } from "@/lib/mapProvider";
import { useToast } from "@/hooks/use-toast";
import { X, Plus, MapPin, Camera, Check, AlertTriangle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { DialogContent, DialogTitle, DialogHeader, DialogFooter, Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type CreatePostModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type Item = {
  id: string;
  name: string;
};

// Sample image URLs for demonstration
const sampleImageUrls = [
  "https://images.unsplash.com/photo-1563347893-0e0d9839cee7?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80",
  "https://images.unsplash.com/photo-1596201307615-3aa3b455ee14?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80",
  "https://images.unsplash.com/photo-1615529328331-f8917597711f?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80",
  "https://images.unsplash.com/photo-1602082087218-658ada48e851?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80",
  "https://images.unsplash.com/photo-1616464916356-3a777b414b3d?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&h=400&q=80"
];

export default function CreatePostModal({ isOpen, onClose }: CreatePostModalProps) {
  const { currentLocation, searchLocation } = useMap();
  const { toast } = useToast();
  const [location, setLocation] = useState("");
  const [items, setItems] = useState<Item[]>([{ id: crypto.randomUUID(), name: "" }]);
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("available");
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddItem = () => {
    setItems([...items, { id: crypto.randomUUID(), name: "" }]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const handleItemChange = (id: string, value: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, name: value } : item
    ));
  };

  const handleAddImages = () => {
    // In a real implementation, this would open the file picker
    // For demo purposes, we'll add a sample image
    if (images.length < 5) {
      const randomIndex = Math.floor(Math.random() * sampleImageUrls.length);
      setImages([...images, sampleImageUrls[randomIndex]]);
    } else {
      toast({
        title: "Maximum images reached",
        description: "You can only add up to 5 images",
        variant: "destructive",
      });
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleUseCurrentLocation = async () => {
    if (currentLocation) {
      // In a real app, we would use reverse geocoding to get the address
      setLocation("Current location");
    } else {
      toast({
        title: "Location not available",
        description: "Unable to get your current location",
        variant: "destructive",
      });
    }
  };

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async () => {
      // Validate required fields
      if (!location) throw new Error("Location is required");
      if (items.some(item => !item.name.trim())) throw new Error("All items must have a name");
      if (images.length === 0) throw new Error("At least one image is required");

      const data = {
        location,
        latitude: currentLocation?.latitude.toString() || "0",
        longitude: currentLocation?.longitude.toString() || "0",
        description,
        status,
        items: items.map(item => item.name.trim()),
        imageUrls: images
      };

      const res = await apiRequest("POST", "/api/posts", data);
      return res.json();
    },
    onMutate: () => {
      setIsSubmitting(true);
    },
    onSuccess: () => {
      // Reset form
      setLocation("");
      setItems([{ id: crypto.randomUUID(), name: "" }]);
      setDescription("");
      setStatus("available");
      setImages([]);
      
      // Close modal
      onClose();
      
      // Show success toast
      toast({
        title: "Post created",
        description: "Your post has been created successfully",
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["/api/posts/nearby"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts/recent"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating post",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPostMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden max-h-[90vh]">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="text-xl font-bold">Create Post</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </DialogHeader>
        
        <div className="overflow-y-auto p-4">
          <form onSubmit={handleSubmit}>
            {/* Location picker */}
            <div className="mb-4">
              <Label className="block text-sm font-medium mb-2">Location</Label>
              <div className="bg-secondary p-3 rounded-lg flex items-center">
                <MapPin className="text-muted-foreground mr-2 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Enter or select location"
                  className="bg-transparent w-full border-none shadow-none"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleUseCurrentLocation}
                >
                  <MapPin className="h-5 w-5 text-primary" />
                </Button>
              </div>
            </div>
            
            {/* Photo upload */}
            <div className="mb-4">
              <Label className="block text-sm font-medium mb-2">Photos</Label>
              <div className="grid grid-cols-3 gap-2">
                <div 
                  className="aspect-square bg-secondary rounded-lg flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-border"
                  onClick={handleAddImages}
                >
                  <Camera className="h-6 w-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground mt-1">Add Photos</span>
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    multiple 
                  />
                </div>
                
                {/* Image previews */}
                {images.map((image, index) => (
                  <div key={index} className="aspect-square bg-secondary rounded-lg relative">
                    <img 
                      src={image} 
                      alt={`Preview ${index + 1}`} 
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 rounded-full"
                      onClick={() => handleRemoveImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              {images.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  <AlertTriangle className="h-3 w-3 inline mr-1" />
                  At least one photo is required
                </p>
              )}
            </div>
            
            {/* Items list */}
            <div className="mb-4">
              <Label className="block text-sm font-medium mb-2">Items List</Label>
              <div className="space-y-2">
                {items.map((item, index) => (
                  <div key={item.id} className="flex items-center">
                    <Input
                      type="text"
                      placeholder={`Item ${index + 1}`}
                      className="p-3 bg-secondary rounded-lg w-full"
                      value={item.name}
                      onChange={(e) => handleItemChange(item.id, e.target.value)}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={items.length <= 1}
                      className="ml-2"
                    >
                      <X className="h-5 w-5 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddItem}
                  className="flex items-center"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  <span>Add Item</span>
                </Button>
              </div>
            </div>
            
            {/* Description */}
            <div className="mb-4">
              <Label className="block text-sm font-medium mb-2">Description</Label>
              <Textarea
                placeholder="Describe the condition and any details about the items"
                className="p-3 bg-secondary rounded-lg w-full h-24 resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            
            {/* Availability */}
            <div className="mb-6">
              <Label className="block text-sm font-medium mb-2">Availability</Label>
              <RadioGroup value={status} onValueChange={setStatus} className="grid grid-cols-3 gap-2">
                <div className={cn(
                  "flex flex-col items-center p-3 rounded-lg cursor-pointer border",
                  status === "available" ? "border-primary bg-primary/10" : "border-border bg-secondary"
                )}>
                  <RadioGroupItem 
                    value="available" 
                    id="available" 
                    className="sr-only" 
                  />
                  <Label htmlFor="available" className="cursor-pointer flex flex-col items-center">
                    <Check className={cn(
                      "h-5 w-5 mb-1",
                      status === "available" ? "text-primary" : "text-muted-foreground"
                    )} />
                    <span className="text-xs">Available</span>
                  </Label>
                </div>
                
                <div className={cn(
                  "flex flex-col items-center p-3 rounded-lg cursor-pointer border",
                  status === "partial" ? "border-accent bg-accent/10" : "border-border bg-secondary"
                )}>
                  <RadioGroupItem 
                    value="partial" 
                    id="partial" 
                    className="sr-only" 
                  />
                  <Label htmlFor="partial" className="cursor-pointer flex flex-col items-center">
                    <AlertTriangle className={cn(
                      "h-5 w-5 mb-1",
                      status === "partial" ? "text-accent" : "text-muted-foreground"
                    )} />
                    <span className="text-xs">Partial</span>
                  </Label>
                </div>
                
                <div className={cn(
                  "flex flex-col items-center p-3 rounded-lg cursor-pointer border",
                  status === "taken" ? "border-destructive bg-destructive/10" : "border-border bg-secondary"
                )}>
                  <RadioGroupItem 
                    value="taken" 
                    id="taken" 
                    className="sr-only" 
                  />
                  <Label htmlFor="taken" className="cursor-pointer flex flex-col items-center">
                    <X className={cn(
                      "h-5 w-5 mb-1",
                      status === "taken" ? "text-destructive" : "text-muted-foreground"
                    )} />
                    <span className="text-xs">Taken</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            <DialogFooter className="mt-6 gap-2">
              <Button 
                variant="outline" 
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-background border-t-transparent rounded-full" />
                    Posting...
                  </>
                ) : (
                  'Post'
                )}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
