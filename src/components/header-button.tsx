import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";

type HeaderButtonProps = {
	/** Tooltip text; also the accessible name. */
	label: string;
	onClick: () => void;
	/** The icon. */
	children: ReactNode;
};

/** An icon-only ghost button with a tooltip, for page headers. */
export function HeaderButton({ label, onClick, children }: HeaderButtonProps) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					aria-label={label}
					onClick={onClick}
				>
					{children}
				</Button>
			</TooltipTrigger>
			<TooltipContent>{label}</TooltipContent>
		</Tooltip>
	);
}
