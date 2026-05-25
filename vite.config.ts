import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url && req.url.startsWith('/api/')) {
            let bodyData = '';
            req.on('data', (chunk) => {
              bodyData += chunk;
            });
            req.on('end', async () => {
              try {
                if (bodyData) {
                  req.body = JSON.parse(bodyData);
                }
              } catch (e) {
                req.body = {};
              }

              try {
                const urlPath = req.url!.split('?')[0];
                const modulePath = `.${urlPath}.ts`;
                const module = await server.ssrLoadModule(modulePath);
                
                // Compatibility helpers for express/vercel
                res.status = (code: number) => {
                  res.statusCode = code;
                  return res;
                };
                res.json = (data: any) => {
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(data));
                };

                if (module.default) {
                  await module.default(req, res);
                } else {
                  res.statusCode = 404;
                  res.end(JSON.stringify({ error: `Function not found in ${modulePath}` }));
                }
              } catch (err: any) {
                console.error("Vite API Dev Middleware Error:", err);
                res.statusCode = 500;
                res.end(JSON.stringify({ error: err.message || "API load error" }));
              }
            });
            return;
          }
          next();
        });
      },
    },
  };
});
