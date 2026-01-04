import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Store } from 'lucide-react';
import { Card } from '@/components/ui/card';

// Fix Leaflet default icon issue with webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface DeliveryMapProps {
  deliveryLocation?: {
    latitude: number;
    longitude: number;
  } | null;
  customerLocation?: {
    latitude: number;
    longitude: number;
  } | null;
  restaurantLocation?: {
    latitude: number;
    longitude: number;
  } | null;
  restaurantName?: string;
  customerAddress?: string;
}

export function DeliveryMap({
  deliveryLocation,
  customerLocation,
  restaurantLocation,
  restaurantName,
  customerAddress,
}: DeliveryMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const deliveryMarkerRef = useRef<L.Marker | null>(null);
  const customerMarkerRef = useRef<L.Marker | null>(null);
  const restaurantMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    try {
      // Default center (Brazil)
      const defaultCenter: [number, number] = [-15.7801, -47.9292];
      
      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 13,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;

      // Wait a bit for the map to fully initialize
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError('Erro ao carregar mapa');
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update delivery marker (motoboy)
  useEffect(() => {
    if (!mapRef.current || !deliveryLocation) return;

    const { latitude, longitude } = deliveryLocation;
    const position: [number, number] = [latitude, longitude];

    // Custom icon for delivery person
    const deliveryIcon = L.divIcon({
      html: `
        <div style="background: #8b5cf6; border: 3px solid white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12h14"></path>
            <path d="M12 5v14"></path>
            <circle cx="8" cy="19" r="2"></circle>
            <circle cx="16" cy="19" r="2"></circle>
            <path d="M9 5h10l2 7H7L9 5z"></path>
          </svg>
        </div>
      `,
      className: 'delivery-marker',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    if (deliveryMarkerRef.current) {
      deliveryMarkerRef.current.setLatLng(position);
    } else {
      deliveryMarkerRef.current = L.marker(position, { icon: deliveryIcon })
        .addTo(mapRef.current)
        .bindPopup('<strong>🛵 Entregador</strong><br/>Sua entrega está a caminho!');
    }

    // Center map on delivery location
    mapRef.current.setView(position, 15, { animate: true });
  }, [deliveryLocation]);

  // Update customer marker
  useEffect(() => {
    if (!mapRef.current || !customerLocation) return;

    const { latitude, longitude } = customerLocation;
    const position: [number, number] = [latitude, longitude];

    // Custom icon for customer
    const customerIcon = L.divIcon({
      html: `
        <div style="background: #22c55e; border: 3px solid white; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>
      `,
      className: 'customer-marker',
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    if (customerMarkerRef.current) {
      customerMarkerRef.current.setLatLng(position);
    } else {
      const popup = customerAddress 
        ? `<strong>📍 Seu Endereço</strong><br/>${customerAddress}`
        : '<strong>📍 Seu Endereço</strong>';
      
      customerMarkerRef.current = L.marker(position, { icon: customerIcon })
        .addTo(mapRef.current)
        .bindPopup(popup);
    }
  }, [customerLocation, customerAddress]);

  // Update restaurant marker
  useEffect(() => {
    if (!mapRef.current || !restaurantLocation) return;

    const { latitude, longitude } = restaurantLocation;
    const position: [number, number] = [latitude, longitude];

    // Custom icon for restaurant
    const restaurantIcon = L.divIcon({
      html: `
        <div style="background: #ef4444; border: 3px solid white; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 3h18v18H3V3z"></path>
            <path d="M7 8h10"></path>
            <path d="M7 12h10"></path>
            <path d="M7 16h10"></path>
          </svg>
        </div>
      `,
      className: 'restaurant-marker',
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    if (restaurantMarkerRef.current) {
      restaurantMarkerRef.current.setLatLng(position);
    } else {
      const popup = restaurantName 
        ? `<strong>🏪 ${restaurantName}</strong><br/>Restaurante`
        : '<strong>🏪 Restaurante</strong>';
      
      restaurantMarkerRef.current = L.marker(position, { icon: restaurantIcon })
        .addTo(mapRef.current)
        .bindPopup(popup);
    }
  }, [restaurantLocation, restaurantName]);

  // Draw route line between delivery person and customer
  useEffect(() => {
    if (!mapRef.current || !deliveryLocation || !customerLocation) {
      if (routeLineRef.current) {
        routeLineRef.current.remove();
        routeLineRef.current = null;
      }
      return;
    }

    const positions: [number, number][] = [
      [deliveryLocation.latitude, deliveryLocation.longitude],
      [customerLocation.latitude, customerLocation.longitude],
    ];

    if (routeLineRef.current) {
      routeLineRef.current.setLatLngs(positions);
    } else {
      routeLineRef.current = L.polyline(positions, {
        color: '#8b5cf6',
        weight: 3,
        opacity: 0.7,
        dashArray: '10, 10',
      }).addTo(mapRef.current);
    }

    // Fit bounds to show all markers
    const bounds = L.latLngBounds(positions);
    if (restaurantLocation) {
      bounds.extend([restaurantLocation.latitude, restaurantLocation.longitude]);
    }
    mapRef.current.fitBounds(bounds, { padding: [50, 50] });
  }, [deliveryLocation, customerLocation, restaurantLocation]);

  if (mapError) {
    return (
      <Card className="p-6 text-center">
        <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
        <p className="text-muted-foreground">{mapError}</p>
      </Card>
    );
  }

  return (
    <div className="relative w-full h-[400px] rounded-lg overflow-hidden border">
      <div ref={mapContainerRef} className="w-full h-full" />
      
      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 space-y-2 text-sm z-[1000]">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-purple-600 rounded-full border-2 border-white"></div>
          <span>Entregador</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-600 rounded-full border-2 border-white"></div>
          <span>Você</span>
        </div>
        {restaurantLocation && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-600 rounded-full border-2 border-white"></div>
            <span>Restaurante</span>
          </div>
        )}
      </div>

      {/* No delivery location message */}
      {!deliveryLocation && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-[999]">
          <Card className="p-6 text-center max-w-sm">
            <Navigation className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-semibold mb-2">Aguardando rastreamento</h3>
            <p className="text-sm text-muted-foreground">
              O rastreamento em tempo real será exibido quando seu pedido sair para entrega.
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}
