import { start } from "./pipe";
import { sub, Vector2 } from "./vector2";
import { scalarMul, add } from "./vector2";

export const cubicBezier2d = (
	t: number,
	p0: Vector2,
	p1: Vector2,
	p2: Vector2,
	p3: Vector2
) =>
	start(p0)
		._((p) => scalarMul(p, (1 - t) ** 3))
		._((p) => add(p, scalarMul(p1, 3 * (1 - t) ** 2 * t)))
		._((p) => add(p, scalarMul(p2, 3 * (1 - t) * t ** 2)))
		._((p) => add(p, scalarMul(p3, t ** 3))).value;

export const cubicBezierDeriv2d = (
	t: number,
	p0: Vector2,
	p1: Vector2,
	p2: Vector2,
	p3: Vector2
) => {
	let result = [0, 0] satisfies [number, number];
	result = add(result, scalarMul(sub(p1, p2), 3 * (1 - t) ** 2));
	result = add(result, scalarMul(sub(p1, p2), 6 * (1 - t) * t));
	result = add(result, scalarMul(sub(p3, p2), 3 * (1 - t) * t ** 2));
	return result;
};
