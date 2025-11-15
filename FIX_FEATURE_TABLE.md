# Solución de Errores en FeatureTable

## 🐛 Problemas Identificados

### 1. Error: "Failed to execute 'removeChild' on 'Node'"
**Causa Raíz:** React intentaba recrear el contenedor DOM usando el mecanismo de `key={tableKey}`, mientras ArcGIS FeatureTable aún controlaba ese contenedor.

**El Conflicto:**
- `key={tableKey}` forzaba a React a desmontar/montar el div contenedor
- Cuando `tableKey` cambiaba, React intentaba eliminar el div viejo
- Pero ArcGIS FeatureTable tenía nodos hijos en ese div
- React no reconocía esos nodos (porque ArcGIS los creó) y fallaba al intentar eliminarlos

### 2. Tabla Vacía en la Primera Carga
**Causa:** Restricciones de escala (minScale/maxScale) en las capas.
- Las capas tienen configurado `minScale` y `maxScale` en `config.js`
- Si el zoom actual del mapa está fuera del rango de visibilidad de la capa
- FeatureTable no carga los datos porque la capa está "fuera de escala"

## ✅ Soluciones Implementadas

### Solución 1: ELIMINAR el Mecanismo de `key` de React

**LA CLAVE DEL PROBLEMA:** No usar `key={tableKey}` para forzar recreación del contenedor.

#### Antes (INCORRECTO):
```javascript
const [tableKey, setTableKey] = useState(0);

// En el render:
<div key={tableKey} ref={featureTableContainerRef} className="feature-table-content" />

// Al cambiar capa:
setSelectedLayerForTable(newLayer);
setTableKey(prev => prev + 1); // ❌ Esto causa el error!
```

#### Después (CORRECTO):
```javascript
// ✅ SIN tableKey - el contenedor NUNCA se recrea
<div ref={featureTableContainerRef} className="feature-table-content" />

// Al cambiar capa:
setSelectedLayerForTable(newLayer); // ✅ Solo cambiar estado
// El useEffect se encarga de todo
```

**Por qué funciona:**
- El contenedor DOM es estable, React nunca lo elimina
- Solo ArcGIS manipula el contenido del contenedor
- No hay conflicto porque React no intenta tocar lo que ArcGIS controla

### Solución 2: Limpieza Sincrónica en useEffect

El useEffect limpia completamente ANTES de crear el nuevo FeatureTable:

```javascript
useEffect(() => {
  let isMounted = true; // Flag para prevenir actualizaciones si se desmonta
  
  const initFeatureTable = async () => {
    // 1. PRIMERO: Destruir el FeatureTable existente
    if (featureTableRef.current) {
      console.log('Destroying existing FeatureTable...');
      
      // Remover watch handles
      if (featureTableRef.current.watchHandle) {
        featureTableRef.current.watchHandle.remove();
      }
      
      // Restaurar configuración original de la capa
      if (featureTableRef.current._originalLayerSettings) {
        const layer = featureTableRef.current.layer;
        const settings = featureTableRef.current._originalLayerSettings;
        if (layer) {
          layer.visible = settings.visible;
          layer.minScale = settings.minScale;
          layer.maxScale = settings.maxScale;
        }
      }
      
      // Destruir widget y limpiar contenedor
      const container = featureTableRef.current.container;
      featureTableRef.current.destroy();
      featureTableRef.current = null;
      
      // CRÍTICO: Limpiar TODOS los nodos hijos
      if (container) {
        while (container.firstChild) {
          container.removeChild(container.firstChild);
        }
      }
      
      // Esperar a que la limpieza complete
      await new Promise(resolve => setTimeout(resolve, 150));
    }
    
    // 2. Verificar que el componente no se desmontó
    if (!isMounted) return;
    
    // 3. AHORA SÍ: Crear el nuevo FeatureTable
    // ... código de creación ...
  };
  
  initFeatureTable();
  
  return () => {
    isMounted = false; // Marcar como desmontado
    // ... limpieza ...
  };
}, [mapView, selectedLayerForTable, loadedLayersMap, tableVisible]);
```

**Beneficios:**
- ✅ Limpieza completa ANTES de crear nuevo widget
- ✅ Previene race conditions con `isMounted` flag
- ✅ Restaura configuración de capas correctamente
- ✅ No hay conflictos DOM

### Solución 3: Remover Restricciones de Escala Temporalmente

