import { createContext, ReactNode, useEffect, useState } from "react";

type ThemeColorIdentifier = "dark" | "light";

export type Theme = Readonly<{
	timeline: Readonly<{
		background: string;
		tickColor: string;
		formation: Readonly<{
			selected: string;
			unselected: string;
		}>;
	}>;
	background: string;
	primary: string;
	sidebar: Readonly<{
		background: string;
		tabs: Readonly<{
			background: string;
		}>;
	}>;
	stage: Readonly<{
		background: string;
		centerLine: string;
	}>;
	formationsList: Readonly<{
		listItem: Readonly<{
			unselected: string;
			selected: {
				background: string;
				border: string;
			};
		}>;
	}>;
}>;

export const dark: Theme = Object.freeze({
	timeline: Object.freeze({
		background: "rgb(27, 27, 27)",
		tickColor: "white",
		formation: Object.freeze({
			selected: "rgba(64,177,171,0.3)",
			unselected: "rgba(201, 201, 201, 0.3)",
		}),
	}),
	background: "#1b1b1b",
	primary: "rgb(180, 255, 135)",
	sidebar: Object.freeze({
		background: "rgb(15, 15, 15)",
		tabs: Object.freeze({
			background: "rgb(38, 38, 38)",
		}),
	}),
	stage: Object.freeze({
		background: "black",
		centerLine: "#4a4a4a",
	}),
	formationsList: Object.freeze({
		listItem: {
			unselected: "black",
			selected: {
				background: "rgba(64, 109, 177, 0.3)",
				border: "rgba(64, 109, 177, 0.9)",
			},
		},
	}),
});

export const light: Theme = Object.freeze({
	timeline: Object.freeze({
		background: "#f0f0f0",
		tickColor: "black",
		formation: Object.freeze({
			selected: "rgba(64,177,171,0.3)",
			unselected: "rgba(138, 138, 138, 0.3)",
		}),
	}),
	background: "#f0f0f0",
	primary: "rgb(180, 255, 135)",
	sidebar: Object.freeze({
		background: "rgb(143, 141, 141)",
		tabs: Object.freeze({
			background: "rgb(212, 212, 212)",
		}),
	}),
	stage: Object.freeze({
		background: "white",
		centerLine: "#ccc",
	}),
	formationsList: Object.freeze({
		listItem: {
			unselected: "white",
			selected: {
				background: "rgba(64, 109, 177, 0.3)",
				border: "rgba(64, 109, 177, 0.9)",
			},
		},
	}),
});

const matchMediaDark = window.matchMedia("(prefers-color-scheme: dark)");

type ThemeAndLabel = {
	theme: Theme;
	label: ThemeColorIdentifier;
};

export function getTheme(override?: ThemeColorIdentifier): ThemeAndLabel {
	return override === "dark" || matchMediaDark.matches
		? { theme: dark, label: "dark" }
		: { theme: light, label: "light" };
}

export const ThemeContext = createContext<ThemeAndLabel>(getTheme());

export function ThemeProvider({
	children,
	override,
}: {
	children: ReactNode;
	override?: ThemeColorIdentifier;
}) {
	const themeHelper = () => getTheme(override);
	const [theme, setTheme] = useState(themeHelper);

	useEffect(() => {
		const listener = () => setTheme(themeHelper);
		matchMediaDark.addEventListener("change", listener);
		return () => matchMediaDark.removeEventListener("change", listener);
	}, []);

	return (
		<ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
	);
}
