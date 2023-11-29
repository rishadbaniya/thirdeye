import react from '@vitejs/plugin-react'
import {defineConfig} from 'vite'
import imagePresets, {widthPreset} from 'vite-plugin-image-presets'

export default defineConfig({
    plugins: [
        react(),
        imagePresets({
            thumbnail: widthPreset({
                class: 'img thumb',
                loading: 'lazy',
                widths: [48, 96],
                formats: {
                    webp: {quality: 50},
                    jpg: {quality: 70},
                },
            }),
        })
    ],
})

