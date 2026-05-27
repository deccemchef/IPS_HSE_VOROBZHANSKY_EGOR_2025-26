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
const totalsGrid = document.getElementById("totals-grid");
const buyersTableContainer = document.getElementById("buyers-table-container");
const toggleReportBtn = document.getElementById("toggle-report-btn");
const chartsContainer = document.getElementById("charts-container");

let lastReportText = "";
let buyerCounter = 1;
let buyers = [];
let welfareChart = null;
let buyersChart = null;

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

function getBuyerDisplayData(id) {
    return {
        segment: document.getElementById(`b${id}-segment`)?.value || "A",
        demandType: document.getElementById(`b${id}-demand_type`)?.value || "linear"
    };
}

function renderMiniMapWaiting() {
    const mapEl = document.getElementById("mini-map");
    if (!mapEl) return;

    if (buyers.length === 0) {
        mapEl.innerHTML = `<div class="map-firm">🏭</div><div class="map-path"></div>`;
        return;
    }

    const mapWidth = mapEl.offsetWidth || 600;
    const step = Math.min(46, Math.floor(76 / buyers.length));

    const figures = buyers.map((buyer, i) => {
        const top = 12 + i * step;
        const left = mapWidth - 60 - i * 5;
        return `<div class="map-figure" id="map-fig-${buyer.id}" style="left:${left}px; top:${top}px">
            🧍<span class="map-figure-label">#${buyer.id}</span>
        </div>`;
    }).join("");

    mapEl.innerHTML = `<div class="map-firm">🏭</div><div class="map-path"></div>${figures}`;
}

function animateMiniMap(buyers_results) {
    buyers_results.forEach((b, i) => {
        const fig = document.getElementById(`map-fig-${b.id}`);
        if (!fig) return;
        if (b.q > 0) {
            fig.innerHTML = `🚶<span class="map-figure-label">#${b.id}</span>`;
            setTimeout(() => { fig.style.left = "72px"; }, i * 300 + 100);
        } else {
            fig.innerHTML = `🚫<span class="map-figure-label">#${b.id}</span>`;
        }
    });
}

function renderBattlefieldWaiting() {
    firmCard.innerHTML = `
        <div class="firm-title">Monopolist / Factory</div>
        <div class="firm-mode">Режим: ожидание запуска</div>
        <div class="firm-stats">
            <div class="mini-stat"><span class="mini-stat-label">Q</span><span class="mini-stat-value">—</span></div>
            <div class="mini-stat"><span class="mini-stat-label">Revenue</span><span class="mini-stat-value">—</span></div>
            <div class="mini-stat"><span class="mini-stat-label">Profit</span><span class="mini-stat-value">—</span></div>
        </div>
    `;

    if (buyers.length === 0) {
        buyersGrid.innerHTML = `<div class="placeholder-text">Добавь покупателей в левой панели.</div>`;
        renderMiniMapWaiting();
        return;
    }

    buyersGrid.innerHTML = buyers.map(buyer => {
        const { segment, demandType } = getBuyerDisplayData(buyer.id);
        return `
            <div class="buyer-card segment-${segment} status-waiting">
                <div class="buyer-header">
                    <div class="buyer-name">Buyer #${buyer.id}</div>
                    <div class="status-badge waiting">Ожидает</div>
                </div>
                <div class="buyer-meta">
                    Segment: <strong>${segment}</strong><br>
                    Demand: <strong>${demandType}</strong>
                </div>
            </div>
        `;
    }).join("");

    renderMiniMapWaiting();
}

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
        <div class="field"><label>Сегмент</label>
            <select id="b${buyer.id}-segment">
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
            </select>
        </div>
        <div class="field"><label>Бюджет (money)</label><input type="number" id="b${buyer.id}-money" value="30" min="0" step="1"></div>
        <div class="field"><label>target_stock</label><input type="number" id="b${buyer.id}-target_stock" value="5" min="0" step="1"></div>
        <div class="field"><label>stock (текущий запас)</label><input type="number" id="b${buyer.id}-stock" value="0" min="0" step="1"></div>
        <div class="field"><label>Тип спроса</label>
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
        renderBattlefieldWaiting();
    });

    renderBattlefieldWaiting();
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

function renderTotals(totals) {
    const fields = [
        { label: "Q", key: "Q" },
        { label: "Revenue", key: "Revenue" },
        { label: "Profit", key: "Profit" },
        { label: "CS", key: "CS" },
        { label: "PS", key: "PS" },
        { label: "W", key: "W" }
    ];
    totalsGrid.innerHTML = fields.map(f => `
        <div class="total-card">
            <span class="total-card-label">${f.label}</span>
            <span class="total-card-value">${formatNumber(totals[f.key])}</span>
        </div>
    `).join("");
}

