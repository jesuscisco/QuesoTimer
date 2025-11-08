# Documentación QuesoTimer - Índice

Documentación completa del sistema QuesoTimer para Magic: The Gathering.

## 📚 Documentos Disponibles

### 🚀 Para Usuarios

- **[README.md](../README.md)** - Introducción y características principales
- **[Manual de Usuario](USER_GUIDE.md)** - Guía completa de uso del sistema
- **[Guía de Instalación](INSTALLATION.md)** - Instalación paso a paso

### 🔧 Para Desarrolladores

- **[Documentación Técnica](TECHNICAL.md)** - Arquitectura y implementación
- **[API Reference](API.md)** - Documentación de endpoints
- **[Guía de Contribución](CONTRIBUTING.md)** - Cómo contribuir al proyecto

## 🎯 Guía Rápida por Roles

### 👤 Usuario Final
1. [Instalación](INSTALLATION.md) - Configura el sistema
2. [Manual de Usuario](USER_GUIDE.md) - Aprende a usar todas las funciones
3. [README](../README.md) - Características y casos de uso

### 👨‍💻 Desarrollador
1. [Documentación Técnica](TECHNICAL.md) - Entiende la arquitectura
2. [API Reference](API.md) - Integra con las APIs
3. [Guía de Contribución](CONTRIBUTING.md) - Contribuye al proyecto

### 🔌 Integrador
1. [API Reference](API.md) - Endpoints disponibles
2. [Documentación Técnica](TECHNICAL.md) - Patrones y estructuras
3. [Guía de Instalación](INSTALLATION.md) - Setup del entorno

## 📖 Contenido por Tema

