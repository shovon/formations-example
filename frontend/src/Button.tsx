import { useContext } from "react";
import { ThemeContext } from "./theme";

export const Button = ({
	style,
	...props
}: React.DetailedHTMLProps<
	React.ButtonHTMLAttributes<HTMLButtonElement>,
	HTMLButtonElement
>) => {
	const { theme } = useContext(ThemeContext);

	console.log(theme.primary);

	return (
		<button
			style={{
				background: theme.primary,
				textTransform: "uppercase",
				fontWeight: "bold",
				border: "none",
				padding: "0.5em 1em",
				borderRadius: "7px",

				...style,
			}}
			{...props}
		/>
	);
};
