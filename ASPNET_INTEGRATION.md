# Integración con ASP.NET Core

Esta guía explica cómo integrar el visor de mapas React con ASP.NET Core usando Razor Pages o MVC.

## 📋 Requisitos

- ASP.NET Core 6.0 o superior
- Visual Studio 2022 o VS Code
- Node.js (para build del frontend)

## 🎯 Estrategia de Integración

Existen dos enfoques principales:

### Opción 1: Frontend Integrado (Recomendado)
El frontend React se construye y se sirve directamente desde ASP.NET Core.

### Opción 2: Frontend Separado
React y ASP.NET Core corren como aplicaciones separadas (SPA con API).

Esta guía se enfoca en la **Opción 1** según los requerimientos del usuario.

## 🚀 Pasos de Integración

### 1. Estructura del Proyecto ASP.NET Core

```
MiProyecto/
├── ClientApp/              # Aplicación React (este proyecto)
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── webpack.config.js
├── Controllers/
├── Views/
│   └── Mapa/
│       └── Index.cshtml     # Vista Razor para el mapa
├── wwwroot/
│   └── dist/               # Build de React (generado)
├── Program.cs
└── MiProyecto.csproj
```

### 2. Configuración del Frontend

#### 2.1. Actualizar `webpack.config.js`

Ya está configurado, pero verifica el `publicPath`:

```javascript
output: {
  path: path.resolve(__dirname, 'dist'),
  filename: isDevelopment ? 'bundle.js' : 'bundle.[contenthash].js',
  clean: true,
  publicPath: '/dist/', // Ruta desde wwwroot
}
```

#### 2.2. Actualizar `src/config.js`

```javascript
aspnetCore: {
  enabled: true,
  staticAssetsPath: '/dist/',
  apiBaseUrl: '' // Si usas APIs de ASP.NET Core
}
```

#### 2.3. Agregar script de build para ASP.NET Core

Edita `package.json`:

```json
{
  "scripts": {
    "start": "webpack serve --mode development --open",
    "build": "webpack --mode production",
    "build:aspnet": "webpack --mode production && xcopy dist ..\\wwwroot\\dist /E /Y /I",
    "dev": "webpack --mode development"
  }
}
```

Para Linux/Mac:
```json
"build:aspnet": "webpack --mode production && cp -r dist ../wwwroot/dist"
```

### 3. Configuración de ASP.NET Core

#### 3.1. Actualizar `Program.cs`

```csharp
var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllersWithViews();
builder.Services.AddRazorPages();

var app = builder.Build();

// Configure the HTTP request pipeline
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles(); // Importante: sirve archivos de wwwroot

app.UseRouting();
app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.MapRazorPages();

app.Run();
```

#### 3.2. Crear Controller

`Controllers/MapaController.cs`:

```csharp
using Microsoft.AspNetCore.Mvc;

namespace MiProyecto.Controllers
{
    public class MapaController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
```

#### 3.3. Crear Vista Razor

`Views/Mapa/Index.cshtml`:

```cshtml
@{
    ViewData["Title"] = "Mapa de Assets";
    Layout = null; // Sin layout para fullscreen, o usa tu layout
}

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="description" content="Sistema de visualización geográfica con ArcGIS y GeoServer">
    <title>@ViewData["Title"]</title>
    
    <!-- ArcGIS CSS -->
    <link rel="stylesheet" href="https://js.arcgis.com/4.28/@arcgis/core/assets/esri/themes/light/main.css">
    
    <!-- Estilos del bundle (inline en el JS con style-loader) -->
    
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Avenir Next', 'Helvetica Neue', Arial, sans-serif;
        }
        #root {
            height: 100vh;
            width: 100vw;
        }
    </style>
</head>
<body>
    <div id="root">
        <!-- Fallback loading indicator -->
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
            <div style="width: 40px; height: 40px; margin: 0 auto 1rem; border: 4px solid #f3f3f3; border-top: 4px solid #0079c1; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <p>Cargando aplicación...</p>
        </div>
    </div>
    
    <!-- React App Bundle -->
    <script src="~/dist/vendors.js" asp-append-version="true"></script>
    <script src="~/dist/arcgis.js" asp-append-version="true"></script>
    <script src="~/dist/bundle.js" asp-append-version="true"></script>
</body>
</html>

<style>
@@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
</style>
```

### 4. Proceso de Build e Integración

#### 4.1. Desarrollo

Durante el desarrollo, puedes trabajar de dos maneras:

**Opción A: Desarrollo independiente**
```bash
cd ClientApp
npm start
```
Trabaja en `http://localhost:3000`

**Opción B: Desarrollo integrado**
1. Build manual del frontend:
```bash
cd ClientApp
npm run build:aspnet
```

2. Ejecuta ASP.NET Core desde Visual Studio o:
```bash
dotnet run
```

3. Accede a `https://localhost:7xxx/Mapa`

#### 4.2. Producción

##### Paso 1: Build del Frontend
```bash
cd ClientApp
npm run build:aspnet
```

Esto genera:
- `wwwroot/dist/index.html`
- `wwwroot/dist/bundle.[hash].js`
- `wwwroot/dist/vendors.[hash].js`
- `wwwroot/dist/arcgis.[hash].js`

##### Paso 2: Publicar ASP.NET Core
```bash
dotnet publish -c Release -o ./publish
```

##### Paso 3: Desplegar
Despliega el contenido de `./publish` a tu servidor (IIS, Azure, etc.)

### 5. Automatización con MSBuild

Para automatizar el build del frontend, edita tu `.csproj`:

