import * as tf from '@tensorflow/tfjs';
import { DIGIT_SIZE } from './classify';

export interface DigitPrediction {
  digit: number; // 1-9
  confidence: number; // softmax probability of the chosen digit
}

export interface DigitModel {
  predict(batch: Float32Array, count: number): Promise<DigitPrediction[]>;
}

// Wrap a layers model behind a plain-array interface so callers and tests
// never touch tensors directly
export const wrapModel = (model: tf.LayersModel): DigitModel => ({
  async predict(batch, count) {
    if (count === 0) return [];
    const input = tf.tensor4d(batch, [count, DIGIT_SIZE, DIGIT_SIZE, 1]);
    let output: tf.Tensor | undefined;
    let probs: Float32Array | Int32Array | Uint8Array;
    try {
      output = model.predict(input) as tf.Tensor;
      probs = await output.data();
    } finally {
      input.dispose();
      output?.dispose();
    }
    const predictions: DigitPrediction[] = [];
    for (let i = 0; i < count; i++) {
      let digit = 1;
      let confidence = 0;
      for (let d = 0; d < 9; d++) {
        const p = probs[i * 9 + d];
        if (p > confidence) {
          confidence = p;
          digit = d + 1;
        }
      }
      predictions.push({ digit, confidence });
    }
    return predictions;
  },
});

let modelPromise: Promise<DigitModel> | null = null;

export const loadDigitModel = (): Promise<DigitModel> => {
  modelPromise ??= tf.loadLayersModel('/models/digits/model.json').then(wrapModel);
  return modelPromise;
};
