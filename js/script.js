/**
 * NAKIYA BAR オーダーシート用メインスクリプト
 */

/* GoogleスプレットシートのマクロURL */
const API_URL = "https://script.google.com/macros/s/AKfycbx3Z88Rj0Qo4HUSKVA-Yc5LHhHiMTYHO54Q-9n6NbXqGAdOYx9HOAHGaIKriWfBd8vN/exec";

/* カート（注文済カクテルAry） */
let cart= [];

/* オリジナルカクテル用フラグ */
let isOriginal= false;

/**
 * 初期化処理
 * TODO このままだとこのファイルが読まれたときに必ず動くので、
 *      初期化処理は関数化して、HTMLファイル側で呼び出した方がよさそう。
 */
fetch(API_URL)
    .then(r=>r.json())
    .then(data=>{
        table.innerHTML='<option value="">選択</option>';
        data.table.forEach(t=>{
            table.innerHTML+=`<option>${t[0]}</option>`;
        });

        render("l1Area","l1",data.liqueur);
        render("l2Area","l2",data.liqueur);
        renderOriginal(data.original);
        checkOrder();
    });


/**
 * 選択した卓の値を保持。
 */
function onTableSelect(){
    const t = table.value;
    tableLabel.innerText = t?`選択中：${t}`:"";
    menuArea.classList.toggle("hidden",!t);
}

/**
 *  リキュールの色を元に適したクラス名を返却。
 *  該当するクラスが存在しない場合、空文字を返却。
 *
 *  @param  name リキュール名
 *  @return クラス名
 */
function getColorClass(name){
    if(name==="紅") return "red";
    if(name==="翠") return "green";
    if(name==="累") return "white";
    if(name==="蒼") return "blue";
    if(name==="黎") return "black";
    return "";
}

/**
 * リキュールの色に応じて、ボタンのHTMLを挿入
 *
 * @param   id      挿入先のタグid
 * @param   name    ボタンに指定する値
 * @param   data    スプレットシートから受け取ったデータ
 */
function render(id,name,data){
    const el=document.getElementById(id);
    el.innerHTML="";

    // TODO 重くなる原因なので、interHTMLやめたい。いい方法見つかるまではそのままで
    data.forEach(item=>{
        const color= getColorClass(item[0]);

        el.innerHTML+=`
    <label>
      <input type="radio" name="${name}" value="${item[0]}">
      <div class="card ${color}">
        <div>${item[0]}</div>
        <div>${item[1]}</div>
      </div>
    </label>`;
    });
}

/**
 * オリジナルカクテル用のボタンHTMLを挿入
 *
 * @param   data    スプレットシートから受け取ったデータ
 */
function renderOriginal(data){
    originalList.innerHTML="";

    // TODO 重くなる原因なので、interHTMLやめたい。いい方法見つかるまではそのままで
    data.forEach(item=>{
        originalList.innerHTML+=`
    <label>
      <input type="radio" name="original" value="${item[0]}" onchange="selectOriginalEffect(this)">
      <div class="card">
        <div>${item[0]}</div>
        <div>${item[1]}</div>
      </div>
    </label>`;
    });
}

/**
 * 選択したボタンにエフェクト付与（選択したという色を着ける）処理
 *
 * @param   el  選択中したボタン情報
 */
function selectOriginalEffect(el){
    el.nextElementSibling.style.boxShadow="0 0 10px #4cafef";
}

/**
 *  オリジナルカクテル用のメニュー表示・非表示切替処理
 */
function toggleOriginal(){
    isOriginal=!isOriginal;

    // 通常カクテルメニューエリアの表示・非表示切替
    normalArea.classList.toggle("hidden",isOriginal);

    // オリジナルカクテルメニューエリアの表示・非表示切替
    originalArea.classList.toggle("hidden",!isOriginal);

    // オリジナルカクテルボタンの有効・無効切替
    originalBtn.classList.toggle("active",isOriginal);
}

/**
 * 各種ボタンの選択状態から、メニューの値を返却
 *
 * @param   n   ボタンの選択状態を返却
 * @return　メニューの選択肢を返却
 */
function getSelected(n){
    const el=document.querySelector(`input[name="${n}"]:checked`);
    return el?el.value:null;
}

/**
 *  カート内のオーダー状況に応じ、注文確認ボタンを有効・無効を切替
 */
