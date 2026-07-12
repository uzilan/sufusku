import { describe, expect, it } from 'vitest';
import { findGridQuad, warpGrid } from '../src/scan/detect';
import { grayAt } from '../src/scan/classify';
import { makeImage, strokeRect } from './helpers/image';
import { loadOpenCVNode } from './helpers/opencvNode';

describe('findGridQuad', () => {
  it('finds a large square outline', async () => {
    const cv = await loadOpenCVNode();
    const image = makeImage(320, 240);
    strokeRect(image, 40, 20, 240, 200, 6, 20); // covers 62% of frame
    const quad = findGridQuad(cv, image);
    expect(quad).not.toBeNull();
    const [tl, tr, br, bl] = quad!;
    expect(Math.abs(tl.x - 40)).toBeLessThanOrEqual(8);
    expect(Math.abs(tl.y - 20)).toBeLessThanOrEqual(8);
    expect(Math.abs(tr.x - 280)).toBeLessThanOrEqual(8);
    expect(Math.abs(br.y - 220)).toBeLessThanOrEqual(8);
    expect(Math.abs(bl.x - 40)).toBeLessThanOrEqual(8);
  }, 60000);

  it('returns null when nothing big enough exists', async () => {
    const cv = await loadOpenCVNode();
    const image = makeImage(320, 240);
    strokeRect(image, 100, 100, 60, 60, 4, 20); // only ~5% of frame
    expect(findGridQuad(cv, image)).toBeNull();
  }, 60000);
});

describe('warpGrid', () => {
  it('maps the quad to a 450x450 image', async () => {
    const cv = await loadOpenCVNode();
    const image = makeImage(320, 240);
    strokeRect(image, 40, 20, 240, 200, 6, 20);
    const quad = findGridQuad(cv, image)!;
    const grid = warpGrid(cv, image, quad);
    expect(grid.width).toBe(450);
    expect(grid.height).toBe(450);
    expect(grayAt(grid, 225, 225)).toBeGreaterThan(200); // white interior
    expect(grayAt(grid, 225, 4)).toBeLessThan(120); // border ink at top edge
  }, 60000);
});
