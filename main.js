'use strict';



// ★★★ 2. 【店側設定】各商品の「本日の限定販売個数（在庫）」をここで設定します ★★★
// ※ 売り切れたら自動で選択できなくなります。制限しない場合は 999 などを入れてください。
const STOCK_CONFIG = {
    "ハンバーグ弁当": 5, // あと5個売れたら売り切れ
    "唐揚げ弁当": 2, // あと3個売れたら売り切れ
    "生姜焼き弁当": 5, // あと10個売れたら売り切れ
    "カレーライス": 0, // 0個＝最初から売り切れ状態になります
    "シーザーサラダ": 5 // あと8個売れたら売り切れ
};






//////////////////////// この下のコードは触らないでください。////////////////////////////////////





// ★★★ 1. あなたのLINE IDを設定してください ★★★
// const LINE_ACCOUNT_ID = "@あなたのLINEのID";
const LINE_ACCOUNT_ID = "@038tuuna";


const qtySelects = document.querySelectorAll('.menu-qty-select');
const totalPriceDisplay = document.getElementById('totalPriceDisplay');
const pickupTimeSelect = document.getElementById('pickupTime');
const orderForm = document.getElementById('orderForm');





















// 画面を開いた時に在庫状況（STOCK_CONFIG）を見て、選択肢や売切表示を自動調整する関数
function initProductStock() {
    qtySelects.forEach(function (select) {
        const itemName = select.getAttribute('data-name');
        const maxStock = STOCK_CONFIG[itemName] !== undefined ? STOCK_CONFIG[itemName] : 5;

        // 商品名が表示されているHTML要素を取得
        const menuItem = select.closest('.menu-item');
        const nameDisplay = menuItem.querySelector('.menu-name');

        // 在庫が0個（最初から売り切れ）の場合の処理
        if (maxStock <= 0) {
            select.disabled = true;
            nameDisplay.textContent = itemName + "（売切れ）";
            nameDisplay.style.color = "#999";
            nameDisplay.style.fontSize = "13px";
            return;
        }

        // 在庫数（最大5個まで）に合わせて選択肢(option)を動的に作り直す
        while (select.options.length > 0) {
            select.remove(0);
        }

        // 0個から「在庫数の上限（または最大個5）」までの選択肢を作る
        const limit = Math.min(maxStock, 5);
        for (let i = 0; i <= limit; i++) {
            const opt = document.createElement('option');
            opt.value = i;
            opt.textContent = i + "個";
            select.appendChild(opt);
        }
    });
}

// 受け取り時間の選択肢を生成・更新する関数
function updatePickupTimeSlots() {
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

// 初期化の実行
initProductStock();
updatePickupTimeSlots();
pickupTimeSelect.addEventListener('focus', updatePickupTimeSlots);

// 金額を計算する関数
function calculateTotal() {
    let total = 0;
    qtySelects.forEach(function (select) {
        const price = parseInt(select.getAttribute('data-price')) || 0;
        const qty = parseInt(select.value) || 0;
        total += price * qty;
    });
    totalPriceDisplay.textContent = "¥" + total.toLocaleString();
    return total;
}

qtySelects.forEach(function (select) {
    select.addEventListener('change', calculateTotal);
});

// フォーム送信時の処理
orderForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const customerPhone = document.getElementById('phone').value;
    const pickupTime = pickupTimeSelect.value;
    const total = calculateTotal();

    let selectedItemsText = "";
    let hasItem = false;

    qtySelects.forEach(function (select) {
        const qty = parseInt(select.value) || 0;
        if (qty > 0) {
            const itemName = select.getAttribute('data-name');
            selectedItemsText += "・" + itemName + ": " + qty + "個\n";
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

    let lineSelectedItemsText = "";
    qtySelects.forEach(function (select) {
        const qty = parseInt(select.value) || 0;
        if (qty > 0) {
            const itemName = select.getAttribute('data-name');
            lineSelectedItemsText += "・" + itemName + ": " + qty + "個%0a";
        }
    });

    const lineMessage = "【テイクアウト注文】%0aお名前: " + name + " 様%0a連絡先: " + customerPhone + "%0a【商品内容】%0a" + lineSelectedItemsText + "合計: ¥" + total.toLocaleString() + "%0a受取: " + pickupTime + "%0a%0a※このまま送信ボタンを押してください。";
    const link = "https://line.me" + LINE_ACCOUNT_ID + "/?" + lineMessage;

    window.location.href = link;
});







// LIFFの初期化（あとでここにIDを入れます）
liff.init({ liffId: "2011383351-oeSaS7vS" })
    .then(() => {
        if (!liff.isLoggedIn()) {
            liff.login();
        }
    })
    .catch((err) => { console.error(err); });

// ボタンが押された時の処理
function sendOrder() {
    const menu = document.getElementById("menuSelect").value;
    const num = document.getElementById("numSelect").value;
    const time = document.getElementById("timeSelect").value;

    // お店に届く文章の組み立て
    const messageText = `【テイクアウト注文】\n■商品：${menu}\n■個数：${num}\n■受取時間：${time}\n\n※このままお店からの返信をお待ちください。`;

    // ユーザーのLINEからメッセージを送信
    liff.sendMessages([{
        type: 'text',
        text: messageText
    }])
        .then(() => {
            alert("注文メッセージを送信しました！");
            liff.closeWindow(); // 画面を閉じる
        })
        .catch((err) => {
            alert("送信に失敗しました。LINEアプリ内でテストしてください。");
            console.error(err);
        });
}
