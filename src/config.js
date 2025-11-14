/**
 * Configuration file for the ArcGIS React application
 * Centralized configuration for easy customization and deployment
 */

export const config = {
  // GeoServer Configuration
  geoserver: {
    // Use proxy in development to avoid CORS, direct URL in production
    baseUrl: process.env.NODE_ENV === 'production' 
      ? 'https://geoserver.hanoit.com/geoserver/assets10/ows'
      : '/geoserver/assets10/ows', // Proxy route in development
    workspace: 'assets10',
    
    // WFS Configuration
    wfs: {
      version: '1.0.0',
      outputFormat: 'application/json',
      srsName: 'EPSG:4326', // WGS84 for better compatibility with ArcGIS
      // No maxFeatures limit - get ALL features from WFS
    },

    // Layer Definitions
    layers: [
      {
        name: 'Zonas_PRC',
        title: 'Zonas PRC',
        color: [255, 0, 0, 0.6],
        outlineColor: [255, 0, 0, 1],
        visible: true,
        minScale: 0,      // Siempre visible cuando alejado (nivel región)
        maxScale: 0,  // Se oculta cuando acercas más de 1:50,000
      },
      {
        name: 'Areas_Loteos',
        title: 'Áreas Por Loteos',
        color: [255, 127, 0, 0.6],
        outlineColor: [255, 127, 0, 1],
        visible: true,
        minScale: 50000, // Visible hasta nivel barrios/localidades (1:50,000)
        maxScale: 0,     // Sin límite de acercamiento
      },
      {
        name: 'Direcciones',
        title: 'Direcciones',
        color: [0, 112, 255, 0.6],
        outlineColor: [0, 112, 255, 1],
        visible: true,
        minScale: 10000, // Visible solo a nivel calles (1:10,000)
        maxScale: 0,     // Sin límite de acercamiento
        useForInitialExtent: true, // Use this layer's extent for initial map view
      },
      {
        name: 'Predios',
        title: 'Predios',
        color: [115, 178, 115, 0],
        outlineColor: [115, 178, 115, 1],
        visible: true,
        minScale: 10000, // Visible hasta nivel barrios/localidades (1:50,000)
        maxScale: 0,     // Sin límite de acercamiento
      },
      {
        name: 'Vías',
        title: 'Vías',
        color: [178, 102, 255, 0.6],
        outlineColor: [178, 102, 255, 1],
        visible: true,
        minScale: 10000, // Visible solo a nivel calles (1:10,000)
        maxScale: 0,     // Sin límite de acercamiento
      },
      {
        name: 'Soleras',
        title: 'Soleras',
        color: [255, 170, 0, 0.6],
        outlineColor: [255, 170, 0, 1],
        visible: true,
        minScale: 50000, // Visible hasta nivel barrios/localidades (1:50,000)
        maxScale: 0,     // Sin límite de acercamiento
      },     
    ],
  },

  // Map Configuration
  map: {
    // Default center (Temuco, Chile)
    defaultCenter: [-72.6, -38.7],
    defaultZoom: 13,
    
    // Map constraints
    constraints: {
      minZoom: 10,
      maxZoom: 20,
    },

    // Default basemap
    defaultBasemap: 'topo-vector', // Options: 'hybrid', 'satellite', 'streets', 'topo-vector', 'gray-vector', 'dark-gray-vector'
    
    // Widget positions
    widgets: {
      zoom: { position: 'top-left' },
      home: { position: 'top-left' },
      compass: { position: 'top-left' },
      navigationToggle: { position: 'top-left' },
      locate: { position: 'top-left' },
      search: { position: 'top-right' },
      basemapGallery: { position: 'top-right' },
      layerList: { position: 'top-right' },
    },
  },

  // UI Configuration
  ui: {
    // Loading messages
    loading: {
      title: 'Cargando Mapa...',
      description: 'Cargando capas:',
    },
    
    // Error messages
    errors: {
      mapInitialization: 'Error al inicializar el mapa. Por favor, recarga la página.',
      layerLoading: 'Error cargando',
    },
  },

  // Performance Configuration
  performance: {
    enableClustering: false, // Enable clustering for large datasets
    clusterRadius: 50,
    enableLabeling: true,
    simplifyGeometry: false,
  },

  // Feature Configuration
  features: {
    enablePopups: true,
    enableSelection: true,
    enableHighlight: true,
    popupMaxHeight: 300,
  },

  // ASP.NET Core Integration Settings
  aspnetCore: {
    // Set to true when integrating with ASP.NET Core
    enabled: false,
    // Base path for static assets in ASP.NET Core (e.g., '/wwwroot/dist/')
    staticAssetsPath: '/dist/',
    // API endpoint prefix (if using ASP.NET Core as API backend)
    apiBaseUrl: '',
  },
};

export default config;

