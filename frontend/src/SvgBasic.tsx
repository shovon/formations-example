import { forwardRef, useEffect, useRef } from "react";
import { equals as equals2, sub as sub2, Vector2 } from "./vector2";

export type SvgBasicProps = Omit<
	React.SVGProps<SVGSVGElement>,
	"onMouseUp" | "onWheel" | "onMouseMove"
> & {
	onMouseUp: () => void;
	onWheel: (e: WheelEvent) => void;
	onMouseMove: (e: MouseEvent & { x: number; y: number }) => void;
};

export type SvgBasicObject = {
	getBoundingClientRect(): {
		left: number;
		top: number;
		right: number;
		bottom: number;
		width: number;
		height: number;
	};
};

export const SvgBasic = forwardRef<SvgBasicObject, SvgBasicProps>(
	(
		{ onMouseDown, onMouseMove, onMouseUp, onWheel, ...props },
		forwardedRef
	) => {
		const svgRef = useRef<SVGSVGElement | null>(null);

		useEffect(() => {
			document.addEventListener("mouseup", onMouseUp);

			return () => {
				document.removeEventListener("mouseup", onMouseUp);
			};
		}, [onMouseUp]);

		return (
			<svg
				ref={(ref) => {
					if (typeof forwardedRef === "function") {
						forwardedRef(ref);
					} else if (forwardedRef) {
						forwardedRef.current = ref;
					}
					if (ref === null) {
						return;
					}
					svgRef.current = ref;

					svgRef.current.addEventListener(
						"wheel",
						(e) => {
							e.preventDefault();

							if (!svgRef.current) return;

							if (onWheel) onWheel(e as any as WheelEvent);
						},
						{ passive: false }
					);
				}}
				onMouseDown={onMouseDown}
				onMouseMove={(e) => {
					if (svgRef.current) {
						const rect = svgRef.current.getBoundingClientRect();
						const rectPos = [rect.left, rect.top] satisfies Vector2;
						const clientXY = [e.clientX, e.clientY] satisfies Vector2;

						const [x, y] = sub2(clientXY, rectPos);

						const evt = { ...e, x, y };

						onMouseMove?.(evt);
					}
				}}
				{...props}
			></svg>
		);
	}
);
