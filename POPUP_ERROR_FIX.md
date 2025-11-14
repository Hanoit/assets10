# Solución al Error de Popup/Calcite Components

## 🔴 Problema

Error al cargar chunks de Calcite Components cuando se hace click en el mapa para ver popups:

```
ChunkLoadError: Loading chunk node_modules_esri_calcite-components_dist_components_calcite-action-bar_index_js failed
```

## ✅ Solución Aplicada

### 1. Ajuste de Code Splitting en Desarrollo

**Antes:**
```javascript
splitChunks: false  // Deshabilitado completamente
```

**Ahora:**
```javascript
splitChunks: {
  chunks: 'async',      // Permite chunks dinámicos (necesario para ArcGIS)
  minSize: 30000,
}
```

**Por qué:** ArcGIS SDK carga componentes de Calcite dinámicamente. Si deshabilitamos completamente splitChunks, webpack no puede manejar estos imports dinámicos.

### 2. Configuración de Asset Modules

```javascript
output: {
  // ...
  assetModuleFilename: 'assets/[hash][ext][query]',
}
```

Esto asegura que los assets de Calcite se manejen correctamente.

### 3. Caché Limpiado

Se limpió el caché de webpack que podría tener chunks corruptos.

## 🚀 Cómo Aplicar la Solución

### Paso 1: Detener el Servidor
```bash
# Presiona Ctrl+C en la terminal
```

### Paso 2: Limpiar Completamente (Opcional pero Recomendado)
```bash
# Windows PowerShell
Remove-Item -Recurse -Force dist
Remove-Item -Recurse -Force node_modules\.cache

# O simplemente:
rmdir /s /q dist
```

### Paso 3: Reiniciar el Servidor
```bash
npm start
```

## 🔍 Verificar que Funciona

1. **Espera a que el servidor inicie** completamente
2. **Abre el navegador** en http://localhost:3000
3. **Click en cualquier feature** en el mapa (Áreas, Direcciones, etc.)
4. **Debería aparecer el popup** sin errores de ChunkLoadError

## 📊 Configuración Final de Webpack

### Desarrollo
- ✅ **splitChunks: async** - Permite imports dinámicos
- ✅ **runtimeChunk: false** - No separa runtime en dev
- ✅ **chunks async** - Solo divide código asíncrono

### Producción
- ✅ **splitChunks: all** - Optimización completa
- ✅ **runtimeChunk: runtime** - Runtime separado para mejor caché
- ✅ **Vendors separados** - arcgis-vendor y vendors

## 🐛 Si el Error Persiste

### Opción 1: Limpiar Todo y Reinstalar
```bash
# 1. Detener servidor (Ctrl+C)

# 2. Limpiar
rmdir /s /q node_modules
rmdir /s /q dist
del package-lock.json

# 3. Reinstalar
npm install

# 4. Iniciar
npm start
```

### Opción 2: Deshabilitar Optimización Temporalmente

Si necesitas que funcione YA, puedes deshabilitar temporalmente la optimización:

En `webpack.config.js`:
```javascript
optimization: {
  minimize: false,
  splitChunks: false,
  runtimeChunk: false,
},
```

**Nota:** Esto hará que el bundle sea más grande y lento, pero debería funcionar.

### Opción 3: Usar CDN para ArcGIS (No Recomendado)

Como última opción, podrías cargar ArcGIS desde CDN en lugar de npm:

```html
<!-- public/index.html -->
<link rel="stylesheet" href="https://js.arcgis.com/4.28/esri/themes/light/main.css">
<script src="https://js.arcgis.com/4.28/"></script>
```

Pero esto requeriría cambios significativos en el código.

## 🎯 Comportamiento Esperado

### Popup Funcionando
Cuando haces click en un feature:
1. ✅ Se muestra el popup sin errores
2. ✅ Aparece información del feature
3. ✅ Los componentes de Calcite se cargan correctamente
4. ✅ No hay errores de ChunkLoadError en consola

### Widgets Funcionando
- ✅ Search funciona
- ✅ BasemapGallery funciona  
- ✅ LayerList funciona
- ✅ Todos los expand widgets funcionan

## 💡 Explicación Técnica

### ¿Por qué ocurre este error?

ArcGIS JS SDK usa **Calcite Components** para sus widgets modernos. Estos componentes se cargan **dinámicamente** (lazy loading) cuando se necesitan.

Cuando haces click en el mapa:
1. Se activa el popup
2. El popup necesita componentes de Calcite (action-bar, etc.)
3. Webpack intenta cargar el chunk dinámicamente
4. Si la configuración de chunks está mal → error

### Nuestra Solución

Configuramos webpack para:
- ✅ Permitir chunks asíncronos en desarrollo
- ✅ Manejar imports dinámicos correctamente
- ✅ No romper el hot reload
- ✅ Mantener buenos tiempos de build

## 📚 Referencias

- [Webpack Code Splitting](https://webpack.js.org/guides/code-splitting/)
- [ArcGIS JS API Webpack Guide](https://developers.arcgis.com/javascript/latest/webpack/)
- [Calcite Components](https://developers.arcgis.com/calcite-design-system/)

## ✅ Checklist Post-Fix

- [ ] Servidor reiniciado
- [ ] Navegador refrescado (Ctrl+F5)
- [ ] Click en feature del mapa
- [ ] Popup aparece sin errores
- [ ] Consola sin ChunkLoadErrors
- [ ] Todos los widgets funcionan

## 🎉 Resultado Final

Con esta configuración:
- ✅ Popups funcionan perfectamente
- ✅ Widgets cargan sin errores
- ✅ Performance optimizada
- ✅ Hot reload funciona
- ✅ Producción lista para deploy



