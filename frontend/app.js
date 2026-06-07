const BACKEND_BASE_URL = ""

// Предустановленные сценарии для быстрой загрузки примеров
const SCENARIOS = {
    textbook: {
        name: "Учебник: монополия",
        description: "Классика из учебника. Один покупатель, MB = 10 − (k−1). Фирма A — единая цена p=6, MC=2. Попробуй изменить p и посмотри как меняются Profit, CS и DWL.",
        firmA: { mode: "uniform", params: { p: 6 }, mc: 2, capacity: 20 },
        firmB: { mode: "uniform", params: { p: 6 }, mc: 2, capacity: 20 },
        buyers: [
            { factory: "A", segment: "A", money: 1000, target_stock: 8, stock: 0, demand_type: "linear", a: 10, b: 1 }
        ]
    },
    segments: {
        name: "Три сегмента",
        description: "Три покупателя из сегментов A, B, C. Фирма A — PD3 с разными ценами по сегментам. Переключи на Uniform и сравни — видно как фирма теряет выручку при одной цене.",
        firmA: { mode: "pd3", params: { segment_prices: { A: 8, B: 5, C: 3 } }, mc: 1, capacity: 50 },
        firmB: { mode: "uniform", params: { p: 5 }, mc: 1, capacity: 50 },
        buyers: [
            { factory: "A", segment: "A", money: 1000, target_stock: 5, stock: 0, demand_type: "linear", a: 12, b: 2 },
            { factory: "A", segment: "B", money: 1000, target_stock: 5, stock: 0, demand_type: "linear", a: 8,  b: 1 },
            { factory: "A", segment: "C", money: 1000, target_stock: 6, stock: 0, demand_type: "linear", a: 5,  b: 0.5 }
        ]
    },
    twofirms: {
        name: "PD1 vs Uniform",
        description: "Одинаковые пары покупателей на двух заводах. Фирма A (PD1) забирает весь CS, DWL=0. Фирма B (Uniform) оставляет часть CS покупателям, но теряет в эффективности.",
        firmA: { mode: "pd1", params: {}, mc: 2, capacity: 30 },
        firmB: { mode: "uniform", params: { p: 5 }, mc: 2, capacity: 30 },
        buyers: [
            { factory: "A", segment: "A", money: 1000, target_stock: 6, stock: 0, demand_type: "linear", a: 12, b: 2 },
            { factory: "A", segment: "B", money: 1000, target_stock: 6, stock: 0, demand_type: "linear", a: 8,  b: 1.5 },
            { factory: "B", segment: "A", money: 1000, target_stock: 6, stock: 0, demand_type: "linear", a: 12, b: 2 },
            { factory: "B", segment: "B", money: 1000, target_stock: 6, stock: 0, demand_type: "linear", a: 8,  b: 1.5 }
        ]
    },
    twotariff: {
        name: "Двухчастный тариф",
        description: "Фирма A — PD2: взнос F=8 + цена p=2 за единицу. Фирма B — единая цена p=5. Взнос F съедает CS покупателя, но низкая p побуждает покупать больше.",
        firmA: { mode: "pd2", params: { F: 8, p: 2 }, mc: 1, capacity: 30 },
        firmB: { mode: "uniform", params: { p: 5 }, mc: 1, capacity: 30 },
        buyers: [
            { factory: "A", segment: "A", money: 1000, target_stock: 6, stock: 0, demand_type: "linear", a: 10, b: 1.5 },
            { factory: "A", segment: "A", money: 1000, target_stock: 6, stock: 0, demand_type: "linear", a: 9,  b: 1.5 },
            { factory: "B", segment: "B", money: 1000, target_stock: 6, stock: 0, demand_type: "linear", a: 10, b: 1.5 },
            { factory: "B", segment: "B", money: 1000, target_stock: 6, stock: 0, demand_type: "linear", a: 9,  b: 1.5 }
        ]
    }
};

// Полные названия режимов для отображения в интерфейсе
const MODE_NAMES = {
    uniform: "Uniform",
    pd1:     "PD1 — первая степень",
    pd2:     "PD2 — двухчастный тариф",
    pd3:     "PD3 — третья степень"
};

// Короткие метки для снапшотов и компактных блоков
const MODE_SHORT = {
    uniform: "Uniform",
    pd1:     "PD1",
    pd2:     "PD2",
    pd3:     "PD3"
};

// Тексты подсказок при наведении на метрики в блоке итогов
const METRIC_TOOLTIPS = {
    Q:       "Q — суммарный объем покупок всех покупателей у этой фирмы",
    Revenue: "Revenue = Σ T(q) — суммарная выручка фирмы (все платежи покупателей)",
    Profit:  "Profit = Revenue − MC·Q — прибыль фирмы после переменных издержек",
    CS:      "CS = Σ [V(q) − T(q)] — потребительский излишек: что покупатели получили сверх уплаченного",
    PS:      "PS = Profit — производительный излишек (в этой модели совпадает с прибылью)",
    W:       "W = CS + PS — общественное благосостояние",
    W_eff:   "W_eff — максимальное благосостояние при P=MC (конкурентный рынок). Эталон для DWL.",
    DWL:     "DWL = W_eff − W — потери благосостояния из-за монопольного ценообразования. Цель — минимизировать."
};


// DOM-ссылки на основные элементы интерфейса
const runBtn               = document.getElementById("run-btn");
const downloadBtn          = document.getElementById("download-btn");
const resultBox            = document.getElementById("result-box");
const tabButtons           = document.querySelectorAll(".tab-btn");
const tabContents          = document.querySelectorAll(".tab-content");
const buyersList           = document.getElementById("buyers-list");
const addBuyerBtn          = document.getElementById("add-buyer-btn");
const toggleReportBtn      = document.getElementById("toggle-report-btn");
const chartsContainer      = document.getElementById("charts-container");
const buyersTableContainer = document.getElementById("buyers-table-container");
const compareBtn           = document.getElementById("compare-btn");
const advancedToggle       = document.getElementById("advanced-mode-toggle");
const saveSnapshotBtn      = document.getElementById("save-snapshot-btn");
const snapClearBtn         = document.getElementById("snap-clear-btn");
const snapshotsContainer   = document.getElementById("snapshots-container");


// Глобальное состояние приложения
let lastReportText  = "";
let buyerCounter    = 1;
let buyers          = [];
let welfareChart    = null;
let buyersChart     = null;
let compareChart    = null;
let snapChart       = null;
let hasRunOnce      = false;
const buyerPositions = {};

// Состояние снапшотов - хранит до 5 результатов для сравнения
let snapshots       = [];
let snapshotCounter = 0;
let lastDataA       = null;
let lastDataB       = null;
let lastModeA       = "uniform";
let lastModeB       = "uniform";


// Помечает кнопку запуска как "требует перезапуска" после изменения параметров
function setDirty() {
    if (!hasRunOnce) return;
    runBtn.classList.add("run-btn--dirty");
    runBtn.textContent = "↺ Параметры изменились — перезапусти";
}

// Сбрасывает метку dirty после успешного запуска симуляции
function setClean() {
    hasRunOnce = true;
    runBtn.classList.remove("run-btn--dirty");
    runBtn.textContent = "Запустить симуляцию";
}


