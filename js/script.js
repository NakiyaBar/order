Gemini
/**
 * NAKIYA BAR オーダーシート用メインスクリプト
 */

const API_URL = "https://script.google.com/macros/s/AKfycbx3Z88Rj0Qo4HUSKVA-Yc5LHhHiMTYHO54Q-9n6NbXqGAdOYx9HOAHGaIKriWfBd8vN/exec";

let cart = [];
let isOriginal = false;
let isFood = false;

window.addEventListener('DOMContentLoaded', () => {
    fetch(API_URL)
        .then(r => r.json())
        .then(data => {
            const tableSelect = document.getElementById("table");
            if (tableSelect) {
                tableSelect.innerHTML = '<option value="">選択</option>';
                // 卓：1行目を飛ばして2行目から反映
                if (data.table) {
                    data.table.slice(1).forEach(t => {
                        tableSelect.innerHTML += `<option>${t[0]}</option>`;
                    });
                }
            }

            // 各エリアの描画（GASから届いたデータをそのまま渡す）
            render("l1Area", "l1", data.liqueur);
            render("l2Area", "l2", data.liqueur);
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

// 汎用描画関数：2行目（index 1）から表示
function render(id, name, data) {
    const el = document.getElementById(id);
    if (!el || !data) return;
    el.innerHTML = data.slice(1).map(item => {
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

// オリジナルカクテル：2行目（index 1）から表示
function renderOriginal(data) {
    const el = document.getElementById("originalList");
    if (!el || !data) return;
    el.innerHTML = data.slice(1).map(item => `
        <label>
          <input type="radio" name="original" value="${item[0]}">
          <div class="card">
            <div>${item[0]}</div>
            <div style="font-size:10px;">${item[1] || ''}</div>
          </div>
        </label>`).join("");
}

// フード：2行目（index 1）から表示
function renderFood(data) {
    const el = document.getElementById("foodList");
    if (!el || !data) return;
    
    // slice(1)で1行目の「フード名」を飛ばし、空行を除外
    const foodItems = data.slice(1).filter(item => item[0] && item[0].toString().trim() !== "");

    el.innerHTML = foodItems.map(item => `
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

    // 切り替え時にラジオボタンの選択をリセット（青枠が残らないようにする）
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

function addToCart() {
    let name = "";
    if (isOriginal) {
        const o = getSelected("original");
        if (!o) return alert("カクテルを選択してください");
        name = "【オリ】" + o;
    } else if (isFood) {
        const f = getSelected("food");
        if (!f) return alert("フードを選択してください");
        name = "【フード】" + f;
    } else {
        const l1 = getSelected("l1"), l2 = getSelected("l2"), s = getSelected("sour");
        if (!l1 || !l2 || !s) return alert("メニューをすべて選択してください");
        name = `${l1}${l2}${s === "あり" ? "サワー" : "カクテル"}`;
    }

    const ex = cart.find(i => i.name === name);
    ex ? ex.qty++ : cart.push({ name, qty: 1 });

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
        <span class="qty-num" style="min-width:24px; text-align:center;">${c.qty}</span>
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
    const btn = document.getElementById("sendBtn");
    if (!table) return alert("卓を選択してください");
    btn.disabled = true;
    btn.innerText = "送信中...";

    fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({ table, items: cart })
    })
    .then(() => {
        alert("送信完了しました");
        cart = [];
        closeCart();
        checkOrder();
        btn.innerText = "送信";
        btn.disabled = false;
    })
    .catch(() => {
        alert("送信に失敗しました");
        btn.disabled = false;
        btn.innerText = "送信";
    });
}
script.js
「script.js」を表示しています。
