# Contribución al Proyecto QuesoTimer

¡Gracias por tu interés en contribuir a QuesoTimer! Esta guía te ayudará a empezar.

## 🤝 Formas de Contribuir

### Reportar Bugs
- Usar el sistema de Issues de GitHub
- Incluir pasos para reproducir el problema
- Adjuntar screenshots si es necesario
- Especificar navegador y sistema operativo

### Sugerir Mejoras
- Abrir un Issue con la etiqueta "enhancement"
- Describir claramente la funcionalidad propuesta
- Explicar el caso de uso y beneficios

### Contribuir Código
- Fork del repositorio
- Crear branch para la feature/fix
- Seguir las convenciones de código
- Enviar Pull Request con descripción detallada

### Mejorar Documentación
- Corregir errores tipográficos
- Agregar ejemplos de uso
- Traducir a otros idiomas
- Actualizar guías existentes

## 🚀 Setup de Desarrollo

### 1. Fork y Clone

```bash
# Fork desde GitHub web interface
# Luego clonar tu fork
git clone https://github.com/TU_USUARIO/QuesoTimer.git
cd QuesoTimer

# Agregar upstream remote
git remote add upstream https://github.com/jesuscisco/QuesoTimer.git
```

### 2. Instalación Local

```bash
# Instalar dependencias
npm install

# Configurar pre-commit hooks
npm run prepare

# Verificar que todo funciona
npm run dev
```

### 3. Estructura de Branches

- `main`: Código de producción estable
- `develop`: Desarrollo activo e integración
- `feature/nombre-feature`: Nuevas funcionalidades
- `fix/descripcion-bug`: Correcciones de bugs
- `docs/tema`: Actualizaciones de documentación

### 4. Workflow de Desarrollo

```bash
# Actualizar desde upstream
git checkout develop
git pull upstream develop

# Crear nueva branch para tu feature
git checkout -b feature/mi-nueva-feature

# Desarrollar y hacer commits
git add .
git commit -m "feat: descripción de la feature"

# Push a tu fork
git push origin feature/mi-nueva-feature

# Crear Pull Request desde GitHub
```

## 📝 Convenciones de Código

### TypeScript/JavaScript

```typescript
// ✅ Correcto
interface TournamentConfig {
  mode: 'ffa' | 'twoHeads' | 'oneVsOne';
  rounds: number;
  players: string[];
}

const calculateStandings = (rounds: Round[]): Standing[] => {
  return rounds
    .map(round => processRound(round))
    .sort((a, b) => b.points - a.points);
};

// ❌ Incorrecto
interface tournamentconfig {
  mode: string;
  rounds: any;
  players: any;
}

const calculate_standings = function(rounds) {
  // lógica sin tipos
}
```

### Naming Conventions

| Tipo | Convención | Ejemplo |
|------|------------|---------|
| Components | PascalCase | `TournamentEditor` |
| Functions | camelCase | `buildStandingsFromRounds` |
| Variables | camelCase | `currentRound` |
| Constants | UPPER_SNAKE_CASE | `ROUNDS_KEY` |
| Types/Interfaces | PascalCase | `PlayerStanding` |
| Files | kebab-case | `tournament-editor.tsx` |

### Estructura de Archivos

```
src/
├── components/
│   ├── ui/              # Componentes básicos reutilizables
│   ├── tournament/      # Componentes específicos de torneos
│   └── shared/          # Componentes compartidos
├── hooks/               # Custom hooks
├── utils/               # Funciones utilitarias
├── types/               # Definiciones de tipos
└── constants/           # Constantes globales
```

### Imports Order

```typescript
// 1. React/Next imports
import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';

// 2. Third-party libraries
import { toast } from 'react-hot-toast';

// 3. Internal components
import { TournamentEditor } from '@/components/tournament/TournamentEditor';
import { Timer } from '@/components/Timer';

// 4. Utils and hooks
import { useAppStore } from '@/store/useAppStore';
import { buildStandingsFromRounds } from '@/utils/tournament';

// 5. Types
import type { TournamentMode, Round } from '@/types/tournament';
```

## 📋 Commit Guidelines

### Formato de Commits

