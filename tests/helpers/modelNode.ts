import fs from 'node:fs';
import path from 'node:path';
import * as tf from '@tensorflow/tfjs';

interface WeightsGroup {
  paths: string[];
  weights: tf.io.WeightsManifestEntry[];
}

export const loadModelFromDisk = async (dir: string): Promise<tf.LayersModel> => {
  const modelJSON = JSON.parse(fs.readFileSync(path.join(dir, 'model.json'), 'utf8'));
  const manifest = modelJSON.weightsManifest as WeightsGroup[];
  const weightSpecs = manifest.flatMap((g) => g.weights);
  const buffers = manifest.flatMap((g) => g.paths.map((p) => fs.readFileSync(path.join(dir, p))));
  const concatenated = Buffer.concat(buffers);
  const weightData = concatenated.buffer.slice(
    concatenated.byteOffset,
    concatenated.byteOffset + concatenated.byteLength,
  );
  return tf.loadLayersModel(
    tf.io.fromMemory({ modelTopology: modelJSON.modelTopology, weightSpecs, weightData }),
  );
};
