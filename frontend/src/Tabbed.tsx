import { ReactNode, useState } from "react";

type TabProps = {
	icon: string;
	children: ReactNode;
};

type TabElementChild = React.ReactElement<TabProps>;

export function Tab({ icon }: TabProps) {
	return <></>;
}

type TabbedProps = {
	style?: React.CSSProperties;
	children: TabElementChild | TabElementChild[];
};

export function Tabbed({ children, style }: TabbedProps) {
	const [tabIndex, setTabIndex] = useState(0);

	return (
		<div style={style}>
			{(Array.isArray(children) ? children : [children]).map((child) => {
				return child.props.children;
			})}
		</div>
	);
}
