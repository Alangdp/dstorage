import {
	Check,
	CircleAlert,
	CircleCheck,
	Clock,
	File,
	Link,
	RefreshCw,
	Trash2,
	X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type { UploadItem } from "@/hooks/use-uploads";
import { formatDateTime, getLinkState, type LinkState } from "@/lib/link-state";

function formatBytes(bytes: number) {
	if (bytes < 1024) return `${bytes} B`;
	const units = ["KB", "MB", "GB", "TB"];
	let value = bytes / 1024;
	let unit = 0;
	while (value >= 1024 && unit < units.length - 1) {
		value /= 1024;
		unit++;
	}
	return `${value.toFixed(1)} ${units[unit]}`;
}

/** Relógio que atualiza a cada 30 s, para o status dos links mudar sozinho. */
function useNow() {
	const [now, setNow] = useState(() => Date.now());
	useEffect(() => {
		const id = setInterval(() => setNow(Date.now()), 30_000);
		return () => clearInterval(id);
	}, []);
	return now;
}

function withDate(label: string, item: UploadItem) {
	return item.createdAt
		? `${label} · ${formatDateTime(item.createdAt)}`
		: label;
}

type Filter = "all" | "active" | "expired" | "failed";

const FILTERS: Array<{ value: Filter; label: string }> = [
	{ value: "all", label: "Todos" },
	{ value: "active", label: "Ativos" },
	{ value: "expired", label: "Vencidos" },
	{ value: "failed", label: "Falhas" },
];

/** Em qual aba o item aparece (além de "Todos"). */
function categoryOf(item: UploadItem, now: number): Exclude<Filter, "all"> {
	if (item.status === "error" || item.status === "canceled") return "failed";
	if (item.status === "done") {
		return getLinkState(item, now) === "valid" ? "active" : "expired";
	}
	return "active"; // na fila ou enviando
}

function statusLabel(item: UploadItem, now: number) {
	switch (item.status) {
		case "queued":
			return "Na fila";
		case "uploading":
			return `${Math.round(item.progress)}%`;
		case "canceled":
			return withDate("Cancelado", item);
		case "error":
			return withDate(item.error ?? "Erro no envio", item);
		case "done": {
			if (!item.url && !item.deleted) return "Enviado · gerando link...";
			const state = getLinkState(item, now);
			if (state === "file-deleted") return "Arquivo removido do S3";
			if (state === "link-expired") return "Link expirado";

			const parts = [
				`Link válido até ${formatDateTime(item.linkExpiresAt ?? now)}`,
			];
			if (item.copied) parts.unshift("copiado");
			if (item.fileExpiresAt) {
				parts.push(`arquivo apagado ~${formatDateTime(item.fileExpiresAt)}`);
			}
			return parts.join(" · ");
		}
	}
}

function StatusIcon({ item, state }: { item: UploadItem; state: LinkState }) {
	if (item.status === "error") {
		return <CircleAlert className="size-4 shrink-0 text-destructive" />;
	}
	if (item.status === "done") {
		if (state === "file-deleted") {
			return <Trash2 className="size-4 shrink-0 text-muted-foreground" />;
		}
		if (state === "link-expired") {
			return <Clock className="size-4 shrink-0 text-amber-500" />;
		}
		return <CircleCheck className="size-4 shrink-0 text-green-600" />;
	}
	return <File className="size-4 shrink-0 text-muted-foreground" />;
}

type IconAction = {
	label: string;
	icon: React.ReactNode;
	onClick: () => void;
};

function IconButton({ label, icon, onClick }: IconAction) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					variant="ghost"
					size="icon-xs"
					aria-label={label}
					onClick={onClick}
				>
					{icon}
				</Button>
			</TooltipTrigger>
			<TooltipContent>{label}</TooltipContent>
		</Tooltip>
	);
}

type UploadListProps = {
	items: UploadItem[];
	onCancel: (id: string) => void;
	onCopyLink: (id: string) => void;
	onRemove: (id: string) => void;
};

export function UploadList({
	items,
	onCancel,
	onCopyLink,
	onRemove,
}: UploadListProps) {
	const now = useNow();
	const [filter, setFilter] = useState<Filter>("all");

	if (items.length === 0) return null;

	const counts: Record<Filter, number> = {
		all: items.length,
		active: 0,
		expired: 0,
		failed: 0,
	};
	for (const item of items) counts[categoryOf(item, now)]++;

	// Mais recentes primeiro.
	const visible = [...items]
		.reverse()
		.filter((item) => filter === "all" || categoryOf(item, now) === filter);

	return (
		<div className="flex flex-col gap-3">
			<Tabs
				value={filter}
				onValueChange={(value) => setFilter(value as Filter)}
			>
				<TabsList className="w-full">
					{FILTERS.map(({ value, label }) => (
						<TabsTrigger key={value} value={value} className="text-xs">
							{label} ({counts[value]})
						</TabsTrigger>
					))}
				</TabsList>
			</Tabs>

			{visible.length === 0 && (
				<p className="py-4 text-center text-sm text-muted-foreground">
					Nenhum item nesta aba.
				</p>
			)}

			<ul className="flex flex-col gap-3">
				{visible.map((item) => {
					const active =
						item.status === "queued" || item.status === "uploading";
					const finished = item.status === "done";
					const state = getLinkState(item, now);

					return (
						<li key={item.id} className="flex flex-col gap-1.5">
							<div className="flex items-center gap-2">
								<StatusIcon item={item} state={state} />

								<span
									className="min-w-0 flex-1 truncate text-sm"
									title={item.name}
								>
									{item.name}
								</span>
								<span className="shrink-0 text-xs text-muted-foreground">
									{formatBytes(item.size)}
								</span>

								{finished && item.key && state !== "file-deleted" && (
									<IconButton
										label={
											state === "link-expired"
												? "Gerar novo link e copiar"
												: item.copied
													? "Link copiado"
													: "Copiar link"
										}
										icon={
											state === "link-expired" ? (
												<RefreshCw />
											) : item.copied ? (
												<Check />
											) : (
												<Link />
											)
										}
										onClick={() => onCopyLink(item.id)}
									/>
								)}

								{active ? (
									<IconButton
										label={`Cancelar ${item.name}`}
										icon={<X />}
										onClick={() => onCancel(item.id)}
									/>
								) : (
									<IconButton
										label="Remover do histórico"
										icon={<X />}
										onClick={() => onRemove(item.id)}
									/>
								)}
							</div>

							{active && <Progress value={item.progress} />}

							<p
								className={
									item.status === "error"
										? "text-xs text-destructive"
										: "text-xs text-muted-foreground"
								}
							>
								{statusLabel(item, now)}
							</p>
						</li>
					);
				})}
			</ul>
		</div>
	);
}