```xml
<Project Sdk="Microsoft.NET.Sdk.Web">
  
  <PropertyGroup>
    <TargetFramework>net6.0</TargetFramework>
    <SpaRoot>ClientApp\</SpaRoot>
  </PropertyGroup>

  <ItemGroup>
    <!-- Incluir archivos del frontend en el proyecto -->
    <Content Remove="$(SpaRoot)**" />
    <None Remove="$(SpaRoot)**" />
    <None Include="$(SpaRoot)**" Exclude="$(SpaRoot)node_modules\**" />
  </ItemGroup>

  <Target Name="BuildFrontend" BeforeTargets="Build" Condition="'$(Configuration)' == 'Release'">
    <Message Importance="high" Text="Building React frontend..." />
    <Exec WorkingDirectory="$(SpaRoot)" Command="npm install" />
    <Exec WorkingDirectory="$(SpaRoot)" Command="npm run build:aspnet" />
  </Target>

</Project>
```

Ahora, al hacer `dotnet build -c Release`, el frontend se construirá automáticamente.

### 6. Configuración de IIS (Producción)

#### 6.1. web.config

Asegúrate de tener un `web.config` apropiado:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <location path="." inheritInChildApplications="false">
    <system.webServer>
      <handlers>
        <add name="aspNetCore" path="*" verb="*" modules="AspNetCoreModuleV2" resourceType="Unspecified" />
      </handlers>
      <aspNetCore processPath="dotnet" 
                  arguments=".\MiProyecto.dll" 
                  stdoutLogEnabled="false" 
                  stdoutLogFile=".\logs\stdout" 
                  hostingModel="inprocess" />
      
      <!-- Cache static files -->
      <staticContent>
        <clientCache cacheControlMode="UseMaxAge" cacheControlMaxAge="7.00:00:00" />
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
    </system.webServer>
  </location>
</configuration>
```

### 7. Integración con Layout Razor (Opcional)

Si quieres incluir el mapa dentro de tu layout existente:

`Views/Mapa/Index.cshtml`:

```cshtml
@{
    ViewData["Title"] = "Mapa de Assets";
    Layout = "_Layout"; // Tu layout principal
}

<!-- ArcGIS CSS en el head -->
@section Styles {
    <link rel="stylesheet" href="https://js.arcgis.com/4.28/@arcgis/core/assets/esri/themes/light/main.css">
}

<!-- Contenedor del mapa -->
<div id="root" style="height: calc(100vh - 100px); width: 100%;"></div>

@section Scripts {
    <script src="~/dist/vendors.js" asp-append-version="true"></script>
    <script src="~/dist/arcgis.js" asp-append-version="true"></script>
    <script src="~/dist/bundle.js" asp-append-version="true"></script>
}
```

### 8. API Backend (Opcional)

Si necesitas crear APIs en ASP.NET Core para complementar el frontend:

```csharp
[ApiController]
[Route("api/[controller]")]
public class MapDataController : ControllerBase
{
    [HttpGet("layers")]
    public IActionResult GetLayers()
    {
        var layers = new[]
        {
            new { name = "Areas_Por_Loteos", visible = true },
            new { name = "Direcciones", visible = true },
            // ... más capas
        };
        return Ok(layers);
    }
}
```

Actualiza `src/config.js`:
```javascript
aspnetCore: {
  enabled: true,
  apiBaseUrl: '/api'
}
```

### 9. Debugging en Visual Studio

#### 9.1. Configurar `launchSettings.json`

```json
{
  "profiles": {
    "MiProyecto": {
      "commandName": "Project",
      "dotnetRunMessages": true,
      "launchBrowser": true,
      "launchUrl": "Mapa",
      "applicationUrl": "https://localhost:7001;http://localhost:5000",
      "environmentVariables": {
        "ASPNETCORE_ENVIRONMENT": "Development"
      }
    }
  }
}
```

### 10. CORS (Si usas APIs)

Si el frontend necesita llamar a APIs:

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        builder => builder
            .WithOrigins("http://localhost:3000") // Dev server de React
            .AllowAnyMethod()
            .AllowAnyHeader());
});

// ...

app.UseCors("AllowReactApp");
```

## 🎯 Checklist de Integración

- [ ] Frontend construido con `npm run build:aspnet`
- [ ] Archivos copiados a `wwwroot/dist/`
- [ ] Controller y Vista Razor creados
- [ ] ArcGIS CSS incluido en la vista
- [ ] Scripts referenciados correctamente con `asp-append-version`
- [ ] `UseStaticFiles()` configurado en Program.cs
- [ ] Ruta accesible (ej: `/Mapa`)
- [ ] Testing en navegador
- [ ] Build de producción funcional

## 🐛 Troubleshooting

### Archivos estáticos no se sirven
- Verifica que `app.UseStaticFiles()` esté en Program.cs
- Confirma que los archivos estén en `wwwroot/dist/`
- Revisa permisos de carpetas

### Bundle no se encuentra
- Verifica las rutas en la vista Razor
- Usa `asp-append-version="true"` para cache busting
- Confirma que el publicPath en webpack sea correcto

### Errores 404 en producción
- Asegúrate de que los archivos del dist estén incluidos en la publicación
- Revisa el web.config
- Confirma configuración de IIS

## 📚 Referencias

- [ASP.NET Core Static Files](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/static-files)
- [ArcGIS JS API](https://developers.arcgis.com/javascript/latest/)
- [Webpack Documentation](https://webpack.js.org/)

## ✅ Resultado Final

Después de seguir esta guía, tendrás:
- ✅ Frontend React integrado nativamente con ASP.NET Core
- ✅ Build automático en producción
- ✅ Archivos estáticos servidos eficientemente
- ✅ Vista Razor con el mapa completamente funcional
- ✅ Sin necesidad de servidores separados

