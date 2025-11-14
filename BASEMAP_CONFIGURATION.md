# Configuración de Basemap Gallery

## ✅ Solución Implementada (Simple y Confiable)

La configuración actual usa los basemaps por defecto de ArcGIS:

```javascript
const basemapGallery = new BasemapGallery({
  view: view
  // Sin 'source' personalizado - usa basemaps de Esri por defecto
});
```

**Basemaps incluidos por defecto:**
- Streets
- Topographic
- Oceans
- Imagery
- Dark Gray Canvas
- Light Gray Canvas
- Navigation
- Streets Night
- Terrain
- OSM (OpenStreetMap)

## 🎨 Opciones Avanzadas de Personalización

### Opción 1: Basemaps Específicos con Estilos

```javascript
import Basemap from '@arcgis/core/Basemap';

const basemapGallery = new BasemapGallery({
  view: view,
  source: [
    Basemap.fromId("streets-vector"),
    Basemap.fromId("hybrid"),
    Basemap.fromId("topo-vector"),
    Basemap.fromId("satellite"),
    Basemap.fromId("dark-gray-vector"),
    Basemap.fromId("osm")
  ]
});
```

### Opción 2: Usando Basemap Styles (Recomendado por Esri)

Según la documentación oficial ([Creating a Basemap](https://developers.arcgis.com/javascript/latest/api-reference/esri-Basemap.html#creating-a-basemap)), puedes usar estilos:

```javascript
import Basemap from '@arcgis/core/Basemap';

// Crear basemap con estilo y idioma
const outdoorBasemap = new Basemap({
  style: {
    id: "arcgis/outdoor",
    language: "es" // Etiquetas en español
  }
});

const streetsBasemap = new Basemap({
  style: {
    id: "arcgis/streets",
    language: "es"
  }
});

const imageryBasemap = new Basemap({
  style: {
    id: "arcgis/imagery"
  }
});

const basemapGallery = new BasemapGallery({
  view: view,
  source: [outdoorBasemap, streetsBasemap, imageryBasemap]
});
```

**Estilos disponibles:**
- `arcgis/streets`
- `arcgis/outdoor`
- `arcgis/navigation`
- `arcgis/topographic`
- `arcgis/light-gray`
- `arcgis/dark-gray`
- `arcgis/imagery`
- `arcgis/oceans`
- `arcgis/terrain`

### Opción 3: Basemaps desde Portal Items

```javascript
import Basemap from '@arcgis/core/Basemap';

const customBasemap = new Basemap({
  portalItem: {
    id: "8dda0e7b5e2d4fafa80132d59122268c" // ID de un webmap en ArcGIS Online
  }
});

const basemapGallery = new BasemapGallery({
  view: view,
  source: [
    Basemap.fromId("streets-vector"),
    customBasemap
  ]
});
```

### Opción 4: Basemaps Personalizados desde WMS/WMTS

```javascript
import Basemap from '@arcgis/core/Basemap';
import WMTSLayer from '@arcgis/core/layers/WMTSLayer';
import TileLayer from '@arcgis/core/layers/TileLayer';

// Basemap desde servicio WMS
const customBasemap = new Basemap({
  baseLayers: [
    new WMTSLayer({
      url: "https://your-server.com/wmts",
      activeLayer: {
        id: "layer-id"
      }
    })
  ],
  title: "Mi Basemap Custom",
  id: "custom-basemap",
  thumbnailUrl: "path/to/thumbnail.jpg"
});

const basemapGallery = new BasemapGallery({
  view: view,
  source: [
    Basemap.fromId("streets-vector"),
    customBasemap
  ]
});
```

### Opción 5: Query Personalizado (Arreglado)

Si quieres usar query pero que funcione correctamente:

```javascript
import BasemapGallery from '@arcgis/core/widgets/BasemapGallery';
import LocalBasemapsSource from '@arcgis/core/widgets/BasemapGallery/support/LocalBasemapsSource';
import PortalBasemapsSource from '@arcgis/core/widgets/BasemapGallery/support/PortalBasemapsSource';

// Opción A: Portal query mejorado
const basemapGallery = new BasemapGallery({
  view: view,
  source: new PortalBasemapsSource({
    portal: view.map.portalItem?.portal,
    query: "basemap"  // Query más simple y efectivo
  })
});

// Opción B: Combinar local + portal
const localSource = new LocalBasemapsSource({
  basemaps: [
    Basemap.fromId("streets-vector"),
    Basemap.fromId("hybrid"),
    Basemap.fromId("topo-vector")
  ]
});

const basemapGallery = new BasemapGallery({
  view: view,
  source: localSource
});
```

## 📱 Ejemplo con Web Components (Moderno)

Si prefieres usar la nueva API de Web Components (como en el ejemplo que compartiste):

### HTML:
```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="initial-scale=1, maximum-scale=1, user-scalable=no" />
  <title>Mapa con Web Components</title>
  
  <!-- Calcite Components -->
  <script type="module" src="https://js.arcgis.com/calcite-components/3.3.3/calcite.esm.js"></script>
  
  <!-- ArcGIS Maps SDK -->
  <script src="https://js.arcgis.com/4.34/"></script>
  
  <!-- Map Components -->
  <script type="module" src="https://js.arcgis.com/4.34/map-components/"></script>
  
  <style>
    html, body {
      margin: 0;
      height: 100%;
    }
  </style>
</head>
<body>
  <arcgis-map basemap="hybrid" center="-72.6,-38.7" zoom="13">
    <arcgis-zoom position="top-left"></arcgis-zoom>
    <arcgis-home position="top-left"></arcgis-home>
    <arcgis-search position="top-right"></arcgis-search>
    <arcgis-basemap-gallery position="top-right"></arcgis-basemap-gallery>
    <arcgis-layer-list position="top-right"></arcgis-layer-list>
  </arcgis-map>
</body>
</html>
```

## 🔧 Implementación en React (Futuro)

Para integrar Web Components en React:

```jsx
import { useEffect, useRef } from 'react';
import '@arcgis/map-components/dist/components/arcgis-map';
import '@arcgis/map-components/dist/components/arcgis-basemap-gallery';

function MapWithComponents() {
  const mapRef = useRef(null);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.addEventListener('arcgisViewReadyChange', (event) => {
        const { view } = event.detail;
        console.log('Map view is ready', view);
      });
    }
  }, []);

  return (
    <arcgis-map
      ref={mapRef}
      basemap="hybrid"
      center="-72.6,-38.7"
      zoom="13"
    >
      <arcgis-zoom slot="top-left"></arcgis-zoom>
      <arcgis-basemap-gallery slot="top-right"></arcgis-basemap-gallery>
    </arcgis-map>
  );
}
```

## 🎯 Recomendaciones

### Para Desarrollo Actual (Widgets Clásicos)
✅ **Usa la configuración simple** (ya implementada):
```javascript
const basemapGallery = new BasemapGallery({ view: view });
```

**Ventajas:**
- Funciona inmediatamente
- Incluye todos los basemaps populares
- No requiere configuración adicional
- Mantenido por Esri

### Para Producción
Considera:
1. **Basemaps específicos** si solo necesitas algunos
2. **Estilos con idioma español** para mejor UX local
3. **Basemap custom** si tienes cartografía propia

### Para Futuro (2025+)
Migrar a **Web Components** según el plan de Esri:
- Más modernos y mantenibles
- Mejor rendimiento
- Integración más simple
- Menos código

## 🐛 Troubleshooting

### Problema: "Basemap gallery está vacío"
**Solución:** Elimina el `source` personalizado y usa por defecto

### Problema: "Query no devuelve resultados"
**Solución:** Usa `LocalBasemapsSource` con basemaps específicos

### Problema: "Basemaps muy lentos"
**Solución:** Limita la cantidad de basemaps en el source

### Problema: "Quiero basemaps en español"
**Solución:** Usa Basemap styles con `language: "es"`

## 📚 Referencias

- [Basemap Class - ArcGIS API](https://developers.arcgis.com/javascript/latest/api-reference/esri-Basemap.html)
- [BasemapGallery Widget](https://developers.arcgis.com/javascript/latest/api-reference/esri-widgets-BasemapGallery.html)
- [Basemap Styles](https://developers.arcgis.com/javascript/latest/api-reference/esri-support-BasemapStyle.html)
- [Web Components Guide](https://developers.arcgis.com/javascript/latest/components/)

## ✅ Checklist

Después de los cambios:
- [x] BasemapGallery usa configuración por defecto
- [ ] Probar cambio de basemap en el navegador
- [ ] Verificar que todos los basemaps cargan
- [ ] Confirmar que el mapa se actualiza al cambiar
- [ ] Opcional: Personalizar basemaps según necesidad

