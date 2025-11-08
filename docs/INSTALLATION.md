# Guía de Instalación y Configuración

Esta guía te ayudará a configurar QuesoTimer desde cero en tu entorno local.

## 📋 Requisitos del Sistema

### Software Necesario

- **Node.js**: Versión 18 o superior
  - Descargar desde: https://nodejs.org/
  - Verificar instalación: `node --version`

- **npm**: Incluido con Node.js
  - Verificar: `npm --version`

- **Git**: Para clonar el repositorio
  - Descargar desde: https://git-scm.com/

### Sistemas Operativos Soportados

- Windows 10/11
- macOS 10.15+
- Linux (Ubuntu 18.04+, otras distribuciones)

## 🚀 Instalación Paso a Paso

### 1. Obtener el Código

```bash
# Clonar el repositorio
git clone https://github.com/jesuscisco/QuesoTimer.git

# Navegar al directorio
cd QuesoTimer

# (Opcional) Cambiar a rama específica
git checkout main
```

### 2. Instalar Dependencias

```bash
# Instalar todas las dependencias
npm install

# Verificar que no hay vulnerabilidades
npm audit

# (Opcional) Actualizar dependencias
npm update
```

### 3. Configuración Inicial

#### Crear Directorios de Contenido

```bash
# Crear directorio para sonidos (si no existe)
mkdir -p public/sound

# Crear directorio para imágenes del slider (si no existe)  
mkdir -p public/slider
```

#### Agregar Archivos de Audio

Coloca estos archivos en `public/sound/`:

- `warning.mp3`: Sonido de alerta (cuando se alcanza el tiempo configurado)
- `over.mp3`: Sonido de fin de tiempo

**Formatos recomendados**:
- MP3 (mejor compatibilidad)
- OGG (alternativa libre)
- WAV (calidad máxima, mayor tamaño)

#### Agregar Imágenes del Slider

Coloca imágenes en `public/slider/`:

**Formatos soportados**:
- JPG/JPEG
- PNG  
- WebP
- GIF

**Resoluciones recomendadas**:
- 1920x1080 (Full HD)
- 1280x720 (HD)
- Aspect ratio 16:9 preferido

### 4. Variables de Entorno (Opcional)

Crear archivo `.env.local` en la raíz del proyecto:

```env
# Puerto de desarrollo (opcional, default: 3000)
PORT=3000

# Configuración de APIs externas (si necesario)
MOXFIELD_API_KEY=tu_api_key_aqui
SCRYFALL_API_URL=https://api.scryfall.com

# Configuración PWA
PWA_NAME=QuesoTimer
PWA_SHORT_NAME=Timer
```

## 🎯 Comandos de Desarrollo

### Desarrollo Local

```bash
# Iniciar servidor de desarrollo
npm run dev

# Servidor estará disponible en:
# http://localhost:3000
```

### Building y Producción

```bash
# Crear build de producción
npm run build

# Iniciar servidor de producción
npm run start

# Export estático (si necesario)
npm run export
```

### Utilidades

```bash
# Linter (verificar código)
npm run lint

# Linter con corrección automática
npm run lint -- --fix

# Script personalizado para exportar cotizaciones
npm run export:quote
```

## 🌐 Configuración de Red

### Acceso desde Otros Dispositivos

Para acceder desde otros dispositivos en la misma red:

1. **Encontrar IP local**:
```bash
# Windows
ipconfig | findstr IPv4

# macOS/Linux  
ifconfig | grep inet
```

2. **Iniciar con host específico**:
```bash
# Permitir acceso externo
npm run dev -- --host 0.0.0.0
```

3. **Acceder desde otros dispositivos**:
```
http://TU_IP_LOCAL:3000
```

### Configuración de Firewall

**Windows**:
- Permitir Node.js a través del firewall
- Abrir puerto 3000 (o el puerto configurado)

**macOS**:
- Verificar configuración en Preferencias del Sistema > Seguridad

**Linux**:
```bash
# UFW (Ubuntu)
sudo ufw allow 3000

# iptables
sudo iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
```

## 📱 Configuración PWA

### Certificados SSL (Producción)

Para funcionalidad PWA completa en producción:

```bash
# Usar mkcert para desarrollo local con HTTPS
npm install -g mkcert
mkcert -install
mkcert localhost
```