// Считывает текущее состояние формы фирмы (режим, MC, мощность, параметры цен)
function captureFirmState(suffix) {
    const mode     = document.getElementById(`pricing-mode-${suffix}`).value;
    const mc       = parseFloat(document.getElementById(`mc-${suffix}`).value);
    const capacity = parseInt(document.getElementById(`capacity-${suffix}`).value);
    let params = {};
    if (mode === "uniform") {
        params.p = parseFloat(document.getElementById(`param-p-${suffix}`)?.value || 4);
    } else if (mode === "pd2") {
        params.F = parseFloat(document.getElementById(`param-F-${suffix}`)?.value || 5);
        params.p = parseFloat(document.getElementById(`param-p-${suffix}`)?.value || 3);
    } else if (mode === "pd3") {
        params.segment_prices = {
            A: parseFloat(document.getElementById(`param-pA-${suffix}`)?.value || 3),
            B: parseFloat(document.getElementById(`param-pB-${suffix}`)?.value || 5),
            C: parseFloat(document.getElementById(`param-pC-${suffix}`)?.value || 7)
        };
    }
    return { mode, mc, capacity, params };
}

// Считывает все данные одного покупателя из его формы по ID
function collectOneBuyerData(id) {
    const demandType = document.getElementById(`b${id}-demand_type`)?.value || "linear";
    const data = {
        factory:      document.getElementById(`b${id}-factory`)?.value     || "A",
        segment:      document.getElementById(`b${id}-segment`)?.value     || "A",
        a:            parseFloat(document.getElementById(`b${id}-a`)?.value       || 10),
        b:            parseFloat(document.getElementById(`b${id}-b`)?.value       || 2),
        target_stock: parseInt(document.getElementById(`b${id}-target_stock`)?.value || 5),
        money:        parseFloat(document.getElementById(`b${id}-money`)?.value   || 1000),
        stock:        parseInt(document.getElementById(`b${id}-stock`)?.value     || 0),
        demand_type:  demandType
    };
    if (demandType === "inverse_square") {
        data.A = parseFloat(document.getElementById(`b${id}-A`)?.value || 20);
    } else if (demandType === "step") {
        const raw = document.getElementById(`b${id}-values`)?.value || "";
        data.values = raw.split(",").map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
    }
    return data;
}

// Сохраняет текущее состояние формы в localStorage для восстановления при перезагрузке
function saveState() {
    try {
        const state = {
            firmA: captureFirmState("a"),
            firmB: captureFirmState("b"),
            buyers: buyers.map(b => collectOneBuyerData(b.id))
        };
        localStorage.setItem("mss_state", JSON.stringify(state));
    } catch (e) {}
}

// Заполняет форму фирмы из сохраненного объекта состояния
function restoreFirmState(firmState, suffix) {
    document.getElementById(`pricing-mode-${suffix}`).value = firmState.mode || "uniform";
    document.getElementById(`mc-${suffix}`).value            = firmState.mc   || 2;
    document.getElementById(`capacity-${suffix}`).value      = firmState.capacity || 20;
    renderPricingParams(firmState.mode || "uniform", suffix);
    setFirmParams(firmState, suffix);
}

// Восстанавливает состояние из localStorage; возвращает false если сохранения нет
function loadSavedState() {
    try {
        const raw = localStorage.getItem("mss_state");
        if (!raw) return false;
        const state = JSON.parse(raw);
        if (!state || !Array.isArray(state.buyers) || state.buyers.length === 0) return false;
        if (state.firmA) restoreFirmState(state.firmA, "a");
        if (state.firmB) restoreFirmState(state.firmB, "b");
        state.buyers.forEach(data => addBuyer(data));
        return true;
    } catch (e) {
        return false;
    }
}


// Клиентский аналог demand.py: MB(k) для мини-графика без запроса к серверу
function mbJS(demandType, params, k) {
    if (k <= 0) return 0;
    if (demandType === "linear")
        return Math.max((params.a || 0) - (params.b || 0) * (k - 1), 0);
    if (demandType === "inverse_square")
        return (params.A || 20) / (k * k);
    if (demandType === "step") {
        const vals = params.values || [];
        return k <= vals.length ? (vals[k - 1] || 0) : 0;
    }
    return 0;
}

// Показывает/скрывает дополнительные поля в зависимости от типа спроса
function renderDemandParams(buyerId, demandType) {
    const container = document.getElementById(`demand-params-${buyerId}`);
    if (!container) return;
    if (demandType === "linear") { container.innerHTML = ""; return; }
    if (demandType === "inverse_square") {
        container.innerHTML = `<div class="field"><label>A (коэффициент)</label><input type="number" id="b${buyerId}-A" value="20" min="0.01" step="0.1"></div>`;
    } else if (demandType === "step") {
        container.innerHTML = `<div class="field"><label>Values (через запятую)</label><input type="text" id="b${buyerId}-values" value="10, 10, 6, 6, 2"></div>`;
    }
    document.getElementById(`demand-params-${buyerId}`)
        ?.querySelectorAll("input")
        .forEach(el => el.addEventListener("input", () => renderMiniCurve(buyerId)));
}

// Читает параметры спроса из формы покупателя для передачи в mbJS
function getDemandParams(buyerId, demandType) {
    if (demandType === "linear") return {
        a: parseFloat(document.getElementById(`b${buyerId}-a`)?.value || 10),
        b: parseFloat(document.getElementById(`b${buyerId}-b`)?.value || 2)
    };
    if (demandType === "inverse_square") return {
        A: parseFloat(document.getElementById(`b${buyerId}-A`)?.value || 20)
    };
    if (demandType === "step") {
        const raw = document.getElementById(`b${buyerId}-values`)?.value || "";
        return { values: raw.split(",").map(v => parseFloat(v.trim())).filter(v => !isNaN(v)) };
    }
    return {};
}

// Перерисовывает SVG-гистограмму MB(k) на карточке покупателя
function renderMiniCurve(buyerId) {
    const el = document.getElementById(`mini-curve-${buyerId}`);
    if (!el) return;
    const demandType  = document.getElementById(`b${buyerId}-demand_type`)?.value || "linear";
    const targetStock = parseInt(document.getElementById(`b${buyerId}-target_stock`)?.value || 5);
    const params      = getDemandParams(buyerId, demandType);
    const gap  = Math.min(Math.max(targetStock, 1), 10);
    const mbs  = Array.from({ length: gap }, (_, i) => mbJS(demandType, params, i + 1));
    const maxMB = Math.max(...mbs, 0.01);
    const svgW = 200, svgH = 52, plotH = svgH - 12;
    const barW = Math.floor((svgW - 4) / gap) - 2;
    const bars = mbs.map((mb, i) => {
        const h = Math.max(Math.round((mb / maxMB) * plotH), mb > 0 ? 2 : 0);
        const x = 2 + i * (barW + 2);
        return `<rect x="${x}" y="${plotH - h}" width="${barW}" height="${h}" fill="#93c5fd" rx="2"/>
                <text x="${x + barW / 2}" y="${svgH}" font-size="8" fill="#9ca3af" text-anchor="middle">${i + 1}</text>`;
    }).join("");
    el.innerHTML = `
        <div class="mini-curve-label">MB(k) — кривая спроса</div>
        <svg viewBox="0 0 ${svgW} ${svgH}" style="width:100%;display:block">
            <line x1="0" y1="${plotH}" x2="${svgW}" y2="${plotH}" stroke="#e5e7eb" stroke-width="1"/>
            ${bars}
        </svg>`;
}


// Генерирует HTML-поля параметров для выбранного режима ценообразования
function renderPricingParams(mode, suffix) {
    const block = document.getElementById(`pricing-params-block-${suffix}`);
    if (!block) return;
    let html = "";
    if (mode === "uniform") {
        html = `<div class="field"><label>Цена p</label><input type="number" id="param-p-${suffix}" value="4" min="0" step="0.1"></div>`;
    } else if (mode === "pd1") {
        html = `<p class="hint">PD1 не требует дополнительных параметров.</p>`;
    } else if (mode === "pd2") {
        html = `<div class="field"><label>F (взнос)</label><input type="number" id="param-F-${suffix}" value="5" min="0" step="0.1"></div>
                <div class="field"><label>p (цена за ед.)</label><input type="number" id="param-p-${suffix}" value="3" min="0" step="0.1"></div>`;
    } else if (mode === "pd3") {
        html = `<div class="field"><label>pA</label><input type="number" id="param-pA-${suffix}" value="3" min="0" step="0.1"></div>
                <div class="field"><label>pB</label><input type="number" id="param-pB-${suffix}" value="5" min="0" step="0.1"></div>
                <div class="field"><label>pC</label><input type="number" id="param-pC-${suffix}" value="7" min="0" step="0.1"></div>`;
    }
    block.innerHTML = html;
}

