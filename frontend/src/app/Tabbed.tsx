import { ReactNode, useContext, useState } from "react";
import { css } from "@emotion/css";
import { ThemeContext } from "../contexts/theme";

type TabProps = {
	icon: string;
	children: ReactNode;
};

type TabElementChild = React.ReactElement<TabProps>;

export function Tab(_: TabProps) {
	return <></>;
}

type TabbedProps = {
	style?: React.CSSProperties;
	children: TabElementChild | TabElementChild[];
};

export function Tabbed({ children, style }: TabbedProps) {
	const [tabIndex, setTabIndex] = useState(0);
	const { theme, label: themeLabel } = useContext(ThemeContext);

	const childrenArray = Array.isArray(children) ? children : [children];

	const child = childrenArray[tabIndex] ?? [];

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				paddingTop: "10px",
				...style,
			}}
		>
			<div
				className={css`
					display: flex;
					flex-direction: row;

					> div {
						display: flex;
						align-items: center;
						justify-content: center;
						background: ${theme.sidebar.tabs.background};
						width: 45px;
						justify-content: center;
						border-top-left-radius: 5px;
						border-top-right-radius: 5px;
						margin-left: 5px;

						height: 30px;
						&.active {
							height: 35px;
						}

						&:not(.active) {
							cursor: pointer;
							border-bottom-left-radius: 5px;
							border-bottom-right-radius: 5px;
						}

						img {
							width: 18px;
							height: 18px;
						}
					}
				`}
			>
				{childrenArray.map((child, i) => (
					<div
						key={child.props.icon}
						className={i === tabIndex ? "active" : ""}
						onClick={() => setTabIndex(i)}
					>
						<img
							src={child.props.icon}
							style={{ opacity: i === tabIndex ? 1 : 0.5 }}
						/>
					</div>
				))}
			</div>
			<div style={{ flex: "1" }}>{child?.props?.children ?? null}</div>
		</div>
	);
}
