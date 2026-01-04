# 🗺️ Rastreamento em Tempo Real - Delivery

## ✅ Implementação Concluída

Sistema completo de rastreamento em tempo real do pedido com motoboy usando mapa ao vivo, 100% gratuito!

## 🎯 Funcionalidades

### Para o Cliente:
- ✅ Visualizar localização do entregador em tempo real
- ✅ Ver trajeto entre entregador e destino
- ✅ Mapa interativo com marcadores coloridos
- ✅ Atualizações automáticas via Supabase Realtime
- ✅ Exibido apenas quando status é "Saiu para Entrega"
- ✅ Legenda clara com ícones para cada localização

### Para o Entregador:
- ✅ Página dedicada para ativar/desativar rastreamento
- ✅ Atualização automática da localização usando GPS
- ✅ Visualização da própria posição no mapa
- ✅ Informações de precisão, velocidade e direção
- ✅ Interface simples e intuitiva

## 🗂️ Arquivos Criados/Modificados

### Novos Arquivos:
- ✅ `supabase/migrations/20260104_add_delivery_tracking.sql` - Tabela de localização
- ✅ `src/hooks/useDeliveryTracking.ts` - Hook para rastreamento
- ✅ `src/components/delivery/DeliveryMap.tsx` - Componente do mapa
- ✅ `src/pages/DeliveryTrackerUpdate.tsx` - Página do entregador

### Arquivos Modificados:
- ✅ `src/pages/DeliveryTracking.tsx` - Adicionado mapa ao vivo
- ✅ `src/App.tsx` - Nova rota para entregador

## 🛠️ Tecnologias Utilizadas

- **Leaflet**: Biblioteca de mapas open-source (100% gratuita)
- **OpenStreetMap**: Tiles de mapa gratuitos
- **Supabase Realtime**: Atualizações em tempo real
- **Geolocation API**: API nativa do navegador
- **PostgreSQL**: Armazenamento de localizações

## 📱 Como Usar

### 1. Aplicar Migration no Banco de Dados

```bash
# Execute a migration no Supabase
npx supabase db push
```

Ou aplique manualmente via Dashboard do Supabase:
1. Acesse o Supabase Dashboard
2. Vá em "SQL Editor"
3. Cole o conteúdo de `supabase/migrations/20260104_add_delivery_tracking.sql`
4. Execute

### 2. Para o Entregador Iniciar Rastreamento

**URL de acesso:** `/delivery/tracker/:pedidoId`

Exemplo: `https://seuapp.com/delivery/tracker/abc123`

#### Fluxo:
1. Entregador acessa a URL do pedido
2. Navegador solicita permissão de localização
3. Entregador concede permissão
4. Clica em "Iniciar Rastreamento"
5. Localização é enviada automaticamente a cada atualização
6. Cliente visualiza em tempo real na página de rastreamento

### 3. Cliente Acompanha a Entrega

**URL de acesso:** `/delivery/tracking/:pedidoId`

Exemplo: `https://seuapp.com/delivery/tracking/abc123`

#### O que o cliente vê:
- Mapa com 3 marcadores:
  - 🟣 **Roxo**: Entregador (posição em tempo real)
  - 🟢 **Verde**: Endereço do cliente
  - 🔴 **Vermelho**: Restaurante
- Linha tracejada roxa entre entregador e cliente
- Última atualização da localização
- Precisão do GPS em metros

## 🎨 Componentes

### DeliveryMap

Componente de mapa interativo que exibe:

```tsx
<DeliveryMap
  deliveryLocation={{ latitude: -23.550, longitude: -46.633 }}
  customerLocation={{ latitude: -23.551, longitude: -46.634 }}
  restaurantLocation={{ latitude: -23.549, longitude: -46.632 }}
  restaurantName="Restaurante Exemplo"
  customerAddress="Rua Exemplo, 123"
/>
```

### useDeliveryTracking Hook

Hook para consumir localização em tempo real:

```tsx
const { location, isLoading, error, hasLocation } = useDeliveryTracking(pedidoId);
```

### useUpdateDeliveryLocation Hook

Hook para o entregador atualizar sua localização:

```tsx
const { startTracking, stopTracking, isUpdating } = useUpdateDeliveryLocation(pedidoId);

// Iniciar rastreamento
const watchId = startTracking();

// Parar rastreamento
stopTracking(watchId);
```

## 🔄 Fluxo de Dados

