# 📦 Guía de Despliegue - Assets10

## ✅ Arreglo Implementado

**Problema:** Los archivos JS se generaban con rutas `/script.js` en lugar de `/assets/script.js`

**Solución:** Configuración de `publicPath` en `webpack.config.js`

## 🚀 Cómo Compilar

### Para Despliegue en /assets/ (ASP.NET Core)

```bash
npm run build
```

o

```bash
.\node_modules\.bin\webpack --mode production
```

**Genera:**
```
dist/
  index.html  ← Con rutas /assets/xxx.js
  runtime.[hash].js
  react-vendor.[hash].js
  vendors.[hash].js
  main.[hash].js
  arcgis-*.js
```

### Verificar que las Rutas sean Correctas

Después de compilar, abre `dist/index.html` y busca:

```html
<!-- ✅ Debería verse así -->
<script defer src="/assets/runtime.xxx.js"></script>
<script defer src="/assets/react-vendor.xxx.js"></script>
<script defer src="/assets/vendors.xxx.js"></script>
<script defer src="/assets/main.xxx.js"></script>
```

## 📁 Despliegue en Servidor

### Opción 1: Despliegue en /assets/

**Estructura en el servidor:**
```
public_html/  o  wwwroot/
  assets/
    index.html
    runtime.[hash].js
    react-vendor.[hash].js
    vendors.[hash].js
    main.[hash].js
    arcgis-*.js
```

**Comando:**
```bash
# Compilar
npm run build

# Copiar a servidor
# (Copiar todo el contenido de dist/ a la carpeta assets/ del servidor)
```

**URL de acceso:** `https://tudominio.com/assets/`

### Opción 2: Si necesitas desplegar en raíz `/`

Si necesitas desplegar en la raíz (no en `/assets/`), cambia esta línea en `webpack.config.js`:

```javascript
// Línea 12
const publicPath = isDevelopment 
  ? '/' 
  : '/';  // ← Cambiar de '/assets/' a '/'
```

Luego compila:
```bash
npm run build
```

## 🔧 Cambiar publicPath Manualmente

Si necesitas cambiar entre `/assets/` y `/`:

### Para /assets/ (ASP.NET Core, subdirectorios):
```javascript
// webpack.config.js línea 12
const publicPath = isDevelopment ? '/' : '/assets/';
```

### Para / (raíz, standalone):
```javascript
// webpack.config.js línea 12
const publicPath = isDevelopment ? '/' : '/';
```

## 📋 Checklist de Despliegue

1. ✅ Compilar el proyecto
   ```bash
   npm run build
   ```

2. ✅ Verificar rutas en `dist/index.html`
   - Abrir `dist/index.html` en un editor
   - Verificar que los `<script src="...">` tengan las rutas correctas

3. ✅ Copiar archivos al servidor
   - Copiar TODO el contenido de `dist/` a la carpeta de destino

4. ✅ Probar en navegador
   - Acceder a la URL correcta
   - Abrir DevTools (F12) → Network
   - Verificar que NO haya errores 404
   - Verificar que todos los `.js` se carguen con status 200

5. ✅ Limpiar caché
   - `Ctrl + F5` para forzar recarga

## 🐛 Troubleshooting

### Error 404 en archivos .js

**Causa:** publicPath incorrecto

**Solución:**
1. Abre `dist/index.html`
2. Verifica las rutas de los `<script>`
3. Asegúrate de que coincidan con la estructura de carpetas en el servidor
4. Ajusta `publicPath` en `webpack.config.js` si es necesario
5. Recompila: `npm run build`

### Archivos se cargan pero app no funciona

**Causa:** Posible problema con CORS o rutas de la API

**Solución:**
1. Abre consola del navegador (F12)
2. Busca errores de CORS
3. Verifica que las URLs de GeoServer en `config.js` sean correctas

### App funciona en localhost pero no en servidor

**Causa:** Rutas relativas vs absolutas

**Solución:**
1. Verifica que `publicPath` sea correcto para el servidor
2. En `config.js`, usa rutas absolutas para el GeoServer:
   ```javascript
   baseUrl: 'https://geoserver.hanoit.com/geoserver/assets10/ows'
   ```

## 📚 Configuración para Diferentes Entornos

### Desarrollo Local
```javascript
// webpack.config.js
const publicPath = '/';
```

```bash
npm start
```

Acceso: `http://localhost:3000/`

### Producción en /assets/
```javascript
// webpack.config.js
const publicPath = '/assets/';
```

```bash
npm run build
```

Acceso: `https://tudominio.com/assets/`

### Producción en raíz /
```javascript
// webpack.config.js
const publicPath = '/';
```

```bash
npm run build
```

Acceso: `https://tudominio.com/`

## 🎯 Resumen

**Cambio Principal:** `publicPath` en `webpack.config.js`

**Por defecto:** Configurado para `/assets/` (ASP.NET Core)

**Para cambiar:** Edita línea 12 de `webpack.config.js`

**Compilar:** `npm run build` o `.\node_modules\.bin\webpack --mode production`

**Desplegar:** Copiar `dist/*` a `servidor/assets/`

---

**Nota:** Si cambias entre `/` y `/assets/`, siempre recompila y limpia la caché del navegador con `Ctrl + F5`.

