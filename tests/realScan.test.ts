import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { classifyGrid } from '../src/scan/classify';
import { findGridQuad, warpGrid } from '../src/scan/detect';
import { wrapModel } from '../src/scan/model';
import { loadPng } from './helpers/image';
import { loadModelFromDisk } from './helpers/modelNode';
import { loadOpenCVNode } from './helpers/opencvNode';

describe('real photo scan', () => {
  it.each(['real-1', 'real-2'])('reads photographed puzzle %s end to end', async (name) => {
    const cv = await loadOpenCVNode();
    const model = wrapModel(await loadModelFromDisk('public/models/digits'));
    const image = loadPng(`tests/fixtures/${name}.png`);
    const expected = fs.readFileSync(`tests/fixtures/${name}.txt`, 'utf8').trim();

    const quad = findGridQuad(cv, image);
    expect(quad).not.toBeNull();
    const grid = warpGrid(cv, image, quad!);
    const { board } = await classifyGrid(model, grid);
    const actual = board.map((v) => v ?? 0).join('');
    expect(actual).toBe(expected);
  }, 120000);
});
