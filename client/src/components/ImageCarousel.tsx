import { useState, useRef, useEffect } from "react";
import { Image } from "@shared/schema";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type ImageCarouselProps = {
  images: Image[];
};

export default function ImageCarousel({ images }: ImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Handle scroll events to update active index
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const handleScroll = () => {
      if (!carousel) return;
      
      const scrollPosition = carousel.scrollLeft;
      const itemWidth = carousel.offsetWidth;
      const newIndex = Math.round(scrollPosition / itemWidth);
      
      setActiveIndex(newIndex);
    };

    carousel.addEventListener("scroll", handleScroll);
    return () => carousel.removeEventListener("scroll", handleScroll);
  }, []);

  // Scroll to the active index when it changes
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    
    const scrollTo = activeIndex * carousel.offsetWidth;
    carousel.scrollTo({ left: scrollTo, behavior: "smooth" });
  }, [activeIndex]);

  const goToNext = () => {
    setActiveIndex(prev => Math.min(prev + 1, images.length - 1));
  };

  const goToPrev = () => {
    setActiveIndex(prev => Math.max(prev - 1, 0));
  };

  // If no images, show a placeholder
  if (images.length === 0) {
    return (
      <div className="relative w-full h-64 bg-secondary rounded-xl flex items-center justify-center">
        <p className="text-muted-foreground">No images available</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div 
        ref={carouselRef}
        className="carousel-container flex overflow-x-auto hide-scrollbar rounded-xl snap-x snap-mandatory"
      >
        {images.map((image, index) => (
          <div 
            key={index}
            className="carousel-item flex-shrink-0 w-full snap-center"
          >
            <img 
              src={image.url} 
              alt={`Item ${index + 1}`} 
              className="w-full h-64 object-cover rounded-xl"
            />
          </div>
        ))}
      </div>
      
      {/* Navigation buttons */}
      {images.length > 1 && (
        <>
          <Button
            variant="secondary"
            size="icon"
            className="absolute left-2 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded-full opacity-80 hover:opacity-100"
            onClick={goToPrev}
            disabled={activeIndex === 0}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <Button
            variant="secondary"
            size="icon"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded-full opacity-80 hover:opacity-100"
            onClick={goToNext}
            disabled={activeIndex === images.length - 1}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </>
      )}
      
      {/* Image indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center space-x-1">
          {images.map((_, index) => (
            <button
              key={index}
              className={cn(
                "image-indicator h-1 rounded-full bg-white transition-all duration-200",
                index === activeIndex ? "w-6 opacity-90" : "w-1 opacity-60"
              )}
              onClick={() => setActiveIndex(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
