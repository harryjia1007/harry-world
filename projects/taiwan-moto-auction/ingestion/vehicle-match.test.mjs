#!/usr/bin/env node
/* 機車辨識回歸測試。用法： node --test projects/taiwan-moto-auction/ingestion/vehicle-match.test.mjs

   測資中的標題是 2026-08 從臺北惜物網真實列表抓到的原始字串，不是編造的。
   特別守住「車輛起重機(車輛吊車)」這筆——它會被「重機」關鍵字誤判成機車，
   已經實際發生過一次，這個測試就是為了不要再發生第二次。 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isMotorcycleTitle, classifyVehicleCategory, extractPlateNumber,
  extractDisplacementCc, refineCategoryByCc,
} from './vehicle-match.js';

test('真實惜物網標題：機車要收', () => {
  for (const title of [
    '二輪機踏車1台',
    '重型機車1輛［原車牌：ADQ-8927］',
    '重型機車1輛［原車牌：ADQ-3200］',
  ]) {
    assert.equal(isMotorcycleTitle(title), true, title);
  }
});

test('真實惜物網標題：非機車要排除（含起重機誤判坑）', () => {
  for (const title of [
    '車輛起重機(車輛吊車)',   // ← 「重機」誤命中，實際踩過的 bug
    '冷氣',
    '高溫烘碗消毒櫃',
    '自小客車1輛',
    '堆高機1台',
  ]) {
    assert.equal(isMotorcycleTitle(title), false, title);
  }
});

test('空值不應該炸掉', () => {
  assert.equal(isMotorcycleTitle(null), false);
  assert.equal(isMotorcycleTitle(''), false);
  assert.equal(classifyVehicleCategory(null), 'UNKNOWN');
  assert.equal(extractPlateNumber(null), null);
  assert.equal(extractDisplacementCc(null), null);
});

test('級別判斷', () => {
  assert.equal(classifyVehicleCategory('重型機車1輛'), 'HEAVY_UNSPECIFIED');
  assert.equal(classifyVehicleCategory('大型重型機車'), 'LARGE_HEAVY');
  assert.equal(classifyVehicleCategory('普通輕型機車1輛'), 'ORDINARY_LIGHT');
  assert.equal(classifyVehicleCategory('電動機車1輛'), 'ELECTRIC_MOTORCYCLE');
  // 寫不明確就保守回 UNKNOWN，不要猜
  assert.equal(classifyVehicleCategory('二輪機踏車1台'), 'UNKNOWN');
});

test('車牌只認明確標示，不從一般文字亂猜', () => {
  assert.equal(extractPlateNumber('重型機車1輛［原車牌：ADQ-8927］'), 'ADQ-8927');
  assert.equal(extractPlateNumber('機車1輛 車牌號碼 MRK-1234'), 'MRK-1234');
  assert.equal(extractPlateNumber('機車1輛 案號 ABC-1234'), null); // 沒寫「車牌」就不採信
  assert.equal(extractPlateNumber('二輪機踏車1台'), null);
});

test('排氣量解析與範圍防呆', () => {
  assert.equal(extractDisplacementCc('重型機車 150cc'), 150);
  assert.equal(extractDisplacementCc('機車 125 c.c.'), 125);
  assert.equal(extractDisplacementCc('機車 排氣量：550'), 550);
  // 年份、金額不該被當成排氣量
  assert.equal(extractDisplacementCc('機車1輛 民國'), null);
  assert.equal(extractDisplacementCc('機車 底價 30000 元'), null);
});

test('cc 可以回補未確認的級別，但不覆蓋已確定的級別', () => {
  assert.equal(refineCategoryByCc('UNKNOWN', 50), 'ORDINARY_LIGHT');
  assert.equal(refineCategoryByCc('UNKNOWN', 125), 'HEAVY_UNSPECIFIED');
  assert.equal(refineCategoryByCc('UNKNOWN', 650), 'LARGE_HEAVY');
  assert.equal(refineCategoryByCc('UNKNOWN', null), 'UNKNOWN');
  assert.equal(refineCategoryByCc('LARGE_HEAVY', 125), 'LARGE_HEAVY'); // 不覆蓋
});
