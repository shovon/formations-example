import { createContext, ReactNode, useEffect, useState } from "react";

type ThemeColorIdentifier = "dark" | "light";

export type Theme = Readonly<{
	tickColor: string;
	background: string;
	stageBackground: string;
}>;

export const dark: Theme = Object.freeze({
	tickColor: "white",
	background: "#1b1b1b",
	stageBackground: "black",
});

export const light: Theme = Object.freeze({
	tickColor: "black",
	background: "#f0f0f0",
	stageBackground: "white",
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
