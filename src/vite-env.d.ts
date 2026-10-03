/// <reference types="vite/client" />

interface ImportMetaEnv {
	/** URL base do backend que gera as URLs pré-assinadas do S3. */
	readonly VITE_API_URL: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
