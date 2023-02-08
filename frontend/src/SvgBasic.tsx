import { forwardRef, useEffect, useRef } from "react";

export type SvgBasicProps = Omit<React.SVGProps<SVGSVGElement>, "onMouseUp"> & {
	onMouseUp: () => void;
};

export const SvgBasic = forwardRef<SVGSVGElement, SvgBasicProps>(
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
				onMouseMove={onMouseMove}
				{...props}
			></svg>
		);
	}
);