### Personalizar Manifest

Editar `public/manifest.webmanifest`:

```json
{
  "name": "Tu Nombre de Timer",
  "short_name": "Timer",
  "description": "Tu descripción personalizada",
  "theme_color": "#tu_color_hex",
  "background_color": "#tu_fondo_hex",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

## 🔧 Personalización

### Cambiar Colores del Tema

Editar `app/globals.css`:

```css
:root {
  --primary-color: #3b82f6;    /* Azul principal */
  --secondary-color: #1f2937;  /* Gris oscuro */
  --accent-color: #f59e0b;     /* Amarillo acento */
  --text-color: #ffffff;       /* Texto claro */
}
```

### Configurar Tiempos por Defecto

Editar `app/store/useAppStoreSimple.ts`:

```typescript
const initialState = {
  minutes: 50,        // Tiempo inicial principal
  seconds: 0,
  extraMinutes: 10,   // Tiempo extra
  alertMinutes: 5,    // Alerta por defecto
  alertSeconds: 0,
  // ...
};
```

### Personalizar Sonidos

Reemplazar archivos en `public/sound/`:
- Mantener nombres `warning.mp3` y `over.mp3`
- O modificar rutas en `app/utils/sound.ts`

## 🚨 Solución de Problemas

### Problemas Comunes

#### 1. Error "Unable to acquire lock"

**Windows**:
```powershell
# Matar procesos Node
taskkill /F /IM node.exe /T 2>$null

# Limpiar caché Next.js
Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue

# Reiniciar desarrollo
npm run dev
```

**macOS/Linux**:
```bash
# Matar procesos Node
pkill -f node

# Limpiar caché
rm -rf .next

# Reiniciar
npm run dev
```

#### 2. Puerto en Uso

```bash
# Cambiar puerto
npm run dev -- --port 3001

# O encontrar proceso usando puerto 3000
# Windows
netstat -ano | findstr :3000

# macOS/Linux
lsof -ti:3000
```

#### 3. Problemas de Audio

1. **Verificar archivos**:
   - Confirmar que existen `public/sound/warning.mp3` y `public/sound/over.mp3`
   - Verificar que son archivos válidos de audio

2. **Política de Autoplay**:
   - El audio requiere interacción del usuario
   - Usar Alt+5 en el panel para desbloquear

3. **Formatos no soportados**:
   - Convertir a MP3 si hay problemas
   - Verificar codificación de archivos

#### 4. Imágenes del Slider No Aparecen

1. **Verificar directorio**:
```bash
ls -la public/slider/
```

2. **Permisos de archivos**:
```bash
# Linux/macOS
chmod 644 public/slider/*
```

3. **Formatos soportados**:
   - Solo JPG, PNG, WebP, GIF
   - Verificar extensiones de archivo

#### 5. LocalStorage Bloqueado

**Modo Incógnito**: Las funciones pueden estar limitadas
**Configuración del Navegador**: Verificar que localStorage esté habilitado

### Debugging Avanzado

#### Habilitar Logs de Desarrollo

```javascript
// En app/globals.css, agregar:
if (process.env.NODE_ENV === 'development') {
  window.DEBUG = true;
}
```

#### Verificar Service Worker

1. Abrir DevTools (F12)
2. Ir a pestaña "Application"
3. Verificar "Service Workers"
4. Ver estado y errores

#### Verificar APIs Externas

```bash
# Probar conectividad Moxfield
curl -I https://api2.moxfield.com/v3/decks/all/test

# Probar Scryfall
curl -I https://api.scryfall.com/cards/search?q=lightning+bolt
```

## 📞 Soporte

### Antes de Reportar un Problema

1. **Verificar versiones**:
```bash
node --version
npm --version
```

2. **Limpiar instalación**:
```bash
rm -rf node_modules package-lock.json
npm install
```

3. **Verificar logs**:
   - Console del navegador (F12)
   - Terminal donde corre `npm run dev`

### Información Útil para Issues

- Sistema operativo y versión
- Versión de Node.js y npm
- Navegador y versión
- Pasos para reproducir el problema
- Mensajes de error completos
- Screenshots si aplica

---

¡Con esta configuración deberías tener QuesoTimer funcionando perfectamente en tu entorno local!