import path from "node:path"
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { GET as getSong } from "./api/song/[cid].ts"

// Dev stand-in for the Vercel function: runs the same handler, so dev and production
// return the same JSON shape.
function songApi(): Plugin {
  return {
    name: "song-api",
    configureServer(server) {
      server.middlewares.use("/api/song/", async (req, res) => {
        const response = await getSong(new Request(`http://localhost${req.originalUrl ?? req.url}`))
        res.statusCode = response.status
        response.headers.forEach((value, key) => res.setHeader(key, value))
        res.end(await response.text())
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    songApi(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
