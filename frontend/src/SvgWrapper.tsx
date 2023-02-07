import React, { useCallback, useEffect, useReducer, useRef } from "react";
import { sub as sub2, Vector2 } from "./vector2";

type SvgWrapperProps = Omit<
	React.SVGProps<SVGSVGElement>,
	"onMouseDown" | "onMouseMove" | "onMouseUp"
> & {
	onMouseDown?: () => void;
	onMouseMove?: (props: {
		x: number;
		y: number;
		movementX: number;
		movementY: number;
	}) => void;
	onMouseUp?: () => void;
	onWheel?: (props: {
		deltaX: number;
		deltaY: number;
		ctrlKey: boolean;
	}) => void;
};

export function SvgWrapper({
	onMouseDown,
	onMouseMove,
	onMouseUp,
	onWheel,
	...svgProps
}: SvgWrapperProps) {
	const svgRef = useRef<SVGSVGElement | null>(null);
	const onWheelCallback = useCallback(
		(e: WheelEvent) => {
			e.preventDefault();

			if (!svgRef.current) return;

			(onWheel || (() => {}))(e);
		},
		[onWheel]
	);
	const [, update] = useReducer(() => ({}), {});

	useEffect(() => {
		const listener = onMouseUp || (() => {});
		document.addEventListener("mouseup", onMouseUp || listener);

		return () => {
			document.removeEventListener("mouseup", listener);
		};
	});

	useEffect(() => {
		return () => {
			if (!svgRef.current) return;

			svgRef.current.removeEventListener("wheel", onWheelCallback);
		};
	}, [onWheel]);

	return (
		<svg
			ref={(ref) => {
				if (ref === null) {
					return;
				}
				const currentRef = svgRef.current;
				svgRef.current = ref;

				svgRef.current.addEventListener("wheel", onWheelCallback, {
					passive: false,
				});

				if (currentRef === ref) return;

				update();
			}}
			onMouseDown={() => {
				(onMouseDown || (() => {}))();
			}}
			onMouseMove={(e) => {
				if (svgRef.current) {
					const rect = svgRef.current.getBoundingClientRect();
					const rectPos = [rect.left, rect.top] satisfies Vector2;
					const clientXY = [e.clientX, e.clientY] satisfies Vector2;

					const [x, y] = sub2(clientXY, rectPos);
					(onMouseMove || (() => {}))({
						x,
						y,
						movementX: e.movementX,
						movementY: e.movementY,
					});
				}
			}}
			{...svgProps}
		/>
	);
}
