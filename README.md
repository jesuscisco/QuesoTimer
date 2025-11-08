# QuesoTimer - Sistema de Timer y Gestión de Torneos MTG

Sistema completo para gestión de partidas y torneos de Magic: The Gathering con timer avanzado, panel de control remoto, sistema de torneos multimodo y agregador de mazos de Moxfield.

## 🚀 Características Principales

### Timer y Control
- **Timer 50 → 10**: Cambio de fase automático con tiempo extra
- **Alertas personalizadas**: Sonidos configurables (warning.mp3, over.mp3)
- **Panel de Control remoto**: Control completo desde otra pestaña/dispositivo
- **PWA Offline**: Funciona sin conexión después de la primera carga
- **Sincronización cross-tab**: Estado compartido entre pestañas

### Sistema de Torneos
- **Torneos FFA (Free-for-All)**: Mesas de 4 jugadores con sistema de puntos
- **Torneos 2 Cabezas**: Equipos de 2 jugadores vs equipos de 2
- **Torneos 1vs1**: Enfrentamientos individuales
- **Sistema de emparejamiento inteligente**: Basado en clasificación Swiss
- **Clasificaciones automáticas**: OMW%, PRF%, exportación a CSV

### Agregador de Mazos Moxfield
- **Importación masiva**: URLs de mazos de Moxfield
- **Enriquecimiento de datos**: Integración con Scryfall API
- **Filtros avanzados**: Por rareza, expansión, color
- **Exportación Excel**: CSV con metadata completa

### Carrusel de Promociones
- **Slider automático**: Imágenes desde `public/slider`
- **Fondo inteligente**: Sin barras negras, fondo difuminado
- **Control remoto**: Navegación desde panel de control

## 📁 Estructura del Proyecto

```
app/
├── components/           # Componentes React principales
│   ├── TournamentEditor.tsx    # Editor de torneos
│   ├── ControlPanel.tsx        # Panel de control principal
│   ├── PromoSlider.tsx         # Carrusel de promociones
│   └── GlobalEffects.tsx       # Efectos globales
├── store/               # Estado global (Zustand)
│   └── useAppStoreSimple.ts
├── hooks/               # Hooks personalizados
│   └── useSimpleTimer.ts
├── utils/               # Utilidades
│   ├── broadcast.ts            # Comunicación cross-tab
│   ├── sound.ts               # Audio Web API
│   ├── pairings.ts            # Tipos de emparejamiento
│   └── csv.ts                 # Exportación CSV
├── api/                 # API Routes
│   ├── moxfield/              # Proxy Moxfield + Scryfall
│   └── slider-images/         # Lista de imágenes
├── torneos/             # Páginas de torneos
│   ├── multi/                 # Torneos FFA
│   ├── 2cabezas/             # Torneos por equipos
│   └── 1vs1/                 # Torneos 1 contra 1
├── timer/               # Página del timer
├── control/             # Página del panel de control
└── clasificacion/       # Visualización de clasificaciones
```

## 🛠️ Instalación y Configuración

### Requisitos Previos
- Node.js 18 o superior
- npm o yarn

### Instalación
```powershell
# Clonar el repositorio
git clone [URL_REPOSITORIO]
cd queso-timer

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev
```

### Configuración de Contenido
1. **Sonidos**: Coloca `warning.mp3` y `over.mp3` en `public/sound/`
2. **Imágenes del slider**: Agrega imágenes en `public/slider/`
3. **Configuración PWA**: Personaliza `public/manifest.webmanifest`

## 🎮 Uso del Sistema

### Acceso a Pantallas
- **Timer principal**: `http://localhost:3000/timer`
- **Panel de control**: `http://localhost:3000/control`
- **Torneos Multi**: `http://localhost:3000/torneos/multi`
- **Torneos 2 Cabezas**: `http://localhost:3000/torneos/2cabezas`
- **Torneos 1vs1**: `http://localhost:3000/torneos/1vs1`
- **Clasificaciones**: `http://localhost:3000/clasificacion`

### Atajos de Teclado
- **Alt+1**: Abrir panel de control
- **Alt+5**: Probar sonido de alerta

### Flujo de Trabajo de Torneos

1. **Configuración Inicial**
   - Crear nuevo torneo (Multi/2 Cabezas/1vs1)
   - Agregar participantes
   - Configurar número de rondas

2. **Gestión de Rondas**
   - Generar emparejamientos automáticos
   - Registrar resultados de partidas
   - Ver clasificaciones en tiempo real

3. **Finalización**
   - Exportar clasificaciones finales
   - Guardar historial del torneo

### Agregador de Mazos Moxfield

1. **Importación**
   - Pegar URLs de mazos de Moxfield (una por línea)
   - Configurar opciones (sideboard, cartas repetidas)
   - Procesar mazos

2. **Análisis y Filtrado**
   - Filtrar por rareza, expansión, colores
   - Ordenar por columnas
   - Ver estadísticas agregadas

