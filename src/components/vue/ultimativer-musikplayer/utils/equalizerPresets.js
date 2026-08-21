/**
 * 10-band graphic equalizer configuration.
 *
 * Frequencies are the center frequencies for the BiquadFilter chain; the
 * presets are gain values in dB (range roughly -12 … +12) per band.
 */

export const EQ_FREQUENCIES = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000]

export const EQ_BAND_COUNT = EQ_FREQUENCIES.length

/** Human-readable label for a frequency (e.g. 16000 -> "16k"). */
export function formatFrequency(freq) {
  return freq >= 1000 ? `${freq / 1000}k` : String(freq)
}

// Order matters for the preset <select>.
export const EQ_PRESET_ORDER = [
  'flat',
  'rock',
  'pop',
  'jazz',
  'classical',
  'bass',
  'treble',
  'vocal',
]

export const EQ_PRESETS = {
  flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  rock: [5, 4, 2, 0, -1, 0, 2, 3, 4, 4],
  pop: [-1, 0, 2, 4, 4, 2, 0, -1, -1, -1],
  jazz: [3, 2, 1, 2, -1, -1, 0, 1, 2, 3],
  classical: [4, 3, 2, 1, -1, -1, 0, 2, 3, 4],
  bass: [7, 6, 5, 3, 1, 0, 0, 0, 0, 0],
  treble: [0, 0, 0, 0, 0, 2, 4, 5, 6, 7],
  vocal: [-2, -1, 0, 2, 4, 4, 3, 1, 0, -1],
}

export const EQ_MIN_DB = -12
export const EQ_MAX_DB = 12
