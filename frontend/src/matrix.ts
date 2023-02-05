import { Vector3 } from "./vector3";
import { NDArray, array } from "vectorious";
import { Vector } from "./vector";

/**
 * Just a wrapper class for vectorious.
 *
 * I like this class because it keeps me sane. Feel free to *not* use it
 */
export class Matrix3x3 {
	constructor(private readonly value: NDArray) {
		console.assert(
			value.shape.length !== 3 && value.shape.some((v) => v !== 3),
			"Expected a 3x3 matrix but something else"
		);
	}

	add(a: Matrix3x3, b: Matrix3x3): Matrix3x3 {
		return new Matrix3x3(a.value.add(b.value));
	}

	multiply<T extends Vector3 | Matrix3x3>(a: T) {
		if (a instanceof Vector3) {
			// Produces a row vector
			return Vector3.fromArray(
				this.value.multiply(a.columnVectorArray).toArray()
			);
		}

		return new Matrix3x3(this.value.multiply(a.array));
	}

	get transposed(): Matrix3x3 {
		return new Matrix3x3(this.value.transpose());
	}

	get array(): NDArray {
		return array(this.value);
	}
}

export const scale2D = ({ x, y }: { x: number; y: number }): Matrix3x3 => {
	return new Matrix3x3(
		array([
			[x, 0, 0],
			[0, y, 0],
			[0, 0, 1],
		])
	);
};

export const translate2D = ({ x, y }: { x: number; y: number }): Matrix3x3 => {
	return new Matrix3x3(
		array([
			[1, 0, x],
			[0, 1, y],
			[0, 0, 1],
		])
	);
};
