# 🔧 Solución: PublicPath para Rutas Correctas en Build

## 🐛 Problema

Los archivos JS compilados están en `/assets/` pero webpack genera rutas en `index.html` que apuntan a `/`:

```html
<!-- ❌ Generado por webpack (incorrecto) -->
<script src="/runtime.xxx.js"></script>
<script src="/react-vendor.xxx.js"></script>

<!-- ✅ Debería ser (correcto) -->
<script src="/assets/runtime.xxx.js"></script>
<script src="/assets/react-vendor.xxx.js"></script>
```

**Resultado:** 404 en todos los archivos JavaScript

## ✅ Solución

### 1. Configuración Dinámica de `publicPath`

En `webpack.config.js`:

```javascript
const publicPath = isDevelopment 
  ? '/' 
  : (process.env.PUBLIC_PATH || '/assets/');

module.exports = {
  output: {
    publicPath: publicPath, // ← Configurable
    // ...
  }
}
```

### 2. Scripts de Build en `package.json`

```json
{
  "scripts": {
    "build": "webpack --mode production",
    "build:assets": "cross-env PUBLIC_PATH=/assets/ webpack --mode production",
    "build:root": "cross-env PUBLIC_PATH=/ webpack --mode production"
  }
}
```

### 3. Instalar `cross-env`

```bash
npm install --save-dev cross-env
```

## 🚀 Uso

### Para Desarrollo (localhost:3000)
```bash
npm start
```
- Usa `publicPath: '/'`
- Archivos en `http://localhost:3000/`

### Para Producción en /assets/
```bash
npm run build:assets
```
- Usa `publicPath: '/assets/'`
- Genera rutas: `/assets/runtime.xxx.js`
- Perfecto para ASP.NET Core (`wwwroot/assets/`)

### Para Producción en raíz /
```bash
npm run build:root
```
- Usa `publicPath: '/'`
- Genera rutas: `/runtime.xxx.js`
- Para despliegues standalone

### Build por Defecto
```bash
npm run build
```
- Usa `publicPath: '/assets/'` (valor por defecto)
- Igual que `build:assets`

## 📁 Estructura de Deployment

### Opción 1: ASP.NET Core
```
wwwroot/
  assets/
    index.html
    runtime.xxx.js
    react-vendor.xxx.js
    vendors.xxx.js
    main.xxx.js
    arcgis-core.xxx.js
    (etc.)
```

**Acceso:** `https://tudominio.com/assets/index.html`

**Build:** `npm run build:assets`

### Opción 2: Raíz del Servidor
```
public_html/
  index.html
  runtime.xxx.js
  react-vendor.xxx.js
  vendors.xxx.js
  main.xxx.js
  (etc.)
```

**Acceso:** `https://tudominio.com/`

**Build:** `npm run build:root`

## 🔍 Cómo Verificar

Después de compilar, abre `dist/index.html` y busca las rutas de los scripts:

### Con `build:assets`:
```html
<script defer src="/assets/runtime.xxx.js"></script>
<script defer src="/assets/react-vendor.xxx.js"></script>
```

### Con `build:root`:
```html
<script defer src="/runtime.xxx.js"></script>
<script defer src="/react-vendor.xxx.js"></script>
```

## 📝 Configuración ASP.NET Core

Si estás integrando con ASP.NET Core:

### 1. Configurar `config.js`
```javascript
export const config = {
  aspnetCore: {
    enabled: true,
    staticAssetsPath: '/assets/',
  }
}
```

### 2. Compilar para ASP.NET
```bash
npm run build:assets
```

### 3. Copiar a ASP.NET
```bash
# Copiar dist/ a wwwroot/assets/
xcopy /E /I /Y dist wwwroot\assets
```

### 4. En tu Vista Razor (`.cshtml`)
```html
<!DOCTYPE html>
<html>
<head>
    <title>Assets 10 - Mapa</title>
</head>
<body>
    <div id="root"></div>
    <!-- Incluir index.html de React o referenciar los scripts directamente -->
</body>
</html>
```

O simplemente sirve `wwwroot/assets/index.html` desde tu controlador.

## 🎯 Solución Alternativa (Sin Variables de Entorno)

Si no quieres usar `cross-env`, puedes:

### Opción A: Hardcodear en webpack.config.js
```javascript
const publicPath = isDevelopment 
  ? '/' 
  : '/assets/';  // ← Hardcodeado
```

### Opción B: Usar diferentes configs
```javascript
// webpack.config.js (para /assets/)
module.exports = { publicPath: '/assets/' }

// webpack.config.root.js (para /)
module.exports = { publicPath: '/' }
```

## 🐛 Troubleshooting

### Los scripts siguen dando 404
1. Verifica que compilaste con el script correcto
2. Abre `dist/index.html` y verifica las rutas de los `<script>`
3. Asegúrate de que los archivos `.js` estén en la misma carpeta que `index.html`
4. Limpia caché del navegador: `Ctrl + F5`

### ¿Cuándo usar cada opción?

- **`build:assets`**: Para ASP.NET Core, subdirectorios
- **`build:root`**: Para despliegue en raíz, GitHub Pages
- **`start`**: Para desarrollo local

---

**Comando Recomendado para Tu Caso:**

```bash
npm install --save-dev cross-env
npm run build:assets
```

Esto generará archivos con rutas `/assets/xxx.js` listas para copiar a tu servidor.

