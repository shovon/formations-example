import { Performance } from "./performance-project";

// TODO; perhaps move this to another file
export type TimelineState =
	| {
			mode: "CURRENT_FORMATION";
			index: number;

			/**
			 * A value between 0 and 1
			 */
			position: number;
	  }
	| {
			mode: "SEEKER";

			/**
			 * The time in milliseconds
			 */
			time: number;
	  };

// TODO: rename this
export const getCurrentFormationIndex = (
	performance: Performance,
	timelineState: TimelineState
): number => {
	switch (timelineState.mode) {
		case "CURRENT_FORMATION":
			return timelineState.index;
		case "SEEKER":
			const formation = performance.getFormationAtTime(timelineState.time);
			if (formation) {
				return formation[0];
			}
			return 0;
	}
};

export const getTimelineByFormationIndex = (
	performance: Performance,
	index: number
): TimelineState => {
	return {
		mode: "CURRENT_FORMATION",
		index:
			index >= performance.formations.length
				? performance.formations.length - 1
				: index,
		position: 0,
	};
};