### Timer y Control
- [Timer System](USER_GUIDE.md#️-sistema-de-timer) - Uso del timer
- [Panel de Control](USER_GUIDE.md#-navegación-por-el-sistema) - Control remoto
- [Audio System](TECHNICAL.md#audio-system) - Implementación de sonidos

### Sistema de Torneos
- [Flujo de Torneos](USER_GUIDE.md#-sistema-de-torneos) - Cómo organizar torneos
- [Tipos de Torneo](USER_GUIDE.md#tipos-de-torneo-disponibles) - Multi, 2 Cabezas, 1vs1
- [Algoritmos Swiss](TECHNICAL.md#sistema-de-torneos) - Implementación técnica

### Agregador Moxfield
- [Guía de Uso](USER_GUIDE.md#-agregador-de-mazos-moxfield) - Importar y analizar mazos
- [API Moxfield](API.md#apimoxfield---agregador-de-mazos) - Endpoint técnico
- [Integración Scryfall](API.md#scryfall-api) - Enriquecimiento de datos

### PWA y Offline
- [Funciones PWA](USER_GUIDE.md#-funciones-pwa-progressive-web-app) - Instalación y offline
- [Service Worker](TECHNICAL.md#pwa-y-offline) - Implementación técnica
- [Configuración PWA](INSTALLATION.md#-configuración-pwa) - Setup personalizado

## 🛠️ Casos de Uso Específicos

### Organizador de Torneos
1. [Configuración Inicial](USER_GUIDE.md#configuración-inicial) - Setup de torneo
2. [Gestión de Rondas](USER_GUIDE.md#gestión-de-rondas) - Emparejamientos y resultados
3. [Exportación](USER_GUIDE.md#finalización) - Clasificaciones finales

### Analista de Meta
1. [Agregador Moxfield](USER_GUIDE.md#agregador-de-mazos-moxfield) - Importar mazos
2. [Sistema de Filtros](USER_GUIDE.md#sistema-de-filtros) - Filtrar cartas
3. [Exportación CSV](USER_GUIDE.md#exportación-de-datos) - Análisis en Excel

### Desarrollador de Extensiones
1. [API Reference](API.md) - Endpoints disponibles
2. [Patrones de Código](TECHNICAL.md#mejores-prácticas) - Convenciones
3. [Setup de Desarrollo](CONTRIBUTING.md#-setup-de-desarrollo) - Entorno local

### Administrador de Sistema
1. [Instalación](INSTALLATION.md) - Deploy completo
2. [Configuración de Red](INSTALLATION.md#-configuración-de-red) - Acceso multi-dispositivo
3. [Resolución de Problemas](INSTALLATION.md#-solución-de-problemas) - Debugging

## 🔍 Búsqueda Rápida

### Por Funcionalidad

| Funcionalidad | Usuario | Técnico | API |
|---------------|---------|---------|-----|
| Timer | [User Guide](USER_GUIDE.md#️-sistema-de-timer) | [Technical](TECHNICAL.md#useappstoresimple.ts-zustand) | - |
| Torneos | [User Guide](USER_GUIDE.md#-sistema-de-torneos) | [Technical](TECHNICAL.md#sistema-de-torneos) | - |
| Moxfield | [User Guide](USER_GUIDE.md#-agregador-de-mazos-moxfield) | [Technical](TECHNICAL.md#agregador-moxfield) | [API](API.md#apimoxfield---agregador-de-mazos) |
| Slider | [User Guide](USER_GUIDE.md#-carrusel-de-promociones) | [Technical](TECHNICAL.md#promoslider.tsx) | [API](API.md#apislider-images---lista-de-imágenes) |
| PWA | [User Guide](USER_GUIDE.md#-funciones-pwa-progressive-web-app) | [Technical](TECHNICAL.md#pwa-y-offline) | - |

### Por Problema

| Problema | Solución |
|----------|----------|
| No instala | [Instalación](INSTALLATION.md#-instalación-paso-a-paso) |
| Audio no funciona | [User Guide](USER_GUIDE.md#sistema-de-audio) + [Installation](INSTALLATION.md#3-problemas-de-audio) |
| Torneos no guardan | [User Guide](USER_GUIDE.md#🆘-soporte-y-ayuda) + [Installation](INSTALLATION.md#4-torneos-no-sincronizan) |
| APIs fallan | [API](API.md#-consideraciones-de-seguridad) + [Technical](TECHNICAL.md#error-handling) |
| Performance lento | [Technical](TECHNICAL.md#performance) + [Contributing](CONTRIBUTING.md#-desarrollo-de-nuevas-features) |

## 📝 Formatos y Convenciones

### Documentación
- **Markdown**: Todos los docs usan GitHub Flavored Markdown
- **Estructura**: Headers, TOC, ejemplos de código, tablas
- **Idioma**: Español con términos técnicos en inglés cuando es estándar

### Código
- **TypeScript**: Fuertemente tipado
- **Convenciones**: Ver [Contributing Guide](CONTRIBUTING.md#-convenciones-de-código)
- **Ejemplos**: Incluidos en cada sección técnica

## 🔄 Actualizaciones

Esta documentación se actualiza con cada release. Para la versión más actual:

1. **GitHub**: `docs/` folder en el repositorio principal
2. **Release Notes**: Changelog en cada release
3. **Issues**: Reportar problemas de documentación

## 📞 Soporte

### Documentación
- **Issues**: Reportar errores o mejoras en docs
- **PRs**: Contribuir con mejoras directamente
- **Discussions**: Preguntas sobre uso o implementación

### Proyecto
- **Bug Reports**: Issues con label `bug`
- **Feature Requests**: Issues con label `enhancement`
- **Questions**: GitHub Discussions

---

## 🎯 Siguiente Paso

**Nuevo en el proyecto**: Empieza con [README.md](../README.md)

**Quiero usar el sistema**: Ve a [Manual de Usuario](USER_GUIDE.md)

**Quiero instalarlo**: Sigue [Guía de Instalación](INSTALLATION.md)

**Quiero desarrollar**: Lee [Documentación Técnica](TECHNICAL.md)

**Quiero contribuir**: Revisa [Guía de Contribución](CONTRIBUTING.md)

**Quiero integrar APIs**: Consulta [API Reference](API.md)