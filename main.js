'use strict';

// ==========================================
// 1. 在庫の基本設定
// ==========================================
const STOCK_CONFIG = {
"ハンバーグ弁当": 5,
"唐揚げ弁当": 2,
"生姜焼き弁当": 5,
"カレーライス": 0,
"シーザーサラダ": 5,
};

// ==========================================
// 2. 画面が完全に読み込まれてからプログラムを起動
// ==========================================
window.addEventListener('load', function() {

const qtySelects = document.querySelectorAll('.menu-qty-select');
const totalPriceDisplay = document.getElementById('totalPriceDisplay');
const pickupTimeSelect = document.getElementById('pickupTime');
const orderForm = document.getElementById('orderForm');

// --- 在庫管理から個数の選択肢を画面に作り出すプログラム ---
function initProductStock() {
qtySelects.forEach(function (select) {
const itemName = select.getAttribute('data-name');
const maxStock = STOCK_CONFIG[itemName] !== undefined ? STOCK_CONFIG[itemName] : 5;
const menuItem = select.closest('.menu-item');

if (menuItem) {
const nameDisplay = menuItem.querySelector('.menu-name');
if (maxStock <= 0 && nameDisplay) {
select.disabled = true;
nameDisplay.textContent = itemName + "（売切れ）";
nameDisplay.style.color = "#999";
nameDisplay.style.fontSize = "13px";

const opt = document.createElement('option');
opt.value = 0;
opt.textContent = "0個";
select.appendChild(opt);
return;
}
}

while (select.options.length > 0) {
select.remove(0);
}

const limit = Math.min(maxStock, 5);
for (let i = 0; i <= limit; i++) {
const opt = document.createElement('option');
opt.value = i;
opt.textContent = i + "個";
select.appendChild(opt);
}
});
}

// --- 受け取り時間の選択肢を作り出すプログラム ---
function updatePickupTimeSlots() {
if (!pickupTimeSelect) return;
while (pickupTimeSelect.options.length > 1) {
pickupTimeSelect.remove(1);
}
const now = new Date();
const timeSlotsConfig = [
{ label: "本日 11:30〜12:00", dayOffset: 0, hour: 11, minute: 30 },
{ label: "本日 12:00〜12:30", dayOffset: 0, hour: 12, minute: 0 },
{ label: "本日 17:30〜18:00", dayOffset: 0, hour: 17, minute: 30 },
{ label: "本日 18:00〜18:30", dayOffset: 0, hour: 18, minute: 0 },
{ label: "明日 12:00〜12:30", dayOffset: 1, hour: 12, minute: 0 }
];

timeSlotsConfig.forEach(function (slot) {
const option = document.createElement('option');
option.value = slot.label;
option.textContent = slot.label;
const targetDate = new Date();
targetDate.setDate(now.getDate() + slot.dayOffset);
targetDate.setHours(slot.hour, slot.minute, 0, 0);
const limitTime = new Date(now.getTime() - (30 * 60 * 1000));

if (targetDate < limitTime) {
option.disabled = true;
option.textContent += "（受付終了）";
}
pickupTimeSelect.appendChild(option);
});
}

// --- 金額の合計をリアルタイムに計算するプログラム ---
function calculateTotal() {
let total = 0;
qtySelects.forEach(function (select) {
const price = parseInt(select.getAttribute('data-price')) || 0;
const qty = parseInt(select.value) || 0;
total += price * qty;
});
if (totalPriceDisplay) {
totalPriceDisplay.textContent = "¥" + total.toLocaleString();
}
return total;
}

// イベントリスナーの登録
qtySelects.forEach(function (select) {
select.addEventListener('change', calculateTotal);
});

if (pickupTimeSelect) {
pickupTimeSelect.addEventListener('focus', updatePickupTimeSlots);
}

// 最初に在庫と時間、金額計算を自動実行する
initProductStock();
updatePickupTimeSlots();
calculateTotal();

// ==========================================
// 3. 注文ボタン（送信）が押されたときの処理
// ==========================================
function setupOrderForm() {
if (!orderForm) return;

orderForm.addEventListener('submit', function (e) {
e.preventDefault();

const name = document.getElementById('name').value;
const customerPhone = document.getElementById('phone').value;
const pickupTime = pickupTimeSelect.value;
const total = calculateTotal();

let selectedItemsText = "";
let lineSelectedItemsText = "";
let hasItem = false;

qtySelects.forEach(function (select) {
const qty = parseInt(select.value) || 0;
if (qty > 0) {
const itemName = select.getAttribute('data-name');
selectedItemsText += "・" + itemName + ": " + qty + "個\n";
lineSelectedItemsText += "・" + itemName + ": " + qty + "個\n";
hasItem = true;
}
});

if (!hasItem) {
alert('商品を1つ以上選択してください。');
return;
}
if (!pickupTime) {
alert('受け取り日時を選択してください。');
return;
}

const confirmMessage = "以下の内容で注文を送信（LINE起動）しますか？\n\n" +
"・お名前: " + name + " 様\n" +
"・連絡先: " + customerPhone + "\n" +
"【注文商品】\n" + selectedItemsText +
"・合計金額: ¥" + total.toLocaleString() + "\n" +
"・受取日時: " + pickupTime;

if (!confirm(confirmMessage)) {
return;
}

const messageText = `【テイクアウト注文】\nお名前: ${name} 様\n連絡先: ${customerPhone}\n【商品内容】\n${lineSelectedItemsText}合計: ¥${total.toLocaleString()}\n受取: ${pickupTime}\n\n※このままお店からの返信をお待ちください。`;

liff.sendMessages([
{
type: 'text',
text: messageText
}
])
.then(() => {
alert("注文メッセージを送信しました！");
liff.closeWindow();
})
.catch((err) => {
alert("送信に失敗しました。公式LINEのトーク画面内でお試しください。");
console.error("メッセージ送信エラー:", err);
});
});
}

// ==========================================
// 4. LINEの初期化（すべての機能のあとに安全に実行）
// ==========================================
liff.init({ liffId: "2011383351-oeSaS7vS" })
.then(() => {
console.log("LIFF初期化成功");
if (!liff.isLoggedIn()) {
liff.login();
}
setupOrderForm(); // LINEの準備ができたらボタンの機能を有効化
})
.catch((err) => {
console.log("LINE外で開かれているため、送信機能は待機中です");
setupOrderForm(); // パソコン等のテストでも確認画面が出るように起動
});

}); // windowの閉じカッコ

