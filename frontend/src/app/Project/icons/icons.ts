import dark from "./dark/dark";
import light from "./light/light";

// TODO: this is pointless. Just use CSS invert

type Icons = Readonly<{
	formations: string;
	performers: string;
}>;

export function icon(mode: "dark" | "light"): Icons {
	switch (mode) {
		case "dark":
			return dark;
		case "light":
			return light;
	}
}
