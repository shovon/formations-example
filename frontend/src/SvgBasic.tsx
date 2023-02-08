import { forwardRef, useEffect } from "react";

export type SvgBasicProps = Omit<React.SVGProps<SVGSVGElement>, "onMouseUp"> & {
	onMouseUp: () => void;
};

export const SvgBasic = forwardRef<SVGSVGElement, SvgBasicProps>(
	({ onMouseDown, onMouseMove, onMouseUp, ...props }, ref) => {
		useEffect(() => {
			document.addEventListener("mouseup", onMouseUp);

			return () => {
				document.removeEventListener("mouseup", onMouseUp);
			};
		}, [onMouseUp]);

		return (
			<svg
				ref={ref}
				onMouseDown={onMouseDown}
				onMouseMove={onMouseMove}
				{...props}
			></svg>
		);
	}
);