Usar [Conventional Commits](https://www.conventionalcommits.org/):

```
<tipo>[ámbito opcional]: <descripción>

[cuerpo opcional]

[pie opcional]
```

### Tipos de Commit

| Tipo | Descripción | Ejemplo |
|------|-------------|---------|
| `feat` | Nueva funcionalidad | `feat(tournaments): add 1vs1 mode` |
| `fix` | Corrección de bug | `fix(audio): resolve autoplay issues` |
| `docs` | Documentación | `docs(readme): update installation guide` |
| `style` | Cambios de formato | `style: fix indentation in components` |
| `refactor` | Refactorización | `refactor(api): simplify moxfield logic` |
| `test` | Agregar tests | `test(utils): add tournament utils tests` |
| `chore` | Tareas mantenimiento | `chore: update dependencies` |

### Ejemplos de Buenos Commits

```bash
# ✅ Buenos
git commit -m "feat(tournaments): implement Swiss pairing algorithm"
git commit -m "fix(timer): resolve audio unlock on first interaction"
git commit -m "docs(api): add Moxfield endpoint documentation"

# ❌ Malos
git commit -m "fix stuff"
git commit -m "working version"
git commit -m "changes"
```

## 🧪 Testing

### Estructura de Tests

```typescript
// __tests__/utils/tournament.test.ts
import { buildStandingsFromRounds, calculateOMW } from '@/utils/tournament';
import { mockRounds } from '@/test-utils/mocks';

describe('Tournament Utils', () => {
  describe('buildStandingsFromRounds', () => {
    it('should calculate correct points for FFA tournament', () => {
      const standings = buildStandingsFromRounds(mockRounds.ffa);
      expect(standings[0].points).toBe(12); // 3 rounds × 4 points
    });

    it('should handle empty rounds array', () => {
      const standings = buildStandingsFromRounds([]);
      expect(standings).toEqual([]);
    });
  });
});
```

### Ejecutar Tests

```bash
# Todos los tests
npm test

# Tests específicos
npm test -- tournament.test.ts

# Tests con coverage
npm run test:coverage

# Tests en modo watch
npm run test:watch
```

### Mock Data

```typescript
// test-utils/mocks.ts
export const mockPlayer = {
  name: 'Player 1',
  points: 10,
  wins: 2,
  omw: 0.65,
  prf: 0.75
};

export const mockRound = {
  round: 1,
  tables: [
    {
      table: 1,
      players: ['Player 1', 'Player 2', 'Player 3', 'Player 4'],
      results: [1, 2, 3, 4] // posiciones finales
    }
  ],
  timestamp: Date.now()
};
```

## 🎨 UI/UX Guidelines

### Diseño Consistente

```typescript
// ✅ Usar clases Tailwind consistentes
const buttonClasses = "px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded";

// ✅ Componentes reutilizables
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger';
  size: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ variant, size, children }) => {
  const baseClasses = 'font-medium rounded focus:outline-none focus:ring-2';
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white'
  };
  // ...
};
```

### Accesibilidad

```typescript
// ✅ Labels y ARIA
<button 
  aria-label="Iniciar timer"
  onClick={startTimer}
  disabled={isRunning}
  aria-disabled={isRunning}
>
  {isRunning ? 'Pausar' : 'Iniciar'}
</button>

// ✅ Navegación por teclado
<div 
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
```

### Responsive Design

```css
/* ✅ Mobile-first approach */
.tournament-table {
  @apply w-full overflow-x-auto;
}

.tournament-table th,
.tournament-table td {
  @apply px-2 py-1 text-sm;
}

@media (min-width: 768px) {
  .tournament-table th,
  .tournament-table td {
    @apply px-4 py-2 text-base;
  }
}
```

## 🔧 Desarrollo de Nuevas Features

### 1. Planificación

Antes de empezar a codificar:

1. **Issue o RFC**: Crear issue describiendo la feature
2. **Diseño**: Mockups o wireframes si es UI
3. **API**: Definir interfaces y tipos necesarios
4. **Tests**: Planificar casos de prueba

### 2. Implementación

#### Para Nuevos Tipos de Torneo

```typescript
// 1. Actualizar tipos
type TournamentMode = 'ffa' | 'twoHeads' | 'oneVsOne' | 'nuevoTipo';

// 2. Agregar lógica de emparejamiento
function generateNuevoTipoRoundFromStandings(roundNumber: number) {
  // Implementar algoritmo específico
}

// 3. Actualizar UI
const modeLabels = {
  ffa: 'Multi (FFA)',
  twoHeads: '2 Cabezas',
  oneVsOne: '1vs1',
  nuevoTipo: 'Nuevo Tipo'
};

// 4. Crear página específica
// app/torneos/nuevo-tipo/page.tsx
```

#### Para Nuevas APIs

```typescript
// 1. Crear route handler
// app/api/nueva-api/route.ts
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await processRequest(body);
    return Response.json(result);
  } catch (error) {
    return Response.json(
      { error: 'Processing failed' },
      { status: 500 }
    );
  }
}

// 2. Agregar tipos
interface NuevaApiRequest {
  // definir estructura
}

interface NuevaApiResponse {
  // definir respuesta
}

// 3. Crear cliente
async function callNuevaApi(data: NuevaApiRequest): Promise<NuevaApiResponse> {
  const response = await fetch('/api/nueva-api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error('API call failed');
  }
  
  return response.json();
}
```

### 3. Testing de Features

```typescript
// Ejemplo: test de nueva feature de torneo
describe('Nuevo Tipo de Torneo', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should generate correct pairings', () => {
    const players = ['A', 'B', 'C', 'D', 'E', 'F'];
    const pairings = generateNuevoTipoRoundFromStandings(1);
    
    expect(pairings).toHaveLength(3); // 3 mesas de 2
    expect(pairings.flat()).toEqual(expect.arrayContaining(players));
  });

  it('should calculate points correctly', () => {
    const rounds = [mockNuevoTipoRound];
    const standings = buildStandingsFromRounds(rounds, 'nuevoTipo');
    
    expect(standings[0].points).toBeGreaterThan(standings[1].points);
  });
});
```

## 📚 Documentación

### Actualizar Documentación

Cuando agregues nuevas features:

1. **README.md**: Agregar a características principales
2. **USER_GUIDE.md**: Documentar uso para usuarios finales
3. **API.md**: Documentar nuevos endpoints
4. **TECHNICAL.md**: Explicar implementación técnica

### Formato de Documentación

```markdown
## Nueva Funcionalidad

### Propósito
Descripción clara del problema que resuelve.

### Uso
```typescript
// Ejemplo de código
const result = nuevaFuncion(parametros);
```

### Parámetros
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `param1` | `string` | Descripción del parámetro |

### Retorno
Descripción del valor de retorno.

### Ejemplos
Casos de uso comunes con código.
```

## 🔍 Code Review

### Checklist para PRs

- [ ] **Funcionalidad**: ¿Hace lo que dice hacer?
- [ ] **Tests**: ¿Están cubiertos los casos importantes?
- [ ] **Performance**: ¿No introduce problemas de rendimiento?
- [ ] **Accesibilidad**: ¿Es usable para todos?
- [ ] **Documentación**: ¿Está documentado apropiadamente?
- [ ] **Breaking Changes**: ¿Rompe funcionalidad existente?

### Revisión de Código

```typescript
// ✅ Código bien estructurado
const calculateTournamentStandings = (
  rounds: Round[], 
  mode: TournamentMode
): PlayerStanding[] => {
  if (!rounds.length) return [];
  
  const playerStats = aggregatePlayerStats(rounds, mode);
  return sortByStandingsRules(playerStats);
};

// ❌ Código que necesita mejora
function doStuff(data: any): any {
  let result = {};
  // lógica compleja sin explicación
  for (let i = 0; i < data.length; i++) {
    // múltiples niveles de anidación
    if (data[i].something) {
      if (data[i].other) {
        // ...
      }
    }
  }
  return result;
}
```

### Feedback Constructivo

```markdown
## Comentarios en PR

### ✅ Constructivo
"Considera extraer esta lógica a una función separada para mejor legibilidad:
```typescript
const validateTournamentConfig = (config) => {
  // lógica de validación
};
```

### ❌ No constructivo
"Este código está mal."
```

## 🚀 Proceso de Release

### Versionado

Seguimos [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0): Cambios incompatibles
- **MINOR** (0.1.0): Nuevas funcionalidades compatibles
- **PATCH** (0.0.1): Correcciones de bugs

### Changelog

Mantener `CHANGELOG.md` actualizado:

```markdown
## [1.2.0] - 2024-01-15

### Added
- Torneos 1vs1 con emparejamiento Swiss
- Filtros avanzados en agregador Moxfield

### Fixed
- Problemas de audio en Safari
- Sincronización cross-tab en Firefox

### Changed
- Mejorado algoritmo de emparejamiento Swiss
```

## 💬 Comunicación

### Canales

- **Issues**: Bugs y sugerencias
- **Discussions**: Preguntas generales
- **Discord**: Chat en tiempo real (si disponible)

### Etiquetas de Issues

- `bug`: Errores confirmados
- `enhancement`: Mejoras propuestas
- `documentation`: Actualizaciones de docs
- `good first issue`: Ideal para nuevos contribuidores
- `help wanted`: Necesita colaboración

---

¡Gracias por contribuir a QuesoTimer! 🎉

Tu participación ayuda a hacer mejor el sistema para toda la comunidad de Magic: The Gathering.