function renderCharts(data) {
    const t = data.totals;
    const results = data.buyers_results;

    chartsContainer.innerHTML = `
        <div class="chart-wrap">
            <div class="chart-title">Распределение благосостояния</div>
            <canvas id="welfare-canvas"></canvas>
        </div>
        <div class="chart-wrap">
            <div class="chart-title">Результаты по покупателям</div>
            <canvas id="buyers-canvas"></canvas>
        </div>
    `;

    if (welfareChart) { welfareChart.destroy(); welfareChart = null; }
    if (buyersChart) { buyersChart.destroy(); buyersChart = null; }

    const welfareCtx = document.getElementById("welfare-canvas").getContext("2d");
    welfareChart = new Chart(welfareCtx, {
        type: "bar",
        data: {
            labels: ["CS", "PS (Profit)", "W (Total)"],
            datasets: [{
                data: [t.CS, t.PS, t.W],
                backgroundColor: ["#86efac", "#93c5fd", "#c4b5fd"],
                borderColor: ["#22c55e", "#3b82f6", "#8b5cf6"],
                borderWidth: 1.5,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, grid: { color: "#f1f5f9" } } }
        }
    });

    const buyerLabels = results.map(b => `Buyer #${b.id}`);
    const buyersCtx = document.getElementById("buyers-canvas").getContext("2d");
    buyersChart = new Chart(buyersCtx, {
        type: "bar",
        data: {
            labels: buyerLabels,
            datasets: [
                {
                    label: "Value",
                    data: results.map(b => b.value),
                    backgroundColor: "#86efac",
                    borderColor: "#22c55e",
                    borderWidth: 1.5,
                    borderRadius: 4
                },
                {
                    label: "Payment",
                    data: results.map(b => b.payment),
                    backgroundColor: "#93c5fd",
                    borderColor: "#3b82f6",
                    borderWidth: 1.5,
                    borderRadius: 4
                },
                {
                    label: "CS",
                    data: results.map(b => b.consumer_surplus),
                    backgroundColor: "#fde68a",
                    borderColor: "#f59e0b",
                    borderWidth: 1.5,
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: "top", labels: { font: { size: 12 } } } },
            scales: { y: { beginAtZero: true, grid: { color: "#f1f5f9" } } }
        }
    });
}

function renderBuyersTable(buyersResults) {
    if (!buyersResults.length) {
        buyersTableContainer.innerHTML = `<div class="placeholder-text">Нет данных.</div>`;
        return;
    }
    const rows = buyersResults.map(b => `
        <tr>
            <td>${b.id}</td>
            <td>${b.segment}</td>
            <td>${b.demand_type}</td>
            <td>${formatNumber(b.gap)}</td>
            <td>${formatNumber(b.q)}</td>
            <td>${formatNumber(b.payment)}</td>
            <td>${formatNumber(b.utility)}</td>
            <td>${formatNumber(b.consumer_surplus)}</td>
        </tr>
    `).join("");
    buyersTableContainer.innerHTML = `
        <table class="buyers-table">
            <thead>
                <tr>
                    <th>ID</th><th>Сегмент</th><th>Тип спроса</th><th>Gap</th>
                    <th>q*</th><th>Payment</th><th>Utility</th><th>CS</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    `;
}

function showError(msg) {
    resultBox.classList.remove("hidden");
    resultBox.textContent = msg;
    toggleReportBtn.textContent = "▼ Скрыть текстовый отчёт";
}

async function runSimulation() {
    if (buyers.length === 0) {
        showError("Добавь хотя бы одного покупателя.");
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

        renderTotals(data.totals);
        renderCharts(data);
        renderBuyersTable(data.buyers_results);
        renderBattlefield(mode, data);
        renderMiniMapWaiting();
        setTimeout(() => animateMiniMap(data.buyers_results), 150);
    } catch (error) {
        showError(`Ошибка:\n${error.message}`);
    }
}

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

    buyersGrid.innerHTML = data.buyers_results.map((buyer, index) => {
        const bought = buyer.q > 0;
        const statusClass = bought ? "bought" : "skipped";
        const statusLabel = bought ? "Купил" : "Не купил";
        const delay = index * 120;
        return `
            <div class="buyer-card segment-${buyer.segment} status-${statusClass} card-animate" style="animation-delay: ${delay}ms">
                <div class="buyer-header">
                    <div class="buyer-name">Buyer #${buyer.id}</div>
                    <div class="status-badge ${statusClass}">${statusLabel}</div>
                </div>
                <div class="buyer-meta">
                    Segment: <strong>${buyer.segment}</strong><br>
                    Demand: <strong>${buyer.demand_type}</strong>
                </div>
                <div class="buyer-stats">
                    <div class="buyer-stat"><span class="buyer-stat-label">Gap</span><span class="buyer-stat-value">${formatNumber(buyer.gap)}</span></div>
                    <div class="buyer-stat"><span class="buyer-stat-label">Bought</span><span class="buyer-stat-value">${formatNumber(buyer.q)}</span></div>
                    <div class="buyer-stat"><span class="buyer-stat-label">Payment</span><span class="buyer-stat-value">${formatNumber(buyer.payment)}</span></div>
                    <div class="buyer-stat"><span class="buyer-stat-label">CS</span><span class="buyer-stat-value">${formatNumber(buyer.consumer_surplus)}</span></div>
                </div>
                ${bought ? `<div class="payment-arrow" style="animation-delay: ${delay + 200}ms">← оплата отправлена</div>` : ""}
            </div>
        `;
    }).join("");
}

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

function switchTab(tabId) {
    tabButtons.forEach(btn => btn.classList.toggle("active", btn.dataset.tab === tabId));
    tabContents.forEach(c => c.classList.toggle("active", c.id === tabId));
}

pricingModeSelect.addEventListener("change", () => renderPricingParams(pricingModeSelect.value));
addBuyerBtn.addEventListener("click", addBuyer);
runBtn.addEventListener("click", runSimulation);
downloadBtn.addEventListener("click", downloadReport);
tabButtons.forEach(btn => btn.addEventListener("click", () => switchTab(btn.dataset.tab)));

toggleReportBtn.addEventListener("click", () => {
    const hidden = resultBox.classList.toggle("hidden");
    toggleReportBtn.textContent = hidden ? "▶ Показать текстовый отчёт" : "▼ Скрыть текстовый отчёт";
});

renderPricingParams("uniform");
addBuyer();
