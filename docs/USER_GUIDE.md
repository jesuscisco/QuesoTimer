# Manual de Usuario - QuesoTimer

Guía completa para usar todas las funciones de QuesoTimer.

## 🎯 Introducción

QuesoTimer es un sistema completo para gestionar partidas y torneos de Magic: The Gathering. Incluye un timer avanzado, sistema de torneos multimodo, agregador de mazos y carrusel de promociones.

## 🖥️ Navegación por el Sistema

### Pantallas Principales

1. **Timer** (`/timer`): Pantalla principal con timer y carrusel
2. **Panel de Control** (`/control`): Control remoto del sistema
3. **Torneos**: Gestión de diferentes tipos de torneos
   - Multi (`/torneos/multi`): Free-for-All (FFA)
   - 2 Cabezas (`/torneos/2cabezas`): Equipos de 2vs2
   - 1vs1 (`/torneos/1vs1`): Enfrentamientos individuales
4. **Clasificaciones** (`/clasificacion`): Ver resultados de torneos

### Atajos de Teclado

- **Alt + 1**: Abrir panel de control en nueva pestaña
- **Alt + 5**: Probar sonido de alerta (solo en panel de control)

## ⏱️ Sistema de Timer

### Configuración Básica

1. **Tiempo Principal**: Por defecto 50 minutos
2. **Tiempo Extra**: Por defecto 10 minutos
3. **Alerta Personalizada**: Configurable (ej: 5 minutos restantes)

### Controles del Timer

#### Desde la Pantalla Principal
- **Play/Pausa**: Clic en el timer o barra espaciadora
- **Reset**: Botón de reset (vuelve a tiempo inicial)

#### Desde el Panel de Control
- **Iniciar/Pausar**: Control remoto del timer
- **Reset**: Reiniciar a tiempo configurado
- **Ajustar Tiempo**: Modificar minutos/segundos mientras corre
- **Configurar Alerta**: Establecer momento de sonido de aviso

### Fases del Timer

1. **Fase Principal**: 50 → 0 minutos
   - Color normal
   - Alerta personalizada cuando corresponda

2. **Fase Extra**: 10 → 0 minutos
   - Color diferente (generalmente rojo)
   - Sonido automático al finalizar

### Sistema de Audio

#### Sonidos Incluidos
- **Warning**: Alerta personalizada
- **Over**: Fin del tiempo

#### Configuración de Audio
1. **Primer Uso**: Hacer clic en cualquier parte para activar audio
2. **Prueba de Sonido**: Alt+5 en panel de control
3. **Resolución de Problemas**: Si no suena, interactuar con la página

## 🏆 Sistema de Torneos

### Tipos de Torneo Disponibles

#### 1. Multi (Free-for-All)
- **Jugadores por mesa**: 4
- **Sistema de puntos**: 4/3/2/1 (1er/2do/3er/4to lugar)
- **Emparejamiento**: Swiss basado en clasificación

#### 2. 2 Cabezas (Two-Headed Giant)
- **Jugadores por equipo**: 2
- **Equipos por mesa**: 2 (4 jugadores total)
- **Sistema de puntos**: Equipo ganador recibe puntos

#### 3. 1vs1 (Individual)
- **Jugadores por mesa**: 2
- **Sistema de puntos**: Ganador/Perdedor
- **Emparejamiento**: Swiss estándar

### Flujo de Trabajo de Torneos

#### Configuración Inicial

1. **Crear Nuevo Torneo**:
   - Navegar a tipo de torneo deseado
   - Ingresar nombre del torneo
   - Configurar número de rondas

2. **Agregar Participantes**:
   - Escribir nombres (uno por línea)
   - Usar "Agregar Jugador" para individual
   - Verificar lista antes de iniciar

3. **Validación**:
   - Verificar nombres correctos
   - Confirmar número de participantes apropiado
   - Revisar configuración de rondas

#### Gestión de Rondas

1. **Primera Ronda**:
   - Clic en "Iniciar Torneo"
   - Emparejamientos aleatorios
   - Mesas se generan automáticamente

2. **Registro de Resultados**:
   - Seleccionar posición de cada jugador/equipo
   - Resultados por mesa individual
   - Guardar ronda al completar todas las mesas

3. **Rondas Siguientes**:
   - Clic en "Generar siguiente ronda (auto)"
   - Emparejamiento Swiss por clasificación
   - Evita repetir enfrentamientos cuando es posible

#### Sistema de Clasificación

##### Criterios de Ordenamiento
1. **Puntos Totales**: Suma de puntos de todas las rondas
2. **OMW% (Opponent Match Win)**: Porcentaje de victorias de oponentes
3. **Victorias Totales**: Número total de victorias
4. **PRF% (Player Rating Factor)**: Factor de rating del jugador
5. **Orden Alfabético**: Desempate final

##### Visualización de Clasificaciones
- **Tabla en Tiempo Real**: Se actualiza tras cada ronda
- **Exportación CSV**: Botón "Exportar clasificación"
- **Formato Excel**: Columnas organizadas para análisis

### Funciones Avanzadas

#### Gestión de Datos
- **Persistencia Local**: Datos se guardan automáticamente
- **Sincronización Cross-Tab**: Cambios se reflejan en otras pestañas
- **Historial**: Mantiene registro de todas las rondas

#### Opciones de Exportación
- **Clasificación Final**: CSV con todos los datos
- **Nombre de Archivo**: Formato YYYY-MM-DD automático
- **Datos Incluidos**: Jugador, Puntos, OMW%, Victorias, PRF%, Rondas

