const BACKEND_BASE_URL = "http://127.0.0.1:8000";

const runBtn = document.getElementById("run-btn");
const downloadBtn = document.getElementById("download-btn");
const resultBox = document.getElementById("result-box");
const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");
const buyersGrid = document.getElementById("buyers-grid");
const firmCard = document.getElementById("firm-card");
const pricingModeSelect = document.getElementById("pricing-mode");
const pricingParamsBlock = document.getElementById("pricing-params-block");
const buyersList = document.getElementById("buyers-list");
const addBuyerBtn = document.getElementById("add-buyer-btn");

let lastReportText = "";
let buyerCounter = 1;
let buyers = [];

// --- Pricing params ---

function renderPricingParams(mode) {
    let html = "";
    if (mode === "uniform") {
        html = `<div class="field"><label>Цена p</label><input type="number" id="param-p" value="4" min="0" step="0.1"></div>`;
    } else if (mode === "pd1") {
        html = `<p class="hint">PD1 не требует дополнительных параметров.</p>`;
    } else if (mode === "pd2") {
        html = `
            <div class="field"><label>Фиксированный платёж F</label><input type="number" id="param-F" value="5" min="0" step="0.1"></div>
            <div class="field"><label>Цена за единицу p</label><input type="number" id="param-p" value="3" min="0" step="0.1"></div>
        `;
    } else if (mode === "pd3") {
        html = `
            <div class="field"><label>Цена для сегмента A</label><input type="number" id="param-pA" value="3" min="0" step="0.1"></div>
            <div class="field"><label>Цена для сегмента B</label><input type="number" id="param-pB" value="5" min="0" step="0.1"></div>
            <div class="field"><label>Цена для сегмента C</label><input type="number" id="param-pC" value="7" min="0" step="0.1"></div>
        `;
    }
    pricingParamsBlock.innerHTML = html;
}

function getPricingParams(mode) {
    if (mode === "uniform") return { p: parseFloat(document.getElementById("param-p").value) };
    if (mode === "pd1") return {};
    if (mode === "pd2") return {
        F: parseFloat(document.getElementById("param-F").value),
        p: parseFloat(document.getElementById("param-p").value)
    };
    if (mode === "pd3") return {
        segment_prices: {
            A: parseFloat(document.getElementById("param-pA").value),
            B: parseFloat(document.getElementById("param-pB").value),
            C: parseFloat(document.getElementById("param-pC").value)
        }
    };
    return {};
}

// --- Demand params ---

function renderDemandParams(buyerId, demandType) {
    const container = document.getElementById(`demand-params-${buyerId}`);
    if (!container) return;
    let html = "";
    if (demandType === "linear") {
        html = `
            <div class="field"><label>a (макс. MB)</label><input type="number" id="b${buyerId}-a" value="10" min="0" step="0.1"></div>
            <div class="field"><label>b (наклон)</label><input type="number" id="b${buyerId}-b" value="2" min="0.01" step="0.1"></div>
        `;
    } else if (demandType === "inverse_square") {
        html = `<div class="field"><label>A (коэффициент)</label><input type="number" id="b${buyerId}-A" value="20" min="0.01" step="0.1"></div>`;
    } else if (demandType === "step") {
        html = `<div class="field"><label>Values (через запятую)</label><input type="text" id="b${buyerId}-values" value="10, 10, 6, 6, 2" placeholder="10, 8, 6, 4, 2"></div>`;
    }
    container.innerHTML = html;
}

function getDemandParams(buyerId, demandType) {
    if (demandType === "linear") return {
        a: parseFloat(document.getElementById(`b${buyerId}-a`).value),
        b: parseFloat(document.getElementById(`b${buyerId}-b`).value)
    };
    if (demandType === "inverse_square") return {
        A: parseFloat(document.getElementById(`b${buyerId}-A`).value)
    };
    if (demandType === "step") {
        const raw = document.getElementById(`b${buyerId}-values`).value;
        return { values: raw.split(",").map(v => parseFloat(v.trim())).filter(v => !isNaN(v)) };
    }
    return {};
}

// --- Buyers ---

