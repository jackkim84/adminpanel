import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // 리액트 플러그인 장착
  plugins: [react()],
  
  build: {
    // 1. 내장 초고속 압축 엔진(esbuild) 활성화
    minify: 'esbuild', 
    
    rollupOptions: {
      output: {
        // 2. 무거운 외부 라이브러리들을 잘게 쪼개어 번들 용량을 경량화하는 표준 로직입니다.
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
});