## 📋 Agregador de Mazos Moxfield

### Propósito
Analizar múltiples mazos de Moxfield para ver estadísticas agregadas de cartas, ideal para meta-análisis o compras grupales.

### Proceso de Uso

#### 1. Obtener URLs de Mazos
- Copiar enlaces de mazos desde Moxfield
- Formato: `https://www.moxfield.com/decks/[ID_DEL_MAZO]`
- Un enlace por línea en el área de texto

#### 2. Configurar Opciones
- **Incluir Sideboard**: Agregar cartas del sideboard
- **Cartas Repetidas**: Permitir múltiples copias de la misma carta

#### 3. Procesar Mazos
- Clic en "Analizar Mazos"
- El sistema consulta Moxfield y Scryfall automáticamente
- Ver progreso en tiempo real

#### 4. Analizar Resultados
- **Tabla Completa**: Todas las cartas con metadata
- **Información por Carta**:
  - Nombre de la carta
  - Expansión (nombre y código)
  - Rareza
  - Colores de identidad
  - Cantidad total

### Sistema de Filtros

#### Filtros Disponibles
1. **Por Rareza**:
   - Common, Uncommon, Rare, Mythic
   - Special (cartas especiales)

2. **Por Expansión**:
   - Filtro por código de set
   - Lista desplegable con opciones disponibles

3. **Por Color**:
   - W (Blanco), U (Azul), B (Negro), R (Rojo), G (Verde)
   - C (Incoloro/Artifacts)
   - "Todos" para ver sin filtro

#### Uso de Filtros
- **Combinables**: Usar múltiples filtros simultáneamente
- **Tiempo Real**: Tabla se actualiza instantáneamente
- **Contadores**: Número de cartas mostradas vs total

### Ordenamiento de Datos

#### Columnas Ordenables
- **Carta**: Orden alfabético por nombre
- **Expansión**: Por nombre de set
- **Código**: Por código de expansión
- **Rareza**: Common → Mythic
- **Color**: Orden WUBRG + C
- **Cantidad**: Numérico ascendente/descendente

#### Indicadores Visuales
- **▲**: Orden ascendente
- **▼**: Orden descendente
- **Clic en Header**: Cambiar orden

### Exportación de Datos

#### Formato CSV
- **Compatible con Excel**: Separadores y encoding correctos
- **Columnas Incluidas**:
  1. Código (Set code)
  2. Expansión (Set name)
  3. Rareza
  4. Color (identidad)
  5. Carta (nombre)
  6. Cantidad

#### Uso del Archivo
- **Análisis de Meta**: Ver cartas más populares
- **Lista de Compras**: Cantidades necesarias por carta
- **Inventario**: Comparar con colección personal

### Resolución de Problemas

#### Mazos No Procesan
1. **Verificar URL**: Formato correcto de Moxfield
2. **Mazos Privados**: Deben ser públicos
3. **Conexión**: Verificar acceso a internet

#### Datos Incompletos
- **Scryfall Fallback**: Sistema busca datos faltantes automáticamente
- **Rate Limiting**: Proceso puede tomar tiempo con muchos mazos
- **Reintento**: Volver a procesar si fallan algunos mazos

## 🎨 Carrusel de Promociones

### Configuración
1. **Agregar Imágenes**: Colocar en carpeta `public/slider/`
2. **Formatos Soportados**: JPG, PNG, WebP, GIF
3. **Resolución Recomendada**: 1920x1080 (16:9)

### Controles
- **Auto-Avance**: Cambio automático cada X segundos
- **Control Manual**: Navegación desde panel de control
- **Pausa/Reanuda**: Control de auto-avance
- **Ir a Slide**: Saltar a imagen específica

### Características Técnicas
- **Sin Barras Negras**: Fondo difuminado automático
- **Responsive**: Se adapta a diferentes tamaños de pantalla
- **Sincronización**: Cambios se reflejan en todas las pestañas

## 📱 Funciones PWA (Progressive Web App)

### Instalación
1. **Prompt Automático**: Aparece en navegadores compatibles
2. **Instalación Manual**: Botón en panel de control
3. **Shortcuts**: Acceso directo a Timer y Control

### Funciones Offline
- **Caché Automático**: Assets críticos se guardan localmente
- **Funcionalidad Básica**: Timer funciona sin internet
- **Sincronización**: Datos se sincronizan al reconectar

### Ventajas
- **Pantalla Completa**: Sin barra de navegador
- **Inicio Rápido**: Acceso desde escritorio/inicio
- **Notificaciones**: Alertas del sistema (si configurado)

## 🔧 Personalización

### Configuraciones Disponibles
- **Tiempos por Defecto**: Modificar en código fuente
- **Colores del Tema**: CSS personalizable
- **Sonidos**: Reemplazar archivos de audio
- **Manifest PWA**: Personalizar nombre y iconos

### Para Desarrolladores
- Ver documentación técnica en `/docs/TECHNICAL.md`
- Código fuente abierto y modificable
- APIs documentadas para extensiones

---

## 🆘 Soporte y Ayuda

### Problemas Comunes
1. **Audio no funciona**: Interactuar con la página, usar Alt+5
2. **Sincronización falla**: Verificar LocalStorage habilitado
3. **Imágenes no cargan**: Verificar archivos en carpeta correcta
4. **Torneos no guardan**: Comprobar permisos de navegador

### Recursos Adicionales
- README.md: Información general
- docs/INSTALLATION.md: Guía de instalación
- docs/TECHNICAL.md: Documentación técnica

Para más ayuda, revisar la documentación completa o reportar issues en el repositorio del proyecto.