```javascript
// Guardar configuración original
const originalVisibility = selectedLayer.visible;
const originalMinScale = selectedLayer.minScale;
const originalMaxScale = selectedLayer.maxScale;

// CRÍTICO: Remover restricciones temporalmente
selectedLayer.minScale = 0;
selectedLayer.maxScale = 0;

// Asegurar que la capa esté visible
if (!selectedLayer.visible) {
  selectedLayer.visible = true;
}

// Crear FeatureTable
const featureTable = new FeatureTable({
  view: mapView,
  layer: selectedLayer,
  container: featureTableContainerRef.current,
  filterGeometry: null // Mostrar todas las features
});

// Guardar configuración para restaurarla después
featureTable._originalLayerSettings = {
  visible: originalVisibility,
  minScale: originalMinScale,
  maxScale: originalMaxScale
};
```

**Beneficios:**
- ✅ La tabla muestra TODOS los datos sin importar el zoom
- ✅ Se restaura la configuración original al cerrar/cambiar de capa
- ✅ No afecta el comportamiento visual del mapa

### Solución 4: Simplificar Handlers

Los handlers de botones ahora SOLO cambian estado, el useEffect hace el resto:

```javascript
// Al cambiar capa:
onChange={(e) => {
  setSelectedLayerForTable(e.target.value); // ✅ Solo esto
}}

// Al cerrar tabla:
onClick={() => {
  setTableVisible(false); // ✅ El useEffect cleanup se activa automáticamente
  setTableMaximized(false);
}}
```

## 🎯 Flujo Completo (Simplificado)

```
1. Usuario cambia de capa o cierra tabla
   ↓
2. Se actualiza el estado (setSelectedLayerForTable / setTableVisible)
   ↓
3. useEffect detecta el cambio y se ejecuta
   ↓
4. PRIMERO: Destruir FeatureTable existente
   - Remover watch handles
   - Restaurar configuración original de la capa (minScale, maxScale, visible)
   - Destruir widget ArcGIS
   - Limpiar TODOS los nodos hijos del contenedor manualmente
   - Esperar 150ms para que complete la limpieza
   ↓
5. Verificar que el componente no se desmontó (isMounted flag)
   ↓
6. SEGUNDO: Crear nuevo FeatureTable
   - Guardar configuración original de la nueva capa
   - Modificar temporalmente minScale/maxScale a 0
   - Crear widget FeatureTable
   - Guardar configuración para restaurar después
   ↓
7. FIN: FeatureTable funcionando con nueva capa o limpio si se cerró

🔑 CLAVE: El contenedor DOM NUNCA se recrea, solo su contenido cambia
```

## 🔍 Puntos Clave

### ¿Por qué NO usar `key={}` en el contenedor?

**El problema con `key`:**
```javascript
// ❌ MAL: Forzar recreación con key
<div key={tableKey} ref={containerRef} />
```

Cuando el `key` cambia:
1. React crea un NUEVO elemento DOM
2. React intenta ELIMINAR el elemento DOM viejo
3. Pero ArcGIS todavía controla el DOM viejo y sus hijos
4. React intenta eliminar nodos que no creó → **ERROR**

**La solución:**
```javascript
// ✅ BIEN: Contenedor estable, sin key
<div ref={containerRef} />
```

- El contenedor DOM nunca cambia
- Solo el CONTENIDO (gestionado por ArcGIS) cambia
- React nunca intenta eliminar lo que ArcGIS controla

### ¿Por qué remover nodos manualmente?
```javascript
while (container.firstChild) {
  container.removeChild(container.firstChild);
}
```

Aunque el contenedor es estable, ArcGIS crea muchos nodos hijos. Al cambiar de capa, debemos limpiarlos manualmente para:
- Evitar memory leaks
- Prevenir nodos "fantasma"
- Asegurar un contenedor limpio para el nuevo widget

### ¿Por qué modificar minScale/maxScale?

Las capas en `config.js` tienen:
```javascript
{
  name: 'Direcciones',
  minScale: 10000,  // Solo visible después de cierto zoom
  maxScale: 0
}
```

Si el mapa está alejado (zoom < 10000), la capa no está visible y FeatureTable no carga datos. Al establecer temporalmente `minScale: 0` y `maxScale: 0`, removemos estas restricciones para la tabla.

### ¿Por qué restaurar la configuración?

Para no afectar el comportamiento del mapa. Las capas deben seguir apareciendo/desapareciendo según el zoom, solo la tabla necesita ver todos los datos.

## 📊 Resultados Esperados

