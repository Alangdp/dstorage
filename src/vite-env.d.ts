/// <reference types="vite/client" />

interface ImportMetaEnv {
	/** Base URL of the backend that issues the presigned S3 URLs. */
	readonly VITE_API_URL: string;
}

// biome-ignore lint/correctness/noUnusedVariables: Global interface
interface ImportMeta {
	readonly env: ImportMetaEnv;
}
