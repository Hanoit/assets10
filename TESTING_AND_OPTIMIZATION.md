# Testing y Optimización

Guía completa para testing, optimización de performance y mejores prácticas.

## 🧪 Testing

### Testing Manual

#### Checklist de Funcionalidad

- [ ] **Carga del Mapa**
  - El mapa se carga correctamente
  - El basemap por defecto es "hybrid"
  - El centro inicial es Temuco (-72.6, -38.7)
  - El zoom inicial es 13

- [ ] **Capas WFS**
  - Las 6 capas se cargan correctamente
  - Áreas Por Loteos (naranja)
  - Direcciones (azul)
  - Servicio de Predios (verde)
  - Servicio de Vías Público (morado)
  - Soleras (amarillo)
  - Zonas PRC (rojo)

- [ ] **Widgets**
  - Zoom in/out funciona
  - Home button regresa al extent inicial
  - Compass muestra orientación correcta
  - Navigation Toggle funciona
  - Locate encuentra ubicación del usuario
  - Search permite buscar lugares
  - Basemap Gallery cambia mapas base
  - Layer List muestra/oculta capas

- [ ] **Interactividad**
  - Click en features muestra popup
  - Popup muestra atributos correctamente
  - Zoom to layer funciona desde Layer List
  - Transparencia cambia desde Layer List

- [ ] **Responsive**
  - Desktop (> 1024px): todos los widgets visibles
  - Tablet (768-1024px): widgets ajustados
  - Móvil (< 768px): widgets compactos
  - Touch gestures funcionan en móvil

- [ ] **Estados**
  - Loading overlay muestra mientras carga
  - Contador de capas incrementa correctamente
  - Errores se muestran en banner rojo
  - Banner de error se puede cerrar

### Testing en Diferentes Navegadores

#### Chrome/Edge
```bash
npm start
# Abrir http://localhost:3000
# Probar todas las funcionalidades
```

#### Firefox
- Verificar que todos los widgets funcionan
- Confirmar que los popups se muestran correctamente
- Testear performance

#### Safari (Mac/iOS)
- Verificar compatibilidad con WebKit
- Testear gestos táctiles en iPad/iPhone
- Confirmar que los estilos se renderizan correctamente

#### Pruebas en Dispositivos Móviles
- iOS Safari
- Android Chrome
- Samsung Internet

### Testing de Performance

#### Chrome DevTools

1. **Network Tab**
```
- Verificar que los bundles se cargan rápido
- bundle.js debe ser < 500KB (gzipped)
- vendors.js debe cachear correctamente
- Verificar headers de cache
```

2. **Performance Tab**
```
- Grabar carga inicial
- Verificar First Contentful Paint < 2s
- Verificar Time to Interactive < 4s
- No debe haber long tasks > 50ms
```

3. **Lighthouse**
```bash
# Ejecutar desde Chrome DevTools > Lighthouse
- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 80
```

### Testing de Capas WFS

#### Verificar Conectividad
```javascript
// En consola del navegador
fetch('https://geoserver.hanoit.com/geoserver/assets10/ows?service=WFS&version=1.0.0&request=GetCapabilities')
  .then(r => r.text())
  .then(console.log)
```

#### Verificar Datos de Capa
```javascript
// Verificar features de una capa
fetch('https://geoserver.hanoit.com/geoserver/assets10/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=assets10:Direcciones&outputFormat=application/json&maxFeatures=10')
  .then(r => r.json())
  .then(data => {
    console.log('Features count:', data.features.length);
    console.log('First feature:', data.features[0]);
  })
```

## 🚀 Optimización

### 1. Optimización de Bundle

#### Code Splitting Actual
```javascript
// webpack.config.js ya configurado
optimization: {
  splitChunks: {
    chunks: 'all',
    cacheGroups: {
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        priority: 10,
      },
      arcgis: {
        test: /[\\/]node_modules[\\/]@arcgis[\\/]/,
        name: 'arcgis',
        priority: 20,
      },
    },
  },
}
```

#### Análisis de Bundle
```bash
# Instalar webpack-bundle-analyzer
npm install --save-dev webpack-bundle-analyzer

# Agregar a webpack.config.js
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

plugins: [
  new BundleAnalyzerPlugin()
]

# Ejecutar build
npm run build
```

### 2. Optimización de Capas

#### Limitar Features
```javascript
// src/config.js
wfs: {
  maxFeatures: 50000, // Reducir si es necesario
}
```

#### Simplificación de Geometrías
```javascript
// Si las geometrías son muy complejas
performance: {
  simplifyGeometry: true,
  tolerance: 0.5 // metros
}
```

#### Clustering (Opcional)
```javascript
// Para capas con muchos puntos
import Cluster from '@arcgis/core/layers/support/FeatureReductionCluster';

const layer = new GeoJSONLayer({
  url: wfsUrl,
  featureReduction: new Cluster({
    clusterRadius: 50,
    clusterMinSize: 16,
    clusterMaxSize: 37
  })
});
```

### 3. Optimización de Red

#### Caché de Assets
```javascript
// ASP.NET Core - Program.cs
app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        const int durationInSeconds = 60 * 60 * 24 * 7; // 7 days
        ctx.Context.Response.Headers[HeaderNames.CacheControl] =
            "public,max-age=" + durationInSeconds;
    }
});
```

#### Compresión
```javascript
// ASP.NET Core - Program.cs
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<GzipCompressionProvider>();
});

app.UseResponseCompression();
```

