export interface ADSRParams {
  attack: number;   // seconds
  decay: number;    // seconds
  sustain: number;  // 0.0-1.0 (gain level)
  release: number;  // seconds
}

export const DEFAULT_ADSR: ADSRParams = {
  attack: 0.01,
  decay: 0.1,
  sustain: 0.7,
  release: 0.3,
};

/** Minimum attack time to prevent clicks. */
const MIN_ATTACK = 0.005;

/** Schedule ADSR attack+decay on a gain node. Returns the sustain start time. */
export function scheduleAttack(
  gain: GainNode,
  params: ADSRParams,
  velocity: number,
  startTime: number,
): number {
  const attack = Math.max(params.attack, MIN_ATTACK);
  const peakGain = velocity;
  const sustainGain = params.sustain * velocity;

  // Cancel any scheduled values and capture current gain
  gain.gain.cancelScheduledValues(startTime);
  gain.gain.setValueAtTime(0, startTime);

  // Attack: ramp to peak
  gain.gain.linearRampToValueAtTime(peakGain, startTime + attack);

  // Decay: ramp to sustain level
  gain.gain.linearRampToValueAtTime(sustainGain, startTime + attack + params.decay);

  return startTime + attack + params.decay;
}

/** Schedule release on a gain node. Returns the time when release ends. */
export function scheduleRelease(
  gain: GainNode,
  params: ADSRParams,
  startTime: number,
): number {
  // Capture current value to avoid clicks
  const currentGain = gain.gain.value;
  gain.gain.cancelScheduledValues(startTime);
  gain.gain.setValueAtTime(currentGain, startTime);

  // Release: ramp to zero
  gain.gain.linearRampToValueAtTime(0, startTime + params.release);

  return startTime + params.release;
}
