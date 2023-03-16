import { createContext, ReactNode, useEffect, useState } from "react";

type ThemeColorIdentifier = "dark" | "light";

export type Theme = Readonly<{
	timeline: Readonly<{
		tickColor: string;
		formation: Readonly<{
			selected: string;
			unselected: string;
		}>;
	}>;
	background: string;
	stageBackground: string;
	primary: string;
}>;

export const dark: Theme = Object.freeze({
	timeline: Object.freeze({
		tickColor: "white",
		formation: Object.freeze({
			selected: "rgba(64,177,171,0.3)",
			unselected: "rgba(201, 201, 201, 0.3)",
		}),
	}),
	background: "#1b1b1b",
	stageBackground: "black",
	primary: "rgb(180, 255, 135)",
});

export const light: Theme = Object.freeze({
	timeline: Object.freeze({
		tickColor: "black",
		formation: Object.freeze({
			selected: "rgba(64,177,171,0.3)",
			unselected: "rgba(138, 138, 138, 0.3)",
		}),
	}),
	background: "#f0f0f0",
	stageBackground: "white",
	primary: "rgb(180, 255, 135)",
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
