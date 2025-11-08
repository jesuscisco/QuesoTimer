# Documentación Técnica - QuesoTimer

Esta documentación está dirigida a desarrolladores que quieran entender, modificar o contribuir al proyecto.

## Arquitectura del Sistema

### Stack Tecnológico

- **Framework**: Next.js 16 con App Router
- **Runtime**: React 19 con TypeScript
- **Estilos**: Tailwind CSS 4
- **Estado Global**: Zustand
- **PWA**: Service Workers + Web App Manifest
- **Audio**: Web Audio API
- **Persistencia**: LocalStorage + BroadcastChannel

### Patrones de Diseño

1. **Store Global con Zustand**
   - Estado centralizado para timer, slider, alertas
   - Subscripciones reactivas para UI
   - Persist middleware para LocalStorage

2. **Comunicación Cross-Tab**
   - BroadcastChannel para sincronización
   - Eventos de storage para backup
   - Estado compartido entre ventanas

3. **API Routes como Proxy**
   - Evita CORS con APIs externas
   - Rate limiting y error handling
   - Transformación de datos server-side

## Componentes Principales

### TournamentEditor.tsx

**Propósito**: Editor universal para todos los tipos de torneo

**Props**:
```typescript
interface TournamentEditorProps {
  mode: 'ffa' | 'twoHeads' | 'oneVsOne';
}
```

**Estado Local**:
- `players`: Lista de participantes
- `tables`: Mesas actuales
- `placements`: Resultados por mesa
- `rounds`: Historial de rondas
- `pendingRound`: Flag de ronda pendiente

**Funciones Clave**:

1. **`startTournament()`**: 
   - Genera emparejamientos iniciales aleatorios
   - Diferente lógica según modo
   - Actualiza LocalStorage y BroadcastChannel

2. **`generateRoundFromStandings(roundNumber)`**:
   - Emparejamiento Swiss para FFA
   - Agrupa por clasificación actual
   - Mesas de 4 jugadores optimizadas

3. **`generateTwoHeadsRoundFromStandings(roundNumber)`**:
   - Forma equipos de 2 jugadores
   - Enfrenta equipos por clasificación
   - Maneja equipos impares

4. **`generateOneVsOneRoundFromStandings(roundNumber)`**:
   - Enfrenta jugadores 1vs1
   - Basado en clasificación Swiss
   - Bye automático para números impares

5. **`buildStandingsFromRounds()`**:
   - Calcula puntos por modo de torneo
   - OMW% y PRF% para desempates
   - Ordenamiento multi-criterio

**Persistencia**:
```typescript
// Keys de LocalStorage
const PLAYERS_KEY = `players_${mode}`;
const ROUNDS_KEY = `rounds_${mode}`;
const TABLES_KEY = `tables_${mode}`;
const PENDING_KEY = `pending_${mode}`;
```

### ControlPanel.tsx

**Propósito**: Panel de control remoto con múltiples funcionalidades

**Secciones**:

1. **Timer Controls**: Play/Pause/Reset/Adjust
2. **Slider Controls**: Navigation/Auto-advance
3. **Tournament Section**: Links a diferentes modos
4. **Moxfield Aggregator**: Importación y análisis de mazos
5. **PWA Controls**: Install prompt, offline status

**MoxfieldAggregator Subcomponent**:

```typescript
interface CardResult {
  name: string;
  quantity: number;
  set_name?: string;
  set?: string;
  rarity?: string;
  colors?: string[];
}

interface ProcessingDetails {
  processedDecks: string[];
  failedDecks: { url: string; reason: string }[];
  cardCount: number;
}
```

**Estado del Agregador**:
- `urls`: TextArea con URLs de mazos
- `results`: Cartas agregadas con metadata
- `details`: Información de procesamiento
- `filters`: Filtros activos (rareza, set, color)
- `sorting`: Orden de columnas

### PromoSlider.tsx

