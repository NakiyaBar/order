/**
 * NAKIYA BAR オーダーシート用メインスクリプト
 */

const API_URL = "https://script.google.com/macros/s/AKfycbwmCtWbn6-qJCWmqLuF8M59Fe4wXFt7fZMgISbW_sa_I754O7FLymRr4aHmRs0bSMen/exec";

let cart = [];
let isOriginal = false;
let isFood = false;

window.addEventListener('DOMContentLoaded', () => {
    fetch(API_URL)
        .then(r => r.json())
        .then(data => {
            const tableSelect = document.getElementById("table");
            if (tableSelect && data.table) {
                tableSelect.innerHTML = '<option value="">選択</option>';
                // 卓：1行目が「卓名」なら slice(1)、最初からデータなら slice(0)
                data.table.slice(1).forEach(t => {
                    if(t[0]) tableSelect.innerHTML += `<option>${t[0]}</option>`;
                });
            }

            // 【追加】「担当名」シートから届いたデータを反映
            const staffSelect = document.getElementById("staff");
            if (staffSelect && data.staff) {
                staffSelect.innerHTML = '<option value="">選択</option>';
                // A2セルからデータが始まるため slice(1) で1行目を飛ばす
                data.staff.slice(1).forEach(s => {
                    if(s[0]) staffSelect.innerHTML += `<option>${s[0]}</option>`;
                });
            }

            // 各メニューの描画
            // 画像を見る限り、1行目から中身があるので slice(0) または filter で空行を除去して表示
            renderMenu("l1Area", "l1", data.liqueur);
            renderMenu("l2Area", "l2", data.liqueur);
            renderOriginal(data.original);
            renderFood(data.food);
            checkOrder();
        })
        .catch(err => console.error("データ取得エラー:", err));
});

function onTableSelect() {
    const t = document.getElementById("table").value;
    const label = document.getElementById("tableLabel");
    const menu = document.getElementById("menuArea");
    if (label) label.innerText = t ? `選択中：${t}` : "";
    if (menu) menu.classList.toggle("hidden", !t);
}

function getColorClass(name) {
    const colors = { "紅": "red", "翠": "green", "累": "white", "蒼": "blue", "黎": "black" };
    return colors[name] || "";
}

// 共通描画：1行目が項目名（リキュール名など）なら飛ばし、データなら出す
function renderMenu(id, name, data) {
    const el = document.getElementById(id);
    if (!el || !data) return;
    
    // 空行を除去し、もし1行目が「リキュール名」などの見出しなら除外
    const items = data.filter(item => item[0] && !item[0].includes("名") && item[0] !== "");

    el.innerHTML = items.map(item => {
        const color = getColorClass(item[0]);
        return `
        <label>
          <input type="radio" name="${name}" value="${item[0]}">
          <div class="card ${color}">
            <div>${item[0]}</div>
            <div style="font-size:10px;">${item[1] || ''}</div>
          </div>
        </label>`;
    }).join("");
}

function renderOriginal(data) {
    const el = document.getElementById("originalList");
    if (!el || !data) return;
    const items = data.filter(item => item[0] && !item[0].includes("カクテル名") && item[0] !== "");
    el.innerHTML = items.map(item => `
        <label>
          <input type="radio" name="original" value="${item[0]}">
          <div class="card">
            <div>${item[0]}</div>
            <div style="font-size:10px;">${item[1] || ''}</div>
          </div>
        </label>`).join("");
}

function renderFood(data) {
    const el = document.getElementById("foodList");
    if (!el || !data) return;
    const items = data.filter(item => item[0] && !item[0].includes("フード名") && item[0] !== "");
    el.innerHTML = items.map(item => `
        <label>
          <input type="radio" name="food" value="${item[0]}">
          <div class="card">
            <div>${item[0]}</div>
          </div>
        </label>`).join("");
}

function toggleOriginal() {
    isOriginal = !isOriginal;
    if (isOriginal) isFood = false;
    updateVisibility();
}

function toggleFood() {
    isFood = !isFood;
    if (isFood) isOriginal = false;
    updateVisibility();
}

function updateVisibility() {
    document.getElementById("normalArea").classList.toggle("hidden", isOriginal || isFood);
    document.getElementById("originalArea").classList.toggle("hidden", !isOriginal);
    document.getElementById("foodArea").classList.toggle("hidden", !isFood);
    document.getElementById("originalBtn").classList.toggle("active", isOriginal);
    document.getElementById("foodBtn").classList.toggle("active", isFood);
    document.querySelectorAll('input[type="radio"]').forEach(i => i.checked = false);
}

