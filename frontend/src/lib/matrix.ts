import { NDArray, array } from "vectorious";
import { Vector2 } from "./vector2";

export const scale2D = ([x, y]: Vector2): NDArray => {
	return array([
		[x, 0, 0],
		[0, y, 0],
		[0, 0, 1],
	]);
};

export const translate2D = ([x, y]: Vector2): NDArray => {
	return array([
		[1, 0, x],
		[0, 1, y],
		[0, 0, 1],
	]);
};
