-- Create delivery tracking location table
CREATE TABLE IF NOT EXISTS public.entregador_localizacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_delivery_id UUID NOT NULL REFERENCES public.pedidos_delivery(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  velocidade DECIMAL(5, 2), -- km/h
  direcao DECIMAL(5, 2), -- heading em graus
  precisao DECIMAL(6, 2), -- precisão em metros
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_entregador_localizacao_pedido 
  ON public.entregador_localizacao(pedido_delivery_id);

CREATE INDEX IF NOT EXISTS idx_entregador_localizacao_updated 
  ON public.entregador_localizacao(updated_at DESC);

-- Enable RLS
ALTER TABLE public.entregador_localizacao ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read location (for public tracking)
CREATE POLICY "Allow public read entregador_localizacao"
  ON public.entregador_localizacao FOR SELECT
  TO public
  USING (true);

-- Policy: Only authenticated users can insert/update location
CREATE POLICY "Allow authenticated insert entregador_localizacao"
  ON public.entregador_localizacao FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update entregador_localizacao"
  ON public.entregador_localizacao FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_entregador_localizacao_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_entregador_localizacao_updated_at 
  ON public.entregador_localizacao;

CREATE TRIGGER trigger_update_entregador_localizacao_updated_at
  BEFORE UPDATE ON public.entregador_localizacao
  FOR EACH ROW
  EXECUTE FUNCTION update_entregador_localizacao_updated_at();

-- Add comment
COMMENT ON TABLE public.entregador_localizacao IS 'Armazena a localização em tempo real dos entregadores para rastreamento de pedidos';