#### CDN (Producción)
```javascript
// Servir ArcGIS desde CDN (ya configurado)
<link rel="stylesheet" href="https://js.arcgis.com/4.28/@arcgis/core/assets/esri/themes/light/main.css">
```

### 4. Optimización de Rendering

#### Lazy Loading de Widgets
```javascript
// Cargar widgets solo cuando se necesitan
const loadBasemapGallery = async () => {
  const { default: BasemapGallery } = await import('@arcgis/core/widgets/BasemapGallery');
  return new BasemapGallery({ view });
};
```

#### Throttling de Eventos
```javascript
// Para eventos de mouse/touch
import { debounce } from '@arcgis/core/core/promiseUtils';

const handleMapClick = debounce((event) => {
  // Handle click
}, 100);

view.on('click', handleMapClick);
```

### 5. Optimización de Memoria

#### Limpieza de Recursos
```javascript
// App.js ya implementa cleanup
useEffect(() => {
  // ... setup
  
  return () => {
    if (viewRef.current) {
      viewRef.current.destroy(); // Libera recursos
    }
  };
}, []);
```

#### Límite de Features en Memoria
```javascript
// GeoServer configuration (server-side)
// Configurar maxFeatures en WFS
```

### 6. Monitoreo de Performance

#### Console Logs
```javascript
// Ya implementado en App.js
console.log('Loading layer:', layerConfig.title);
console.log('Successfully loaded:', layerConfig.title);
console.error('Error loading:', error);
```

#### Performance Marks
```javascript
// Agregar a App.js si necesitas métricas detalladas
performance.mark('map-init-start');
// ... initialize map
performance.mark('map-init-end');
performance.measure('map-initialization', 'map-init-start', 'map-init-end');

const measure = performance.getEntriesByName('map-initialization')[0];
console.log('Map init took:', measure.duration, 'ms');
```

### 7. SEO y Accesibilidad

#### Meta Tags
```html
<!-- public/index.html ya incluye -->
<meta name="description" content="...">
<meta name="theme-color" content="#0079c1">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

#### ARIA Labels
```javascript
// Agregar a widgets si es necesario
const searchWidget = new Search({
  view: view,
  ariaLabel: 'Buscar ubicación'
});
```

## 📊 Métricas de Performance

### Objetivos

| Métrica | Objetivo | Actual |
|---------|----------|--------|
| First Contentful Paint | < 2s | ⏱️ Medir |
| Time to Interactive | < 4s | ⏱️ Medir |
| Total Bundle Size | < 2MB | ⏱️ Medir |
| Gzipped Bundle | < 500KB | ⏱️ Medir |
| Lighthouse Score | > 90 | ⏱️ Medir |

### Herramientas de Medición

1. **Chrome DevTools**
   - Network tab para bundle sizes
   - Performance tab para runtime performance
   - Lighthouse para overall score

2. **WebPageTest**
   ```
   https://www.webpagetest.org/
   ```

3. **GTmetrix**
   ```
   https://gtmetrix.com/
   ```

## 🔧 Debugging

### Console Debugging
```javascript
// Habilitar logs detallados de ArcGIS
import esriConfig from '@arcgis/core/config';
esriConfig.log.level = 'debug';
```

### React DevTools
```bash
# Instalar extensión de navegador
# Chrome: React Developer Tools
# Firefox: React Developer Tools
```

### Network Debugging
```javascript
// Interceptar requests de WFS
const originalFetch = window.fetch;
window.fetch = function(...args) {
  if (args[0].includes('geoserver')) {
    console.log('WFS Request:', args[0]);
  }
  return originalFetch.apply(this, args);
};
```

## 📈 Mejores Prácticas

### 1. Desarrollo
- Usa `npm start` para desarrollo con HMR
- Mantén el bundle size bajo control
- Revisa console logs regularmente
- Testea en múltiples navegadores

### 2. Pre-Producción
- Ejecuta `npm run build` y verifica outputs
- Testea la versión de producción localmente
- Ejecuta Lighthouse audit
- Verifica que todos los assets cargan

### 3. Producción
- Habilita compresión en servidor
- Configura caché headers apropiados
- Monitorea errores con herramientas como Sentry
- Mide performance real de usuarios (RUM)

### 4. Mantenimiento
- Actualiza dependencias regularmente
- Revisa logs de errores
- Optimiza basado en métricas reales
- Documenta cambios importantes

## 🎯 Quick Wins para Performance

1. **Lazy load widgets no críticos**
2. **Reducir maxFeatures si hay problemas de performance**
3. **Habilitar compresión en servidor**
4. **Usar CDN para assets estáticos**
5. **Implementar service worker para caché offline**
6. **Minificar y optimizar imágenes**
7. **Usar HTTP/2 en servidor**
8. **Implementar preconnect para GeoServer**

## ✅ Checklist Pre-Deploy

- [ ] Build de producción exitoso
- [ ] Bundle size aceptable (< 2MB total)
- [ ] Lighthouse score > 90
- [ ] Testeo en Chrome, Firefox, Safari
- [ ] Testeo en móvil (iOS y Android)
- [ ] Todas las capas cargan correctamente
- [ ] Popups funcionan
- [ ] Widgets funcionan
- [ ] Loading states funcionan
- [ ] Error handling funciona
- [ ] Responsive design verificado
- [ ] Documentación actualizada
- [ ] Variables de entorno configuradas
- [ ] CORS configurado si es necesario

## 📞 Soporte

Si encuentras problemas de performance:
1. Revisa console logs
2. Ejecuta Lighthouse audit
3. Verifica network tab
4. Revisa la documentación de ArcGIS
5. Contacta al equipo de desarrollo

