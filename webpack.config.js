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
        // Full optimization for production
        chunks: 'all',
        cacheGroups: {
          arcgisVendor: {
            test: /[\\/]node_modules[\\/]@arcgis[\\/]/,
            name: 'arcgis-vendor',
            priority: 20,
          },
          defaultVendors: {
            test: /[\\/]node_modules[\\/](?!@arcgis)/,
            name: 'vendors',
            priority: 10,
          },
        },
      },
    },
    performance: {
      hints: isDevelopment ? false : 'warning',
      maxEntrypointSize: 512000,
      maxAssetSize: 512000,
    },
    devtool: isDevelopment ? 'eval-source-map' : 'source-map',
  };
};
