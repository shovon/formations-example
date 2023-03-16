import dark from "./dark/dark";
import light from "./light/light";

type Icons = {
	formations: string;
};

export function icon(mode: "dark" | "light"): Icons {
	switch (mode) {
		case "dark":
			return dark;
		case "light":
			return light;
	}
}
