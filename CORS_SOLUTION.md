# Solución al Problema de CORS

## 🔴 Problema

GeoServer no permite requests desde `http://localhost:3000` debido a la política CORS (Cross-Origin Resource Sharing).

## ✅ Solución Implementada

### Desarrollo (localhost)
Hemos configurado un **proxy en Webpack Dev Server** que redirige las peticiones:

```
http://localhost:3000/geoserver/... 
  ↓ (proxy)
https://geoserver.hanoit.com/geoserver/...
```

**Configuración en `webpack.config.js`:**
```javascript
proxy: [
  {
    context: ['/geoserver'],
    target: 'https://geoserver.hanoit.com',
    changeOrigin: true,
    secure: false,
  }
]
```

**Configuración en `src/config.js`:**
```javascript
baseUrl: process.env.NODE_ENV === 'production' 
  ? 'https://geoserver.hanoit.com/geoserver/assets10/ows'  // Producción
  : '/geoserver/assets10/ows'  // Desarrollo (usa proxy)
```

### Producción

En producción tienes 3 opciones:

#### Opción 1: Configurar CORS en GeoServer (Recomendado)

Agregar en `web.xml` de GeoServer:

```xml
<filter>
  <filter-name>CorsFilter</filter-name>
  <filter-class>org.apache.catalina.filters.CorsFilter</filter-class>
  <init-param>
    <param-name>cors.allowed.origins</param-name>
    <param-value>https://tu-dominio.com</param-value>
  </init-param>
  <init-param>
    <param-name>cors.allowed.methods</param-name>
    <param-value>GET,POST,HEAD,OPTIONS,PUT</param-value>
  </init-param>
</filter>
<filter-mapping>
  <filter-name>CorsFilter</filter-name>
  <url-pattern>/*</url-pattern>
</filter-mapping>
```

#### Opción 2: Desplegar en el mismo dominio

Si tu aplicación está en `https://ejemplo.com` y GeoServer en `https://ejemplo.com/geoserver`, no hay problema de CORS.

#### Opción 3: Proxy en servidor web (IIS/Nginx)

**Nginx:**
```nginx
location /geoserver/ {
    proxy_pass https://geoserver.hanoit.com/geoserver/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

**IIS (URL Rewrite):**
```xml
<rule name="GeoServer Proxy" stopProcessing="true">
  <match url="^geoserver/(.*)" />
  <action type="Rewrite" url="https://geoserver.hanoit.com/geoserver/{R:1}" />
</rule>
```

## 🚀 Cómo Usar

### Desarrollo
```bash
# Reiniciar servidor para aplicar cambios del proxy
npm start
```

Las URLs se convertirán automáticamente:
- Local: `http://localhost:3000/geoserver/assets10/ows`
- Proxy to: `https://geoserver.hanoit.com/geoserver/assets10/ows`

### Producción
El código automáticamente usa la URL directa de GeoServer basado en `NODE_ENV`.

## 📝 Notas Adicionales

### Otros Errores que Viste

1. **Runtime.lastError** - Error de extensión de Chrome, no afecta la app
2. **ArcGIS Deprecated Warnings** - Solo advertencias, los widgets siguen funcionando
3. **Webpack disconnect/reconnect** - Normal en desarrollo, se reconecta automáticamente
4. **content_script.js errors** - Errores de extensiones del navegador, ignorar

### Verificar que Funciona

Después de reiniciar, en la consola deberías ver:
```
Loading layer: Áreas Por Loteos from /geoserver/assets10/ows...
Successfully loaded layer: Áreas Por Loteos
```

En lugar de errores CORS.

## 🔍 Troubleshooting

Si aún hay errores:

1. **Verifica que el servidor se reinició**
2. **Limpia caché del navegador** (Ctrl+Shift+Delete)
3. **Verifica la consola del terminal** - debería mostrar logs del proxy
4. **Prueba la URL del proxy manualmente**: http://localhost:3000/geoserver/assets10/ows?service=WFS&request=GetCapabilities

## ✅ Checklist

- [ ] Servidor reiniciado (`npm start`)
- [ ] Caché del navegador limpiado
- [ ] Las capas cargan sin errores CORS
- [ ] Mapa muestra las geometrías
- [ ] Popups funcionan al hacer click