function checkOrder(){
    if (cart.length === 0) {
        // カート内にオーダーがない場合
        // 注文確認ボタンを無効化
        document.getElementById("orderCheckBtn").setAttribute("disabled", true);
    } else {
        // カート内にオーダーがある場合
        // 注文確認ボタンを有効化
        document.getElementById("orderCheckBtn").removeAttribute("disabled");
    }
}

/**
 * カートへ選択したメニューを追加
 */
function addToCart(){
    // 初期化
    let name="";

    if (isOriginal) {
        // オリジナルカクテルメニューの場合
        // オリジナルカクテルメニューの選択状態を取得
        const o=　getSelected("original");

        // メニュー選択チェック処理
        if(!o) {
            return alert("オリジナルカクテルを選択してください！！");
        }

        name = o;

    } else {
        // 通常カクテルメニューの場合
        // リキュール１メニューの選択状態を取得
        const l1= getSelected("l1");
        // リキュール２メニューの選択状態を取得
        const l2= getSelected("l2");
        // サワーのありなしメニューの選択状態を取得
        const s= getSelected("sour");

        // メニュー選択チェック処理
        if(!l1||!l2||!s){
            return alert("リキュールとサワーのありなしを選択してください！！");
        }

        // サワーの選択状態で、サワーかカクテルかをチェック
        const type = (s==="あり") ? "サワー" : "カクテル";

        name=`${l1}${l2}${type}`;
    }

    const ex = cart.find(i=>i.name===name);
    ex?ex.qty++:cart.push({name,qty:1});

    // メニューボタン選択状態をリセット
    // TODO forEachを使うか要確認。これだとただ重くなるだけな気がしてる。
    document.querySelectorAll("input").forEach(i=>i.checked=false);

    // 🔥ここ重要
    // TODO 上のforEachと合わせて修正。forEachを使用してるのが原因で、
    //      消す必要のないオリジナルカクテルボタンの有効状態もリセットされてる。
    if(isOriginal){
        toggleOriginal();
    }

    // カートの内容チェック
    checkOrder();
}

/**
 * カートの内容をダイアログ表示する
 */
function openCart(){
    cartList.innerHTML = "";

    // TODO 重くなる原因なので、interHTMLやめたい。いい方法見つかるまではそのままで
    cart.forEach((c,i)=>{
        cartList.innerHTML+=`
    <div class="cart-item">
      <button class="delete-btn" onclick="removeItem(${i})">削除</button>
      <span class="drink-name">${c.name}</span>
      <div class="qty-area">
        <button class="qty-btn" onclick="changeQty(${i},-1)">−</button>
        ${c.qty}
        <button class="qty-btn" onclick="changeQty(${i},1)">＋</button>
      </div>
    </div>`;
    });

    cartModal.style.display = "block";

    // TODO ここのチェック処理、実はいらないかも？
    checkOrder();
}

/**
 * 表示中のカート内容ダイアログを閉じる
 */
function closeCart(){
    cartModal.style.display = "none";
}

/**
 * カート内のメニュー個数変更処理
 *
 * @param   i   メニュー（上から何番目のメニューか）
 * @param   d   メニュー増減数（減らす場合はマイナスの値を渡す）
 */
function changeQty(i,d){
    // メニュー増減
    cart[i].qty += d;

    // 個数0以下になったら、メニュー項目ごと削除
    if (cart[i].qty<=0) {
        cart.splice(i,1);
    }

    // TODO カートの状態確認してからHTML組み直してそう。メニューが増えると処理が急激に重くなるかもしれない
    openCart();
}

/**
 *　カート内のメニュー削除処理
 *
 * @param   i   メニュー（上から何番目のメニューか）
 */
function removeItem(i){
    // メニュー項目ごと削除
    cart.splice(i,1);

    // TODO カートの状態確認してからHTML組み直してそう。メニューが増えると処理が急激に重くなるかもしれない
    openCart();
}

/**
 * オーダー送信。GoogleスプレットシートのマクロURLを呼び出す。
 */
function sendOrder(){
    fetch(API_URL,{
        method:"POST",
        body:JSON.stringify({
            table:table.value,
            items:cart
        })
    }).then(()=>{
        cart=[];
        closeCart();
        checkOrder();
    });
}