function addBuyer() {
    const buyer = { id: buyerCounter++ };
    buyers.push(buyer);

    const div = document.createElement("div");
    div.className = "buyer-form-card";
    div.id = `buyer-form-${buyer.id}`;
    div.innerHTML = `
        <div class="buyer-form-header">
            <span class="buyer-form-title">Покупатель #${buyer.id}</span>
            <button class="remove-buyer-btn" data-id="${buyer.id}">✕</button>
        </div>
        <div class="field">
            <label>Сегмент</label>
            <select id="b${buyer.id}-segment">
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
            </select>
        </div>
        <div class="field">
            <label>Бюджет (money)</label>
            <input type="number" id="b${buyer.id}-money" value="30" min="0" step="1">
        </div>
        <div class="field">
            <label>target_stock</label>
            <input type="number" id="b${buyer.id}-target_stock" value="5" min="0" step="1">
        </div>
        <div class="field">
            <label>stock (текущий запас)</label>
            <input type="number" id="b${buyer.id}-stock" value="0" min="0" step="1">
        </div>
        <div class="field">
            <label>Тип спроса</label>
            <select id="b${buyer.id}-demand_type" data-id="${buyer.id}">
                <option value="linear">linear</option>
                <option value="inverse_square">inverse_square</option>
                <option value="step">step</option>
            </select>
        </div>
        <div id="demand-params-${buyer.id}"></div>
    `;

    buyersList.appendChild(div);
    renderDemandParams(buyer.id, "linear");

    document.getElementById(`b${buyer.id}-demand_type`).addEventListener("change", (e) => {
        renderDemandParams(buyer.id, e.target.value);
    });

    div.querySelector(".remove-buyer-btn").addEventListener("click", () => {
        buyers = buyers.filter(b => b.id !== buyer.id);
        div.remove();
    });
}

function collectBuyersData() {
    return buyers.map(buyer => {
        const id = buyer.id;
        const demandType = document.getElementById(`b${id}-demand_type`).value;
        return {
            id: id,
            money: parseFloat(document.getElementById(`b${id}-money`).value),
            segment: document.getElementById(`b${id}-segment`).value,
            target_stock: parseInt(document.getElementById(`b${id}-target_stock`).value),
            stock: parseInt(document.getElementById(`b${id}-stock`).value),
            demand_type: demandType,
            params: getDemandParams(id, demandType)
        };
    });
}

// --- Run ---

