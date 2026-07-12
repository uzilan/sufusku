import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { classifyGrid } from '../src/scan/classify';
import { findGridQuad, warpGrid } from '../src/scan/detect';
import { wrapModel } from '../src/scan/model';
import { loadPng } from './helpers/image';
import { loadModelFromDisk } from './helpers/modelNode';
import { loadOpenCVNode } from './helpers/opencvNode';

describe('golden scan pipeline', () => {
  it('reads the synthetic fixture puzzle end to end', async () => {
    const cv = await loadOpenCVNode();
    const model = wrapModel(await loadModelFromDisk('public/models/digits'));
    const image = loadPng('tests/fixtures/synthetic-1.png');
    const expected = fs.readFileSync('tests/fixtures/synthetic-1.txt', 'utf8').trim();

    const quad = findGridQuad(cv, image);
    expect(quad).not.toBeNull();
    const grid = warpGrid(cv, image, quad!);
    const { board, confidence } = await classifyGrid(model, grid);

    expect(board.map((v) => v ?? 0).join('')).toBe(expected);
    for (let i = 0; i < 81; i++) {
      if (board[i] !== null) expect(confidence[i]).toBeGreaterThan(0.5);
    }
  }, 120000);
});
