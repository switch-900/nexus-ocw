import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { promises as fs } from 'fs'
import path from 'path'
import { gzipSync, brotliCompressSync } from 'zlib'

// Inscription build plugin
function createInscriptionBuild() {
  return {
    name: 'create-inscription',
    enforce: 'post',
    async closeBundle() {
      try {
        const buildDir = path.resolve(process.cwd(), 'build')
        const builtFiles = await fs.readdir(buildDir)
        const jsFile = builtFiles.find(file => file.endsWith('.js'))
        
        if (!jsFile) {
          throw new Error('No JavaScript build file found')
        }
        
        const coreScript = await fs.readFile(path.join(buildDir, jsFile), 'utf-8')
        
        // Create compressed versions
        const brotliCompressed = brotliCompressSync(coreScript)
        const gzipCompressed = gzipSync(coreScript)
        
        // Calculate sizes
        const coreSize = coreScript.length
        const brotliSize = brotliCompressed.length
        const gzipSize = gzipCompressed.length
        
        // Save inscription files
        await fs.writeFile(path.join(buildDir, 'inscription.br'), brotliCompressed)
        await fs.writeFile(path.join(buildDir, 'inscription.gz'), gzipCompressed)
        
        console.log('\n🎯 NexusWalletConnect Inscription Ready:')
        console.log(`  📦 inscription.br - ${(brotliSize/1024).toFixed(2)}KB (for Bitcoin inscription)`)
        console.log(`  📄 ${jsFile} - ${(coreSize/1024).toFixed(1)}KB (human readable)`)
        console.log(`  📊 Compression: ${(((coreSize-brotliSize)/coreSize)*100).toFixed(1)}% reduction`)
        console.log(`\n💡 Usage: <script src="/content/INSCRIPTION_ID"></script>`)

      } catch (error) {
        console.error('❌ Inscription build error:', error)
        throw error
      }
    }
  }
}

export default defineConfig(({ command, mode }) => {
  const isCoreMode = process.env.BUILD_MODE === 'core'
  
  return {
    plugins: [
      viteSingleFile(),
      ...(isCoreMode ? [createInscriptionBuild()] : [])
    ],
    build: {
      rollupOptions: {
        input: isCoreMode ? 'core-inscription.js' : 'main.js',
        output: {
          format: 'iife',
          inlineDynamicImports: true,
          entryFileNames: isCoreMode ? 'core-script.js' : '[name].js',
          manualChunks: undefined
        }
      },
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          passes: 3,
          unsafe: true
        },
        mangle: {
          toplevel: true
        },
        format: {
          comments: false
        }
      },
      target: 'es2015',
      outDir: 'build'
    }
  }
})
