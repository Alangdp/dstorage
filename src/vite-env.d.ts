/// <reference types="vite/client" />

interface ImportMetaEnv {
	/** Base URL of the backend that issues the presigned S3 URLs. */
	readonly VITE_API_URL: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
