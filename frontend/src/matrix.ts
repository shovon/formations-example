import { Vector3 } from "./vector3";
import { NDArray, array } from "vectorious";
import { Vector } from "./vector";

export const scale2D = ({ x, y }: { x: number; y: number }): NDArray => {
	return array([
		[x, 0, 0],
		[0, y, 0],
		[0, 0, 1],
	]);
};

export const translate2D = ({ x, y }: { x: number; y: number }): NDArray => {
	return array([
		[1, 0, x],
		[0, 1, y],
		[0, 0, 1],
	]);
};