async function runSimulation() {
    if (buyers.length === 0) {
        resultBox.textContent = "Добавь хотя бы одного покупателя.";
        return;
    }

    const mode = pricingModeSelect.value;
    const capacityVal = document.getElementById("capacity").value;

    const payload = {
        pricing_mode: mode,
        pricing_params: getPricingParams(mode),
        buyers: collectBuyersData(),
        mc: parseFloat(document.getElementById("mc").value),
        capacity_per_day: capacityVal ? parseInt(capacityVal) : null
    };

    resultBox.textContent = "Загрузка...";
    downloadBtn.disabled = true;
    lastReportText = "";

    try {
        const response = await fetch(`${BACKEND_BASE_URL}/simulate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(JSON.stringify(err.detail, null, 2));
        }

        const data = await response.json();
        const reportText = buildSimulationReport(data);
        resultBox.textContent = reportText;
        lastReportText = reportText;
        downloadBtn.disabled = false;
        renderBattlefield(mode, data);
    } catch (error) {
        resultBox.textContent = `Ошибка:\n${error.message}`;
    }
}

// --- Battlefield ---

function formatNumber(value) {
    if (typeof value !== "number") return value;
    if (Number.isInteger(value)) return value.toString();
    return value.toFixed(2);
}

const MODE_NAMES = {
    uniform: "Uniform pricing",
    pd1: "PD1 — первая степень",
    pd2: "PD2 — двухчастный тариф",
    pd3: "PD3 — третья степень"
};

function renderBattlefield(mode, data) {
    if (!data.buyers_results || !data.totals) return;
    const t = data.totals;

    firmCard.innerHTML = `
        <div class="firm-title">Monopolist / Factory</div>
        <div class="firm-mode">Режим: ${MODE_NAMES[mode] || mode}</div>
        <div class="firm-stats">
            <div class="mini-stat"><span class="mini-stat-label">Q</span><span class="mini-stat-value">${formatNumber(t.Q)}</span></div>
            <div class="mini-stat"><span class="mini-stat-label">Revenue</span><span class="mini-stat-value">${formatNumber(t.Revenue)}</span></div>
            <div class="mini-stat"><span class="mini-stat-label">Profit</span><span class="mini-stat-value">${formatNumber(t.Profit)}</span></div>
        </div>
    `;

    buyersGrid.innerHTML = data.buyers_results.map(buyer => {
        const bought = buyer.q > 0;
        return `
            <div class="buyer-card segment-${buyer.segment} status-${bought ? "bought" : "skipped"}">
                <div class="buyer-header">
                    <div class="buyer-name">Buyer #${buyer.id}</div>
                    <div class="status-badge ${bought ? "bought" : "skipped"}">${bought ? "Купил" : "Не купил"}</div>
                </div>
                <div class="buyer-meta">Segment: <strong>${buyer.segment}</strong><br>Demand: <strong>${buyer.demand_type}</strong></div>
                <div class="buyer-stats">
                    <div class="buyer-stat"><span class="buyer-stat-label">Gap</span><span class="buyer-stat-value">${formatNumber(buyer.gap)}</span></div>
                    <div class="buyer-stat"><span class="buyer-stat-label">Bought</span><span class="buyer-stat-value">${formatNumber(buyer.q)}</span></div>
                    <div class="buyer-stat"><span class="buyer-stat-label">Payment</span><span class="buyer-stat-value">${formatNumber(buyer.payment)}</span></div>
                    <div class="buyer-stat"><span class="buyer-stat-label">CS</span><span class="buyer-stat-value">${formatNumber(buyer.consumer_surplus)}</span></div>
                </div>
            </div>
        `;
    }).join("");
}

// --- Report ---

function buildSimulationReport(data) {
    let text = "ОТЧЁТ ПО СИМУЛЯЦИИ РЫНКА\n=======================\n\n";
    text += "РЕЗУЛЬТАТЫ ПО ПОКУПАТЕЛЯМ\n-------------------------\n\n";

    data.buyers_results.forEach((buyer, index) => {
        text += `Покупатель #${index + 1}\n`;
        text += `ID: ${buyer.id} | Сегмент: ${buyer.segment} | Спрос: ${buyer.demand_type}\n`;
        text += `Gap: ${formatNumber(buyer.gap)} | q*: ${formatNumber(buyer.q)}\n`;
        text += `V(q*): ${formatNumber(buyer.value)} | T(q*): ${formatNumber(buyer.payment)}\n`;
        text += `U(q*): ${formatNumber(buyer.utility)} | CS: ${formatNumber(buyer.consumer_surplus)}\n`;
        text += buyer.q === 0 ? "→ Отказался от покупки\n\n" : "→ Купил оптимальный объём\n\n";
    });

    const t = data.totals;
    text += "ИТОГИ ПО ФИРМЕ\n--------------\n";
    text += `Q: ${formatNumber(t.Q)}\n`;
    text += `Revenue: ${formatNumber(t.Revenue)}\n`;
    text += `VarCost: ${formatNumber(t.VarCost)}\n`;
    text += `Profit: ${formatNumber(t.Profit)}\n`;
    text += `CS: ${formatNumber(t.CS)}\n`;
    text += `PS: ${formatNumber(t.PS)}\n`;
    text += `W: ${formatNumber(t.W)}\n`;
    return text;
}

function downloadReport() {
    if (!lastReportText) return;
    const blob = new Blob([lastReportText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "simulation_report.txt";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

// --- Tabs ---

function switchTab(tabId) {
    tabButtons.forEach(btn => btn.classList.toggle("active", btn.dataset.tab === tabId));
    tabContents.forEach(c => c.classList.toggle("active", c.id === tabId));
}

// --- Init ---

pricingModeSelect.addEventListener("change", () => renderPricingParams(pricingModeSelect.value));
addBuyerBtn.addEventListener("click", addBuyer);
runBtn.addEventListener("click", runSimulation);
downloadBtn.addEventListener("click", downloadReport);
tabButtons.forEach(btn => btn.addEventListener("click", () => switchTab(btn.dataset.tab)));

renderPricingParams("uniform");
addBuyer();
