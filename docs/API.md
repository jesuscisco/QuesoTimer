# API Documentation - QuesoTimer

Documentación completa de las APIs del sistema.

## 🌐 Endpoints Disponibles

### `/api/moxfield` - Agregador de Mazos

**Método**: `POST`

**Propósito**: Procesar múltiples URLs de mazos de Moxfield y enriquecer datos con Scryfall API.

#### Request Body

```json
{
  "urls": [
    "https://www.moxfield.com/decks/deck-id-1",
    "https://www.moxfield.com/decks/deck-id-2"
  ],
  "includeSideboard": true,
  "allowRepeated": false
}
```

#### Parámetros

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `urls` | `string[]` | ✅ | Array de URLs de mazos de Moxfield |
| `includeSideboard` | `boolean` | ❌ | Incluir cartas del sideboard (default: `false`) |
| `allowRepeated` | `boolean` | ❌ | Permitir cartas repetidas entre mazos (default: `true`) |

#### Response Format

```json
{
  "results": [
    {
      "name": "Lightning Bolt",
      "quantity": 12,
      "set_name": "Alpha",
      "set": "lea", 
      "rarity": "common",
      "colors": ["R"]
    }
  ],
  "details": {
    "processedDecks": ["deck-id-1", "deck-id-2"],
    "failedDecks": [
      {
        "url": "https://www.moxfield.com/decks/invalid-deck",
        "reason": "Deck not found"
      }
    ],
    "cardCount": 234
  }
}
```

#### Tipos de Datos

```typescript
interface CardResult {
  name: string;
  quantity: number;
  set_name?: string;  // Nombre completo del set
  set?: string;       // Código del set (3 letras)
  rarity?: string;    // common, uncommon, rare, mythic
  colors?: string[];  // Array de colores: W, U, B, R, G
}

interface ProcessingDetails {
  processedDecks: string[];
  failedDecks: {
    url: string;
    reason: string;
  }[];
  cardCount: number;
}
```

#### Códigos de Estado

| Código | Descripción |
|--------|-------------|
| `200` | Procesamiento exitoso |
| `400` | Request body inválido |
| `429` | Rate limit excedido |
| `500` | Error interno del servidor |

#### Ejemplo de Uso

```javascript
const response = await fetch('/api/moxfield', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    urls: [
      'https://www.moxfield.com/decks/example-deck-1',
      'https://www.moxfield.com/decks/example-deck-2'
    ],
    includeSideboard: true,
    allowRepeated: false
  })
});

const data = await response.json();
console.log(`Procesadas ${data.results.length} cartas únicas`);
```

### `/api/slider-images` - Lista de Imágenes

**Método**: `GET`

**Propósito**: Obtener lista de imágenes disponibles en el directorio del slider.

#### Response Format

```json
{
  "images": [
    "/slider/image1.jpg",
    "/slider/image2.png", 
    "/slider/image3.webp"
  ]
}
```

#### Formatos Soportados

- `.jpg`, `.jpeg`
- `.png`
- `.webp`
- `.gif`

#### Ejemplo de Uso

```javascript
const response = await fetch('/api/slider-images');
const data = await response.json();

data.images.forEach(imagePath => {
  console.log(`Imagen disponible: ${imagePath}`);
});
```

## 🔗 APIs Externas Integradas

### Moxfield API

QuesoTimer integra con múltiples endpoints de Moxfield para máxima compatibilidad:

#### Endpoints Utilizados

1. `https://api2.moxfield.com/v3/decks/all/{deckId}`
2. `https://api.moxfield.com/v2/decks/all/{deckId}`
3. `https://moxfield.com/api/v1/decks/all/{deckId}`

#### Extracción de Datos

```typescript
// Tipos de mazos procesados
interface MoxfieldDeck {
  mainboard: Record<string, CardData>;
  sideboard?: Record<string, CardData>;
  commanders?: Record<string, CardData>;
  companions?: Record<string, CardData>;
}

// Datos de carta extraídos
interface CardData {
  card: {
    name: string;
  };
  quantity: number;
}
```

#### Rate Limiting

- **Sin límite oficial**: Pero se aplica throttling por cortesía
- **Retry Logic**: Reintentos automáticos en errores 429
- **Fallback**: Múltiples endpoints para redundancia

### Scryfall API

Usado para enriquecer datos de cartas con metadata completa.

#### Endpoints Utilizados

1. **Búsqueda Exacta**: `/cards/named?exact={cardName}`
2. **Búsqueda Fuzzy**: `/cards/named?fuzzy={cardName}`

#### Rate Limiting

- **Límite Oficial**: 10 requests/segundo
- **Implementación**: 100ms entre requests
- **Retry**: Reintentos automáticos
- **Fallback**: Fuzzy search si exact falla

#### Datos Enriquecidos

```typescript
interface ScryfallCard {
  name: string;
  set_name: string;
  set: string;
  rarity: string;
  color_identity: string[];
  mana_cost?: string;
  cmc?: number;
  type_line?: string;
}
```

## 🛠️ Utilidades Internas

### Extracción de Deck ID

