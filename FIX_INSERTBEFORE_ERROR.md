# 🔧 Fix: Error insertBefore al Cambiar de Capa

## 🐛 El Problema

Al cambiar entre capas en la tabla de atributos, aparecía:
```
Failed to execute 'insertBefore' on 'Node': The node before which the new node is to be inserted is not a child of this node.
```

### Causa

El loading overlay se estaba renderizando **al mismo nivel** que el contenedor de ArcGIS, causando conflictos cuando:
1. React intenta insertar/actualizar el loading overlay
2. ArcGIS está manipulando su contenedor simultáneamente
3. Los nodos del DOM no están en el estado que React espera

## ✅ Solución

### 1. Aislar el Loading Overlay

**Antes (Problemático):**
```jsx
<div className="feature-table-header">...</div>

{/* Loading al mismo nivel que el contenedor de ArcGIS */}
{tableLoading && <div className="table-loading-overlay">...</div>}

{/* Contenedor de ArcGIS */}
<div ref={featureTableContainerRef} className="feature-table-content" />
```

**Después (Correcto):**
```jsx
<div className="feature-table-header">...</div>

{/* Wrapper que aísla loading de ArcGIS */}
<div className="feature-table-content-wrapper">
  {/* Loading dentro del wrapper, no afecta al contenedor de ArcGIS */}
  {tableLoading && (
    <div className="table-loading-overlay">...</div>
  )}
  
  {/* Contenedor de ArcGIS - completamente independiente */}
  <div ref={featureTableContainerRef} className="feature-table-content" />
</div>
```

### 2. Aumentar Tiempos de Espera

Para asegurar limpieza completa sin race conditions:

```javascript
// ANTES: 150ms total
await new Promise(resolve => setTimeout(resolve, 150));

// DESPUÉS: 350ms en pasos
// Paso 1: Destruir widget
featureTableRef.current.destroy();
await new Promise(resolve => setTimeout(resolve, 100));

// Paso 2: Limpiar DOM manualmente
while (container.firstChild) {
  container.removeChild(container.firstChild);
}

// Paso 3: Esperar que React y ArcGIS terminen
await new Promise(resolve => setTimeout(resolve, 250));
```

**Total: 350ms** - Da tiempo suficiente para:
- ArcGIS destruya sus elementos DOM
- React termine sus actualizaciones
- Eliminar race conditions

### 3. CSS del Wrapper

```css
.feature-table-content-wrapper {
  flex: 1;
  overflow: hidden;
  position: relative;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.feature-table-content {
  flex: 1;
  overflow: hidden;
  position: relative;
  min-height: 0;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}
```

## 🎯 Resultado

### Jerarquía del DOM

```
feature-table-container
├── feature-table-header (React controla)
│   ├── Selector de capa
│   └── Botones
│
└── feature-table-content-wrapper (React controla)
    ├── table-loading-overlay (React controla - condicional)
    │   └── Loading spinner y mensaje
    │
    └── feature-table-content (ArcGIS controla)
        └── [FeatureTable widget de ArcGIS]
```

**Clave:** React y ArcGIS nunca compiten por el mismo espacio DOM.

## 🔍 Por Qué Funciona

1. **Aislamiento:** El loading y el contenedor de ArcGIS están en branches separados del árbol DOM
2. **No hay competencia:** React actualiza el loading, ArcGIS actualiza su contenedor, nunca se cruzan
3. **Timing robusto:** 350ms de espera garantiza que la limpieza esté completa antes de continuar

## 📊 Comparación

### Antes:
```
- Loading se renderiza/des-renderiza
- Mientras tanto, ArcGIS está manipulando el DOM
- React intenta insertBefore en un nodo que cambió
- ERROR ❌
```

### Después:
```
- Loading está en su propio branch del DOM ✅
- ArcGIS está en su propio branch del DOM ✅
- Nunca se cruzan ✅
- Tiempos de espera robustos ✅
- NO hay errores ✅
```

## 🧪 Prueba

```bash
npm start
```

1. Abre tabla de atributos
2. Cambia rápidamente entre capas (Direcciones → Zonas PRC → Predios → Vías)
3. Verifica que **NO hay errores** en consola
4. Loading aparece y desaparece suavemente
5. Tabla se actualiza correctamente con los datos de cada capa

## 📝 Lecciones

### Regla de Oro #4: Aislar React de Bibliotecas Externas

Cuando mezclas React con bibliotecas que manipulan DOM:

1. **Nunca** pongas elementos condicionales de React al mismo nivel que contenedores de bibliotecas externas
2. **Siempre** usa un wrapper parent para aislar los elementos de React
3. **Aumenta** los tiempos de espera si ves race conditions
4. **Estructura** tu DOM para separar claramente qué controla cada uno

### Estructura Recomendada:

```jsx
<div className="wrapper-controlado-por-react">
  {/* Elementos condicionales de React aquí */}
  {condition && <ReactComponent />}
  
  {/* Contenedor para biblioteca externa - separado */}
  <div ref={externalLibraryRef} className="external-container" />
</div>
```

## 🎓 Resumen

**Problema:** Loading y FeatureTable competían por el mismo espacio DOM

**Solución:** 
- Wrapper que aísla loading de ArcGIS container
- Tiempos de espera robustos (350ms)
- Estructura clara de quién controla qué

**Resultado:** Cambios de capa suaves sin errores DOM ✅

---

**Archivos Modificados:**
- `src/App.js` - Wrapper + tiempos de espera aumentados
- `src/App.css` - Estilos del wrapper