// Читает параметры цен из формы и формирует объект для отправки на сервер
function getPricingParams(mode, suffix) {
    if (mode === "uniform") return { p: parseFloat(document.getElementById(`param-p-${suffix}`).value) };
    if (mode === "pd1")     return {};
    if (mode === "pd2")     return {
        F: parseFloat(document.getElementById(`param-F-${suffix}`).value),
        p: parseFloat(document.getElementById(`param-p-${suffix}`).value)
    };
    if (mode === "pd3")     return {
        segment_prices: {
            A: parseFloat(document.getElementById(`param-pA-${suffix}`).value),
            B: parseFloat(document.getElementById(`param-pB-${suffix}`).value),
            C: parseFloat(document.getElementById(`param-pC-${suffix}`).value)
        }
    };
    return {};
}

// Заполняет поля параметров из объекта конфигурации фирмы (используется при загрузке сценария)
function setFirmParams(firmConfig, suffix) {
    const p = firmConfig.params || {};
    if (firmConfig.mode === "uniform") {
        const el = document.getElementById(`param-p-${suffix}`);
        if (el && p.p !== undefined) el.value = p.p;
    } else if (firmConfig.mode === "pd2") {
        const F  = document.getElementById(`param-F-${suffix}`);
        const pp = document.getElementById(`param-p-${suffix}`);
        if (F  && p.F !== undefined) F.value  = p.F;
        if (pp && p.p !== undefined) pp.value = p.p;
    } else if (firmConfig.mode === "pd3") {
        const sp = p.segment_prices || {};
        const pA = document.getElementById(`param-pA-${suffix}`);
        const pB = document.getElementById(`param-pB-${suffix}`);
        const pC = document.getElementById(`param-pC-${suffix}`);
        if (pA) pA.value = sp.A !== undefined ? sp.A : (p.pA !== undefined ? p.pA : pA.value);
        if (pB) pB.value = sp.B !== undefined ? sp.B : (p.pB !== undefined ? p.pB : pB.value);
        if (pC) pC.value = sp.C !== undefined ? sp.C : (p.pC !== undefined ? p.pC : pC.value);
    }
}


// Возвращает внутренности карточек покупателя
function createBuyerFormHTML(id) {
    return `
        <div class="buyer-form-header">
            <span class="buyer-form-title">Покупатель #${id}</span>
            <div class="buyer-form-actions">
                <button class="duplicate-buyer-btn" data-id="${id}" title="Дублировать">⧉</button>
                <button class="remove-buyer-btn" data-id="${id}" title="Удалить">✕</button>
            </div>
        </div>
        <div class="buyer-form-row">
            <div class="field">
                <label>Завод</label>
                <select id="b${id}-factory">
                    <option value="A">Фирма A</option>
                    <option value="B">Фирма B</option>
                </select>
            </div>
            <div class="field">
                <label>Сегмент</label>
                <select id="b${id}-segment">
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                </select>
            </div>
        </div>
        <div id="demand-simple-${id}">
            <div class="field">
                <label>Ценность 1-й единицы (₽)</label>
                <input type="number" id="b${id}-a" value="10" min="0" step="0.1">
            </div>
            <div class="field">
                <label>Снижение ценности (₽ на каждую следующую)</label>
                <input type="number" id="b${id}-b" value="2" min="0" step="0.1">
            </div>
        </div>
        <div class="field">
            <label>Хочет купить, шт.</label>
            <input type="number" id="b${id}-target_stock" value="5" min="1" step="1">
        </div>
        <div id="mini-curve-${id}" class="mini-curve"></div>
        <div class="advanced-fields">
            <div class="advanced-divider">Дополнительно</div>
            <div class="field">
                <label>Бюджет (₽)</label>
                <input type="number" id="b${id}-money" value="1000" min="0" step="1">
            </div>
            <div class="field">
                <label>Текущий запас</label>
                <input type="number" id="b${id}-stock" value="0" min="0" step="1">
            </div>
            <div class="field">
                <label>Тип спроса</label>
                <select id="b${id}-demand_type">
                    <option value="linear">linear</option>
                    <option value="inverse_square">inverse_square</option>
                    <option value="step">step</option>
                </select>
            </div>
            <div id="demand-params-${id}"></div>
        </div>`;
}

// вешает обработчики на кнопки удаления, дублирования и поля ввода карточки покупателя
function attachBuyerListeners(id) {
    const div = document.getElementById(`buyer-form-${id}`);

    div.querySelector(".remove-buyer-btn").addEventListener("click", () => {
        buyers = buyers.filter(b => b.id !== id);
        delete buyerPositions[id];
        div.remove();
        renderBattlefieldWaiting();
        saveState();
        setDirty();
    });

    div.querySelector(".duplicate-buyer-btn").addEventListener("click", () => {
        const data = collectOneBuyerData(id);
        addBuyer(data);
        saveState();
        setDirty();
    });

    document.getElementById(`b${id}-factory`).addEventListener("change", () => renderBattlefieldWaiting());

    ["a", "b"].forEach(f => document.getElementById(`b${id}-${f}`)?.addEventListener("input", () => renderMiniCurve(id)));
    document.getElementById(`b${id}-target_stock`).addEventListener("input", () => renderMiniCurve(id));

    document.getElementById(`b${id}-demand_type`).addEventListener("change", (e) => {
        const type = e.target.value;
        document.getElementById(`demand-simple-${id}`)?.classList.toggle("hidden", type !== "linear");
        renderDemandParams(id, type);
        renderMiniCurve(id);
    });
}

// Создает карточку покупателя, добавляет в список и заполняет данными если переданы
function addBuyer(data) {
    const buyer = { id: buyerCounter++ };
    buyers.push(buyer);

    const div = document.createElement("div");
    div.className = "buyer-form-card";
    div.id = `buyer-form-${buyer.id}`;
    div.innerHTML = createBuyerFormHTML(buyer.id);
    buyersList.appendChild(div);

    if (data) {
        document.getElementById(`b${buyer.id}-factory`).value      = data.factory      || "A";
        document.getElementById(`b${buyer.id}-segment`).value      = data.segment      || "A";
        document.getElementById(`b${buyer.id}-a`).value            = data.a            ?? 10;
        document.getElementById(`b${buyer.id}-b`).value            = data.b            ?? 2;
        document.getElementById(`b${buyer.id}-target_stock`).value = data.target_stock ?? 5;
        document.getElementById(`b${buyer.id}-money`).value        = data.money        ?? 1000;
        document.getElementById(`b${buyer.id}-stock`).value        = data.stock        ?? 0;
        const dt = data.demand_type || "linear";
        document.getElementById(`b${buyer.id}-demand_type`).value = dt;
        if (dt !== "linear") document.getElementById(`demand-simple-${buyer.id}`)?.classList.add("hidden");
        renderDemandParams(buyer.id, dt);
        // setTimeout нужен чтобы поля успели отрисоваться перед заполнением
        if (dt === "inverse_square" && data.A !== undefined) {
            setTimeout(() => { const el = document.getElementById(`b${buyer.id}-A`); if (el) el.value = data.A; }, 0);
        } else if (dt === "step" && data.values) {
            setTimeout(() => { const el = document.getElementById(`b${buyer.id}-values`); if (el) el.value = data.values.join(", "); }, 0);
        }
    }

    attachBuyerListeners(buyer.id);
    renderMiniCurve(buyer.id);
    renderBattlefieldWaiting();
}