### Antes:
- ❌ Error `removeChild` al cambiar de capa
- ❌ Tabla vacía en primera carga si zoom incorrecto
- ❌ Múltiples errores en consola al cambiar capas rápidamente
- ❌ Posibles memory leaks por cleanup incompleto

### Después (Con la solución):
- ✅ **CERO errores** al cambiar de capa
- ✅ Datos cargados siempre, **independiente del zoom del mapa**
- ✅ Limpieza completa de recursos al cambiar/cerrar
- ✅ Configuración de capas se restaura correctamente
- ✅ Contenedor DOM estable (nunca se recrea)
- ✅ No hay race conditions gracias al flag `isMounted`

## 🧪 Cómo Probar

1. **Probar cambio de capas:**
   - Abrir tabla de atributos
   - Cambiar entre diferentes capas varias veces
   - No debe haber errores en consola

2. **Probar con zoom alejado:**
   - Alejar el mapa completamente
   - Abrir tabla de "Direcciones" (que tiene minScale: 10000)
   - Debe mostrar todos los datos aunque la capa no sea visible en el mapa

3. **Probar restauración:**
   - Abrir tabla, cambiar capa, cerrar tabla
   - Verificar que las capas siguen apareciendo/desapareciendo correctamente con el zoom

4. **Verificar memory leaks:**
   - Abrir/cerrar tabla múltiples veces
   - Cambiar capas repetidamente
   - Verificar en DevTools que la memoria no crece indefinidamente

## 💡 Consideraciones Adicionales

### Alternativa: Usar FeatureLayer separada

Si prefieres NO modificar las capas del mapa, puedes crear copias separadas:

```javascript
// Crear copia de la capa solo para la tabla
const tableLayer = new GeoJSONLayer({
  url: selectedLayer.url,
  // ... misma configuración pero sin restricciones
  minScale: 0,
  maxScale: 0
});

const featureTable = new FeatureTable({
  view: mapView,
  layer: tableLayer,  // Usar la copia
  container: featureTableContainerRef.current
});
```

**Ventajas:**
- No modifica las capas del mapa
- Más "limpio" conceptualmente

**Desventajas:**
- Duplica datos en memoria
- Más complejo de sincronizar

La solución actual es más eficiente.

## 🎓 Lección Aprendida

### El Antipatrón: Usar `key` para "forzar recreación"

Es tentador usar `key` para forzar a React a recrear un componente:

```javascript
<div key={someValue} ref={ref} />
```

**Pero esto es PELIGROSO cuando:**
1. El ref se pasa a bibliotecas externas (ArcGIS, Leaflet, etc.)
2. Esas bibliotecas manipulan el DOM directamente
3. No hay coordinación entre React y la biblioteca

### La Solución Correcta

**Regla de Oro:** Si una biblioteca externa controla el contenido de un elemento, ese elemento debe ser **estable** en React.

```javascript
// ✅ Contenedor estable
<div ref={ref} />

// Manejar cambios en useEffect, no con key
useEffect(() => {
  // Limpiar widget viejo
  if (widgetRef.current) {
    widgetRef.current.destroy();
    // Limpiar DOM manualmente
  }
  
  // Crear widget nuevo
  widgetRef.current = new Widget({ container: ref.current });
}, [dependencies]);
```

### Cuándo SÍ usar `key`

`key` es perfecto cuando:
- React controla completamente el DOM
- No hay bibliotecas externas involucradas
- Quieres resetear estado de componentes React

```javascript
// ✅ Bien: React controla todo
<MyReactComponent key={userId} />
```

### Cuándo NO usar `key`

NO uses `key` cuando:
- Pasas refs a bibliotecas externas
- La biblioteca manipula el DOM del elemento
- ArcGIS, D3.js, Chart.js, Leaflet, etc.

```javascript
// ❌ Mal: ArcGIS controla este div
<div key={layerId} ref={mapContainerRef} />

// ✅ Bien: Contenedor estable, cambios por useEffect
<div ref={mapContainerRef} />
```

## 📚 Referencias

- [ArcGIS FeatureTable API](https://developers.arcgis.com/javascript/latest/api-reference/esri-widgets-FeatureTable.html)
- [React + ArcGIS Best Practices](https://developers.arcgis.com/javascript/latest/react/)
- [Managing widget lifecycle](https://developers.arcgis.com/javascript/latest/programming-patterns/#managing-widget-lifecycle)
- [React Reconciliation and Keys](https://react.dev/learn/preserving-and-resetting-state#option-2-resetting-state-with-a-key)

