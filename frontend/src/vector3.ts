import { useDebugValue } from "react";
import { array, NDArray } from "vectorious";
import { Matrix3x3 } from "./matrix";
import { Vector } from "./vector";

export class Vector3 implements Vector {
	constructor(
		public readonly x: number,
		public readonly y: number,
		public readonly z: number
	) {}

	add({ x, y, z }: this): this {
		return new Vector3(x + this.x, y + this.y, z + this.z) as this;
	}

	sub(p: this): this {
		return this.add(p.scalar(-1) as this);
	}

	scalar(c: number): this {
		return new Vector3(this.x * c, this.y * c, this.z * c) as this;
	}

	hadamard({ x, y, z }: this): this {
		return new Vector3(x * this.x, y * this.y, z * this.z) as this;
	}

	// multiply(m: Matrix3x3): Vector3 {

	// }

	get columnVectorArray(): NDArray {
		return array([[this.x], [this.y], [this.z]]);
	}

	get rowVectorArray(): NDArray {
		return array([[this.x, this.y, this.z]]);
	}

	static fromArray(arr: number[][]): Vector3 {
		console.assert(
			(arr.length === 1 && arr.every((v) => v.length === 3)) ||
				(arr.length === 3 && arr.every((v) => v.length === 1)),
			"Expected either a 3x1 column vector array, 1x3 row vector, or an array of 3 elements but got something else",
			arr
		);

		const [x, y, z] = arr.flat();

		return new Vector3(x, y, z);
	}
}