```typescript
function extractDeckIdFromUrl(url: string): string | null {
  const patterns = [
    /moxfield\.com\/decks\/([a-zA-Z0-9_-]+)/,
    /moxfield\.com\/decks\/all\/([a-zA-Z0-9_-]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}
```

### Agregación de Cartas

```typescript
function aggregateCards(
  cards: CardData[], 
  allowRepeated: boolean
): CardResult[] {
  const cardMap = new Map<string, CardResult>();
  
  for (const card of cards) {
    const key = allowRepeated ? card.name : `${card.name}_${card.set}`;
    const existing = cardMap.get(key);
    
    if (existing) {
      existing.quantity += card.quantity;
    } else {
      cardMap.set(key, { ...card });
    }
  }
  
  return Array.from(cardMap.values());
}
```

### Error Handling

```typescript
interface APIError {
  message: string;
  code: string;
  details?: any;
}

// Tipos de errores comunes
const ErrorCodes = {
  INVALID_URL: 'INVALID_MOXFIELD_URL',
  DECK_NOT_FOUND: 'DECK_NOT_FOUND',
  RATE_LIMITED: 'RATE_LIMITED',
  SCRYFALL_ERROR: 'SCRYFALL_API_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR'
} as const;
```

## 📊 Métricas y Logging

### Request Logging

Cada request a `/api/moxfield` genera logs detallados:

```typescript
interface RequestLog {
  timestamp: string;
  deckIds: string[];
  processedCount: number;
  failedCount: number;
  processingTime: number;
  scryfallCalls: number;
  errors: string[];
}
```

### Performance Metrics

```typescript
interface PerformanceMetrics {
  totalRequests: number;
  averageProcessingTime: number;
  successRate: number;
  scryfallHitRate: number;
  cacheEfficiency: number;
}
```

## 🔒 Consideraciones de Seguridad

### Rate Limiting Implementado

```typescript
// Throttling para Scryfall
const SCRYFALL_DELAY = 100; // ms entre requests

// Límites por session
const SESSION_LIMITS = {
  maxDecksPerRequest: 50,
  maxRequestsPerHour: 100,
  maxCardsProcessed: 10000
};
```

### Validación de Input

```typescript
function validateMoxfieldUrl(url: string): boolean {
  const validPatterns = [
    /^https?:\/\/(www\.)?moxfield\.com\/decks\/[a-zA-Z0-9_-]+/
  ];
  
  return validPatterns.some(pattern => pattern.test(url));
}
```

### Sanitización de Datos

```typescript
function sanitizeCardName(name: string): string {
  return name
    .trim()
    .replace(/[^\w\s\-',.]/g, '') // Permitir solo caracteres seguros
    .slice(0, 200); // Límite de longitud
}
```

## 🚀 Optimizaciones

### Caching Strategy

```typescript
// Cache en memoria para requests repetidos
const responseCache = new Map<string, {
  data: any;
  timestamp: number;
  ttl: number;
}>();

// TTL por tipo de dato
const CACHE_TTL = {
  deckData: 5 * 60 * 1000,    // 5 minutos
  scryfallData: 60 * 60 * 1000, // 1 hora
  imageList: 10 * 60 * 1000   // 10 minutos
};
```

### Batch Processing

```typescript
// Procesar mazos en lotes para mejor performance
async function processDecksBatch(
  deckIds: string[], 
  batchSize: number = 5
): Promise<ProcessingResult> {
  const batches = chunk(deckIds, batchSize);
  const results = [];
  
  for (const batch of batches) {
    const batchResults = await Promise.allSettled(
      batch.map(processIndividualDeck)
    );
    results.push(...batchResults);
    
    // Pausa entre lotes
    await sleep(200);
  }
  
  return aggregateResults(results);
}
```

## 📈 Monitoreo y Analytics

### Health Check Endpoint

```typescript
// GET /api/health
interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    moxfield: 'up' | 'down' | 'slow';
    scryfall: 'up' | 'down' | 'slow';
    localStorage: 'available' | 'unavailable';
  };
  metrics: {
    uptime: number;
    memoryUsage: number;
    activeConnections: number;
  };
}
```

### Usage Analytics

```typescript
interface UsageStats {
  totalDecksProcessed: number;
  uniqueCardsFound: number;
  averageCardsPerDeck: number;
  popularSets: { set: string; count: number }[];
  errorRate: number;
}
```

---

## 🔧 Desarrollo y Testing

### Local Development

```bash
# Iniciar con debug mode
DEBUG=true npm run dev

# Testing específico de APIs
npm run test:api

# Load testing
npm run load-test
```

### Mock Data para Testing

```typescript
const mockMoxfieldResponse = {
  mainboard: {
    "lightning-bolt": {
      card: { name: "Lightning Bolt" },
      quantity: 4
    }
  }
};

const mockScryfallResponse = {
  name: "Lightning Bolt",
  set_name: "Alpha",
  set: "lea",
  rarity: "common",
  color_identity: ["R"]
};
```

Para más información sobre desarrollo, consultar `/docs/TECHNICAL.md`.