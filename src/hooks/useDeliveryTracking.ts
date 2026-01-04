import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DeliveryLocation {
  id: string;
  pedido_delivery_id: string;
  latitude: number;
  longitude: number;
  velocidade?: number;
  direcao?: number;
  precisao?: number;
  updated_at: string;
}

interface UseDeliveryTrackingReturn {
  location: DeliveryLocation | null;
  isLoading: boolean;
  error: string | null;
  hasLocation: boolean;
}

export function useDeliveryTracking(pedidoId: string | undefined): UseDeliveryTrackingReturn {
  const [location, setLocation] = useState<DeliveryLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLocation = useCallback(async () => {
    if (!pedidoId) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await (supabase as any)
        .from('entregador_localizacao')
        .select('*')
        .eq('pedido_delivery_id', pedidoId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      setLocation(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching delivery location:', err);
      setError('Erro ao carregar localização');
    } finally {
      setIsLoading(false);
    }
  }, [pedidoId]);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  // Subscribe to real-time location updates
  useEffect(() => {
    if (!pedidoId) return;

    const channel = supabase
      .channel(`delivery-location-${pedidoId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'entregador_localizacao',
          filter: `pedido_delivery_id=eq.${pedidoId}`,
        },
        (payload) => {
          console.log('Location update received:', payload);
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setLocation(payload.new as DeliveryLocation);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pedidoId]);

  return {
    location,
    isLoading,
    error,
    hasLocation: location !== null,
  };
}

// Hook para o entregador atualizar sua localização
export function useUpdateDeliveryLocation(pedidoId: string | undefined) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateLocation = useCallback(async (position: GeolocationPosition) => {
    if (!pedidoId) return;

    setIsUpdating(true);
    try {
      const locationData = {
        pedido_delivery_id: pedidoId,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        velocidade: position.coords.speed ? position.coords.speed * 3.6 : null, // m/s to km/h
        direcao: position.coords.heading || null,
        precisao: position.coords.accuracy || null,
      };

      // Tenta atualizar primeiro
      const { data: existingData } = await (supabase as any)
        .from('entregador_localizacao')
        .select('id')
        .eq('pedido_delivery_id', pedidoId)
        .maybeSingle();

      if (existingData) {
        // Update
        const { error: updateError } = await (supabase as any)
          .from('entregador_localizacao')
          .update(locationData)
          .eq('id', existingData.id);

        if (updateError) throw updateError;
      } else {
        // Insert
        const { error: insertError } = await (supabase as any)
          .from('entregador_localizacao')
          .insert(locationData);

        if (insertError) throw insertError;
      }

      setError(null);
    } catch (err) {
      console.error('Error updating delivery location:', err);
      setError('Erro ao atualizar localização');
    } finally {
      setIsUpdating(false);
    }
  }, [pedidoId]);

  const startTracking = useCallback(() => {
    if (!pedidoId || !navigator.geolocation) {
      setError('Geolocalização não suportada');
      return null;
    }

    const watchId = navigator.geolocation.watchPosition(
      updateLocation,
      (error) => {
        console.error('Geolocation error:', error);
        setError('Erro ao obter localização');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );

    return watchId;
  }, [pedidoId, updateLocation]);

  const stopTracking = useCallback((watchId: number) => {
    if (watchId && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  return {
    updateLocation,
    startTracking,
    stopTracking,
    isUpdating,
    error,
  };
}
