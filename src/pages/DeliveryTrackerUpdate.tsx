import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, MapPin, Navigation, AlertCircle, 
  CheckCircle2, Loader2 
} from 'lucide-react';
import { useUpdateDeliveryLocation } from '@/hooks/useDeliveryTracking';
import { DeliveryMap } from '@/components/delivery/DeliveryMap';

export default function DeliveryTrackerUpdate() {
  const { pedidoId } = useParams<{ pedidoId: string }>();
  const navigate = useNavigate();
  const [isTracking, setIsTracking] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [currentPosition, setCurrentPosition] = useState<GeolocationPosition | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt'>('prompt');

  const { startTracking, stopTracking, isUpdating, error } = useUpdateDeliveryLocation(pedidoId);

  // Check geolocation permission
  useEffect(() => {
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setPermissionStatus(result.state as any);
        result.addEventListener('change', () => {
          setPermissionStatus(result.state as any);
        });
      });
    }
  }, []);

  // Get current position for display
  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentPosition(position);
      },
      (error) => {
        console.error('Error getting current position:', error);
      }
    );
  }, []);

  const handleStartTracking = () => {
    const id = startTracking();
    if (id) {
      setWatchId(id);
      setIsTracking(true);
    }
  };

  const handleStopTracking = () => {
    if (watchId !== null) {
      stopTracking(watchId);
      setWatchId(null);
      setIsTracking(false);
    }
  };

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (watchId !== null) {
        stopTracking(watchId);
      }
    };
  }, [watchId, stopTracking]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">Rastreamento de Entrega</h1>
              <p className="text-sm text-primary-foreground/80">
                Pedido #{pedidoId?.slice(0, 8).toUpperCase()}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Permission Alert */}
        {permissionStatus === 'denied' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              A permissão de localização foi negada. Por favor, ative a localização nas configurações do navegador para usar o rastreamento.
            </AlertDescription>
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Tracking Control Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className={`p-4 rounded-full ${isTracking ? 'bg-green-100' : 'bg-muted'}`}>
                {isTracking ? (
                  <Navigation className="w-12 h-12 text-green-600 animate-pulse" />
                ) : (
                  <MapPin className="w-12 h-12 text-muted-foreground" />
                )}
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-2">
                  {isTracking ? 'Rastreamento Ativo' : 'Rastreamento Inativo'}
                </h2>
                <p className="text-muted-foreground">
                  {isTracking
                    ? 'Sua localização está sendo compartilhada em tempo real com o cliente.'
                    : 'Ative o rastreamento para o cliente acompanhar sua localização.'}
                </p>
              </div>

              {isUpdating && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Atualizando localização...
                </div>
              )}

              <Button
                onClick={isTracking ? handleStopTracking : handleStartTracking}
                size="lg"
                variant={isTracking ? 'destructive' : 'default'}
                className="w-full max-w-xs"
                disabled={permissionStatus === 'denied'}
              >
                {isTracking ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Parar Rastreamento
                  </>
                ) : (
                  <>
                    <Navigation className="w-5 h-5 mr-2" />
                    Iniciar Rastreamento
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Current Location Card */}
        {currentPosition && (
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Sua Localização Atual
              </h3>
              <DeliveryMap
                deliveryLocation={{
                  latitude: currentPosition.coords.latitude,
                  longitude: currentPosition.coords.longitude,
                }}
              />
              <div className="mt-3 p-3 bg-muted rounded-lg text-sm space-y-1">
                <p>
                  <strong>Latitude:</strong> {currentPosition.coords.latitude.toFixed(6)}
                </p>
                <p>
                  <strong>Longitude:</strong> {currentPosition.coords.longitude.toFixed(6)}
                </p>
                {currentPosition.coords.accuracy && (
                  <p>
                    <strong>Precisão:</strong> {Math.round(currentPosition.coords.accuracy)}m
                  </p>
                )}
                {currentPosition.coords.speed && (
                  <p>
                    <strong>Velocidade:</strong> {(currentPosition.coords.speed * 3.6).toFixed(1)} km/h
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions Card */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Instruções</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary">1.</span>
                Ative o rastreamento ao sair para entrega
              </li>
              <li className="flex gap-2">
                <span className="text-primary">2.</span>
                Mantenha o aplicativo aberto durante a entrega
              </li>
              <li className="flex gap-2">
                <span className="text-primary">3.</span>
                O cliente poderá ver sua localização em tempo real
              </li>
              <li className="flex gap-2">
                <span className="text-primary">4.</span>
                Desative o rastreamento após finalizar a entrega
              </li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
