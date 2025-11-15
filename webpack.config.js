const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
  const isDevelopment = argv.mode === 'development';
  
  return {
    entry: './src/index.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isDevelopment ? '[name].js' : '[name].[contenthash].js',
      chunkFilename: isDevelopment ? '[name].chunk.js' : '[name].[contenthash].chunk.js',
      clean: true,
      publicPath: '/',
      // Ensure dynamic imports work properly with ArcGIS
      assetModuleFilename: 'assets/[hash][ext][query]',
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env', '@babel/preset-react'],
              cacheDirectory: true,
            },
          },
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
        {
          test: /\.(png|jpg|jpeg|gif|svg)$/i,
          type: 'asset/resource',
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
        },
      ],
    },
    resolve: {
      extensions: ['.js', '.jsx'],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './public/index.html',
        minify: isDevelopment ? false : {
          removeComments: true,
          collapseWhitespace: true,
          removeRedundantAttributes: true,
          useShortDoctype: true,
          removeEmptyAttributes: true,
          removeStyleLinkTypeAttributes: true,
          keepClosingSlash: true,
          minifyJS: true,
          minifyCSS: true,
          minifyURLs: true,
        },
      }),
    ],
    devServer: {
      static: {
        directory: path.join(__dirname, 'public'),
      },
      compress: true,
      port: 3000,
      hot: true,
      open: true,
      historyApiFallback: true,
      // Proxy to GeoServer to avoid CORS issues in development
      proxy: [
        {
          context: ['/geoserver'],
          target: 'https://geoserver.hanoit.com',
          changeOrigin: true,
          secure: false,
          logLevel: 'debug',
        }
      ],
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
      },
    },
    optimization: {
      runtimeChunk: isDevelopment ? false : {
        name: 'runtime',
      },
      splitChunks: isDevelopment ? {
        // Minimal splitting for development but allow dynamic imports
        chunks: 'async',
        minSize: 30000,
      } : {
        // Aggressive code splitting for production
        chunks: 'all',
        maxInitialRequests: 25,
        maxAsyncRequests: 25,
        minSize: 20000,
        cacheGroups: {
          // Core ArcGIS modules (Map, MapView, etc)
          arcgisCore: {
            test: /[\\/]node_modules[\\/]@arcgis[\\/]core[\\/](Map|views|layers)[\\/]/,
            name: 'arcgis-core',
            priority: 30,
            reuseExistingChunk: true,
          },
          // ArcGIS widgets - split into separate chunks
          arcgisWidgets: {
            test: /[\\/]node_modules[\\/]@arcgis[\\/]core[\\/]widgets[\\/]/,
            name(module) {
              // Create separate chunks for each widget
              const widgetName = module.context.match(/[\\/]widgets[\\/]([\w-]+)/);
              return widgetName ? `arcgis-widget-${widgetName[1]}` : 'arcgis-widgets';
            },
            priority: 25,
            reuseExistingChunk: true,
          },
          // Rest of ArcGIS modules
          arcgisVendor: {
            test: /[\\/]node_modules[\\/]@arcgis[\\/]/,
            name: 'arcgis-vendor',
            priority: 20,
            reuseExistingChunk: true,
          },
          // React and related libraries
          reactVendor: {
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
            name: 'react-vendor',
            priority: 15,
            reuseExistingChunk: true,
          },
          // Other vendor libraries
          defaultVendors: {
            test: /[\\/]node_modules[\\/](?!@arcgis|react)/,
            name: 'vendors',
            priority: 10,
            reuseExistingChunk: true,
          },
          // Common code shared across chunks
          common: {
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
            name: 'common',
          },
        },
      },
    },
    performance: {
      hints: isDevelopment ? false : 'warning',
      // Increase limits for ArcGIS SDK (it's a large library)
      maxEntrypointSize: 2500000, // 2.5 MB
      maxAssetSize: 15000000, // 15 MB (to accommodate ArcGIS chunks)
      // Only warn about assets that users download, not source maps
      assetFilter: function(assetFilename) {
        return !assetFilename.endsWith('.map');
      },
    },
    devtool: isDevelopment ? 'eval-source-map' : 'source-map',
  };
};