**Propósito**: Carrusel de imágenes con auto-advance

**Características**:
- Carga dinámica desde `/api/slider-images`
- Técnica de fondo difuminado (sin barras negras)
- Animaciones CSS suaves
- Control remoto desde panel

**CSS Clave** (slider.css):
```css
.slider-container {
  background-image: url('imagen-actual');
  background-size: cover;
  filter: blur(10px);
}

.slider-image {
  object-fit: contain;
  position: relative;
  z-index: 1;
}
```

## APIs y Rutas

### /api/moxfield/route.ts

**Propósito**: Proxy para Moxfield + enriquecimiento Scryfall

**Flujo de Datos**:
1. Recibe URLs de mazos del cliente
2. Extrae IDs de mazos de URLs
3. Consulta Moxfield API por cada mazo
4. Agrega cartas de mainboard, sideboard, commanders, companions
5. Enriquece con Scryfall API (set, rarity, colors)
6. Aplica rate limiting y retry logic
7. Retorna datos agregados

**Rate Limiting**:
- 100ms entre llamadas a Scryfall
- Retry automático en errores 429
- Fuzzy search como fallback

**Estructura de Respuesta**:
```typescript
{
  results: CardResult[];
  details: {
    processedDecks: string[];
    failedDecks: { url: string; reason: string }[];
    cardCount: number;
  }
}
```

### /api/slider-images/route.ts

**Propósito**: Lista imágenes disponibles en `public/slider`

**Implementación**:
```typescript
const fs = require('fs');
const path = require('path');

export async function GET() {
  const sliderDir = path.join(process.cwd(), 'public', 'slider');
  const files = fs.readdirSync(sliderDir)
    .filter(file => /\.(jpg|jpeg|png|webp|gif)$/i.test(file))
    .map(file => `/slider/${file}`);
  
  return Response.json({ images: files });
}
```

## Estado Global y Persistencia

### useAppStoreSimple.ts (Zustand)

**Store Structure**:
```typescript
interface AppStore {
  // Timer
  minutes: number;
  seconds: number;
  isRunning: boolean;
  phase: 'main' | 'extra';
  
  // Slider
  currentSlide: number;
  autoAdvance: boolean;
  images: string[];
  
  // Alerts
  alertMinutes: number;
  alertSeconds: number;
  
  // Audio
  audioUnlocked: boolean;
  
  // Actions
  setTime: (minutes: number, seconds: number) => void;
  toggleTimer: () => void;
  resetTimer: () => void;
  nextSlide: () => void;
  // ... más acciones
}
```

**Middleware de Persistencia**:
- Timer state persiste en localStorage
- Slider state sincroniza cross-tab
- Audio unlock state es volátil

### Comunicación Cross-Tab

**broadcast.ts**:
```typescript
type BroadcastMessage = 
  | { type: 'timerUpdate'; payload: TimerState }
  | { type: 'sliderUpdate'; payload: SliderState }
  | { type: 'showModal' }
  | { type: 'hideModal' };

export function broadcast(message: BroadcastMessage) {
  try {
    const channel = new BroadcastChannel('queso-timer');
    channel.postMessage(message);
  } catch (error) {
    // Fallback a storage events
    localStorage.setItem('broadcast-message', JSON.stringify({
      message,
      timestamp: Date.now()
    }));
  }
}
```

## PWA y Offline

### Service Worker (public/sw.js)

**Estrategias de Caché**:

1. **Stale While Revalidate**: Assets de Next.js
2. **Cache First**: Imágenes y sonidos estáticos
3. **Network First**: API calls con fallback

**Recursos Cached**:
- `/_next/static/` - Assets de Next.js
- `/slider/` - Imágenes del carrusel  
- `/sound/` - Archivos de audio
- `/` y `/control` - Páginas críticas

### Web App Manifest (public/manifest.webmanifest)

