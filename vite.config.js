import { defineConfig } from 'vite';

export default defineConfig({
    base: './',  // ← IMPORTANTE: usa caminhos relativos
    server: {
        port: 3000,
        open: true
    },
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        rollupOptions: {
            output: {
                manualChunks: undefined
            }
        }
    }
});