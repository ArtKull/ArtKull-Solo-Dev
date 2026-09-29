import test from 'node:test'
import assert from 'node:assert/strict'
import { inRoundRect, renderRGBA, encodePNG, encodeICO } from '../tools/make-icons.mjs'

test('inRoundRect: центр внутри, далёкий угол снаружи', () => {
  assert.ok(inRoundRect(32, 32, 0, 0, 64, 64, 14))
  assert.ok(!inRoundRect(1, 1, 0, 0, 64, 64, 14))
})

test('renderRGBA: размер буфера, центр синий, угол прозрачный', () => {
  const buf = renderRGBA(512)
  assert.equal(buf.length, 512 * 512 * 4)
  const center = (256 * 512 + 256) * 4
  assert.ok(buf[center] < 120, 'R центра < 120')
  assert.ok(buf[center + 1] > 90, 'G центра > 90')
  assert.ok(buf[center + 2] > 200, 'B центра > 200')
  assert.equal(buf[3], 0, 'левый верхний угол прозрачный')
})

test('encodePNG: сигнатура и IHDR-размеры', () => {
  const png = encodePNG(16, renderRGBA(16))
  assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
  assert.equal(png.readUInt32BE(16), 16)
  assert.equal(png.readUInt32BE(20), 16)
  assert.equal(png[25], 6, 'color type RGBA')
})

test('encodeICO: три записи, первая 16x16', () => {
  const ico = encodeICO([
    { size: 16, png: encodePNG(16, renderRGBA(16)) },
    { size: 32, png: encodePNG(32, renderRGBA(32)) },
    { size: 48, png: encodePNG(48, renderRGBA(48)) }
  ])
  assert.equal(ico.readUInt16LE(2), 1, 'тип ICO')
  assert.equal(ico.readUInt16LE(4), 3, 'число записей')
  assert.equal(ico[6], 16, 'ширина первой записи')
  assert.equal(ico[7], 16, 'высота первой записи')
})