**Configuración**:
```json
{
  "name": "QuesoTimer",
  "short_name": "Timer",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1f2937",
  "theme_color": "#3b82f6",
  "shortcuts": [
    {
      "name": "Timer",
      "url": "/timer",
      "icons": [...]
    },
    {
      "name": "Control",
      "url": "/control", 
      "icons": [...]
    }
  ]
}
```

## Sistema de Torneos

### Tipos de Torneo

1. **FFA (Free-for-All)**:
   - 4 jugadores por mesa
   - Puntos: 4/3/2/1 por posición
   - Emparejamiento Swiss optimizado

2. **Two Heads Giant**:
   - Equipos de 2 jugadores
   - 2 equipos por mesa
   - Puntos por equipo ganador

3. **1vs1**:
   - Enfrentamientos individuales
   - 2 jugadores por mesa
   - Sistema Swiss estándar

### Algoritmo de Emparejamiento Swiss

**Para FFA**:
```typescript
function generateRoundFromStandings(roundNumber: number) {
  const standings = buildStandingsFromRounds();
  const shuffledStandings = shuffle(standings);
  
  const tables: string[][] = [];
  for (let i = 0; i < shuffledStandings.length; i += 4) {
    const table = shuffledStandings
      .slice(i, i + 4)
      .map(s => s.name);
    tables.push(table);
  }
  
  // Manejar jugadores sobrantes...
}
```

**Cálculo de OMW%**:
```typescript
function calculateOMW(playerName: string, rounds: Round[]) {
  const opponents = getOpponents(playerName, rounds);
  const opponentWinRates = opponents.map(opp => 
    getWinRate(opp, rounds)
  );
  
  return opponentWinRates.reduce((a, b) => a + b, 0) / opponents.length;
}
```

### Persistencia de Torneos

**Estructura de Datos**:
```typescript
interface Round {
  round: number;
  tables: TableResult[];
  timestamp: number;
}

interface TableResult {
  table: number;
  players: string[];
  results: number[]; // Posiciones finales
}
```

**LocalStorage Keys**:
- `players_{mode}`: Lista de participantes
- `rounds_{mode}`: Historial de rondas
- `tables_{mode}`: Estado actual de mesas
- `pending_{mode}`: Flag de ronda pendiente

## Audio System

### Web Audio API (sound.ts)

**Inicialización**:
```typescript
let audioContext: AudioContext | null = null;
let warningBuffer: AudioBuffer | null = null;
let overBuffer: AudioBuffer | null = null;

export async function initAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }
}
```

**Reproducción**:
```typescript
export async function playWarning() {
  if (!warningBuffer) {
    const response = await fetch('/sound/warning.mp3');
    const arrayBuffer = await response.arrayBuffer();
    warningBuffer = await audioContext!.decodeAudioData(arrayBuffer);
  }
  
  const source = audioContext!.createBufferSource();
  source.buffer = warningBuffer;
  source.connect(audioContext!.destination);
  source.start();
}
```

**Desbloqueo de Audio**:
- Requerido por políticas del navegador
- Se activa con primer gesto del usuario
- Flag global `audioUnlocked` en store

## Agregador Moxfield

### Flujo de Procesamiento

1. **Extracción de URLs**:
```typescript
const deckIds = urls
  .split('\n')
  .map(url => url.trim())
  .filter(Boolean)
  .map(extractDeckIdFromUrl)
  .filter(Boolean);
```

