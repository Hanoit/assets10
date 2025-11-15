import React, { useEffect, useRef, useState } from 'react';
// Lazy load ArcGIS modules to reduce initial bundle size
import config from './config';
import './App.css';

const App = () => {
	const mapRef = useRef(null);
	const viewRef = useRef(null);
	const featureTableRef = useRef(null);
	const featureTableContainerRef = useRef(null);
	const [mapView, setMapView] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [layersLoaded, setLayersLoaded] = useState(0);
	const [totalLayers] = useState(config.geoserver.layers.length);
	const [tableVisible, setTableVisible] = useState(false);
	const [tableMaximized, setTableMaximized] = useState(false);
	const [selectedLayerForTable, setSelectedLayerForTable] = useState('Direcciones');
	const [loadedLayersMap, setLoadedLayersMap] = useState({});
	const [tableLoading, setTableLoading] = useState(false);

	// Helper function to create WFS URL
	const createWFSUrl = (layerName) => {
		const params = new URLSearchParams({
			service: 'WFS',
			version: config.geoserver.wfs.version,
			request: 'GetFeature',
			typeName: `${config.geoserver.workspace}:${layerName}`,
			outputFormat: config.geoserver.wfs.outputFormat,
			srsName: config.geoserver.wfs.srsName
			// No maxFeatures - get ALL features from WFS
		});
		
		return `${config.geoserver.baseUrl}?${params.toString()}`;
	};

	// Helper function to create renderer for different geometry types
	const createRenderer = (color, outlineColor, layerName) => {
		// Special renderer for point layers (Direcciones)
		if (layerName === 'Direcciones') {
			return {
				type: 'simple',
				symbol: {
					type: 'simple-marker',
					color: [255, 0, 0, 1], // Rojo sólido
					size: 8, // Tamaño del punto en píxeles
					outline: {
						color: [255, 255, 255, 1], // Halo blanco
						width: 0.5 // Ancho del halo en píxeles
					}
				}
			};
		}
		
		// Special renderer for line layers (Vías Público, Soleras)
		if (layerName === 'Vías' || layerName === 'Soleras') {
			return {
				type: 'simple',
				symbol: {
					type: 'simple-line',
					color: outlineColor, // Usar el color de outline como color principal de la línea
					width: 2.5, // Ancho de la línea en píxeles
					style: 'solid' // Estilo: solid, dash, dot, dash-dot, dash-dot-dot
				}
			};
		}

		// Special categorized renderer for Zonas PRC based on Tipo_Zona
		if (layerName === 'Zonas PRC') {
			// Paleta de colores proporcionada + colores intermedios
			const zoneColors = {
				// Colores principales de la paleta
				'ZH': [84, 13, 110, 0.7],      // #540D6E - Morado oscuro
				'ZHR': [255, 210, 63, 0.7],     // #FFD23F - Amarillo
				'ZM': [14, 173, 105, 0.7],    // #0EAD69 - Verde
				'default': [180, 180, 180, 0.6] // Gris para desconocidos
			};

			return {
				type: 'unique-value',
				field: 'Tipo_Zona',
				defaultSymbol: {
					type: 'simple-fill',
					color: zoneColors['default'],
					outline: {
						color: [100, 100, 100, 1],
						width: 1
					}
				},
				uniqueValueInfos: Object.keys(zoneColors)
					.filter(key => key !== 'default')
					.map(tipoZona => ({
						value: tipoZona,
						symbol: {
							type: 'simple-fill',
							color: zoneColors[tipoZona],
							outline: {
								color: [80, 80, 80, 0.8],
								width: 1.5
							}
						},
						label: tipoZona
					}))
			};
		}
		
		// Default renderer for polygon layers
		return {
			type: 'simple',
			symbol: {
				type: 'simple-fill',
				color: color,
				outline: {
					color: outlineColor,
					width: 1.5
				}
			}
		};
	};

	useEffect(() => {
		const initializeMap = async () => {
			try {
				setLoading(true);
				setError(null);

				// Lazy load core ArcGIS modules
				const [
					{ default: Map },
					{ default: MapView },
					{ default: GeoJSONLayer },
				] = await Promise.all([
					import('@arcgis/core/Map'),
					import('@arcgis/core/views/MapView'),
					import('@arcgis/core/layers/GeoJSONLayer'),
				]);

				// Create map with configured default basemap
				const map = new Map({
					basemap: config.map.defaultBasemap
				});

				// Create view with configured coordinates
				const view = new MapView({
					container: mapRef.current,
					map: map,
					center: config.map.defaultCenter,
					zoom: config.map.defaultZoom,
					constraints: config.map.constraints
				});

				viewRef.current = view;
				setMapView(view);

				// Load all WFS layers from GeoServer
				const loadedLayers = [];
				let initialExtentLayer = null;
				Promise.all(config.geoserver.layers.map(async (layerConfig) => {
					try {
						const wfsUrl = createWFSUrl(layerConfig.name);
						console.log(`Loading layer: ${layerConfig.title} from ${wfsUrl}`);
						
						// Fetch GeoJSON completely to avoid generalization and field mapping issues
						let geojsonData = null;
						let blobUrl = null;
						
						try {
							console.log(`${layerConfig.title} - Fetching GeoJSON from: ${wfsUrl}`);
							const response = await fetch(wfsUrl);
							geojsonData = await response.json();
							
							console.log(`${layerConfig.title} - Total features fetched: ${geojsonData.features?.length || 0}`);
							
							if (geojsonData.features && geojsonData.features.length > 0) {
								const firstFeature = geojsonData.features[0];
								console.log(`${layerConfig.title} - Sample feature properties:`, firstFeature.properties);
							}
							
							// Create a Blob URL from the GeoJSON data to avoid re-fetching and simplification
							const blob = new Blob([JSON.stringify(geojsonData)], { type: 'application/json' });
							blobUrl = URL.createObjectURL(blob);
							
						} catch (error) {
							console.error(`Error fetching GeoJSON for ${layerConfig.title}:`, error);
							// Fallback to direct URL if fetch fails
							blobUrl = wfsUrl;
						}
						
						// Create GeoJSON layer from Blob URL (in-memory data)
						const geoJsonLayer = new GeoJSONLayer({
							url: blobUrl,
							title: layerConfig.title,
							copyright: 'GeoServer Assets10',
							renderer: createRenderer(layerConfig.color, layerConfig.outlineColor, layerConfig.title),
							popupTemplate: {
								title: layerConfig.title,
								// Temporary placeholder - will be updated after layer loads
								content: [{
									type: "fields",
									fieldInfos: [{
										fieldName: "*"
									}]
								}]
							},
							outFields: ['*'],
							visible: layerConfig.visible !== undefined ? layerConfig.visible : true,
							opacity: 0.7,
							minScale: layerConfig.minScale || 0,
							maxScale: layerConfig.maxScale || 0
						});

						// Wait for layer to load
						geoJsonLayer.load().then(() => {

							// Special logging for Zonas PRC to see unique Tipo_Zona values
							if (layerConfig.title === 'Zonas PRC' && geojsonData?.features) {
								const tiposZona = new Set();
								geojsonData.features.forEach(feature => {
									if (feature.properties?.Tipo_Zona) {
										tiposZona.add(feature.properties.Tipo_Zona);
									}
								});
								console.log(`🎨 Zonas PRC - Tipos de zona encontrados:`, Array.from(tiposZona).sort());
								console.log(`🎨 Total de tipos únicos: ${tiposZona.size}`);
							}
							
							// After loading, check fields and create proper popup
							console.log(`${layerConfig.title} - Layer loaded with ${geoJsonLayer.fields?.length || 0} fields`);
							
							if (geoJsonLayer.fields && geoJsonLayer.fields.length > 0) {
								console.log(`${layerConfig.title} - Available fields:`, geoJsonLayer.fields.map(f => f.name));
								
								// Get list of field names (excluding geometry and system fields)
								const displayFields = geoJsonLayer.fields
									.filter(field => {
										const name = field.name.toLowerCase();
										return name !== 'objectid' && 
													 name !== 'fid' && 
													 field.type !== 'geometry' &&
													 name !== 'shape';
									})
									.map(field => field.name);
								
								console.log(`${layerConfig.title} - Display fields:`, displayFields);
								
								// Update popup template with custom content function
								geoJsonLayer.popupTemplate = {
									title: layerConfig.title,
									content: (feature) => {
										const attrs = feature.graphic.attributes;
										console.log(`${layerConfig.title} - Popup attributes:`, attrs);
										
										if (!attrs || Object.keys(attrs).length === 0) {
											return '<p style="padding: 10px;">No hay atributos disponibles</p>';
										}
										
										let html = '<div style="max-height: 400px; overflow-y: auto; font-family: Arial, sans-serif;">';
										html += '<table style="width: 100%; border-collapse: collapse; font-size: 13px;">';
										
										// Iterate through display fields in order
										for (const fieldName of displayFields) {
											if (attrs.hasOwnProperty(fieldName)) {
												const value = attrs[fieldName];
												let displayValue = value;
												
												if (value === null || value === undefined) {
													displayValue = '<em style="color: #999;">sin valor</em>';
												} else if (value === '' || (typeof value === 'string' && value.trim() === '')) {
													displayValue = '<em style="color: #999;">vacío</em>';
												}
												
												html += `
													<tr style="border-bottom: 1px solid #e0e0e0;">
														<td style="padding: 8px 10px; font-weight: 600; color: #0079c1; width: 40%; vertical-align: top;">
															${fieldName}
														</td>
														<td style="padding: 8px 10px; color: #323232; vertical-align: top;">
															${displayValue}
														</td>
													</tr>
												`;
											}
										}
										
										// Also check for any attributes not in display fields
										for (const [key, value] of Object.entries(attrs)) {
											if (!displayFields.includes(key) && 
													key.toLowerCase() !== 'objectid' && 
													key.toLowerCase() !== 'fid' &&
													key.toLowerCase() !== 'shape') {
												let displayValue = value;
												if (value === null || value === undefined) {
													displayValue = '<em style="color: #999;">sin valor</em>';
												} else if (value === '' || (typeof value === 'string' && value.trim() === '')) {
													displayValue = '<em style="color: #999;">vacío</em>';
												}
												
												html += `
													<tr style="border-bottom: 1px solid #e0e0e0;">
														<td style="padding: 8px 10px; font-weight: 600; color: #d97706; width: 40%; vertical-align: top;">
															${key}
														</td>
														<td style="padding: 8px 10px; color: #323232; vertical-align: top;">
															${displayValue}
														</td>
													</tr>
												`;
											}
										}
										
										html += '</table></div>';
										return html;
									},
									outFields: ['*']
								};
								
								console.log(`${layerConfig.title} - Popup configured with ${displayFields.length} fields`);
							}
						});            
						
						map.add(geoJsonLayer);
						loadedLayers.push(geoJsonLayer);

						// Store layer in map for FeatureTable
						setLoadedLayersMap(prev => ({
							...prev,
							[layerConfig.title]: geoJsonLayer
						}));

						// Keep reference to layer for initial extent
						if (layerConfig.useForInitialExtent) {
							initialExtentLayer = geoJsonLayer;
						}

						setLayersLoaded(prev => prev + 1);
						console.log(`Successfully loaded layer: ${layerConfig.title}`);

					} catch (error) {
						console.error(`Error loading layer ${layerConfig.name}:`, error);
						const errorMsg = `${config.ui.errors.layerLoading} ${layerConfig.title}`;
						setError(prev => prev ? `${prev}\n${errorMsg}` : errorMsg);
					}
				}));

				// Set initial extent based on configured layer
				if (initialExtentLayer) {
					try {
						await initialExtentLayer.when();
						if (initialExtentLayer.fullExtent) {
							await view.goTo(initialExtentLayer.fullExtent.expand(1.2));
							console.log(`Zoomed to ${initialExtentLayer.title} extent`);
						}
					} catch (error) {
						console.error('Error zooming to initial extent:', error);
					}
				}

				// Lazy load widgets (only when needed)
				const [
					{ default: Home },
					{ default: Compass },
					{ default: Locate },
					{ default: Search },
					{ default: Expand },
					{ default: BasemapGallery },
					{ default: LayerList },
					{ default: Legend },
				] = await Promise.all([
					import('@arcgis/core/widgets/Home'),
					import('@arcgis/core/widgets/Compass'),
					import('@arcgis/core/widgets/Locate'),
					import('@arcgis/core/widgets/Search'),
					import('@arcgis/core/widgets/Expand'),
					import('@arcgis/core/widgets/BasemapGallery'),
					import('@arcgis/core/widgets/LayerList'),
					import('@arcgis/core/widgets/Legend'),
				]);

				// Add navigation widgets (top-left)
				// Note: Zoom widget is not needed - MapView includes it by default
				
				const homeWidget = new Home({
					view: view
				});
				view.ui.add(homeWidget, 'top-left');

				const compassWidget = new Compass({
					view: view
				});
				view.ui.add(compassWidget, 'top-left');

				// Add locate widget (top-left)
				const locateWidget = new Locate({
					view: view
				});
				view.ui.add(locateWidget, 'top-left');

				// Add search widget (top-right)
				const searchWidget = new Search({
					view: view,
					includeDefaultSources: true,
					popupEnabled: true,
					resultGraphicEnabled: true,
					locationEnabled: false, // Disable geolocation button for cleaner UI
					searchTerm: "",
					autoSelect: true, // Auto-select first suggestion
					maxSuggestions: 6,
					minSuggestCharacters: 2,
					// Remove submit button - search happens on selection only
					goToOverride: (view, goToParams) => {
						return view.goTo(goToParams.target, goToParams.options);
					}
				});
				
				// Add search widget to UI with expand for better mobile experience
				const searchExpand = new Expand({
					view: view,
					content: searchWidget,
					expandIconClass: 'esri-icon-search',
					expanded: false,
					expandTooltip: 'Buscar ubicación'
				});
				view.ui.add(searchExpand, 'top-right');

				// Add basemap gallery (top-right)
				// Uses default ArcGIS basemaps - most reliable option
				const basemapGallery = new BasemapGallery({
					view: view
					// Removed custom source - uses default Esri basemaps which always work
				});

				const bgExpand = new Expand({
					view: view,
					content: basemapGallery,
					expandIconClass: 'esri-icon-basemap',
					expanded: false
				});
				view.ui.add(bgExpand, 'top-right');

				// Add layer list widget (top-right) with actions
				const layerList = new LayerList({
					view: view,
					listItemCreatedFunction: (event) => {
						const item = event.item;

						// Add actions to the layer list items
						item.actionsSections = [
							[
								{
									title: "Zoom a la capa",
									className: "esri-icon-zoom-out-fixed",
									id: "zoom-to-layer"
								},
								{
									title: "Transparencia",
									className: "esri-icon-visible",
									id: "transparency"
								}
							]
						];
					}
				});

				// Handle layer list actions
				layerList.on("trigger-action", (event) => {
					const { action, item } = event;
					const layer = item.layer;

					if (action.id === "zoom-to-layer") {
						if (layer.fullExtent) {
							view.goTo(layer.fullExtent.expand(1.2)).catch((error) => {
								console.error('Error zooming to layer:', error);
							});
						}
					} else if (action.id === "transparency") {
						layer.opacity = layer.opacity === 1 ? 0.7 : 1;
					}
				});

				const layerListExpand = new Expand({
					view: view,
					content: layerList,
					expandIconClass: 'esri-icon-layer-list',
					expanded: false
				});
				view.ui.add(layerListExpand, 'top-right');

				setLoading(false);
				console.log('Map initialization complete');

				// Add legend widget (top-right)
				const legendWidget = new Legend({
					view: view
				});

				const legendExpand = new Expand({
					view: view,
					content: legendWidget,
					expandIconClass: 'esri-icon-legend',
					expanded: false
				});
				view.ui.add(legendExpand, 'top-right');
			} catch (error) {
				console.error('Error initializing map:', error);
				setError(config.ui.errors.mapInitialization);
				setLoading(false);
			}
		};

		initializeMap();

		return () => {
			if (viewRef.current) {
				viewRef.current.destroy();
			}
		};
	}, []);

	// Effect to create/update FeatureTable when layer selection changes
	useEffect(() => {
		console.log('FeatureTable effect triggered. Available layers:', Object.keys(loadedLayersMap));
		console.log('Selected layer:', selectedLayerForTable);
		console.log('Layer exists in map?', !!loadedLayersMap[selectedLayerForTable]);
		
		// Only create FeatureTable if table is visible
		if (!tableVisible || !mapView || !selectedLayerForTable || !loadedLayersMap[selectedLayerForTable]) {
			console.log('FeatureTable conditions not met:', {
				tableVisible,
				mapView: !!mapView,
				selectedLayerForTable,
				hasLayer: !!loadedLayersMap[selectedLayerForTable],
				availableLayers: Object.keys(loadedLayersMap)
			});
			setTableLoading(false);
			return;
		}

		// Flag to prevent stale state updates
		let isMounted = true;

		const initFeatureTable = async () => {
			try {
				console.log(`=== Starting FeatureTable initialization ===`);
				
				// Show loading indicator
				setTableLoading(true);
				
				// CRITICAL: Destroy existing FeatureTable COMPLETELY before creating new one
				if (featureTableRef.current) {
					console.log('Destroying existing FeatureTable...');
					
					// Remove watch handle first
					if (featureTableRef.current.watchHandle) {
						featureTableRef.current.watchHandle.remove();
					}
					
					// Destroy the ArcGIS widget
					featureTableRef.current.destroy();
					featureTableRef.current = null;
					
					console.log('✓ FeatureTable destroyed');
				}

				// CRITICAL: Always create a fresh container div
				// This prevents DOM corruption issues
				if (featureTableContainerRef.current) {
					// Clear everything from the container
					while (featureTableContainerRef.current.firstChild) {
						featureTableContainerRef.current.removeChild(featureTableContainerRef.current.firstChild);
					}
				}

				// Wait for cleanup
				await new Promise(resolve => setTimeout(resolve, 100));

				// Check if still mounted
				if (!isMounted || !featureTableContainerRef.current) {
					setTableLoading(false);
					return;
				}

				// Create a fresh div for FeatureTable
				const tableDiv = document.createElement('div');
				tableDiv.style.width = '100%';
				tableDiv.style.height = '100%';
				tableDiv.style.display = 'flex';
				tableDiv.style.flexDirection = 'column';
				featureTableContainerRef.current.appendChild(tableDiv);

				const selectedLayer = loadedLayersMap[selectedLayerForTable];
				
				if (!selectedLayer) {
					console.error(`❌ Layer not found in map: ${selectedLayerForTable}`);
					setTableLoading(false);
					return;
				}
				
				console.log(`Creating FeatureTable for: ${selectedLayerForTable}`);

				// Lazy load FeatureTable and reactiveUtils only when needed
				const [
					{ default: FeatureTable },
					reactiveUtils
				] = await Promise.all([
					import('@arcgis/core/widgets/FeatureTable'),
					import('@arcgis/core/core/reactiveUtils')
				]);

				// Check if still mounted
				if (!isMounted) {
					setTableLoading(false);
					return;
				}

				// Ensure layer is loaded
				await selectedLayer.when();
				await mapView.when();

				console.log(`✓ Layer ready with ${selectedLayer.fields?.length || 0} fields`);

				// Create FeatureTable in the fresh div
				console.log(`Creating FeatureTable widget for: ${selectedLayerForTable}`);
				const featureTable = new FeatureTable({
					view: mapView,
					layer: selectedLayer,
					container: tableDiv, // Use fresh div, not the ref directly
					visibleElements: {
						menuItems: {
							clearSelection: true,
							refreshData: true,
							toggleColumns: true,
							selectedRecordsShowAllToggle: true,
							selectedRecordsShowSelectedToggle: true,
							zoomToSelection: true
						}
					}
				});

				// Store reference
				featureTableRef.current = featureTable;

				// Wait for FeatureTable to be ready
				await featureTable.when();
				console.log(`✓ FeatureTable widget ready`);
				console.log(`  - ViewModel state: ${featureTable.viewModel.state}`);
				console.log(`  - Container has children:`, tableDiv.childElementCount);

				// Wait for rendering
				await new Promise(resolve => setTimeout(resolve, 500));

				if (!isMounted) {
					featureTable.destroy();
					setTableLoading(false);
					return;
				}
				
				console.log(`✓ FeatureTable created successfully for: ${selectedLayerForTable}`);
				console.log(`  - Final container children:`, tableDiv.childElementCount);
				console.log(`  - Final ViewModel state: ${featureTable.viewModel.state}`);

				// Watch for popup interaction
				const watchHandle = reactiveUtils.watch(
					() => mapView.popup?.selectedFeature,
					(selectedFeature) => {
						if (selectedFeature && mapView.popup.visible) {
							featureTable.highlightIds.removeAll();
							const objectId = selectedFeature.attributes.OBJECTID || 
								selectedFeature.attributes.__OBJECTID || 
								selectedFeature.attributes.FID;
							if (objectId) {
								featureTable.highlightIds.add(objectId);
							}
						}
					}
				);

				// Store watch handle for cleanup
				if (featureTableRef.current) {
					featureTableRef.current.watchHandle = watchHandle;
				}

				console.log('=== FeatureTable initialization complete ===');
				
				// Hide loading indicator
				setTableLoading(false);

			} catch (error) {
				console.error(`❌ Error creating FeatureTable for ${selectedLayerForTable}:`, error);
				setTableLoading(false);
			}
		};

		initFeatureTable();

		return () => {
			isMounted = false;
			
			if (featureTableRef.current) {
				console.log('Cleanup: Destroying FeatureTable...');
				
				// Remove watch handle
				if (featureTableRef.current.watchHandle) {
					featureTableRef.current.watchHandle.remove();
				}

				// Store container reference before destroying
				const container = featureTableRef.current.container;
				
				// Destroy the widget
				featureTableRef.current.destroy();
				featureTableRef.current = null;
				
				// Clear container to prevent React conflicts
				if (container) {
					while (container.firstChild) {
						container.removeChild(container.firstChild);
					}
				}
			}
		};
	}, [mapView, selectedLayerForTable, loadedLayersMap, tableVisible]);

	return (
		<div className="app">
			{/* Loading Overlay */}
			{loading && (
				<div className="loading-overlay">
					<div className="loading-content">
						<div className="spinner"></div>
						<h2>{config.ui.loading.title}</h2>
						<p>{config.ui.loading.description} {layersLoaded} de {totalLayers}</p>
					</div>
				</div>
			)}

			{/* Error Message */}
			{error && (
				<div className="error-banner">
					<div className="error-content">
						<span className="error-icon">⚠</span>
						<span>{error}</span>
						<button className="error-close" onClick={() => setError(null)}>×</button>
					</div>
				</div>
			)}

			{/* Map Container */}
			<div 
				ref={mapRef} 
				className="map-container" 
				style={{ 
					height: tableVisible 
						? tableMaximized 
							? 'calc(100% - 80vh)' 
							: 'calc(100% - 350px)' 
						: '100%' 
				}}
			></div>

			{/* Feature Table Toggle Button */}
			<button 
				className="feature-table-toggle"
				onClick={() => setTableVisible(!tableVisible)}
				title={tableVisible ? "Ocultar tabla" : "Mostrar tabla"}
			>
				<span className={`toggle-icon ${tableVisible ? 'open' : ''}`}>▲</span>
				<span className="toggle-text">Tabla de Atributos</span>
			</button>

			{/* Feature Table Container */}
			<div 
				className={`feature-table-container ${tableVisible ? 'visible' : ''} ${tableMaximized ? 'maximized' : ''}`}
				style={{
					height: tableMaximized ? '80vh' : '350px'
				}}
			>
				<div className="feature-table-header">
					<div className="feature-table-controls">
						<label htmlFor="layer-select">Capa:</label>
						<select 
							id="layer-select"
							value={selectedLayerForTable}
							onChange={(e) => {
								const newLayer = e.target.value;
								console.log(`Changing layer to: ${newLayer}`);
								// Simply update state - the useEffect will handle cleanup and recreation
								setSelectedLayerForTable(newLayer);
							}}
							className="layer-select"
						>
							{config.geoserver.layers.map(layer => (
								<option key={layer.name} value={layer.title}>
									{layer.title}
								</option>
							))}
						</select>
					</div>
					<div className="feature-table-actions">
						<button 
							className="maximize-table-btn"
							onClick={() => setTableMaximized(!tableMaximized)}
							title={tableMaximized ? "Minimizar tabla" : "Maximizar tabla"}
						>
							{tableMaximized ? '▼' : '▲'}
						</button>
						<button 
							className="close-table-btn"
							onClick={() => {
								// Simply close - the useEffect cleanup will handle destruction
								setTableVisible(false);
								setTableMaximized(false);
							}}
							title="Cerrar tabla"
						>
							✕
						</button>
					</div>
				</div>
				
				{/* Feature Table Content Wrapper - isolates loading from ArcGIS container */}
				<div className="feature-table-content-wrapper">
					{/* Loading indicator for table data - kept in DOM to avoid insert/remove issues */}
					<div className={`table-loading-overlay ${tableLoading ? 'visible' : ''}`}>
						<div className="table-loading-content">
							<div className="spinner"></div>
							<p>Cargando datos de {selectedLayerForTable}...</p>
						</div>
					</div>
					
					{/* ArcGIS FeatureTable Container - React never touches this, only ArcGIS */}
					<div 
						ref={featureTableContainerRef} 
						className="feature-table-content"
					></div>
				</div>
			</div>
		</div>
	);
};

export default App;