import { ReactNode, useState } from "react";

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

	const childrenArray = Array.isArray(children) ? children : [children];

	const child = childrenArray[tabIndex] ?? [];

	return (
		<div style={style}>
			<div>
				{childrenArray.map((child) => (
					<img src={child.props.icon} />
				))}
			</div>
			{child?.props?.children ?? null}
		</div>
	);
}