function getBuyerFactory(id) {
    return document.getElementById(`b${id}-factory`)?.value || "A";
}

// Возвращает отображаемые данные покупателя для игрового поля
function getBuyerDisplayData(id) {
    return {
        segment:    document.getElementById(`b${id}-segment`)?.value     || "A",
        demandType: document.getElementById(`b${id}-demand_type`)?.value || "linear",
        factory:    getBuyerFactory(id)
    };
}

// Собирает данные всех покупателей для отправки на сервер
function collectBuyersData() {
    return buyers.map(buyer => {
        const id         = buyer.id;
        const demandType = document.getElementById(`b${id}-demand_type`)?.value || "linear";
        return {
            id,
            money:        parseFloat(document.getElementById(`b${id}-money`)?.value || 1000),
            segment:      document.getElementById(`b${id}-segment`).value,
            target_stock: parseInt(document.getElementById(`b${id}-target_stock`).value),
            stock:        parseInt(document.getElementById(`b${id}-stock`)?.value || 0),
            demand_type:  demandType,
            params:       getDemandParams(id, demandType)
        };
    });
}


// Показывает модальное окно подтверждения перед заменой покупателей на сценарий
function showScenarioConfirmModal(key) {
    const existing = document.getElementById("scenario-confirm-modal");
    if (existing) existing.remove();

    const modal = document.createElement("div");
    modal.id = "scenario-confirm-modal";
    modal.className = "confirm-modal-overlay";
    modal.innerHTML = `
        <div class="confirm-modal">
            <div class="confirm-title">Загрузить сценарий?</div>
            <p class="confirm-body">Все текущие покупатели и параметры будут заменены на «${SCENARIOS[key]?.name}».</p>
            <label class="confirm-skip-label">
                <input type="checkbox" id="confirm-skip-cb">
                Больше не спрашивать
            </label>
            <div class="confirm-btns">
                <button class="confirm-btn-ok">Загрузить</button>
                <button class="confirm-btn-cancel">Отмена</button>
            </div>
        </div>`;
    document.body.appendChild(modal);

    modal.querySelector(".confirm-btn-ok").addEventListener("click", () => {
        if (modal.querySelector("#confirm-skip-cb").checked) {
            localStorage.setItem("mss_skip_scenario_confirm", "true");
        }
        modal.remove();
        doLoadScenario(key);
    });
    modal.querySelector(".confirm-btn-cancel").addEventListener("click", () => modal.remove());
    modal.addEventListener("click", e => { if (e.target === modal) modal.remove(); });
}

// Решает показывать подтверждение или грузить сценарий сразу
function loadScenario(key) {
    const skipConfirm = localStorage.getItem("mss_skip_scenario_confirm") === "true";
    if (!skipConfirm && buyers.length > 0) {
        showScenarioConfirmModal(key);
        return;
    }
    doLoadScenario(key);
}

// Сбрасывает состояние и загружает выбранный сценарий
function doLoadScenario(key) {
    const s = SCENARIOS[key];
    if (!s) return;

    buyers = [];
    buyerCounter = 1;
    Object.keys(buyerPositions).forEach(k => delete buyerPositions[k]);
    buyersList.innerHTML = "";

    document.getElementById("pricing-mode-a").value = s.firmA.mode;
    document.getElementById("mc-a").value            = s.firmA.mc;
    document.getElementById("capacity-a").value      = s.firmA.capacity;
    renderPricingParams(s.firmA.mode, "a");
    setFirmParams(s.firmA, "a");

    document.getElementById("pricing-mode-b").value = s.firmB.mode;
    document.getElementById("mc-b").value            = s.firmB.mc;
    document.getElementById("capacity-b").value      = s.firmB.capacity;
    renderPricingParams(s.firmB.mode, "b");
    setFirmParams(s.firmB, "b");

    s.buyers.forEach(data => addBuyer(data));

    document.getElementById("totals-content").innerHTML = `<div class="placeholder-text">Запусти симуляцию, чтобы увидеть итоги.</div>`;
    chartsContainer.innerHTML      = `<div class="placeholder-text">Запусти симуляцию, чтобы увидеть графики.</div>`;
    buyersTableContainer.innerHTML = `<div class="placeholder-text">Запусти симуляцию, чтобы увидеть таблицу.</div>`;
    resultBox.textContent = "Отчет появится после запуска симуляции.";
    downloadBtn.disabled  = true;
    lastReportText        = "";
    hasRunOnce            = false;
    runBtn.classList.remove("run-btn--dirty");
    runBtn.textContent = "Запустить симуляцию";
    saveSnapshotBtn.disabled = true;

    const descEl = document.getElementById("scenario-description");
    descEl.innerHTML = `${s.description} <button class="scenario-close-btn" onclick="this.parentElement.classList.add('hidden')">✕</button>`;
    descEl.classList.remove("hidden");

    renderBattlefieldWaiting();
    saveState();
}


// Показывает/скрывает дополнительные поля у всех покупателей; при скрытии сбрасывает тип спроса к linear
function toggleAdvancedMode(show) {
    buyersList.classList.toggle("show-advanced", show);
    if (!show) {
        buyers.forEach(b => {
            const dtEl = document.getElementById(`b${b.id}-demand_type`);
            if (dtEl && dtEl.value !== "linear") {
                dtEl.value = "linear";
                document.getElementById(`demand-simple-${b.id}`)?.classList.remove("hidden");
                renderDemandParams(b.id, "linear");
                renderMiniCurve(b.id);
            }
        });
    }
}


// Генерирует случайную позицию фигурки на мини-карте (в процентах от размера контейнера)
function getRandomMapPos() {
    return { x: 18 + Math.random() * 64, y: 8 + Math.random() * 52 };
}

// Обеспечивает наличие позиции для каждого покупателя и удаляет позиции удаленных
function ensureBuyerPositions() {
    buyers.forEach(b => { if (!buyerPositions[b.id]) buyerPositions[b.id] = getRandomMapPos(); });
    Object.keys(buyerPositions).forEach(id => { if (!buyers.find(b => b.id === parseInt(id))) delete buyerPositions[id]; });
}

// Рисует мини-карту с фигурками покупателей в состоянии ожидания
function renderMiniMapWaiting() {
    const mapEl = document.getElementById("mini-map");
    if (!mapEl) return;
    ensureBuyerPositions();
    const figures = buyers.map(buyer => {
        const pos = buyerPositions[buyer.id];
        const fac = getBuyerFactory(buyer.id);
        return `<div class="map-figure" id="map-fig-${buyer.id}" style="left:${pos.x}%;top:${pos.y}%">🧍<span class="map-figure-label">#${buyer.id}(${fac})</span></div>`;
    }).join("");
    mapEl.innerHTML = `
        <div class="map-firm-a">🏭<span class="map-firm-lbl">A</span></div>
        <div class="map-firm-b">🏭<span class="map-firm-lbl">B</span></div>
        ${figures}`;
}

// Анимирует движение фигурок к заводам после завершения симуляции
function animateMiniMap(allResults) {
    allResults.forEach((b, i) => {
        const fig = document.getElementById(`map-fig-${b.id}`);
        if (!fig) return;
        if (b.q > 0) {
            setTimeout(() => {
                fig.innerHTML = `🚶<span class="map-figure-label">#${b.id}(${b.factory})</span>`;
                fig.style.left = b.factory === "A" ? "13%" : "87%";
                fig.style.top  = "82%";
            }, i * 180 + 80);
        } else {
            setTimeout(() => { fig.innerHTML = `🚫<span class="map-figure-label">#${b.id}</span>`; }, i * 180 + 80);
        }
    });
}


