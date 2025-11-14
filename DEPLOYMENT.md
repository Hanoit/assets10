# Guía de Deployment

Guía completa para desplegar la aplicación en diferentes entornos.

## 📋 Pre-requisitos

- Node.js 16+ instalado
- Servidor web (IIS, Apache, Nginx) o plataforma cloud
- Acceso a GeoServer (https://geoserver.hanoit.com)
- Certificado SSL (recomendado para producción)

## 🎯 Entornos de Deployment

### 1. IIS (Windows Server) - Con ASP.NET Core

Ver `ASPNET_INTEGRATION.md` para detalles completos.

#### Resumen:
```bash
# 1. Build del frontend
cd ClientApp
npm install
npm run build

# 2. Copiar a wwwroot
xcopy dist ..\wwwroot\dist /E /Y /I

# 3. Publicar ASP.NET Core
cd ..
dotnet publish -c Release -o ./publish

# 4. Configurar IIS
# - Crear Application Pool (.NET Core)
# - Crear sitio web apuntando a ./publish
# - Configurar bindings (HTTP/HTTPS)
```

### 2. IIS (Windows Server) - Solo Frontend

Si solo necesitas servir el frontend React sin ASP.NET Core:

#### Paso 1: Build
```bash
npm install
npm run build
```

#### Paso 2: Configurar IIS

**web.config** para SPA:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <!-- Rewrite rules para SPA -->
    <rewrite>
      <rules>
        <rule name="React Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/" />
        </rule>
      </rules>
    </rewrite>
    
    <!-- MIME types -->
    <staticContent>
      <mimeMap fileExtension=".json" mimeType="application/json" />
      <mimeMap fileExtension=".woff" mimeType="application/font-woff" />
      <mimeMap fileExtension=".woff2" mimeType="font/woff2" />
    </staticContent>
    
    <!-- Compression -->
    <httpCompression>
      <dynamicTypes>
        <add mimeType="application/javascript" enabled="true" />
        <add mimeType="application/json" enabled="true" />
      </dynamicTypes>
      <staticTypes>
        <add mimeType="application/javascript" enabled="true" />
        <add mimeType="text/css" enabled="true" />
      </staticTypes>
    </httpCompression>
    
    <!-- Cache control -->
    <staticContent>
      <clientCache cacheControlMode="UseMaxAge" cacheControlMaxAge="7.00:00:00" />
    </staticContent>
    
    <!-- Security headers -->
    <httpProtocol>
      <customHeaders>
        <add name="X-Content-Type-Options" value="nosniff" />
        <add name="X-Frame-Options" value="SAMEORIGIN" />
        <add name="X-XSS-Protection" value="1; mode=block" />
      </customHeaders>
    </httpProtocol>
  </system.webServer>
</configuration>
```

#### Paso 3: Deploy
1. Copiar contenido de `dist/` a `C:\inetpub\wwwroot\assets10\`
2. Crear sitio en IIS Manager
3. Configurar Application Pool (No Managed Code)
4. Agregar bindings (puerto 80/443)
5. Configurar SSL certificate

### 3. Apache (Linux)

#### Paso 1: Build
```bash
npm install
npm run build
```

#### Paso 2: Configuración de Apache

**assets10.conf**:
```apache
<VirtualHost *:80>
    ServerName assets10.ejemplo.com
    DocumentRoot /var/www/assets10/dist
    
    <Directory /var/www/assets10/dist>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
        
        # SPA routing
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
    
    # Compression
    <IfModule mod_deflate.c>
        AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css
        AddOutputFilterByType DEFLATE application/javascript application/json
    </IfModule>
    
    # Cache control
    <IfModule mod_expires.c>
        ExpiresActive On
        ExpiresByType text/css "access plus 1 year"
        ExpiresByType application/javascript "access plus 1 year"
        ExpiresByType image/png "access plus 1 year"
        ExpiresByType image/jpg "access plus 1 year"
        ExpiresByType image/jpeg "access plus 1 year"
    </IfModule>
    
    ErrorLog ${APACHE_LOG_DIR}/assets10-error.log
    CustomLog ${APACHE_LOG_DIR}/assets10-access.log combined
</VirtualHost>
```

#### Paso 3: Deploy
```bash
# Copiar archivos
sudo cp -r dist/* /var/www/assets10/dist/

# Permisos
sudo chown -R www-data:www-data /var/www/assets10
sudo chmod -R 755 /var/www/assets10

# Habilitar sitio
sudo a2ensite assets10.conf
sudo a2enmod rewrite
sudo systemctl reload apache2

# SSL con Let's Encrypt (opcional)
sudo certbot --apache -d assets10.ejemplo.com
```

### 4. Nginx (Linux)

#### Configuración de Nginx

**assets10.conf**:
```nginx
server {
    listen 80;
    server_name assets10.ejemplo.com;
    root /var/www/assets10/dist;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
    
    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    access_log /var/log/nginx/assets10-access.log;
    error_log /var/log/nginx/assets10-error.log;
}
```

#### Deploy
```bash
# Copiar archivos
sudo cp -r dist/* /var/www/assets10/dist/

# Permisos
sudo chown -R nginx:nginx /var/www/assets10
sudo chmod -R 755 /var/www/assets10

# Habilitar sitio
sudo ln -s /etc/nginx/sites-available/assets10.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# SSL
sudo certbot --nginx -d assets10.ejemplo.com
```

### 5. Azure App Service

#### Paso 1: Preparar para Azure
```bash
npm install
npm run build
```

#### Paso 2: Crear App Service
```bash
# Azure CLI
az login
az group create --name assets10-rg --location eastus
az appservice plan create --name assets10-plan --resource-group assets10-rg --sku B1 --is-linux
az webapp create --name assets10-app --resource-group assets10-rg --plan assets10-plan --runtime "NODE|18-lts"
```

#### Paso 3: Deploy
```bash
# Opción 1: Azure CLI
az webapp up --name assets10-app --resource-group assets10-rg --location eastus

# Opción 2: GitHub Actions (ver más abajo)

# Opción 3: VS Code Azure Extension
# - Instalar Azure App Service extension
# - Right-click en dist/ > Deploy to Web App
```

#### Paso 4: Configurar
```bash
# Variables de entorno
az webapp config appsettings set --name assets10-app --resource-group assets10-rg --settings WEBSITE_NODE_DEFAULT_VERSION=18

# Custom domain y SSL
az webapp config hostname add --webapp-name assets10-app --resource-group assets10-rg --hostname assets10.ejemplo.com
```

### 6. AWS S3 + CloudFront

#### Paso 1: Build
```bash
npm install
npm run build
```

#### Paso 2: Crear Bucket S3
```bash
aws s3 mb s3://assets10-app
aws s3 website s3://assets10-app --index-document index.html --error-document index.html
```

#### Paso 3: Upload
```bash
aws s3 sync dist/ s3://assets10-app --delete --acl public-read
```

#### Paso 4: Configurar CloudFront
```bash
# Via AWS Console:
# - Create CloudFront distribution
# - Origin: assets10-app.s3.amazonaws.com
# - Viewer Protocol Policy: Redirect HTTP to HTTPS
# - Compress Objects Automatically: Yes
# - Default Root Object: index.html
# - Error Pages: 404 -> /index.html (for SPA routing)
```

#### Paso 5: Script de Deploy
```bash
#!/bin/bash
# deploy-aws.sh

npm install
npm run build
aws s3 sync dist/ s3://assets10-app --delete --acl public-read
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

### 7. Docker

#### Dockerfile
```dockerfile
# Build stage
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### nginx.conf para Docker
```nginx
server {
    listen 80;
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
```

#### Build y Run
```bash
# Build image
docker build -t assets10-app:latest .

# Run container
docker run -d -p 8080:80 --name assets10 assets10-app:latest

# Push to registry
docker tag assets10-app:latest myregistry.azurecr.io/assets10-app:latest
docker push myregistry.azurecr.io/assets10-app:latest
```

#### docker-compose.yml
```yaml
version: '3.8'
services:
  assets10:
    build: .
    ports:
      - "8080:80"
    restart: unless-stopped
    environment:
      - NODE_ENV=production
```

## 🔄 CI/CD

### GitHub Actions

**.github/workflows/deploy.yml**:
```yaml
name: Build and Deploy

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build
      run: npm run build
    
    - name: Deploy to Azure
      uses: azure/webapps-deploy@v2
      with:
        app-name: assets10-app
        publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
        package: ./dist
```

### Azure DevOps

**azure-pipelines.yml**:
```yaml
trigger:
- main

pool:
  vmImage: 'ubuntu-latest'

steps:
- task: NodeTool@0
  inputs:
    versionSpec: '18.x'
  displayName: 'Install Node.js'

- script: |
    npm ci
    npm run build
  displayName: 'npm install and build'

- task: AzureWebApp@1
  inputs:
    azureSubscription: 'Azure subscription'
    appName: 'assets10-app'
    package: '$(System.DefaultWorkingDirectory)/dist'
```

## 🔒 Seguridad en Producción

### 1. HTTPS
- Siempre usar HTTPS en producción
- Configurar redirección HTTP -> HTTPS
- Usar certificados válidos (Let's Encrypt gratis)

### 2. Headers de Seguridad
```
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.arcgis.com; style-src 'self' 'unsafe-inline' https://js.arcgis.com; img-src 'self' data: https:; connect-src 'self' https://geoserver.hanoit.com https://js.arcgis.com;
```

### 3. Variables de Entorno
- No incluir credenciales en el código
- Usar variables de entorno para configuración sensible
- Rotar secretos regularmente

## 📊 Monitoreo

### Application Insights (Azure)
```javascript
// Agregar a src/index.js
import { ApplicationInsights } from '@microsoft/applicationinsights-web';

const appInsights = new ApplicationInsights({
  config: {
    instrumentationKey: 'YOUR_KEY'
  }
});
appInsights.loadAppInsights();
appInsights.trackPageView();
```

### Google Analytics
```html
<!-- En public/index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

## ✅ Checklist de Deployment

- [ ] Build de producción completado sin errores
- [ ] Variables de entorno configuradas
- [ ] HTTPS habilitado
- [ ] Headers de seguridad configurados
- [ ] Compresión habilitada (gzip/brotli)
- [ ] Cache configurado para assets estáticos
- [ ] CDN configurado (opcional)
- [ ] Monitoreo configurado
- [ ] Logs configurados
- [ ] Backup strategy definida
- [ ] Rollback plan preparado
- [ ] Documentación actualizada
- [ ] Testing en producción completado

## 🆘 Troubleshooting

### Errores 404 en rutas
- Verificar configuración de SPA routing en servidor web
- Confirmar que index.html se sirve para todas las rutas

### Assets no cargan
- Verificar publicPath en webpack.config.js
- Confirmar CORS headers si GeoServer está en diferente dominio
- Revisar network tab en DevTools

### Performance issues
- Habilitar compresión en servidor
- Verificar cache headers
- Considerar CDN
- Revisar bundle sizes

## 📞 Soporte

Para problemas de deployment, contacta al equipo de DevOps o revisa la documentación específica de tu plataforma.

