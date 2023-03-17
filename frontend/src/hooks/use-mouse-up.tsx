import { useCallback, useRef } from "react";

export function useMouseUp() {
	const isMouseDownRef = useRef(false);

	const onMouseDown = useCallback((listener: () => void) => {
		return () => {
			isMouseDownRef.current = true;
			listener();
		};
	}, []);

	const onMouseUp = useCallback((listener: () => void) => {
		return () => {
			if (isMouseDownRef.current) {
				isMouseDownRef.current = false;
				listener();
			}
		};
	}, []);

	const objRef = useRef({
		onMouseDown,
		onMouseUp,
	});

	return objRef.current;
}