// строит карточки фирмы с кратким итогом или заглушкой если покупателей нет
function makeFirmCard(label, mode, totals, colorClass) {
    const stats = totals
        ? `<div class="firm-stats">
               <div class="mini-stat"><span class="mini-stat-label">Q</span><span class="mini-stat-value">${formatNumber(totals.Q)}</span></div>
               <div class="mini-stat"><span class="mini-stat-label">Revenue</span><span class="mini-stat-value">${formatNumber(totals.Revenue)}</span></div>
               <div class="mini-stat"><span class="mini-stat-label">Profit</span><span class="mini-stat-value">${formatNumber(totals.Profit)}</span></div>
           </div>`
        : `<div class="firm-no-buyers">нет покупателей</div>`;
    return `<div class="firm-card ${colorClass}">
        <div class="firm-title">${label}</div>
        <div class="firm-mode">${MODE_NAMES[mode] || mode}</div>
        ${stats}
    </div>`;
}

// Отрисовывает игровое поле до запуска: карточки покупателей в состоянии ожидания
function renderBattlefieldWaiting() {
    const battlefield = document.getElementById("battlefield");
    if (!battlefield) return;
    const modeA = document.getElementById("pricing-mode-a")?.value || "uniform";
    const modeB = document.getElementById("pricing-mode-b")?.value || "uniform";
    const buyerCards = buyers.length === 0
        ? `<div class="placeholder-text">Добавь покупателей в левой панели.</div>`
        : buyers.map(buyer => {
            const { segment, demandType, factory } = getBuyerDisplayData(buyer.id);
            return `<div class="buyer-card segment-${segment} status-waiting">
                <div class="buyer-header">
                    <div class="buyer-name">Buyer #${buyer.id} <span class="factory-badge factory-badge-${factory}">${factory}</span></div>
                    <div class="status-badge waiting">Ожидает</div>
                </div>
                <div class="buyer-meta">Сегмент: <strong>${segment}</strong> | Спрос: <strong>${demandType}</strong></div>
            </div>`;
        }).join("");
    battlefield.innerHTML = `
        ${makeFirmCard("Factory A", modeA, null, "firm-card-a")}
        <div class="buyers-zone">
            <div class="buyers-zone-title">Покупатели</div>
            <div class="buyers-grid">${buyerCards}</div>
        </div>
        ${makeFirmCard("Factory B", modeB, null, "firm-card-b")}`;
    renderMiniMapWaiting();
}

// Отрисовывает игровое поле после симуляции с результатами по каждому покупателю
function renderBattlefieldResult(dataA, dataB, modeA, modeB) {
    const battlefield = document.getElementById("battlefield");
    if (!battlefield) return;
    const allResults = [
        ...(dataA?.buyers_results || []).map(b => ({ ...b, factory: "A" })),
        ...(dataB?.buyers_results || []).map(b => ({ ...b, factory: "B" }))
    ];
    const buyerCards = allResults.map((buyer, index) => {
        const bought = buyer.q > 0;
        const cls    = bought ? "bought" : "skipped";
        const delay  = index * 120;
        return `<div class="buyer-card segment-${buyer.segment} status-${cls} card-animate" style="animation-delay:${delay}ms">
            <div class="buyer-header">
                <div class="buyer-name">Buyer #${buyer.id} <span class="factory-badge factory-badge-${buyer.factory}">${buyer.factory}</span></div>
                <div class="status-badge ${cls}">${bought ? "Купил" : "Не купил"}</div>
            </div>
            <div class="buyer-meta">Сегмент: <strong>${buyer.segment}</strong> | Спрос: <strong>${buyer.demand_type}</strong></div>
            <div class="buyer-stats">
                <div class="buyer-stat"><span class="buyer-stat-label">Gap</span><span class="buyer-stat-value">${formatNumber(buyer.gap)}</span></div>
                <div class="buyer-stat"><span class="buyer-stat-label">q*</span><span class="buyer-stat-value">${formatNumber(buyer.q)}</span></div>
                <div class="buyer-stat"><span class="buyer-stat-label">Payment</span><span class="buyer-stat-value">${formatNumber(buyer.payment)}</span></div>
                <div class="buyer-stat"><span class="buyer-stat-label">CS</span><span class="buyer-stat-value">${formatNumber(buyer.consumer_surplus)}</span></div>
            </div>
            ${bought ? `<div class="payment-arrow" style="animation-delay:${delay + 200}ms">← Завод ${buyer.factory}</div>` : ""}
        </div>`;
    }).join("");
    battlefield.innerHTML = `
        ${makeFirmCard("Factory A", modeA, dataA?.totals || null, "firm-card-a")}
        <div class="buyers-zone">
            <div class="buyers-zone-title">Покупатели</div>
            <div class="buyers-grid">${buyerCards || '<div class="placeholder-text">Нет данных.</div>'}</div>
        </div>
        ${makeFirmCard("Factory B", modeB, dataB?.totals || null, "firm-card-b")}`;
}


// Суммирует итоги двух фирм в один объект; заменяет null нулями
function combineTotals(tA, tB) {
    const a = tA || { Q:0, Revenue:0, VarCost:0, Profit:0, CS:0, PS:0, W:0, W_eff:0, DWL:0 };
    const b = tB || { Q:0, Revenue:0, VarCost:0, Profit:0, CS:0, PS:0, W:0, W_eff:0, DWL:0 };
    return {
        Q: a.Q+b.Q, Revenue: a.Revenue+b.Revenue, VarCost: a.VarCost+b.VarCost,
        Profit: a.Profit+b.Profit, CS: a.CS+b.CS, PS: a.PS+b.PS,
        W: a.W+b.W, W_eff: a.W_eff+b.W_eff, DWL: a.DWL+b.DWL
    };
}

// Строит HTML-сетку метрик с подсказками и выделением потерь красным
function makeTotalsGridHTML(totals) {
    if (!totals) return `<div class="placeholder-text">Нет покупателей.</div>`;
    const fields = [
        { label: "Q",       key: "Q" },
        { label: "Revenue", key: "Revenue" },
        { label: "Profit",  key: "Profit" },
        { label: "CS",      key: "CS" },
        { label: "PS",      key: "PS" },
        { label: "W",       key: "W" },
        { label: "W_eff",   key: "W_eff", hint: "эфф." },
        { label: "DWL",     key: "DWL",   loss: true }
    ];
    return fields.map(f => `
        <div class="total-card${f.loss ? " total-card--loss" : ""}" data-tooltip="${METRIC_TOOLTIPS[f.key] || ""}">
            <span class="total-card-label">${f.label}${f.hint ? `<span class="total-card-hint">${f.hint}</span>` : ""}</span>
            <span class="total-card-value">${formatNumber(totals[f.key])}</span>
        </div>`).join("");
}

// Рендерит блок итогов: отдельно по каждой фирме и суммарно
function renderTotals(totalsA, totalsB) {
    const combined = combineTotals(totalsA, totalsB);
    document.getElementById("totals-content").innerHTML = `
        <div class="two-firm-totals">
            <div class="firm-totals-block">
                <h3 class="firm-totals-title firm-totals-title-a">Фирма A</h3>
                <div class="totals-grid">${makeTotalsGridHTML(totalsA)}</div>
            </div>
            <div class="firm-totals-block">
                <h3 class="firm-totals-title firm-totals-title-b">Фирма B</h3>
                <div class="totals-grid">${makeTotalsGridHTML(totalsB)}</div>
            </div>
        </div>
        <div class="combined-totals-block">
            <h3 class="firm-totals-title">Суммарно (A + B)</h3>
            <div class="totals-grid">${makeTotalsGridHTML(combined)}</div>
        </div>`;
}


