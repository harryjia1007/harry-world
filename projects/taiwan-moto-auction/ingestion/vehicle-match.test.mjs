#!/usr/bin/env node
/* 機車辨識回歸測試。用法： node --test projects/taiwan-moto-auction/ingestion/vehicle-match.test.mjs

   測資中的標題是 2026-08 從臺北惜物網真實列表抓到的原始字串，不是編造的。
   特別守住「車輛起重機(車輛吊車)」這筆——它會被「重機」關鍵字誤判成機車，
   已經實際發生過一次，這個測試就是為了不要再發生第二次。 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isMotorcycleTitle, classifyVehicleCategory, extractPlateNumber,
  extractDisplacementCc, refineCategoryByCc, mapRegistrationStatus,
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

/* 以下測資全部來自 2026-08-20 正式 Supabase 資料庫裡 moj_auction 的真實標題。
   當時查出 26 筆裡有 23 筆不是機車，其中「自用小客車」寫法完全沒被舊排除清單擋到
   （舊清單寫「自小客」，但公文寫「自用小客車」，中間多一個「用」字就比對不到）。 */
test('真實檢察署公文標題：汽車類要排除（自用小客車寫法）', () => {
  for (const title of [
    '公告拍賣本署106年度變價字第4號案件，偵查中扣押之自用小客車壹台（廠牌型號：MASERATI GHIBLI S Q4）',
    '公告拍賣本署109年度變價字第2號案件所查扣之自用小客車4部，詳如附件所示。',
    '105年度拍賣沒收扣押物(自小客車、挖土機)公告拍賣結果',
    '107年度拍賣沒收扣押物(自小客車)公告',
  ]) {
    assert.equal(isMotorcycleTitle(title), false, title);
  }
});

/* 混合標的：法院／檢察署常見「汽車N輛、機車N台」一起拍賣。這種**要收**——
   裡面真的有機車，標題也完整顯示給使用者看得到。舊做法「有汽車字樣就整筆否決」
   會把這類真實機車案件丟掉。 */
test('混合標的（汽車＋機車）要收，不能因為有汽車就整筆丟掉', () => {
  assert.equal(
    isMotorcycleTitle('公告拍賣本署偵查中扣押車輛2輛、機車1台，有意承購者，請屆時到場購買'),
    true,
  );
  assert.equal(isMotorcycleTitle('自用小客車3部及重型機車1輛'), true);
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

test('牌照異動登記文字對應到列舉，不確定的一律 UNKNOWN 不硬猜', () => {
  assert.equal(mapRegistrationStatus('已繳銷(可再領牌)'), 'RE_REGISTRATION_REQUIRED');
  assert.equal(mapRegistrationStatus('報廢無法再領牌(得標人需具應回收廢棄物回收業登記證)'), 'CANNOT_RELICENSE');
  // 這幾種是「查過詳情頁、但官方資訊本身就無法判定」，要回 REGISTRABILITY_UNKNOWN，
  // 不是泛用的 UNKNOWN（UNKNOWN 是「根本還沒查」，語意不同，2026-08-20 對照正式資料庫發現先前搞混過）。
  assert.equal(mapRegistrationStatus('無牌照'), 'REGISTRABILITY_UNKNOWN');
  assert.equal(mapRegistrationStatus('詳物品說明'), 'REGISTRABILITY_UNKNOWN');
  assert.equal(mapRegistrationStatus(null), 'REGISTRABILITY_UNKNOWN');
  assert.equal(mapRegistrationStatus(''), 'REGISTRABILITY_UNKNOWN');
  assert.equal(mapRegistrationStatus('未知的新選項'), 'REGISTRABILITY_UNKNOWN'); // 官方未來加新選項也不會誤判成已知類別
});
