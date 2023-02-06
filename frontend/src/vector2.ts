export type Vector2 = [number, number];

export const toColumnVector = ([x, y]: Vector2) => [[x], [y]];

export const add = ([x1, y1]: Vector2, [x2, y2]: Vector2): Vector2 => [
	x1 + x2,
	y1 + y2,
];

export const scalarMul = ([x, y]: Vector2, c: number): Vector2 => [
	x * c,
	y * c,
];

export const sub = (a: Vector2, b: Vector2) => add(a, scalarMul(b, -1));

export const hadamard = ([x1, y1]: Vector2, [x2, y2]: Vector2): Vector2 => [
	x1 * x2,
	y1 * y2,
];

export const dot = ([x1, y1]: Vector2, [x2, y2]: Vector2): number =>
	x1 * y1 + x2 * y2;

export const distance = (a: Vector2, b: Vector2): number => {
	const [x, y] = sub(a, b);
	return (x ** 2 + y ** 2) ** (1 / 2);
};

export const equals = ([x1, y1]: Vector2, [x2, y2]: Vector2): boolean =>
	x1 === x2 && y1 === y2;
