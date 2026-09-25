const assert = require('node:assert/strict');

const values = new Map();
global.localStorage = {
  getItem: (key) => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, value),
};

const M = require('./shared.js');

assert.equal(M.isScrap({ registration_status: 'SCRAP_ONLY' }), true);
assert.equal(M.isScrap({ eligibility: 'LICENSED_RECYCLER_ONLY' }), true);
assert.equal(M.isScrap({ official_title: '報廢警用汽⾞3輛、機⾞10輛' }), true);
assert.equal(M.isScrap({ official_title: '公務用汽車標售' }), false);
assert.equal(M.isScrap({ registration_status: 'NORMAL_TRANSFER', eligibility: 'PUBLIC' }), false);
assert.equal(M.isActive({ auction_status: 'SCHEDULED', ends_at: '2099-01-01T00:00:00Z' }, new Date('2026-08-18T00:00:00Z')), true);
assert.equal(M.isActive({ auction_status: 'SCHEDULED', ends_at: '2026-01-01T00:00:00Z' }, new Date('2026-08-18T00:00:00Z')), false);
assert.equal(M.statusLabel({ auction_status: 'ANNOUNCED', ends_at: null, registration_status: 'UNKNOWN', eligibility: 'UNKNOWN' }), '日期待核對');
assert.deepEqual(M.priceInfo({ sold_price: 900, current_price: 800, reserve_price: 700 }), { label: '成交價', value: 900 });
assert.deepEqual(M.priceInfo({ current_price: 800, reserve_price: 700 }), { label: '目前出價', value: 800 });
assert.deepEqual(M.priceInfo({ reserve_price: 700 }), { label: '拍賣底價', value: 700 });
assert.equal(M.region({ organization_name: '臺灣高雄地方法院', location: '' }), '高雄市');
assert.equal(M.safeOfficialUrl('https://www.tpkonsale.moj.gov.tw/Detail/Chattel?NO=123') !== null, true);
assert.equal(M.safeOfficialUrl('https://web.pcc.gov.tw/opas/aspam/public/readOneAspamDetailOld?pk=123') !== null, true);
assert.equal(M.safeOfficialUrl('https://web.customs.gov.tw/download/auction.pdf') !== null, true);
assert.equal(M.safeOfficialUrl('https://www.tcy.moj.gov.tw/notice/123/post') !== null, true);
assert.equal(M.safeOfficialUrl('https://example.com/not-official'), null);
assert.equal(M.hasFactValue(0), true);
assert.equal(M.hasFactValue(false), false);
assert.equal(M.hasFactValue(null), false);
assert.equal(M.lotQuantityLabel({ lot_size: null, bulk_lot: true }), '數量待核對');
assert.equal(M.lotQuantityLabel({ lot_size: 0, bulk_lot: true }), '數量待核對');
assert.equal(M.lotQuantityLabel({ lot_size: 1, bulk_lot: true }), '數量待核對');
assert.equal(M.lotQuantityLabel({ lot_size: 1, bulk_lot: false }), '1 輛');
assert.equal(M.lotQuantityLabel({ lot_size: 2, bulk_lot: true }), '2 輛（整批）');

const time = new Date('2026-09-25T12:00:00Z');
const daily = { staleHours: 36 };
assert.deepEqual(M.sourceFreshness([], daily, time), { state: 'missing', latest: null });
assert.deepEqual(M.sourceFreshness([{ last_synced_at: null }], daily, time), { state: 'unknown', latest: null });
assert.equal(M.sourceFreshness([{ last_synced_at: '2026-09-25T06:00:00Z' }], daily, time).state, 'recent');
assert.equal(M.sourceFreshness([{ last_synced_at: '2026-08-27T04:45:00Z' }], daily, time).state, 'stale');
assert.equal(M.sourceFreshness([{ last_synced_at: '2026-08-14T23:27:00Z' }], { staleHours: 72 }, time).state, 'stale');
assert.equal(M.sourceFreshness([{ last_synced_at: '2026-09-26T12:00:00Z' }], daily, time).state, 'unknown');
assert.equal(M.sourceMeta.some((source) => /每日兩次/.test(source.mode)), false);
assert.match(M.sourceMeta.find((source) => source.adapter === 'shwoo').mode, /未納入每日排程/);

M.writeList(M.FAVORITES_KEY, ['kept', 'gone']);
assert.equal(M.pruneList(M.FAVORITES_KEY, ['kept']), true);
assert.deepEqual(M.readList(M.FAVORITES_KEY), ['kept']);

let calls = 0;
global.fetch = async (url) => {
  calls += 1;
  const offset = Number(new URL(url).searchParams.get('offset'));
  const page = offset === 0 ? Array.from({ length: 500 }, (_, index) => ({ id: `row-${index}` })) : [{ id: 'row-500' }];
  return { ok: true, json: async () => page };
};

M.fetchRows().then((rows) => {
  assert.equal(rows.length, 501);
  assert.equal(calls, 2);
  console.log('marketplace tests passed');
});