3. **Exportación**
   - Descargar CSV con formato Excel
   - Columnas: Código, Expansión, Rareza, Color, Carta, Cantidad

## 🔧 Tecnologías Utilizadas

- **Frontend**: Next.js 16, React 19, TypeScript
- **Estilos**: Tailwind CSS 4
- **Estado**: Zustand
- **PWA**: Service Workers, Web App Manifest
- **Audio**: Web Audio API
- **Almacenamiento**: LocalStorage, BroadcastChannel

## 📊 Sistema de Puntuación de Torneos

### FFA (Free-for-All)
- 1er lugar: 4 puntos
- 2do lugar: 3 puntos
- 3er lugar: 2 puntos
- 4to lugar: 1 punto

### Desempates
1. **OMW% (Opponent Match Win)**: Porcentaje de victorias de oponentes
2. **PRF% (Player Rating Factor)**: Factor de rating del jugador
3. **Victorias totales**
4. **Orden alfabético**

## 🌐 APIs Integradas

### Moxfield API
- Extracción de listas de mazos
- Soporte para mainboard, sideboard, commanders, companions
- Manejo de rate limiting

### Scryfall API
- Enriquecimiento de metadatos de cartas
- Búsqueda por nombre exacto y fuzzy
- Información de expansiones, rareza, colores

## 🚀 Despliegue

### Build de Producción
```powershell
npm run build
npm run start
```

### Configuración PWA
- El service worker se registra automáticamente
- Manifest configurado para instalación
- Caché offline de assets críticos

## 🐛 Resolución de Problemas

### Problemas Comunes

1. **Audio no reproduce**
   - Interactúa con la página (clic/tecla)
   - Usa Alt+5 en el panel para desbloquear

2. **Lock de desarrollo en Windows**
   ```powershell
   taskkill /F /IM node.exe /T 2>$null
   Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
   npm run dev
   ```

3. **Imágenes del slider no aparecen**
   - Verifica archivos en `public/slider/`
   - Formatos soportados: jpg, jpeg, png, webp, gif

4. **Torneos no sincronizan**
   - Verifica LocalStorage disponible
   - Revisa BroadcastChannel support

### Debugging de APIs
- Logs detallados en `/api/moxfield`
- Información de rate limiting en respuestas
- Fallbacks automáticos para APIs externas

## 🤝 Contribución

### Estructura de Commits
- `feat:` Nuevas funcionalidades
- `fix:` Correcciones de bugs
- `docs:` Documentación
- `style:` Cambios de formato
- `refactor:` Refactorización
- `test:` Tests

### Desarrollo de Nuevas Funcionalidades

1. **Nuevos Tipos de Torneo**
   - Crear página en `app/torneos/[tipo]/`
   - Actualizar tipos en `pairings.ts`
   - Implementar lógica en `TournamentEditor.tsx`

2. **Nuevas APIs**
   - Crear route en `app/api/[nombre]/`
   - Implementar manejo de errores
   - Documentar endpoints

## 📄 Licencia

Proyecto de código abierto para la comunidad de Magic: The Gathering. 

---

## 🔗 Enlaces Útiles

