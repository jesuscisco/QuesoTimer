MTG Timer & Control System
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
