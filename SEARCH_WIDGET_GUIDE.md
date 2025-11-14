# Guía del Search Widget

## ✅ Mejoras Implementadas

### 1. Widget Envuelto en Expand
Ahora el Search está dentro de un `Expand` widget para mejor experiencia en móvil:

```javascript
const searchExpand = new Expand({
  view: view,
  content: searchWidget,
  expandIconClass: 'esri-icon-search',
  expanded: false,
  expandTooltip: 'Buscar ubicación'
});
```

**Ventajas:**
- ✅ Menos espacio en pantalla cuando no se usa
- ✅ Mejor UX en dispositivos móviles
- ✅ Interface más limpia
- ✅ Click para expandir/colapsar

### 2. Estilos CSS Personalizados

Se agregaron estilos en `App.css` para:
- **Input mejorado**: Mejor padding, focus state, bordes suaves
- **Botones**: Colores corporativos, hover effects
- **Suggestions**: Mejor diseño del menú de sugerencias
- **Responsive**: Ancho adaptable según contexto

### 3. Configuración Optimizada

```javascript
const searchWidget = new Search({
  view: view,
  includeDefaultSources: true,
  popupEnabled: true,
  resultGraphicEnabled: true,
  locationEnabled: false  // Sin botón de geolocalización (ya existe Locate widget)
});
```

## 🎨 Estilos Aplicados

### Input de Búsqueda
```css
.esri-search__input {
  font-size: 14px;
  padding: 10px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.esri-search__input:focus {
  border-color: #0079c1;
  box-shadow: 0 0 0 2px rgba(0, 121, 193, 0.2);
}
```

### Menú de Sugerencias
```css
.esri-search__suggestions-menu {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  border-radius: 4px;
  max-height: 300px;
  overflow-y: auto;
}

.esri-search__suggestion-item:hover {
  background-color: #f5f5f5;
}
```

## 🌎 Agregar Fuentes de Búsqueda Personalizadas

Basado en el ejemplo oficial que compartiste, aquí está cómo agregar búsquedas personalizadas:

### Ejemplo 1: Búsqueda de Direcciones en Chile

```javascript
import SearchSource from '@arcgis/core/widgets/Search/SearchSource';
import * as esriRequest from '@arcgis/core/request';
import Graphic from '@arcgis/core/Graphic';
import Point from '@arcgis/core/geometry/Point';

// Fuente personalizada para direcciones en Chile
const chileAddressSource = new SearchSource({
  placeholder: "Buscar dirección en Chile",
  name: "Direcciones Chile",
  
  getSuggestions: (params) => {
    // Llamar a tu API de geocodificación
    return esriRequest("https://tu-api.cl/geocode/suggest", {
      query: {
        text: params.suggestTerm,
        region: "CL",
        limit: 6
      },
      responseType: "json"
    }).then((results) => {
      return results.data.suggestions.map((item) => ({
        key: item.id,
        text: item.address,
        sourceIndex: params.sourceIndex
      }));
    });
  },
  
  getResults: (params) => {
    return esriRequest("https://tu-api.cl/geocode/find", {
      query: {
        text: params.suggestResult.text,
        region: "CL"
      },
      responseType: "json"
    }).then((results) => {
      return results.data.locations.map((location) => {
        const graphic = new Graphic({
          geometry: new Point({
            x: location.longitude,
            y: location.latitude,
            spatialReference: { wkid: 4326 }
          }),
          attributes: location
        });
        
        return {
          extent: graphic.geometry.extent?.expand(1.5),
          feature: graphic,
          name: location.address
        };
      });
    });
  }
});

// Agregar al Search widget
const searchWidget = new Search({
  view: view,
  sources: [
    chileAddressSource,
    // Mantener fuentes por defecto
    ...searchWidget.defaultSources
  ]
});
```

### Ejemplo 2: Búsqueda en tus Capas WFS

```javascript
// Buscar en la capa de Direcciones de GeoServer
const direccionesSource = new SearchSource({
  placeholder: "Buscar en Direcciones",
  name: "Direcciones Locales",
  
  // Usar la capa que ya cargaste
  layer: direccionesLayer,  // Tu capa GeoJSONLayer de Direcciones
  
  searchFields: ["CALLE", "NUMERO", "COMUNA"],  // Campos donde buscar
  displayField: "CALLE",
  exactMatch: false,
  outFields: ["*"],
  
  // Personalizar cómo se muestran los resultados
  getResults: (params) => {
    const query = direccionesLayer.createQuery();
    query.where = `CALLE LIKE '%${params.suggestResult.text}%'`;
    query.outFields = ["*"];
    query.returnGeometry = true;
    
    return direccionesLayer.queryFeatures(query).then((results) => {
      return results.features.map((feature) => ({
        extent: feature.geometry.extent?.expand(1.2),
        feature: feature,
        name: `${feature.attributes.CALLE} ${feature.attributes.NUMERO}`
      }));
    });
  }
});
```

### Ejemplo 3: Múltiples Fuentes