```
1. Entregador → GPS do Celular
   ↓
2. Geolocation API → Captura coordenadas
   ↓
3. useUpdateDeliveryLocation → Envia para Supabase
   ↓
4. Supabase → Armazena em entregador_localizacao
   ↓
5. Realtime → Notifica clientes conectados
   ↓
6. useDeliveryTracking → Recebe atualização
   ↓
7. DeliveryMap → Atualiza marcador no mapa
   ↓
8. Cliente → Vê movimentação em tempo real
```

## 📊 Estrutura da Tabela

```sql
entregador_localizacao
├── id (UUID)
├── pedido_delivery_id (UUID) → Foreign Key
├── latitude (DECIMAL)
├── longitude (DECIMAL)
├── velocidade (DECIMAL) → km/h
├── direcao (DECIMAL) → graus
├── precisao (DECIMAL) → metros
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

## 🔐 Segurança (RLS)

- ✅ Qualquer pessoa pode **ler** localizações (para tracking público)
- ✅ Apenas usuários **autenticados** podem inserir/atualizar
- ✅ Dados antigos podem ser limpos periodicamente

## 🎯 Quando o Mapa Aparece

O mapa só é exibido quando:
1. Status do pedido = `saiu_entrega`
2. Existe localização do entregador no banco

Se não houver localização, exibe mensagem:
> "Aguardando rastreamento - O rastreamento em tempo real será exibido quando seu pedido sair para entrega."

## 🚀 Integrações Futuras

### Possíveis Melhorias:

1. **Cálculo de Tempo Estimado**
   - Usar distância e velocidade para estimar chegada
   - Exibir "Chegando em X minutos"

2. **Histórico de Rota**
   - Salvar todas as posições
   - Desenhar linha completa do trajeto

3. **Notificações de Proximidade**
   - Avisar cliente quando entregador estiver próximo
   - "Seu pedido está chegando!"

4. **Otimização de Rota**
   - Sugerir melhor caminho usando API de roteamento

5. **Modo Offline**
   - Armazenar posições localmente se sem internet
   - Sincronizar quando voltar online

## 🧪 Como Testar

### Teste Local (Simulado):

1. **Abra duas abas do navegador**

2. **Aba 1 - Cliente:**
   ```
   http://localhost:8080/delivery/tracking/[pedido-id]
   ```

3. **Aba 2 - Entregador:**
   ```
   http://localhost:8080/delivery/tracker/[pedido-id]
   ```

4. **Na aba do entregador:**
   - Conceda permissão de localização
   - Clique em "Iniciar Rastreamento"
   - Movimente-se (ou use ferramentas de dev para simular)

5. **Na aba do cliente:**
   - Veja o marcador do entregador se movendo
   - Observe as atualizações em tempo real

### Teste em Produção:

1. Deploy da aplicação
2. Certifique-se que HTTPS está ativo (necessário para Geolocation)
3. Mande o link `/delivery/tracker/:pedidoId` para o entregador via WhatsApp
4. Cliente acessa `/delivery/tracking/:pedidoId` normalmente

## ⚠️ Requisitos

### Para Funcionar:
- ✅ HTTPS (produção) - Geolocation API requer conexão segura
- ✅ Permissão de localização do navegador
- ✅ GPS/localização ativada no dispositivo
- ✅ Migration aplicada no banco de dados
- ✅ Supabase Realtime habilitado

### Compatibilidade:
- ✅ Chrome/Edge: Suporte completo
- ✅ Firefox: Suporte completo
- ✅ Safari: Suporte completo (iOS 11+)
- ✅ Chrome Mobile: Suporte completo
- ✅ Safari Mobile: Suporte completo

## 💰 Custos

**Tudo 100% GRATUITO!**
- ✅ OpenStreetMap: Gratuito
- ✅ Leaflet: Open source
- ✅ Geolocation API: Nativa do navegador
- ✅ Supabase Realtime: Incluído no plano gratuito

## 📝 Notas Importantes

1. **Precisão GPS**: Pode variar de 5m a 100m dependendo do ambiente
2. **Bateria**: Rastreamento contínuo consome bateria do celular
3. **Dados**: Consome dados móveis para atualizar localização
4. **Privacidade**: Localização só é compartilhada durante entrega ativa
5. **Performance**: Leaflet é muito leve e performático

## 🎉 Pronto!

O sistema de rastreamento em tempo real está completo e pronto para uso!

Para integrar no fluxo existente, basta:
1. Aplicar a migration no banco
2. Quando status mudar para "saiu_entrega", enviar link do tracker para o entregador
3. Cliente automaticamente verá o mapa na página de tracking

🚀 **Happy Tracking!**
