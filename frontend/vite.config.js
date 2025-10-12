import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import compression from 'vite-plugin-compression'
import path from 'path'

/**
 * Vite Configuration for Nexus Wallet Connect
 * Handles ordinals content properly for both development and production
 */
export default defineConfig(({ command }) => {
  const isDevMode = command === 'serve';
  
  return {
    root: __dirname,
    plugins: [
      viteSingleFile({ removeViteModuleLoader: true }),
      compression({ algorithm: 'gzip', ext: '.gz' }),
      compression({ algorithm: 'brotliCompress', ext: '.br' })
    ],
    server: {
      port: 5173,
      // Proxy /content requests to ordinals.com during development
      proxy: {
        '/content': {
          target: 'https://ordinals.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/content/, '/content'),
          secure: false,
        }
      },
      fs: {
        allow: [
          // Allow serving files from one level up to the project root
          '..',
        ]
      }
    },
    build: {
      outDir: path.resolve(__dirname, '../build/frontend'),
      emptyOutDir: true,
      rollupOptions: {
        input: path.resolve(__dirname, 'index.html'),
        external: [
          // Exclude React/ReactDOM - loaded externally via inscriptions
          'react',
          'react-dom',
          'react-dom/client',
          'react/jsx-runtime',
          // Exclude dev-only files from production bundle
          './dev-loader.js',
          './dev-loader.bundle.js',
          './core-wallet-dev.js'
        ],
        output: {
          globals: {
            'react': 'React',
            'react-dom': 'ReactDOM',
            'react-dom/client': 'ReactDOM'
          }
        }
      },
      target: 'es2015',
      cssCodeSplit: false,
      assetsInlineLimit: Infinity,
      minify: 'terser',
      terserOptions: {
        compress: {
          passes: 3,
          drop_console: true,
          drop_debugger: true
        },
        mangle: true,
        format: {
          comments: false
        }
      }
    },
    optimizeDeps: {
      include: ['react', 'react-dom']
    }
  }
})