```javascript
const searchWidget = new Search({
  view: view,
  sources: [
    // 1. Búsqueda en tu capa de Direcciones
    {
      layer: direccionesLayer,
      searchFields: ["CALLE", "NUMERO"],
      displayField: "CALLE",
      exactMatch: false,
      outFields: ["*"],
      name: "Direcciones Locales",
      placeholder: "Buscar dirección local"
    },
    // 2. Búsqueda en Predios
    {
      layer: prediosLayer,
      searchFields: ["ROL", "PROPIETARIO"],
      displayField: "ROL",
      exactMatch: false,
      outFields: ["*"],
      name: "Predios",
      placeholder: "Buscar por ROL o propietario"
    },
    // 3. Mantener búsqueda mundial de ArcGIS
    {
      url: "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer",
      name: "Búsqueda Mundial",
      placeholder: "Buscar lugar",
      countryCode: "CL"  // Priorizar resultados de Chile
    }
  ],
  includeDefaultSources: false  // Usar solo tus fuentes personalizadas
});
```

## 🔧 Configuración Avanzada

### Personalizar PopupTemplate

```javascript
const searchWidget = new Search({
  view: view,
  popupEnabled: true,
  popupTemplate: {
    title: "Resultado: {CALLE}",
    content: `
      <b>Dirección:</b> {CALLE} {NUMERO}<br>
      <b>Comuna:</b> {COMUNA}<br>
      <b>Código:</b> {CODIGO}
    `
  }
});
```

### Agregar Sugerencias Locales

```javascript
const searchWidget = new Search({
  view: view,
  sources: [{
    layer: direccionesLayer,
    searchFields: ["CALLE"],
    suggestionTemplate: "{CALLE}, {COMUNA}",  // Formato de sugerencias
    placeholder: "Buscar calle",
    maxSuggestions: 8,
    minSuggestCharacters: 2
  }]
});
```

### Eventos del Search Widget

```javascript
// Detectar cuando se selecciona un resultado
searchWidget.on("select-result", (event) => {
  console.log("Resultado seleccionado:", event.result);
  console.log("Feature:", event.result.feature);
  console.log("Nombre:", event.result.name);
});

// Detectar cuando se completa la búsqueda
searchWidget.on("search-complete", (event) => {
  console.log("Búsqueda completa");
  console.log("Número de resultados:", event.numResults);
});

// Detectar cuando se limpia la búsqueda
searchWidget.on("search-clear", () => {
  console.log("Búsqueda limpiada");
});
```

## 📱 Responsive Behavior

Los estilos ya incluyen comportamiento responsive:

```css
/* Desktop */
.esri-search {
  width: 280px;
}

/* Cuando está en Expand */
.esri-expand__content .esri-search {
  width: 300px;
}

/* Mobile (ya manejado por Expand widget) */
@media (max-width: 768px) {
  .esri-search {
    width: 100%;
    max-width: 280px;
  }
}
```

## 🎯 Mejores Prácticas

### 1. Priorizar Fuentes Locales
Coloca tus fuentes personalizadas primero en el array:
```javascript
sources: [
  localSource,      // Primero
  regionalSource,   // Segundo
  worldSource       // Último
]
```

### 2. Limitar Sugerencias
```javascript
maxSuggestions: 6,  // 6-8 es óptimo
minSuggestCharacters: 3  // Evita demasiadas búsquedas
```

### 3. Usar Placeholder Descriptivo
```javascript
placeholder: "Buscar por calle, número o ROL"
```

### 4. Configurar Zoom Apropiado
```javascript
getResults: (params) => {
  // ...
  return {
    extent: feature.geometry.extent.expand(1.2),  // 120% del extent
    // o especificar zoom fijo
    target: feature.geometry,
    zoom: 16
  };
}
```

## 🔍 Testing

### Verificar que Funciona

1. **Click en el icono de búsqueda** (lupa)
2. **Escribe una ubicación** (ej: "Temuco")
3. **Selecciona de las sugerencias**
4. **Verifica que el mapa hace zoom** al resultado

### Debugging

```javascript
searchWidget.on("search-start", () => {
  console.log("Búsqueda iniciada");
});

searchWidget.on("suggest-start", () => {
  console.log("Obteniendo sugerencias...");
});
```

## 📚 Referencias

- [Search Widget - ArcGIS API](https://developers.arcgis.com/javascript/latest/api-reference/esri-widgets-Search.html)
- [SearchSource](https://developers.arcgis.com/javascript/latest/api-reference/esri-widgets-Search-SearchSource.html)
- [Custom Search Example](https://developers.arcgis.com/javascript/latest/sample-code/widgets-search-customsource/)

## ✅ Estado Actual

Tu Search widget ahora tiene:
- ✅ Diseño mejorado con estilos personalizados
- ✅ Expandible/colapsable para mejor UX
- ✅ Búsqueda mundial de ArcGIS incluida
- ✅ Listo para agregar fuentes personalizadas
- ✅ Responsive y mobile-friendly

