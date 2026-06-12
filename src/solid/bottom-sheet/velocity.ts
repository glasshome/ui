import { VELOCITY_WINDOW_MS } from "./constants";

interface Sample {
	y: number;
	t: number;
}

const MAX_SAMPLES = 16;

export class VelocityTracker {
	private samples: Sample[] = [];

	reset(): void {
		this.samples.length = 0;
	}

	add(y: number, t: number): void {
		this.samples.push({ y, t });
		if (this.samples.length > MAX_SAMPLES) this.samples.shift();
	}

	/** Weighted velocity over the last VELOCITY_WINDOW_MS, in px/ms. */
	compute(now: number): number {
		const recent = this.samples.filter((s) => now - s.t <= VELOCITY_WINDOW_MS);
		if (recent.length < 2) return 0;

		let weightedDy = 0;
		let weightedDt = 0;
		for (let i = 1; i < recent.length; i++) {
			const prev = recent[i - 1];
			const cur = recent[i];
			if (!prev || !cur) continue;
			const dy = cur.y - prev.y;
			const dt = cur.t - prev.t || 1;
			const w = i / recent.length;
			weightedDy += dy * w;
			weightedDt += dt * w;
		}
		if (weightedDt === 0) return 0;
		return weightedDy / weightedDt;
	}
}