function getSelected(n) {
    const el = document.querySelector(`input[name="${n}"]:checked`);
    return el ? el.value : null;
}

function checkOrder() {
    const btn = document.getElementById("orderCheckBtn");
    if (btn) btn.disabled = cart.length === 0;
}

// 【修正箇所①】カートに追加する際に読み方も保存する
function addToCart() {
    let name = "";
    let ruby = ""; // 読み方用の変数を追加

    if (isOriginal) {
        const el = document.querySelector('input[name="original"]:checked');
        if (!el) return alert("カクテルを選択してください");
        name = "【オリ】" + el.value;
        // オリジナルも読み方（2列目）があれば取得するように変更検討可
    } else if (isFood) {
        const el = document.querySelector('input[name="food"]:checked');
        if (!el) return alert("フードを選択してください");
        name = "【フード】" + el.value;
    } else {
        const l1El = document.querySelector('input[name="l1"]:checked');
        const l2El = document.querySelector('input[name="l2"]:checked');
        const s = getSelected("sour");

        if (!l1El || !l2El || !s) return alert("メニューをすべて選択してください");

        // 読み方（カード内の隠し属性や、直接DOMから取得）
        // ここでは一番確実な「選択されたカード内のテキスト」から取得するロジックにします
        const l1Name = l1El.value;
        const l1Ruby = l1El.parentElement.querySelector('div[style*="font-size:10px"]').innerText;
        const l2Name = l2El.value;
        const l2Ruby = l2El.parentElement.querySelector('div[style*="font-size:10px"]').innerText;

        name = `${l1Name}${l2Name}${s === "あり" ? "サワー" : "カクテル"}`;
        ruby = `（${l1Ruby}${l2Ruby}）`; // 読み方をセット
    }

    // カートに「名前 + 読み方」で登録する
    const fullName = name + (ruby ? " " + ruby : "");
    const ex = cart.find(i => i.name === fullName);
    ex ? ex.qty++ : cart.push({ name: fullName, qty: 1 });

    document.querySelectorAll('input[type="radio"]').forEach(i => i.checked = false);
    checkOrder();
    alert("カートに追加しました");
}
function openCart() {
    const list = document.getElementById("cartList");
    if (!list) return;
    list.innerHTML = cart.map((c, i) => `
    <div class="cart-item">
      <button class="delete-btn" onclick="removeItem(${i})">削除</button>
      <span class="drink-name">${c.name}</span>
      <div class="qty-area">
        <button class="qty-btn" onclick="changeQty(${i},-1)">−</button>
        <span class="qty-num">${c.qty}</span>
        <button class="qty-btn" onclick="changeQty(${i},1)">＋</button>
      </div>
    </div>`).join("");
    document.getElementById("cartModal").style.display = "block";
}

function closeCart() { document.getElementById("cartModal").style.display = "none"; }
function changeQty(i, d) { cart[i].qty += d; if (cart[i].qty <= 0) cart.splice(i, 1); openCart(); checkOrder(); }
function removeItem(i) { cart.splice(i, 1); openCart(); checkOrder(); }

function sendOrder() {
    const table = document.getElementById("table").value;
    const staff = document.getElementById("staff").value;
    const btn = document.getElementById("sendBtn");

    if (!table) return alert("卓を選択してください");
    if (!staff) return alert("担当を選択してください");
if (cart.length === 0) return alert("カートが空です");

    if (btn.disabled) return;
    btn.disabled = true;
    btn.innerText = "送信中...";

    fetch(API_URL, {
        method: "POST",
        // body の中に table と items に並べて staff も追加します
        body: JSON.stringify({ 
            table: table, 
            staff: staff, // 【追加】GAS側に担当者名を送る
            items: cart 
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.result === "success") {
            alert("送信完了しました");
            cart = [];
            closeCart();
            checkOrder();
        } else {
            alert("送信エラー: " + data.message);
        }

        btn.innerText = "送信";
        btn.disabled = false;
    })
    .catch(err => {
        console.error(err);
        alert("通信エラー");
        btn.innerText = "送信";
        btn.disabled = false;
    });
}
