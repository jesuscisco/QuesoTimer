# MTG Timer & Control System

Sistema de temporizador para Magic: The Gathering con slider promocional y panel de control remoto.

## Características

### Timer MTG
- **Tiempo principal**: 50 minutos de cuenta regresiva
- **Tiempo extra**: 10 minutos adicionales después de la alarma
- **Alarma de audio**: Suena automáticamente al terminar el tiempo principal
- **Estados visuales**: Diferentes colores según la fase del juego
- **Barra de progreso**: Indicador visual del tiempo transcurrido

### Slider Promocional
- **4 slides diferentes** con animaciones únicas:
  - `anim-4parts`: División en 4 partes
  - `anim-9parts`: División en 9 partes  
  - `anim-5parts`: División en 5 partes
  - `anim-3parts`: División en 3 partes
- **Auto-advance**: Cambia automáticamente cada 10 segundos
- **Animaciones CSS avanzadas**: Transiciones fluidas con pseudo-elementos

### Panel de Control
- **Control remoto completo** del timer y slider
- **Controles de tiempo**: Start, Pause, Reset
- **Ajuste de tiempo**: Agregar/quitar minutos
- **Control de slider**: Navegación manual entre slides
- **Acciones rápidas**: Botones para funciones comunes

## Estructura del Proyecto

```
app/
├── components/
│   ├── MTGTimer.tsx          # Componente del timer (solo display)
│   ├── PromoSlider.tsx       # Componente del slider (solo display)
│   ├── MTGLayout.tsx         # Layout principal con contexto
│   ├── ControlPanel.tsx      # Panel de control
│   └── ControlPanelWrapper.tsx # Wrapper para conectar con contexto
├── context/
│   └── AppContext.tsx        # Estado global y lógica del negocio
├── control/
│   └── page.tsx             # Página del panel de control
└── page.tsx                 # Página principal

src/
└── slider.css              # Animaciones CSS del slider
```

## Uso

### Vista Principal
1. Visita `http://localhost:3000`
2. El timer y slider se ejecutan automáticamente
3. Haz clic en "Panel de Control" (esquina superior derecha) para abrir los controles

### Panel de Control
1. Visita `http://localhost:3000/control` o usa el enlace desde la vista principal
2. **Timer Controls:**
   - `Start`: Inicia el temporizador
   - `Pause`: Pausa el temporizador
   - `Reset`: Reinicia a 50 minutos
   - `+1 min` / `-1 min`: Ajusta el tiempo
   - `+5 min` / `-5 min`: Ajuste rápido de tiempo

3. **Slider Controls:**
   - `◀` / `▶`: Navega manualmente entre slides
   - Botones numerados (1-4): Va directamente al slide específico

### Layouts Responsivos
- **Pantallas grandes (lg+)**: Timer 25% | Slider 75% (lado a lado)
- **Pantallas medianas (md)**: Timer 25% | Slider 75% (vertical)
- **Pantallas pequeñas**: Timer 40% | Slider 60% (vertical)

## Tecnologías

- **Next.js 16**: Framework de React con App Router
- **React 19**: Componentes y hooks modernos
- **TypeScript**: Tipado estático
- **Tailwind CSS 4**: Estilos utility-first
- **React Context API**: Estado global compartido
- **CSS Animations**: Animaciones avanzadas para el slider

## Desarrollo

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Compilar para producción
npm run build

# Ejecutar en producción
npm start
```

## Arquitectura

### Estado Global (AppContext)
- **Timer State**: Estado completo del temporizador
- **Slider State**: Slide actual y estado de transición
- **Control Functions**: Funciones para manejar timer y slider
- **Auto-advance**: Lógica automática del slider cada 10 segundos

### Separación de Responsabilidades
- **Display Components**: Solo muestran información (sin controles)
- **Control Panel**: Interfaz administrativa separada
- **Context Provider**: Maneja toda la lógica de negocio
- **Responsive Design**: Adaptación automática a diferentes pantallas

## Personalización

### Cambiar Tiempo del Timer
Modifica `AppContext.tsx` línea donde se inicializa el timer:
```typescript
const [timer, setTimer] = useState<TimerState>({
  minutes: 50, // Cambiar aquí
  seconds: 0,
  // ...
});
```

### Modificar Slides
Edita el array `slidesData` en `PromoSlider.tsx`:
```typescript
const slidesData: SlideData[] = [
  {
    id: 1,
    title: 'Tu Título',
    subtitle: 'Tu Subtítulo',
    backgroundImage: 'URL_DE_IMAGEN',
    animationType: 'anim-4parts' // Tipo de animación
  },
  // ...
];
```

### Ajustar Auto-advance
Cambia el intervalo en `AppContext.tsx`:
```typescript
const interval = setInterval(() => {
  // ...
}, 10000); // Cambiar milisegundos aquí
```