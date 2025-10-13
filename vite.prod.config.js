import { defineConfig } from 'vite'
import path from 'path'

/**
 * Custom plugin to preserve inscription loader scripts in HTML
 * Prevents Vite from processing scripts that load from inscriptions
 */
function preserveInscriptionScripts() {
  return {
    name: 'preserve-inscription-scripts',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        // Restore the inscription loader script that Vite removes
        // This script loads NexusWalletConnect from an inscription
        const loaderScript = `
  <script type="module">
    // TODO: Replace TODO-LOADER-SAT with your 12-loader.js SAT number after inscribing
    import NWC from '/r/sat/TODO-LOADER-SAT/at/-1/content';
    window.NexusWalletConnect = NWC;
    console.log('✅ NexusWalletConnect loaded from inscription');
  </script>`;
        
        // Insert before the Vite-injected main script
        html = html.replace(
          /<script type="module" crossorigin src="\/main\.js"><\/script>/,
          loaderScript + '\n  <script type="module" crossorigin src="/main.js"></script>'
        );
        
        return html;
      }
    }
  };
}

/**
 * Vite Production Build Configuration
 * 
 * Builds frontend app with SEPARATE inscriptions:
 * 1. index.html - Main HTML (references loader + main.js SATs)
 * 2. main.js - Bundled React app
 * 3. styles.css - Bundled styles (optional, can inline)
 * 
 * This allows updating the app without re-inscribing everything
 */
export default defineConfig({
  root: path.resolve(__dirname, 'frontend'),
  
  plugins: [preserveInscriptionScripts()],
  
  build: {
    outDir: path.resolve(__dirname, 'dist-production'),
    emptyOutDir: true,
    
    rollupOptions: {
      input: path.resolve(__dirname, 'frontend/index.prod.html'),
      
      // External dependencies loaded from inscriptions
      external: [
        'react',
        'react-dom',
        'react-dom/client',
        'react/jsx-runtime',
        // Inscription paths (will be loaded at runtime)
        /^\/r\/sat\//,
        /^\/content\//
      ],
      
      output: {
        // Configure how external modules are accessed
        globals: {
          'react': 'React',
          'react-dom': 'ReactDOM',
          'react-dom/client': 'ReactDOM',
          'react/jsx-runtime': 'React'
        },
        
        // SEPARATE files for modular inscriptions
        inlineDynamicImports: false,
        
        // Asset naming - simple names for easy inscription
        entryFileNames: 'main.js',
        chunkFileNames: 'chunk-[name].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name.endsWith('.css')) {
            return 'styles.css';
          }
          return '[name].[ext]';
        },
        
        // Don't mangle exports so they can be imported
        manualChunks: undefined
      }
    },
    
    // Target modern browsers
    target: 'es2020',
    
    // Don't inline - we want separate files
    assetsInlineLimit: 0,
    
    // Extract CSS to separate file
    cssCodeSplit: false,
    
    // Minification settings
    minify: 'terser',
    terserOptions: {
      compress: {
        passes: 3,
        drop_console: false, // Keep console for debugging
        drop_debugger: true,
        pure_funcs: ['console.debug']
      },
      mangle: {
        safari10: true
      },
      format: {
        comments: false
      }
    },
    
    // Source maps for debugging (optional)
    sourcemap: false,
    
    // Report compressed size
    reportCompressedSize: true,
    
    // Chunk size warnings
    chunkSizeWarningLimit: 1000
  },
  
  // Don't optimize deps since they're external
  optimizeDeps: {
    exclude: ['react', 'react-dom']
  },
  
  // Define global constants
  define: {
    'process.env.NODE_ENV': '"production"',
    '__DEV__': false
  }
})
