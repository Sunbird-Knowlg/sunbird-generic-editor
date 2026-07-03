import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig(({ command }) => {
  if (command === 'serve') {
    /*
     * Dev harness. Content/action APIs are same-origin under /action — set
     * VITE_API_PROXY in .env.local to proxy them to a real backend, e.g.
     *   VITE_API_PROXY=https://dev.sunbirded.org
     */
    const apiProxy = process.env.VITE_API_PROXY;
    return {
      plugins: [react()],
      server: {
        port: 3002,
        proxy: apiProxy
          ? {
              '/action': { target: apiProxy, changeOrigin: true, secure: false },
            }
          : undefined,
      },
    };
  }

  return {
    plugins: [
      react(),
      dts({ include: ['src'], outDir: 'dist', rollupTypes: true }),
    ],
    build: {
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        name: 'SunbirdGenericEditor',
        formats: ['es', 'umd'],
        fileName: (format) => `sunbird-generic-editor.${format}.js`,
      },
      rollupOptions: {
        /* React provided by the host — keep a single React instance. This fork
           previews via the legacy ekstep renderer, so no player dependency. */
        external: ['react', 'react-dom', 'react/jsx-runtime'],
        output: {
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM',
            'react/jsx-runtime': 'jsxRuntime',
          },
          assetFileNames: 'sunbird-generic-editor[extname]',
        },
      },
      sourcemap: true,
      cssCodeSplit: false,
    },
  };
});