2. **Consulta Moxfield**:
```typescript
const endpoints = [
  `https://api2.moxfield.com/v3/decks/all/${deckId}`,
  `https://api.moxfield.com/v2/decks/all/${deckId}`,
  `https://moxfield.com/api/v1/decks/all/${deckId}`
];
```

3. **Agregación de Cartas**:
```typescript
function extractBoardCards(board: any): CardData[] {
  if (!board || typeof board !== 'object') return [];
  
  return Object.values(board).map(card => ({
    name: card.card?.name || '',
    quantity: card.quantity || 1
  }));
}
```

4. **Enriquecimiento Scryfall**:
```typescript
async function enrichWithScryfall(cards: CardData[]) {
  for (const card of cards) {
    // Búsqueda exacta
    let scryfallData = await searchExact(card.name);
    
    // Fallback a fuzzy search
    if (!scryfallData) {
      scryfallData = await searchFuzzy(card.name);
    }
    
    // Aplicar metadata
    if (scryfallData) {
      card.set_name = scryfallData.set_name;
      card.set = scryfallData.set;
      card.rarity = scryfallData.rarity;
      card.colors = scryfallData.color_identity;
    }
    
    // Rate limiting
    await sleep(100);
  }
}
```

### Sistema de Filtros

**Implementación de Filtros**:
```typescript
const filteredResults = results.filter(card => {
  if (filters.rarity && card.rarity !== filters.rarity) return false;
  if (filters.setCode && card.set !== filters.setCode) return false;
  if (filters.color && filters.color !== 'all') {
    const cardColors = card.colors || [];
    if (filters.color === 'C') {
      return cardColors.length === 0;
    } else {
      return cardColors.includes(filters.color);
    }
  }
  return true;
});
```

**Ordenamiento**:
```typescript
const sortedResults = [...filteredResults].sort((a, b) => {
  const aVal = a[sortBy] || '';
  const bVal = b[sortBy] || '';
  
  if (sortDir === 'asc') {
    return aVal.localeCompare(bVal);
  } else {
    return bVal.localeCompare(aVal);
  }
});
```

## Mejores Prácticas

### Manejo de Errores

1. **Try-Catch Wrapping**:
```typescript
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  console.error('Operation failed:', error);
  return fallbackValue;
}
```

2. **Graceful Degradation**:
```typescript
// Audio fallback
if (!window.AudioContext) {
  console.warn('Web Audio API not supported');
  return; // Continúa sin audio
}

// LocalStorage fallback
try {
  localStorage.setItem(key, value);
} catch (error) {
  // Continúa en memoria
  memoryStore[key] = value;
}
```

### Performance

1. **Debouncing de APIs**:
```typescript
const debouncedSearch = useMemo(
  () => debounce(searchFunction, 300),
  []
);
```

2. **Lazy Loading**:
```typescript
const HeavyComponent = lazy(() => import('./HeavyComponent'));
```

3. **Memoización**:
```typescript
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(dependencies);
}, [dependencies]);
```

### Testing

**Estructura Recomendada**:
```typescript
// __tests__/components/TournamentEditor.test.tsx
describe('TournamentEditor', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  
  it('should generate correct FFA pairings', () => {
    // Test implementation
  });
  
  it('should calculate standings correctly', () => {
    // Test implementation  
  });
});
```

## Contribución

### Setup de Desarrollo

1. **Fork y Clone**:
```bash
git clone https://github.com/tu-usuario/queso-timer.git
cd queso-timer
```

2. **Install y Run**:
```bash
npm install
npm run dev
```

3. **Estructura de Branches**:
- `main`: Producción estable
- `develop`: Desarrollo activo  
- `feature/`: Nuevas funcionalidades
- `fix/`: Correcciones de bugs

### Convenciones

**Naming**:
- Componentes: PascalCase (`TournamentEditor`)
- Hooks: camelCase con 'use' (`useSimpleTimer`)
- Utils: camelCase (`buildStandingsFromRounds`)
- Constants: UPPER_SNAKE_CASE (`ROUNDS_KEY`)

**Imports Order**:
1. React/Next imports
2. Third-party libraries
3. Local components
4. Local utils/hooks
5. Types/interfaces

**Commit Messages**:
```
feat(tournaments): add 1vs1 tournament mode
fix(audio): resolve autoplay policy issues  
docs(readme): update installation instructions
refactor(api): simplify moxfield data processing
```