// Сохраняет текущий результат симуляции как снапшот
function saveSnapshot() {
    if (!lastDataA && !lastDataB) return;
    if (snapshots.length >= 5) snapshots.shift();
    snapshotCounter++;
    const now  = new Date();
    const time = `${now.getHours().toString().padStart(2,"0")}:${now.getMinutes().toString().padStart(2,"0")}`;
    snapshots.push({
        id: Date.now(),
        n: snapshotCounter,
        time,
        modeA: lastModeA,
        modeB: lastModeB,
        totalsA: lastDataA?.totals || null,
        totalsB: lastDataB?.totals || null,
        combined: combineTotals(lastDataA?.totals, lastDataB?.totals)
    });
    renderSnapshots();
}

function deleteSnapshot(id) {
    snapshots = snapshots.filter(s => s.id !== id);
    renderSnapshots();
}

function clearSnapshots() {
    snapshots = [];
    renderSnapshots();
}

// Перерисовывает список снапшотов с подсветкой лучших значений и дельтами к предыдущему
function renderSnapshots() {
    const badge   = document.getElementById("snap-count-badge");
    const clearBtn = snapClearBtn;

    if (snapshots.length === 0) {
        badge.textContent = "";
        clearBtn.style.display = "none";
        snapshotsContainer.innerHTML = `<div class="placeholder-text">Нажми «📷 Снапшот» в блоке Итогов после запуска.</div>`;
        if (snapChart) { snapChart.destroy(); snapChart = null; }
        return;
    }

    badge.textContent = snapshots.length;
    clearBtn.style.display = "";

    // Лучшие значения по всем снапшотам для подсветки
    const bestProfit = Math.max(...snapshots.map(s => s.combined?.Profit ?? -Infinity));
    const bestCS     = Math.max(...snapshots.map(s => s.combined?.CS     ?? -Infinity));
    const bestW      = Math.max(...snapshots.map(s => s.combined?.W      ?? -Infinity));
    const bestDWL    = Math.min(...snapshots.map(s => s.combined?.DWL    ??  Infinity));

    const cards = snapshots.map((snap, i) => {
        const prev = i > 0 ? snapshots[i - 1].combined : null;
        const c    = snap.combined;

        // Стрелка изменения относительно предыдущего снапшота
        function deltaHTML(key, lowerIsBetter = false) {
            if (!prev || prev[key] == null || c[key] == null) return "";
            const diff = c[key] - prev[key];
            if (Math.abs(diff) < 0.001) return "";
            const up = lowerIsBetter ? diff < 0 : diff > 0;
            const cls = up ? "snap-delta--up" : "snap-delta--down";
            const sign = diff > 0 ? "+" : "";
            return `<span class="snap-delta ${cls}">${sign}${formatNumber(diff)}</span>`;
        }

        // CSS-класс для ячейки с лучшим значением
        function cellClass(key, lowerIsBetter = false) {
            if (c == null) return "";
            if (lowerIsBetter) return Math.abs(c[key] - bestDWL) < 0.001 ? " snap-cell--best-loss" : "";
            const best = key === "Profit" ? bestProfit : key === "CS" ? bestCS : bestW;
            return Math.abs(c[key] - best) < 0.001 ? " snap-cell--best" : "";
        }

        const modesHTML = snap.modeA === snap.modeB
            ? `<span class="snap-mode snap-mode-a">${MODE_SHORT[snap.modeA]}</span>`
            : `<span class="snap-mode snap-mode-a">A: ${MODE_SHORT[snap.modeA]}</span>
               <span class="snap-vs">vs</span>
               <span class="snap-mode snap-mode-b">B: ${MODE_SHORT[snap.modeB]}</span>`;

        return `<div class="snapshot-card">
            <div class="snap-card-header">
                <div>
                    <div class="snap-card-title">#${snap.n} · ${snap.time}</div>
                </div>
                <button class="snap-delete-btn" data-snap-id="${snap.id}" title="Удалить">✕</button>
            </div>
            <div class="snap-modes">${modesHTML}</div>
            <div class="snap-metrics-grid">
                <div class="snap-cell${cellClass("Profit")}">
                    <span class="snap-cell-label">Profit</span>
                    <span class="snap-cell-value">${formatNumber(c?.Profit)}</span>
                    ${deltaHTML("Profit")}
                </div>
                <div class="snap-cell${cellClass("CS")}">
                    <span class="snap-cell-label">CS</span>
                    <span class="snap-cell-value">${formatNumber(c?.CS)}</span>
                    ${deltaHTML("CS")}
                </div>
                <div class="snap-cell${cellClass("W")}">
                    <span class="snap-cell-label">W</span>
                    <span class="snap-cell-value">${formatNumber(c?.W)}</span>
                    ${deltaHTML("W")}
                </div>
                <div class="snap-cell${cellClass("DWL", true)}">
                    <span class="snap-cell-label">DWL</span>
                    <span class="snap-cell-value">${formatNumber(c?.DWL)}</span>
                    ${deltaHTML("DWL", true)}
                </div>
            </div>
        </div>`;
    }).join("");

    const chartHTML = snapshots.length >= 2
        ? `<div class="snap-chart-block"><canvas id="snap-chart-canvas"></canvas></div>`
        : "";

    snapshotsContainer.innerHTML = `<div class="snapshots-list">${cards}</div>${chartHTML}`;

    snapshotsContainer.querySelectorAll(".snap-delete-btn").forEach(btn => {
        btn.addEventListener("click", () => deleteSnapshot(Number(btn.dataset.snapId)));
    });

    if (snapshots.length >= 2) {
        renderSnapshotChart();
    }
}

// Строит сгруппированную выборку с Profit/CS/W/DWL по всем снапшотам
function renderSnapshotChart() {
    const canvas = document.getElementById("snap-chart-canvas");
    if (!canvas) return;
    if (snapChart) { snapChart.destroy(); snapChart = null; }

    const labels  = snapshots.map(s => `#${s.n}`);
    snapChart = new Chart(canvas.getContext("2d"), {
        type: "bar",
        data: {
            labels,
            datasets: [
                { label: "Profit", data: snapshots.map(s => s.combined?.Profit ?? 0), backgroundColor: "#93c5fd", borderColor: "#3b82f6", borderWidth: 1.5, borderRadius: 4 },
                { label: "CS",     data: snapshots.map(s => s.combined?.CS     ?? 0), backgroundColor: "#86efac", borderColor: "#22c55e", borderWidth: 1.5, borderRadius: 4 },
                { label: "W",      data: snapshots.map(s => s.combined?.W      ?? 0), backgroundColor: "#c4b5fd", borderColor: "#8b5cf6", borderWidth: 1.5, borderRadius: 4 },
                { label: "DWL",    data: snapshots.map(s => s.combined?.DWL    ?? 0), backgroundColor: "#fca5a5", borderColor: "#ef4444", borderWidth: 1.5, borderRadius: 4 }
            ]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: "top" } },
            scales: { y: { beginAtZero: true } }
        }
    });
}


