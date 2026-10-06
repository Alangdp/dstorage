/**
 * English catalog. It is the source of truth: every other language must define
 * exactly the same keys (enforced by the {@link Messages} type).
 *
 * Placeholders use `{name}` and are filled in by `t(key, { name })`.
 */
export const en = {
	"common.back": "Back",
	"common.cancel": "Cancel",
	"common.save": "Save",
	"common.close": "Close",

	"header.themeLight": "Light theme",
	"header.themeDark": "Dark theme",
	"header.settings": "Settings",
	"header.login": "Sign in",
	"header.account": "Account ({name})",

	"login.title": "Sign in",
	"login.email": "Email",
	"login.password": "Password",
	"login.submit": "Sign in",
	"login.submitting": "Signing in...",
	"login.errorCredentials": "Incorrect email or password.",
	"login.errorFallback": "Could not sign in.",

	"account.title": "Account",
	"account.signedInAs": "Signed in as",
	"account.logout": "Sign out",

	"dropzone.title": "Drop files here",
	"dropzone.hint": "Upload starts automatically",

	"settings.title": "Settings",
	"settings.linkHours": "Link validity (hours)",
	"settings.language": "Language",
	"settings.languageSystem": "System",
	"settings.languageEn": "English",
	"settings.languagePt": "Português",
	"settings.autostart": "Start with the system",
	"settings.autostartHint":
		"Opens dstorage when the computer starts, in the tray only.",
	"settings.autostartDev":
		"Unavailable in development builds: they need the dev server running.",
	"settings.errorHours": "Enter a whole number from {min} to {max} hours.",
	"settings.errorSave": "Could not save the settings on this computer.",
	"settings.errorAutostart": "Could not change the start-with-system option.",
	"settings.shortcut": "Global shortcut",
	"settings.shortcutHint":
		"Opens or hides dstorage from any program. Click the field and press the keys. It may not work on some Linux desktops.",
	"settings.shortcutPress": "Press the keys…",
	"settings.shortcutOff": "Off",
	"settings.shortcutClear": "Turn off",
	"settings.errorShortcut":
		"Could not use {shortcut}. Another program may already be using it.",

	"list.filterAll": "All",
	"list.filterActive": "Active",
	"list.filterExpired": "Expired",
	"list.filterFailed": "Failed",
	"list.empty": "No items in this tab.",
	"list.queued": "Queued",
	"list.canceled": "Canceled",
	"list.errorFallback": "Upload failed",
	"list.generatingLink": "Uploaded · generating link...",
	"list.fileDeleted": "File removed from S3",
	"list.linkExpired": "Link expired",
	"list.linkValidUntil": "Link valid until {date}",
	"list.copied": "copied",
	"list.fileDeletedAt": "file deleted ~{date}",
	"list.actionRegenerate": "Generate a new link and copy",
	"list.actionCopied": "Link copied",
	"list.actionCopy": "Copy link",
	"list.actionCancel": "Cancel {name}",
	"list.actionRemove": "Remove from history",

	"history.title": "History",
	"history.viewAll": "View full history ({count})",

	"notify.uploadDone": "Upload complete",
	"notify.uploadFailed": "Upload failed",

	"tray.open": "Open",
	"tray.quit": "Quit",
	"tray.uploading": "dstorage — uploading ({filled}/{total})",

	"error.partNetwork":
		"Network failure while sending a part to S3 (check the bucket CORS and region)",
	"error.noEtag": "S3 did not return an ETag (check the bucket CORS)",
	"error.fileGone": "The file no longer exists on S3",
	"error.interrupted": "Upload interrupted when the app was closed",
} as const;

/** Every translatable string key. */
export type MessageKey = keyof typeof en;

/** A full catalog for one language. */
export type Messages = Record<MessageKey, string>;

/** Portuguese (Brazil) catalog. */
export const pt: Messages = {
	"common.back": "Voltar",
	"common.cancel": "Cancelar",
	"common.save": "Salvar",
	"common.close": "Fechar",

	"header.themeLight": "Tema claro",
	"header.themeDark": "Tema escuro",
	"header.settings": "Configurações",
	"header.login": "Entrar",
	"header.account": "Conta ({name})",

	"login.title": "Entrar",
	"login.email": "E-mail",
	"login.password": "Senha",
	"login.submit": "Entrar",
	"login.submitting": "Entrando...",
	"login.errorCredentials": "E-mail ou senha incorretos.",
	"login.errorFallback": "Não foi possível entrar.",

	"account.title": "Conta",
	"account.signedInAs": "Conectado como",
	"account.logout": "Sair da conta",

	"dropzone.title": "Arraste arquivos aqui",
	"dropzone.hint": "O envio começa automaticamente",

	"settings.title": "Configurações",
	"settings.linkHours": "Validade do link (horas)",
	"settings.language": "Idioma",
	"settings.languageSystem": "Sistema",
	"settings.languageEn": "English",
	"settings.languagePt": "Português",
	"settings.autostart": "Iniciar com o sistema",
	"settings.autostartHint":
		"Abre o dstorage ao ligar o computador, somente na bandeja.",
	"settings.autostartDev":
		"Indisponível em builds de desenvolvimento: elas precisam do servidor de dev rodando.",
	"settings.errorHours": "Informe um número inteiro de {min} a {max} horas.",
	"settings.errorSave":
		"Não foi possível salvar as configurações neste computador.",
	"settings.errorAutostart":
		"Não foi possível alterar a inicialização com o sistema.",
	"settings.shortcut": "Atalho global",
	"settings.shortcutHint":
		"Abre ou esconde o dstorage a partir de qualquer programa. Clique no campo e pressione as teclas. Pode não funcionar em alguns desktops Linux.",
	"settings.shortcutPress": "Pressione as teclas…",
	"settings.shortcutOff": "Desligado",
	"settings.shortcutClear": "Desligar",
	"settings.errorShortcut":
		"Não foi possível usar {shortcut}. Outro programa pode já estar usando essa combinação.",

	"list.filterAll": "Todos",
	"list.filterActive": "Ativos",
	"list.filterExpired": "Vencidos",
	"list.filterFailed": "Falhas",
	"list.empty": "Nenhum item nesta aba.",
	"list.queued": "Na fila",
	"list.canceled": "Cancelado",
	"list.errorFallback": "Erro no envio",
	"list.generatingLink": "Enviado · gerando link...",
	"list.fileDeleted": "Arquivo removido do S3",
	"list.linkExpired": "Link expirado",
	"list.linkValidUntil": "Link válido até {date}",
	"list.copied": "copiado",
	"list.fileDeletedAt": "arquivo apagado ~{date}",
	"list.actionRegenerate": "Gerar novo link e copiar",
	"list.actionCopied": "Link copiado",
	"list.actionCopy": "Copiar link",
	"list.actionCancel": "Cancelar {name}",
	"list.actionRemove": "Remover do histórico",

	"history.title": "Histórico",
	"history.viewAll": "Ver histórico completo ({count})",

	"notify.uploadDone": "Upload concluído",
	"notify.uploadFailed": "Falha no upload",

	"tray.open": "Abrir",
	"tray.quit": "Sair",
	"tray.uploading": "dstorage — enviando ({filled}/{total})",

	"error.partNetwork":
		"Falha de rede ao enviar parte ao S3 (confira o CORS e a região do bucket)",
	"error.noEtag": "O S3 não devolveu ETag (veja o CORS do bucket)",
	"error.fileGone": "O arquivo não existe mais no S3",
	"error.interrupted": "Envio interrompido ao fechar o app",
};
