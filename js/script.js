/**
 * NAKIYA BAR オーダーシート用メインスクリプト
 * ポップアップレイアウト微調整版
 */

const API_URL = "https://script.google.com/macros/s/AKfycbx3Z88Rj0Qo4HUSKVA-Yc5LHhHiMTYHO54Q-9n6NbXqGAdOYx9HOAHGaIKriWfBd8vN/exec";

let cart = [];
let isOriginal = false;
let isFood = false;

// 初期化：ページ読み込み完了時に実行
window.addEventListener('DOMContentLoaded', () => {
    fetch(API_URL)
        .then(r => r.json())
        .then(data => {
            // 卓リストの反映
            const tableSelect = document.getElementById("table");
            if (tableSelect) {
                tableSelect.innerHTML = '<option value="">選択</option>';
                data.table.forEach(t => {
                    tableSelect.innerHTML += `<option>${t[0]}</option>`;
                });
            }

            // 各メニューの描画
            render("l1Area", "l1", data.liqueur);
            render("l2Area", "l2", data.liqueur);
            renderOriginal(data.original);
            renderFood(data.food);
            checkOrder();
        })
        .catch(err => console.error("データ取得エラー:", err));
});

// 卓選択時の表示切り替え
function onTableSelect() {
    const t = document.getElementById("table").value;
    const label = document.getElementById("tableLabel");
    const menu = document.getElementById("menuArea");
    
    if (label) label.innerText = t ? `選択中：${t}` : "";
    if (menu) menu.classList.toggle("hidden", !t);
}

// リキュールのボタン描画
function render(id, name, data) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = data.map(item => {
        const color = (item[0] === "紅") ? "red" : (item[0] === "翠") ? "green" : (item[0] === "累") ? "white" : (item[0] === "蒼") ? "blue" : (item[0] === "黎") ? "black" : "";
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

// オリジナルカクテルのボタン描画
function renderOriginal(data) {
    const el = document.getElementById("originalList");
    if (!el) return;
    const originalItems = data.slice(1);
    el.innerHTML = originalItems.map(item => `
        <label>
          <input type="radio" name="original" value="${item[0]}">
          <div class="card">
            <div>${item[0]}</div>
            <div style="font-size:10px;">${item[1] || ''}</div>
          </div>
        </label>`).join("");
}

// フードのボタン描画
function renderFood(data) {
    const el = document.getElementById("foodList");
    if (!el) return;
    const foodItems = data.slice(1); 
    el.innerHTML = foodItems.map(item => `
        <label>
          <input type="radio" name="food" value="${item[0]}">
          <div class="card food">
            <div>${item[0]}</div>
          </div>
        </label>`).join("");
}

// モード切り替え
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
    const normalArea = document.getElementById("normalArea");
    const originalArea = document.getElementById("originalArea");
    const foodArea = document.getElementById("foodArea");

    if (!normalArea || !originalArea || !foodArea) return;

    normalArea.classList.add("hidden");
    originalArea.classList.add("hidden");
    foodArea.classList.add("hidden");

    if (isOriginal) {
        originalArea.classList.remove("hidden");
    } else if (isFood) {
        foodArea.classList.remove("hidden");
    } else {
        normalArea.classList.remove("hidden");
    }
    
    const oBtn = document.getElementById("originalBtn");
    const fBtn = document.getElementById("foodBtn");
    if (oBtn) oBtn.classList.toggle("active", isOriginal);
    if (fBtn) fBtn.classList.toggle("active", isFood);
}

function getSelected(n) {
    const el = document.querySelector(`input[name="${n}"]:checked`);
    return el ? el.value : null;
}

// 注文追加
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
        if (!l1 || !l2 || !s) return alert("メニューを選択してください");
        name = `${l1}${l2}${s === "あり" ? "サワー" : "カクテル"}`;
    }

    const ex = cart.find(i => i.name === name);
    if (ex) {
        ex.qty++;
    } else {
        cart.push({ name, qty: 1 });
    }

    document.querySelectorAll('input[type="radio"]').forEach(i => i.checked = false);
    checkOrder();
    alert("カートに追加しました");
}

function checkOrder() {
    const orderBtn = document.getElementById("orderCheckBtn");
    if (orderBtn) orderBtn.disabled = (cart.length === 0);
}

// ★カート（ポップアップ）表示の微調整
function openCart() {
    const list = document.getElementById("cartList");
    if (!list) return;

    if (cart.length === 0) {
        list.innerHTML = "<p style='text-align:center;'>カートは空です</p>";
    } else {
        // 画像2枚目にあわせて：[削除] [商品名] [- 数量 +] の順で横並びに
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
    }
    
    const modal = document.getElementById("cartModal");
    if (modal) modal.style.display = "block";
}

function closeCart() { 
    const modal = document.getElementById("cartModal");
    if (modal) modal.style.display = "none"; 
}

function changeQty(i, d) { 
    cart[i].qty += d; 
    if (cart[i].qty <= 0) cart.splice(i, 1); 
    openCart(); 
    checkOrder(); 
}

function removeItem(i) { 
    cart.splice(i, 1); 
    openCart(); 
    checkOrder(); 
}

// 送信処理
function sendOrder() {
    const table = document.getElementById("table");
    const btn = document.getElementById("sendBtn");

    if (!table.value) return alert("卓を選択してください");
    if (cart.length === 0) return alert("カートが空です");

    if(btn.disabled) return;
    btn.disabled = true;
    const originalText = btn.innerText;
    btn.innerText = "送信中...";

    fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({ table: table.value, items: cart })
    })
    .then(res => res.text())
    .then(res => {
        if(res === "ok"){
            alert("送信完了！");
            cart = [];
            closeCart();
            checkOrder();
        } else {
            alert("エラー：" + res);
        }
    })
    .catch(() => alert("通信に失敗しました"))
    .finally(() => {
        btn.disabled = false;
        btn.innerText = originalText;
    });
}
