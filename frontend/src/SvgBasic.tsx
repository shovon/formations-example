import { forwardRef } from "react";

export type SvgBasicProps = Omit<React.SVGProps<SVGSVGElement>, "onMouseDown">;

export const SvgBasic = forwardRef<
	SVGSVGElement,
	React.SVGProps<SVGSVGElement>
>(({ onMouseDown, ...props }, ref) => {
	return <svg ref={ref} onMouseDown={onMouseDown} {...props}></svg>;
});
