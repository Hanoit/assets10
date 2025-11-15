# Optimización de Webpack para ArcGIS JS SDK

## ✅ Cambios Implementados

### 1. **Lazy Loading de Módulos ArcGIS**
Se implementó la carga diferida (lazy loading) de todos los módulos de ArcGIS usando imports dinámicos:

```javascript
// ANTES: Carga todo al inicio
import Map from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';

// AHORA: Carga solo cuando se necesita
const [{ default: Map }, { default: MapView }] = await Promise.all([
  import('@arcgis/core/Map'),
  import('@arcgis/core/views/MapView'),
]);
```

**Beneficios:**
- El bundle inicial es más pequeño
- Los módulos se cargan solo cuando se necesitan
- Mejor performance de carga inicial

### 2. **Code Splitting Mejorado**
Se configuró webpack para dividir el código de forma más agresiva:

- **arcgis-core**: Módulos principales (Map, MapView, Layers)
- **arcgis-widgets**: Cada widget en su propio chunk
- **react-vendor**: React y React-DOM separados
- **vendors**: Otras bibliotecas
- **common**: Código compartido

### 3. **Límites de Performance Actualizados**
Se ajustaron los límites para acomodar el SDK de ArcGIS:
- `maxEntrypointSize`: 2.5 MB (desde 512 KB)
- `maxAssetSize`: 15 MB (desde 512 KB)
- Se excluyen archivos `.map` de las advertencias

## 📊 Resultados Esperados

### Antes:
```
WARNING: arcgis-vendor.js (11.9 MiB)
WARNING: vendors.js (2.15 MiB)
WARNING: Entrypoint main (14.1 MiB)
```

### Después:
- Múltiples chunks más pequeños
- Carga inicial más rápida
- Menos warnings (o ninguno)
- Carga progresiva de funcionalidades

## 🚀 Optimizaciones Adicionales Opcionales

### 1. **Comprimir Assets con Compression Plugin**
```bash
npm install compression-webpack-plugin --save-dev
```

Agregar a `webpack.config.js`:
```javascript
const CompressionPlugin = require('compression-webpack-plugin');

plugins: [
  // ... otros plugins
  new CompressionPlugin({
    filename: '[path][base].gz',
    algorithm: 'gzip',
    test: /\.(js|css|html|svg)$/,
    threshold: 8192,
    minRatio: 0.8,
  }),
]
```

### 2. **Analizar el Bundle**
```bash
npm install webpack-bundle-analyzer --save-dev
```

Agregar script en `package.json`:
```json
"scripts": {
  "analyze": "webpack --mode production --profile --json > stats.json && webpack-bundle-analyzer stats.json dist"
}
```

Ejecutar:
```bash
npm run analyze
```

### 3. **Habilitar Tree Shaking Completo**
Asegúrate de tener en `package.json`:
```json
{
  "sideEffects": ["*.css"]
}
```

### 4. **Optimizar CSS**
```bash
npm install mini-css-extract-plugin css-minimizer-webpack-plugin --save-dev
```

Agregar a `webpack.config.js`:
```javascript
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

module: {
  rules: [
    {
      test: /\.css$/,
      use: [
        isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
        'css-loader'
      ],
    },
  ]
},
plugins: [
  new MiniCssExtractPlugin({
    filename: '[name].[contenthash].css',
  }),
],
optimization: {
  minimizer: [
    `...`, // mantiene los minimizadores por defecto
    new CssMinimizerPlugin(),
  ],
}
```

### 5. **Configurar CDN para ArcGIS (Alternativa Avanzada)**
En lugar de empaquetar ArcGIS, cargarlo desde CDN:

**En `public/index.html`:**
```html
<link rel="stylesheet" href="https://js.arcgis.com/4.28/@arcgis/core/assets/esri/themes/light/main.css">
<script src="https://js.arcgis.com/4.28/"></script>
```

**En `webpack.config.js`:**
```javascript
externals: {
  '@arcgis/core': 'esri',
}
```

**⚠️ Consideración:** Esta opción reduce significativamente el bundle pero requiere conexión a internet y puede tener latencia.

### 6. **Habilitar HTTP/2 Server Push (Producción)**
Si usas un servidor con HTTP/2, configura server push para los chunks críticos:
```
Link: </arcgis-core.js>; rel=preload; as=script
Link: </react-vendor.js>; rel=preload; as=script
```

### 7. **Caché de Build en Producción**
Para CI/CD, usa caché de webpack:
```javascript
cache: {
  type: 'filesystem',
  buildDependencies: {
    config: [__filename],
  },
}
```

## 📝 Comandos Útiles

```bash
# Compilar en modo producción
npm run build

# Iniciar servidor de desarrollo
npm start

# Analizar el tamaño del bundle (si instalaste el analyzer)
npm run analyze
```

## 🔍 Verificar las Mejoras

Después de compilar, verifica:
1. ✅ Menos warnings (o ninguno)
2. ✅ Múltiples chunks en lugar de uno grande
3. ✅ Tamaño del entrypoint principal reducido
4. ✅ Carga inicial más rápida en el navegador

## 📖 Recursos Adicionales

- [Webpack Code Splitting](https://webpack.js.org/guides/code-splitting/)
- [ArcGIS JS API Performance](https://developers.arcgis.com/javascript/latest/performance/)
- [Web Performance Optimization](https://web.dev/fast/)

## 🎯 Integración con ASP.NET Core

Cuando integres con ASP.NET Core Razor:

1. Los archivos compilados irán a `wwwroot/dist/`
2. Configura el `publicPath` en webpack para ASP.NET:
```javascript
output: {
  publicPath: '/dist/',
}
```

3. En tu vista Razor (`.cshtml`):
```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="~/dist/main.css" />
</head>
<body>
    <div id="root"></div>
    <script src="~/dist/runtime.js"></script>
    <script src="~/dist/react-vendor.js"></script>
    <script src="~/dist/main.js"></script>
</body>
</html>
```

4. O usa `HtmlWebpackPlugin` y copia el HTML generado a tu Layout.