// Строит два графика: сравнение фирм по CS/PS/W/DWL и результаты по каждому покупателю
function renderCharts(dataA, dataB) {
    chartsContainer.innerHTML = `
        <div class="chart-wrap"><div class="chart-title">Благосостояние: Фирма A vs Фирма B</div><canvas id="welfare-canvas"></canvas></div>
        <div class="chart-wrap"><div class="chart-title">Результаты по покупателям</div><canvas id="buyers-canvas"></canvas></div>`;
    if (welfareChart) { welfareChart.destroy(); welfareChart = null; }
    if (buyersChart)  { buyersChart.destroy();  buyersChart  = null; }
    const tA = dataA?.totals, tB = dataB?.totals;
    welfareChart = new Chart(document.getElementById("welfare-canvas").getContext("2d"), {
        type: "bar",
        data: {
            labels: ["CS", "PS", "W", "DWL"],
            datasets: [
                { label: "Фирма A", data: [tA?.CS||0, tA?.PS||0, tA?.W||0, tA?.DWL||0], backgroundColor: "#93c5fd", borderColor: "#3b82f6", borderWidth: 1.5, borderRadius: 4 },
                { label: "Фирма B", data: [tB?.CS||0, tB?.PS||0, tB?.W||0, tB?.DWL||0], backgroundColor: "#c4b5fd", borderColor: "#8b5cf6", borderWidth: 1.5, borderRadius: 4 }
            ]
        },
        options: { responsive: true, plugins: { legend: { position: "top" } }, scales: { y: { beginAtZero: true } } }
    });
    const allResults = [
        ...(dataA?.buyers_results || []).map(b => ({ ...b, factory: "A" })),
        ...(dataB?.buyers_results || []).map(b => ({ ...b, factory: "B" }))
    ];
    if (allResults.length > 0) {
        buyersChart = new Chart(document.getElementById("buyers-canvas").getContext("2d"), {
            type: "bar",
            data: {
                labels: allResults.map(b => `#${b.id}(${b.factory})`),
                datasets: [
                    { label: "Value",   data: allResults.map(b => b.value),            backgroundColor: "#86efac", borderColor: "#22c55e", borderWidth: 1.5, borderRadius: 4 },
                    { label: "Payment", data: allResults.map(b => b.payment),          backgroundColor: "#93c5fd", borderColor: "#3b82f6", borderWidth: 1.5, borderRadius: 4 },
                    { label: "CS",      data: allResults.map(b => b.consumer_surplus), backgroundColor: "#fde68a", borderColor: "#f59e0b", borderWidth: 1.5, borderRadius: 4 }
                ]
            },
            options: { responsive: true, plugins: { legend: { position: "top" } }, scales: { y: { beginAtZero: true } } }
        });
    }
}


// Строит таблицу с детальными результатами по каждому покупателю после симуляции
function renderBuyersTable(resultsA, resultsB) {
    const all = [...resultsA.map(b => ({...b, factory:"A"})), ...resultsB.map(b => ({...b, factory:"B"}))];
    if (!all.length) { buyersTableContainer.innerHTML = `<div class="placeholder-text">Нет данных.</div>`; return; }
    buyersTableContainer.innerHTML = `
        <table class="buyers-table">
            <thead><tr><th>ID</th><th>Завод</th><th>Сег.</th><th>Спрос</th><th>Gap</th><th>q*</th><th>Payment</th><th>Utility</th><th>CS</th></tr></thead>
            <tbody>${all.map(b => `<tr>
                <td>${b.id}</td>
                <td><span class="factory-badge factory-badge-${b.factory}">${b.factory}</span></td>
                <td>${b.segment}</td><td>${b.demand_type}</td>
                <td>${formatNumber(b.gap)}</td><td>${formatNumber(b.q)}</td>
                <td>${formatNumber(b.payment)}</td><td>${formatNumber(b.utility)}</td>
                <td>${formatNumber(b.consumer_surplus)}</td>
            </tr>`).join("")}</tbody>
        </table>`;
}


function showError(msg) {
    resultBox.classList.remove("hidden");
    resultBox.textContent = msg;
    toggleReportBtn.textContent = "▼ Скрыть текстовый отчет";
}

// отправляет POST simulate и возвращает JSON и бросает ошибку с деталями если статус не 2xx
async function postSimulate(payload) {
    const response = await fetch(`${BACKEND_BASE_URL}/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(JSON.stringify(err.detail, null, 2));
    }
    return response.json();
}

// Главная функция запуска: параллельно вызывает /simulate для фирм A и B, затем рендерит все блоки
async function runSimulation() {
    if (buyers.length === 0) { showError("Добавь хотя бы одного покупателя."); return; }

    runBtn.disabled = true;
    runBtn.textContent = "Считаю...";
    runBtn.classList.remove("run-btn--dirty");

    const all   = collectBuyersData();
    const modeA = document.getElementById("pricing-mode-a").value;
    const modeB = document.getElementById("pricing-mode-b").value;
    const mcA   = parseFloat(document.getElementById("mc-a").value);
    const mcB   = parseFloat(document.getElementById("mc-b").value);
    const capA  = document.getElementById("capacity-a").value;
    const capB  = document.getElementById("capacity-b").value;
    const buyersA = all.filter(b => getBuyerFactory(b.id) === "A");
    const buyersB = all.filter(b => getBuyerFactory(b.id) === "B");

    try {
        const [dataA, dataB] = await Promise.all([
            buyersA.length > 0 ? postSimulate({ pricing_mode: modeA, pricing_params: getPricingParams(modeA, "a"), buyers: buyersA, mc: mcA, capacity_per_day: capA ? parseInt(capA) : null }) : Promise.resolve(null),
            buyersB.length > 0 ? postSimulate({ pricing_mode: modeB, pricing_params: getPricingParams(modeB, "b"), buyers: buyersB, mc: mcB, capacity_per_day: capB ? parseInt(capB) : null }) : Promise.resolve(null)
        ]);

        renderBattlefieldResult(dataA, dataB, modeA, modeB);
        renderTotals(dataA?.totals, dataB?.totals);
        renderCharts(dataA, dataB);
        renderBuyersTable(dataA?.buyers_results || [], dataB?.buyers_results || []);

        const report = buildReport(dataA, dataB, modeA, modeB);
        resultBox.textContent = report;
        lastReportText = report;
        downloadBtn.disabled = false;
        setClean();

        // Сохраняем последние данные для снапшота
        lastDataA = dataA;
        lastDataB = dataB;
        lastModeA = modeA;
        lastModeB = modeB;
        saveSnapshotBtn.disabled = false;

        renderMiniMapWaiting();
        const allResults = [
            ...(dataA?.buyers_results || []).map(b => ({ ...b, factory: "A" })),
            ...(dataB?.buyers_results || []).map(b => ({ ...b, factory: "B" }))
        ];
        setTimeout(() => animateMiniMap(allResults), 150);
    } catch (error) {
        showError(`Ошибка:\n${error.message}`);
        runBtn.textContent = "Запустить симуляцию";
    } finally {
        runBtn.disabled = false;
    }
}


// Формирует текстовый отчет для скачивания
function buildReport(dataA, dataB, modeA, modeB) {
    const totalsStr = t => !t ? "" :
        `Q: ${formatNumber(t.Q)} | Revenue: ${formatNumber(t.Revenue)} | Profit: ${formatNumber(t.Profit)}\n` +
        `CS: ${formatNumber(t.CS)} | PS: ${formatNumber(t.PS)} | W: ${formatNumber(t.W)} | W_eff: ${formatNumber(t.W_eff)} | DWL: ${formatNumber(t.DWL)}\n`;
    const buyersStr = results => (results || []).map((b, i) =>
        `  #${i+1} (ID ${b.id}) | ${b.segment} | ${b.demand_type} | Gap=${formatNumber(b.gap)} q*=${formatNumber(b.q)} T=${formatNumber(b.payment)} CS=${formatNumber(b.consumer_surplus)}\n`
    ).join("");
    let text = "ОТЧЕТ ПО СИМУЛЯЦИИ\n==================\n\n";
    if (dataA) text += `ФИРМА A — ${MODE_NAMES[modeA]}\n${"─".repeat(36)}\n${buyersStr(dataA.buyers_results)}\n${totalsStr(dataA.totals)}\n`;
    if (dataB) text += `ФИРМА B — ${MODE_NAMES[modeB]}\n${"─".repeat(36)}\n${buyersStr(dataB.buyers_results)}\n${totalsStr(dataB.totals)}\n`;
    if (dataA && dataB) text += `СУММАРНО\n${"─".repeat(36)}\n${totalsStr(combineTotals(dataA.totals, dataB.totals))}`;
    return text;
}

