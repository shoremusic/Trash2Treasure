import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";

type Coordinates = {
  latitude: number;
  longitude: number;
};

type MapContextType = {
  currentLocation: Coordinates | null;
  isLoadingLocation: boolean;
  getLocation: () => Promise<void>;
  searchLocation: (query: string) => Promise<Coordinates | null>;
};

const defaultCoordinates: Coordinates = {
  latitude: -37.8136,  // Default to Melbourne, Australia
  longitude: 144.9631,
};

const MapContext = createContext<MapContextType>({
  currentLocation: null,
  isLoadingLocation: true,
  getLocation: async () => {},
  searchLocation: async () => null,
});

export const MapProvider = ({ children }: { children: ReactNode }) => {
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const { toast } = useToast();

  // Get location on component mount
  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = async () => {
    setIsLoadingLocation(true);
    
    try {
      if ("geolocation" in navigator) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
          });
        });
        
        setCurrentLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      } else {
        // Fallback to default coordinates
        setCurrentLocation(defaultCoordinates);
        toast({
          title: "Geolocation not supported",
          description: "Using default location instead.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error getting location:", error);
      setCurrentLocation(defaultCoordinates);
      toast({
        title: "Location access denied",
        description: "Please enable location services to find nearby items.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // In a real app, this would use a geocoding API like Google Maps or Mapbox
  const searchLocation = async (query: string): Promise<Coordinates | null> => {
    // Mock implementation - in real app would call geocoding API
    if (!query.trim()) return null;
    
    // For demo purposes, return slightly modified current location
    if (currentLocation) {
      return {
        latitude: currentLocation.latitude + (Math.random() * 0.01 - 0.005),
        longitude: currentLocation.longitude + (Math.random() * 0.01 - 0.005),
      };
    }
    
    return defaultCoordinates;
  };

  return (
    <MapContext.Provider
      value={{
        currentLocation,
        isLoadingLocation,
        getLocation,
        searchLocation,
      }}
    >
      {children}
    </MapContext.Provider>
  );
};

export const useMap = () => useContext(MapContext);
