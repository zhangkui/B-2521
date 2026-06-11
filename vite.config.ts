import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true, // 允许局域网/Docker 访问
    port: 5173, // 显式指定端口
    watch: {
      usePolling: true, // Windows Docker 必须开启轮询监听
    },
  },
});
