/// <reference types="vitest/config" />
import preact from '@preact/preset-vite'
import { defineConfig } from 'vite'

// `base` tiene que coincidir con el nombre del repositorio en GitHub Pages.
export default defineConfig({
  base: '/Dieta/',
  plugins: [preact()],
  test: {
    include: ['src/pruebas/**/*.test.ts'],
  },
})
