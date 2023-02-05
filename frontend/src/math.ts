import { Vector } from "./vector";

export const cubicBezier = <T extends Vector>(
	t: number,
	p0: T,
	p1: T,
	p2: T,
	p3: T
) =>
	p0
		.scalar((1 - t) ** 3)
		.add(p1.scalar(3 * (1 - t) ** 2 * t))
		.add(p2.scalar(3 * (1 - t) * t ** 2))
		.add(p3.scalar(t ** 3));

export const cubicBezierDeriv = <T extends Vector>(
	t: number,
	p0: T,
	p1: T,
	p2: T,
	p3: T
) =>
	p1
		.sub(p0)
		.scalar(3 * (1 - t) ** 2)
		.add(p2.sub(p1).scalar(6 * (1 - t) * t))
		.add(p3.sub(p2).scalar(3 * t ** 2));
