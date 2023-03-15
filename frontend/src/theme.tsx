import { createContext, ReactNode, useEffect, useState } from "react";

export type Theme = Readonly<{
	background: string;
	stageBackground: string;
}>;

export const dark: Theme = Object.freeze({
	background: "#1b1b1b",
	stageBackground: "black",
});

export const light: Theme = Object.freeze({
	background: "#f0f0f0",
	stageBackground: "white",
});

export function getTheme(): Theme {
	return window.matchMedia("(prefers-color-scheme: dark)").matches
		? dark
		: light;
}

const ThemeContext = createContext(getTheme());

export function ThemeProvider({ children }: { children: ReactNode }) {
	const [theme, setTheme] = useState(getTheme());

	useEffect(() => {
		const listener = () => setTheme(getTheme());
		window
			.matchMedia("(prefers-color-scheme: dark)")
			.addEventListener("change", listener);
		return () =>
			window
				.matchMedia("(prefers-color-scheme: dark)")
				.removeEventListener("change", listener);
	}, []);

	return (
		<ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
	);
}