- [Next.js Documentation](https://nextjs.org/docs)
- [Moxfield API](https://moxfield.com)
- [Scryfall API](https://scryfall.com/docs/api)
- [PWA Guidelines](https://web.dev/progressive-web-apps/)

Para soporte o contribuciones, por favor abre un issue en el repositorio.

## 📚 Documentación Completa

Esta es una introducción al proyecto. Para documentación detallada, consulta:

- **[📖 Índice de Documentación](docs/README.md)** - Navegación completa
- **[👤 Manual de Usuario](docs/USER_GUIDE.md)** - Guía completa de uso
- **[🛠️ Guía de Instalación](docs/INSTALLATION.md)** - Setup paso a paso
- **[🔧 Documentación Técnica](docs/TECHNICAL.md)** - Arquitectura y desarrollo
- **[🌐 API Reference](docs/API.md)** - Endpoints y integración
- **[🤝 Guía de Contribución](docs/CONTRIBUTING.md)** - Cómo contribuir

## 🚀 Inicio Rápido

```powershell
# Clonar repositorio
git clone https://github.com/jesuscisco/QuesoTimer.git
cd QuesoTimer

# Instalar dependencias
npm install

# Iniciar desarrollo
npm run dev

# Abrir http://localhost:3000
```

Para más detalles, consulta la [Guía de Instalación](docs/INSTALLATION.md).
==========================

Timer de partidas para Magic: The Gathering con Panel de Control remoto, carrusel de promociones, sincronización entre pestañas y soporte PWA offline.

Características principales
---------------------------
- Timer 50 → 10 con cambio de fase automático y fin de partida.
- Alertas personalizadas (mm:ss) con sonido (warning.mp3) y sonido final (over.mp3).
- Sonidos reproducidos vía Web Audio API (sin errores de autoplay ni formatos), desbloqueados tras el primer gesto del usuario.
- Panel de Control completo: iniciar/pausar/reset, ajustar tiempo, saltar a slide, pausar/reanudar auto-slide, preview del slide actual, indicador online/offline, botón “Añadir a inicio” (PWA) y botón “Abrir pantalla”.
- Slider de imágenes dinámico desde `public/slider`, sin barras negras: técnica de imagen “contain” con fondo difuminado de relleno, sincronizado con las animaciones.
- Auto-avance del slider con pausa desde el panel y sincronizado entre pestañas.
- Sincronización entre pestañas/ventanas con BroadcastChannel.
- PWA Offline: manifest, service worker, caché de assets estáticos, imágenes y sonidos.
- Atajos de teclado: Alt+1 (abrir Panel), Alt+5 (probar sonido warning en Panel).

Estructura breve
----------------
- `app/` App Router de Next.js; componentes principales en `app/components`.
- `app/components/GlobalEffects.tsx` Efectos globales (timer, auto-slide, broadcast, SW register, atajos).
- `app/store/useAppStoreSimple.ts` Estado global con Zustand (timer, slider, alertas, audioUnlocked).
- `app/hooks/useSimpleTimer.ts` Lógica de tick del timer y disparo de sonidos/eventos.
- `app/components/PromoSlider.tsx` Carrusel; carga imágenes desde `/api/slider-images`.
- `app/components/ControlPanel*.tsx` UI del panel y puente al store/broadcast.
- `app/components/slider.css` Estilos y animaciones del slider (capas + fondo difuminado).
- `app/utils/broadcast.ts` Mensajes cross-tab.
- `app/utils/sound.ts` Web Audio API: playWarning()/playOver(), buffer cache y unlock.
- `app/api/slider-images/route.ts` Lista las imágenes en `public/slider`.
- `public/sound/` Coloca aquí `warning.mp3` y `over.mp3`.
- `public/slider/` Coloca aquí las imágenes del carrusel.
- `public/sw.js` Service Worker simple para offline.
- `public/manifest.webmanifest` Manifest PWA (incluye shortcuts “Timer” y “Control”).

Requisitos de contenido
-----------------------
- Imágenes del slider: `public/slider/*.jpg|jpeg|png|webp|gif`.
- Sonidos: `public/sound/warning.mp3` y `public/sound/over.mp3`.

Uso en desarrollo
-----------------
1. Instala dependencias:
	```powershell
	npm install
	```
2. Ejecuta el servidor de desarrollo:
	```powershell
	npm run dev
	```
3. Abre `http://localhost:3000` para la pantalla principal (Timer + Slider).
4. Usa Alt+1 para abrir el Panel en una nueva pestaña, o navega a `/control`.

Notas Windows (si “lock” o puerto en uso):
- Si aparece “Unable to acquire lock .next\dev\lock”: cierra procesos Node y borra la carpeta `.next` antes de lanzar de nuevo.
  ```powershell
  taskkill /F /IM node.exe /T 2>$null
  Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
  npm run dev
  ```

Build y producción
------------------
```powershell
npm run build
npm run start
```

PWA, instalación y offline
--------------------------
- El Service Worker (`/sw.js`) se registra automáticamente en el cliente.
- “Añadir a inicio” está disponible cuando el navegador emite `beforeinstallprompt`; el botón aparece en el Panel.
- Tras instalar desde el Panel, se abre automáticamente otra ventana con la pantalla del Timer (`/`).
- Manifest incluye shortcuts: “Timer” (`/`) y “Control” (`/control`).
- Offline: se cachean assets de Next (`/_next`), imágenes de `/slider`, sonidos de `/sound` y rutas críticas (`/`, `/control`).

Sonidos y políticas del navegador
---------------------------------
- El audio se reproduce tras un gesto del usuario (clic/tecla). El Panel desbloquea el audio en el primer gesto.
- Atajo Alt+5 en el Panel reproduce `warning.mp3` (útil para probar audio y desbloquear).
- Alerta personalizada: cuando el timer coincide con el objetivo, suena `warning.mp3`.
- Fin del tiempo extra: suena `over.mp3`.

Atajos y acciones rápidas
-------------------------
- Alt+1: abrir `/control` en una nueva pestaña.
- Alt+5 (solo en Panel): reproducir `warning.mp3`.
- Botones del Panel: Iniciar/Pausar/Reset, Ajustar tiempo, Ir a slide X, Pausar/Reanudar auto-slide, “Abrir pantalla” (abre `/`).

Problemas comunes
-----------------
- No suena el audio: realiza un clic o presiona una tecla en la pestaña (autoplay policy). Prueba Alt+5 en el Panel.
- Imágenes no aparecen: coloca archivos en `public/slider` con extensiones soportadas.
- Offline no carga la primera vez: visita con red para que el SW precargue el contenido.

Licencia
--------
Proyecto con fines de demostración. Ajusta sonidos e imágenes según tus derechos de uso.
