import basicSsl from "@vitejs/plugin-basic-ssl";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";

import { tanstackRouter } from "@tanstack/router-plugin/vite";

import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const config = defineConfig({
	resolve: { tsconfigPaths: true },
	plugins: [
		basicSsl(),
		devtools(),
		tailwindcss(),
		tanstackRouter({ target: "react", autoCodeSplitting: true }),
		viteReact(),
	],
	server: {
		port: 3000,
		proxy: {
			"/proxy/hanzii-word": {
				target: "https://api2.hanzii.net",
				changeOrigin: true,
				rewrite: (p) => p.replace(/^\/proxy\/hanzii-word/, ""),
			},
			"/proxy/hanzii-kanji": {
				target: "https://api2.hanzii.net",
				changeOrigin: true,
				rewrite: (p) => p.replace(/^\/proxy\/hanzii-kanji/, ""),
			},
			"/proxy/hanzii-suggest": {
				target: "https://suggest.hanzii.net",
				changeOrigin: true,
				rewrite: (p) => p.replace(/^\/proxy\/hanzii-suggest/, ""),
			},
			"/proxy/hanzii-chatgpt": {
				target: "https://api.hanzii.net",
				changeOrigin: true,
				rewrite: (p) => p.replace(/^\/proxy\/hanzii-chatgpt/, ""),
			},
		},
	},
});

export default config;
