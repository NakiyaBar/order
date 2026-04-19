/**
 * NAKIYA BAR オーダーシート用メインスクリプト
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
            tableSelect.innerHTML = '<option value="">選択</option>';
            data.table.forEach(t => {
                tableSelect.innerHTML += `<option>${t[0]}</option>`;
            });

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
    document.getElementById("tableLabel").innerText = t ? `選択中：${t}` : "";
    document.getElementById("menuArea").classList.toggle("hidden", !t);
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
    el.innerHTML = data.map(item => `
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
    el.innerHTML = data.map(item => `
        <label>
          <input type="radio" name="food" value="${item[0]}">
          <div class="card food">
            <div>${item[0]}</div>
          </div>
        </label>`).join("");
}

// モード切り替え：オリジナルカクテル
function toggleOriginal() {
    isOriginal = !isOriginal;
    if (isOriginal) isFood = false; // フードをオフにする
    updateVisibility();
}

// モード切り替え：フード
function toggleFood() {
    isFood = !isFood;
    if (isFood) isOriginal = false; // オリジナルをオフにする
    updateVisibility();
}

// 表示の更新（通常・オリジナル・フードの切り替え）
function updateVisibility() {
    document.getElementById("normalArea").classList.toggle("hidden", isOriginal || isFood);
    document.getElementById("originalArea").classList.toggle("hidden", !isOriginal);
    document.getElementById("foodArea").classList.toggle("hidden", !isFood);
    
    document.getElementById("originalBtn").classList.toggle("active", isOriginal);
    document.getElementById("foodBtn").classList.toggle("active", isFood);
}

// 選択されているラジオボタンの値を取得
function getSelected(n) {
    const el = document.querySelector(`input[name="${n}"]:checked`);
    return el ? el.value : null;
}

// 注文追加処理
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
        if (!l1 || !l2 || !s) return alert("リキュールとサワーを選択してください");
        name = `${l1}${l2}${s === "あり" ? "サワー" : "カクテル"}`;
    }

    const ex = cart.find(i => i.name === name);
    ex ? ex.qty++ : cart.push({ name, qty: 1 });

    // 選択リセット
    document.querySelectorAll('input').forEach(i => i.checked = false);
    checkOrder();
    alert("カートに追加しました");
}

function checkOrder() {
    document.getElementById("orderCheckBtn").disabled = (cart.length === 0);
}

function openCart() {
    const list = document.getElementById("cartList");
    list.innerHTML = cart.map((c, i) => `
    <div class="cart-item">
      <span class="drink-name">${c.name}</span>
      <div class="qty-area">
        <button class="qty-btn" onclick="changeQty(${i},-1)">−</button>
        ${c.qty}
        <button class="qty-btn" onclick="changeQty(${i},1)">＋</button>
        <button class="delete-btn" onclick="removeItem(${i})">削除</button>
      </div>
    </div>`).join("");
    document.getElementById("cartModal").style.display = "block";
}

function closeCart() { document.getElementById("cartModal").style.display = "none"; }
function changeQty(i, d) { cart[i].qty += d; if (cart[i].qty <= 0) cart.splice(i, 1); openCart(); checkOrder(); }
function removeItem(i) { cart.splice(i, 1); openCart(); checkOrder(); }

function sendOrder() {
    const table = document.getElementById("table").value;
    fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({ table, items: cart })
    }).then(() => {
        alert("送信しました");
        cart = [];
        closeCart();
        checkOrder();
    });
}
