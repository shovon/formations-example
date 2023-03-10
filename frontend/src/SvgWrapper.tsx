import { forwardRef, useEffect, useRef } from "react";
import { sub as sub2, Vector2 } from "./vector2";
import { WithBoundingClientRect } from "./with-bounding-client-rect";
import { mouseUpEvents } from "./document";

export type SvgWrapperProps = Omit<
	React.SVGProps<SVGSVGElement>,
	"onMouseUp" | "onWheel" | "onMouseMove"
> &
	Partial<{
		onMouseUp: () => void;
		onWheel: (e: WheelEvent) => void;
		onMouseMove: (
			e: React.MouseEvent<SVGSVGElement, MouseEvent> & { x: number; y: number }
		) => void;
		style: React.CSSProperties | undefined;
	}>;

export type SvgWrapperObject = WithBoundingClientRect;

export const SvgWrapper = forwardRef<SvgWrapperObject, SvgWrapperProps>(
	(
		{ onMouseDown, onMouseMove, onMouseUp, onWheel, style, ...props },
		forwardedRef
	) => {
		const svgRef = useRef<SVGSVGElement | null>(null);

		useEffect(() => {
			const listener = onMouseUp ?? (() => {});
			mouseUpEvents.addListener(listener);

			return () => {
				mouseUpEvents.removeListener(listener);
			};
		}, [onMouseUp]);

		return (
			<svg
				style={style}
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