// Создает Blob из текста отчета и инициирует скачивание файла
function downloadReport() {
    if (!lastReportText) return;
    const blob = new Blob([lastReportText], { type: "text/plain;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "simulation_report.txt";
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
}


// Читает параметры из формы сравнения режимов
function getCompareParams() {
    return {
        uniform_params: { p: parseFloat(document.getElementById("cmp-uniform-p").value) },
        pd2_params: { F: parseFloat(document.getElementById("cmp-pd2-F").value), p: parseFloat(document.getElementById("cmp-pd2-p").value) },
        pd3_params: { segment_prices: { A: parseFloat(document.getElementById("cmp-pd3-pA").value), B: parseFloat(document.getElementById("cmp-pd3-pB").value), C: parseFloat(document.getElementById("cmp-pd3-pC").value) } }
    };
}

// Отправляет POST /compare с параметрами всех 4 режимов и рендерит таблицу сравнения
async function runComparison() {
    if (buyers.length === 0) { document.getElementById("compare-results").innerHTML = `<div class="placeholder-text">Сначала добавь покупателей.</div>`; return; }
    compareBtn.disabled = true; compareBtn.textContent = "Считаю...";
    try {
        const response = await fetch(`${BACKEND_BASE_URL}/compare`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ buyers: collectBuyersData(), mc: parseFloat(document.getElementById("mc-a").value), capacity_per_day: parseInt(document.getElementById("capacity-a").value) || null, ...getCompareParams() })
        });
        if (!response.ok) { const err = await response.json(); throw new Error(JSON.stringify(err.detail)); }
        renderCompareResults(await response.json());
    } catch (e) {
        document.getElementById("compare-results").innerHTML = `<div class="placeholder-text" style="color:#dc2626">Ошибка: ${e.message}</div>`;
    } finally {
        compareBtn.disabled = false; compareBtn.textContent = "Сравнить все режимы";
    }
}

// рендерит таблицу и график сравнения всех четырех режимов с подсветкой лучших значений
function renderCompareResults(results) {
    const modes   = ["uniform", "pd1", "pd2", "pd3"];
    const labels  = { uniform: "Uniform", pd1: "PD1", pd2: "PD2", pd3: "PD3" };
    const metrics = [
        { key: "Q", label: "Q", better: "max" }, { key: "Revenue", label: "Revenue", better: "max" },
        { key: "Profit", label: "Profit", better: "max" }, { key: "CS", label: "CS", better: "max" },
        { key: "PS", label: "PS", better: "max" }, { key: "W", label: "W", better: "max" },
        { key: "DWL", label: "DWL", better: "min" }
    ];
    const bestFor = {};
    metrics.forEach(m => {
        const vals = modes.map(mode => results[mode][m.key]);
        bestFor[m.key] = m.better === "max" ? Math.max(...vals) : Math.min(...vals);
    });
    const rows = modes.map(mode => {
        const t = results[mode];
        const cells = metrics.map(m => {
            const val = t[m.key], best = Math.abs(val - bestFor[m.key]) < 0.0001;
            return `<td${best ? ' class="compare-best"' : ""}>${formatNumber(val)}</td>`;
        }).join("");
        return `<tr><td class="compare-mode-name">${labels[mode]}</td>${cells}</tr>`;
    }).join("");
    document.getElementById("compare-results").innerHTML = `
        <div class="compare-weff-note">W_eff (benchmark при P=MC): <strong>${formatNumber(results.pd1.W_eff)}</strong></div>
        <div class="compare-table-wrap">
            <table class="compare-table">
                <thead><tr><th>Режим</th>${metrics.map(m => `<th>${m.label}</th>`).join("")}</tr></thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
        <div class="compare-chart-wrap"><div class="chart-title">CS / PS / W / DWL по режимам</div><canvas id="compare-canvas"></canvas></div>`;
    if (compareChart) { compareChart.destroy(); compareChart = null; }
    compareChart = new Chart(document.getElementById("compare-canvas").getContext("2d"), {
        type: "bar",
        data: {
            labels: ["Uniform", "PD1", "PD2", "PD3"],
            datasets: [
                { label: "CS",  data: modes.map(m => results[m].CS),  backgroundColor: "#86efac", borderColor: "#22c55e", borderWidth: 1.5, borderRadius: 4 },
                { label: "PS",  data: modes.map(m => results[m].PS),  backgroundColor: "#93c5fd", borderColor: "#3b82f6", borderWidth: 1.5, borderRadius: 4 },
                { label: "W",   data: modes.map(m => results[m].W),   backgroundColor: "#c4b5fd", borderColor: "#8b5cf6", borderWidth: 1.5, borderRadius: 4 },
                { label: "DWL", data: modes.map(m => results[m].DWL), backgroundColor: "#fca5a5", borderColor: "#ef4444", borderWidth: 1.5, borderRadius: 4 }
            ]
        },
        options: { responsive: true, plugins: { legend: { position: "top" } }, scales: { y: { beginAtZero: true } } }
    });
}


// Форматирует число: целые без дробей, остальные с 2 знаками после запятой
function formatNumber(value) {
    if (typeof value !== "number") return value ?? "-";
    if (Number.isInteger(value)) return value.toString();
    return value.toFixed(2);
}

function switchTab(tabId) {
    tabButtons.forEach(btn => btn.classList.toggle("active", btn.dataset.tab === tabId));
    tabContents.forEach(c => c.classList.toggle("active", c.id === tabId));
}


// Обработчики событий
document.getElementById("pricing-mode-a").addEventListener("change", (e) => { renderPricingParams(e.target.value, "a"); renderBattlefieldWaiting(); });
document.getElementById("pricing-mode-b").addEventListener("change", (e) => { renderPricingParams(e.target.value, "b"); renderBattlefieldWaiting(); });

addBuyerBtn.addEventListener("click",      () => { addBuyer(null); saveState(); setDirty(); });
runBtn.addEventListener("click",           runSimulation);
downloadBtn.addEventListener("click",      downloadReport);
compareBtn.addEventListener("click",       runComparison);
saveSnapshotBtn.addEventListener("click",  saveSnapshot);
snapClearBtn.addEventListener("click",     clearSnapshots);
tabButtons.forEach(btn => btn.addEventListener("click", () => switchTab(btn.dataset.tab)));
advancedToggle.addEventListener("change",  e => toggleAdvancedMode(e.target.checked));

toggleReportBtn.addEventListener("click", () => {
    const hidden = resultBox.classList.toggle("hidden");
    toggleReportBtn.textContent = hidden ? "▶ Показать текстовый отчет" : "▼ Скрыть текстовый отчет";
});

document.querySelectorAll(".scenario-btn").forEach(btn => {
    btn.addEventListener("click", () => loadScenario(btn.dataset.scenario));
});

// Делегированный обработчик: любое изменение в панели управления сохраняет состояние и помечает как dirty
const controlsPanel = document.querySelector(".controls");
controlsPanel.addEventListener("input",  () => { saveState(); setDirty(); });
controlsPanel.addEventListener("change", () => { saveState(); setDirty(); });


// инициализация: рендерим параметры режимов и восстанавливаем состояние из localStorage
renderPricingParams("uniform", "a");
renderPricingParams("uniform", "b");

if (!loadSavedState()) {
    addBuyer(null);
}
