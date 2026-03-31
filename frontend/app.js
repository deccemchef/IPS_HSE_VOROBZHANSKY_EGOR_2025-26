const BACKEND_BASE_URL = "http://127.0.0.1:8000";

const runBtn = document.getElementById("run-btn");
const downloadBtn = document.getElementById("download-btn");
const endpointSelect = document.getElementById("endpoint-select");
const resultBox = document.getElementById("result-box");

const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

const buyersGrid = document.getElementById("buyers-grid");
const firmCard = document.getElementById("firm-card");

let lastReportText = "";

function formatNumber(value) {
    if (typeof value !== "number") {
        return value;
    }

    if (Number.isInteger(value)) {
        return value.toString();
    }

    return value.toFixed(2);
}

function buildDemandReport(data) {
    let text = "ОТЧЁТ ПО ПРОВЕРКЕ СПРОСА\n";
    text += "========================\n\n";
    text += "В этом режиме система показывает, как устроены предельная полезность MB(k) и суммарная ценность V(q) для разных типов спроса.\n\n";

    for (const [demandType, values] of Object.entries(data)) {
        text += `Тип спроса: ${demandType}\n`;
        text += `Предельные полезности MB(1..5): ${values.MB_1_to_5.map(formatNumber).join(", ")}\n`;
        text += `Суммарная ценность пяти единиц V(5): ${formatNumber(values.V_5)}\n`;

        if (demandType === "linear") {
            text += "Комментарий: полезность убывает линейно, каждая следующая единица ценится меньше предыдущей.\n";
        } else if (demandType === "inverse_square") {
            text += "Комментарий: первая единица очень ценна, затем полезность резко снижается.\n";
        } else if (demandType === "step") {
            text += "Комментарий: полезность меняется ступенчато, по заранее заданным уровням.\n";
        }

        text += "\n";
    }

    return text;
}

function buildOptimizerReport(data) {
    let text = "ОТЧЁТ ПО ОПТИМИЗАТОРУ ПОКУПАТЕЛЯ\n";
    text += "================================\n\n";
    text += "В этом режиме один и тот же покупатель сравнивает разные схемы оплаты и выбирает такой объём покупки q*, который максимизирует полезность U(q) = V(q) - T(q).\n\n";

    const modeNames = {
        uniform: "Uniform pricing",
        pd1: "PD1 — ценовая дискриминация первой степени",
        pd2: "PD2 — двухчастный тариф",
        pd3: "PD3 — ценовая дискриминация третьей степени"
    };

    for (const [mode, result] of Object.entries(data)) {
        const title = modeNames[mode] || mode;

        text += `${title}\n`;
        text += `${"-".repeat(title.length)}\n`;
        text += `Оптимальный объём покупки q*: ${formatNumber(result.q)}\n`;
        text += `Суммарная ценность V(q*): ${formatNumber(result.value)}\n`;
        text += `Платёж T(q*): ${formatNumber(result.payment)}\n`;
        text += `Полезность U(q*): ${formatNumber(result.utility)}\n`;
        text += `Потребительский излишек CS: ${formatNumber(result.consumer_surplus)}\n`;

        if (mode === "uniform") {
            text += "Комментарий: покупатель платит одну и ту же цену за каждую единицу товара.\n";
        } else if (mode === "pd1") {
            text += "Комментарий: фирма почти полностью изымает ценность товара, поэтому потребительский излишек обычно близок к нулю.\n";
        } else if (mode === "pd2") {
            text += "Комментарий: в платёж входит фиксированная часть F и поштучная цена p, что позволяет фирме изымать часть излишка через входной платёж.\n";
        } else if (mode === "pd3") {
            text += "Комментарий: цена зависит от сегмента покупателя, поэтому одинаковый объём может стоить разным группам по-разному.\n";
        }

        text += "\n";
    }

    return text;
}

function buildSimulationReport(data) {
    let text = "ОТЧЁТ ПО СИМУЛЯЦИИ РЫНКА\n";
    text += "=======================\n\n";
    text += "Симуляция моделирует взаимодействие фирмы и нескольких гетерогенных покупателей. Для каждого покупателя рассчитываются допустимый объём покупки, платёж, полезность и излишек, после чего результаты агрегируются на уровне всей фирмы.\n\n";

    text += "РЕЗУЛЬТАТЫ ПО ПОКУПАТЕЛЯМ\n";
    text += "-------------------------\n\n";

    data.buyers_results.forEach((buyer, index) => {
        text += `Покупатель #${index + 1}\n`;
        text += `ID: ${buyer.id}\n`;
        text += `Сегмент: ${buyer.segment}\n`;
        text += `Тип спроса: ${buyer.demand_type}\n`;
        text += `Gap: ${formatNumber(buyer.gap)}\n`;
        text += `Effective gap: ${formatNumber(buyer.effective_gap)}\n`;
        text += `Куплено q*: ${formatNumber(buyer.q)}\n`;
        text += `Ценность V(q*): ${formatNumber(buyer.value)}\n`;
        text += `Платёж T(q*): ${formatNumber(buyer.payment)}\n`;
        text += `Полезность U(q*): ${formatNumber(buyer.utility)}\n`;
        text += `Потребительский излишек CS: ${formatNumber(buyer.consumer_surplus)}\n`;

        if (buyer.q === 0) {
            text += "Комментарий: покупатель отказался от покупки, потому что ни один допустимый вариант не дал положительной выгоды.\n";
        } else {
            text += "Комментарий: покупатель выбрал тот объём, который максимизирует его выгоду при заданной цене и бюджетном ограничении.\n";
        }

        text += "\n";
    });

    const totals = data.totals;

    text += "ОБЩИЕ ИТОГИ ПО ФИРМЕ\n";
    text += "--------------------\n\n";
    text += `Общий объём продаж Q: ${formatNumber(totals.Q)}\n`;
    text += `Выручка Revenue: ${formatNumber(totals.Revenue)}\n`;
    text += `Переменные издержки VarCost: ${formatNumber(totals.VarCost)}\n`;
    text += `Прибыль Profit: ${formatNumber(totals.Profit)}\n`;
    text += `Потребительский излишек CS: ${formatNumber(totals.CS)}\n`;
    text += `Производительный излишек PS: ${formatNumber(totals.PS)}\n`;
    text += `Общественное благосостояние W: ${formatNumber(totals.W)}\n\n`;

    text += "ЭКОНОМИЧЕСКАЯ ИНТЕРПРЕТАЦИЯ\n";
    text += "--------------------------\n";
    text += "Выручка показывает, сколько денег фирма получила от покупателей. ";
    text += "Переменные издержки показывают, сколько фирма потратила на производство реализованного объёма. ";
    text += "Прибыль — это разница между выручкой и переменными издержками. ";
    text += "Потребительский излишек измеряет выгоду покупателей, а производительный излишек — выгоду фирмы. ";
    text += "Их сумма образует общественное благосостояние.\n";

    return text;
}

function buildGenericReport(data) {
    return "СИСТЕМА ПОЛУЧИЛА СЛЕДУЮЩИЕ ДАННЫЕ:\n\n" + JSON.stringify(data, null, 2);
}

function createReport(endpoint, data) {
    if (endpoint === "/test-demand") {
        return buildDemandReport(data);
    }

    if (endpoint === "/test-optimizer") {
        return buildOptimizerReport(data);
    }

    if (endpoint === "/test-simulation") {
        return buildSimulationReport(data);
    }

    return buildGenericReport(data);
}

function getStatusInfo(q) {
    if (q > 0) {
        return { className: "bought", label: "Купил" };
    }
    return { className: "skipped", label: "Не купил" };
}

function renderBattlefield(endpoint, data) {
    if (!buyersGrid || !firmCard) {
        return;
    }

    if (endpoint !== "/test-simulation" || !data.buyers_results || !data.totals) {
        buyersGrid.innerHTML = `
            <div class="placeholder-text">
                Игровое поле сейчас отображается для сценария <strong>/test-simulation</strong>.
                Для других endpoint пока выводится только текстовый отчёт.
            </div>
        `;

        firmCard.innerHTML = `
            <div class="firm-title">Monopolist / Factory</div>
            <div class="firm-mode">Режим: визуализация недоступна</div>
            <div class="firm-stats">
                <div class="mini-stat">
                    <span class="mini-stat-label">Q</span>
                    <span class="mini-stat-value">—</span>
                </div>
                <div class="mini-stat">
                    <span class="mini-stat-label">Revenue</span>
                    <span class="mini-stat-value">—</span>
                </div>
                <div class="mini-stat">
                    <span class="mini-stat-label">Profit</span>
                    <span class="mini-stat-value">—</span>
                </div>
            </div>
        `;
        return;
    }

    const totals = data.totals;

    firmCard.innerHTML = `
        <div class="firm-title">Monopolist / Factory</div>
        <div class="firm-mode">Режим: Uniform pricing, активная симуляция</div>

        <div class="firm-stats">
            <div class="mini-stat">
                <span class="mini-stat-label">Q</span>
                <span class="mini-stat-value">${formatNumber(totals.Q)}</span>
            </div>
            <div class="mini-stat">
                <span class="mini-stat-label">Revenue</span>
                <span class="mini-stat-value">${formatNumber(totals.Revenue)}</span>
            </div>
            <div class="mini-stat">
                <span class="mini-stat-label">Profit</span>
                <span class="mini-stat-value">${formatNumber(totals.Profit)}</span>
            </div>
        </div>
    `;

    buyersGrid.innerHTML = data.buyers_results.map((buyer) => {
        const status = getStatusInfo(buyer.q);

        return `
            <div class="buyer-card segment-${buyer.segment} status-${status.className}">
                <div class="buyer-header">
                    <div class="buyer-name">Buyer #${buyer.id}</div>
                    <div class="status-badge ${status.className}">${status.label}</div>
                </div>

                <div class="buyer-meta">
                    Segment: <strong>${buyer.segment}</strong><br>
                    Demand: <strong>${buyer.demand_type}</strong>
                </div>

                <div class="buyer-stats">
                    <div class="buyer-stat">
                        <span class="buyer-stat-label">Gap</span>
                        <span class="buyer-stat-value">${formatNumber(buyer.gap)}</span>
                    </div>
                    <div class="buyer-stat">
                        <span class="buyer-stat-label">Bought</span>
                        <span class="buyer-stat-value">${formatNumber(buyer.q)}</span>
                    </div>
                    <div class="buyer-stat">
                        <span class="buyer-stat-label">Payment</span>
                        <span class="buyer-stat-value">${formatNumber(buyer.payment)}</span>
                    </div>
                    <div class="buyer-stat">
                        <span class="buyer-stat-label">CS</span>
                        <span class="buyer-stat-value">${formatNumber(buyer.consumer_surplus)}</span>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

function downloadReport() {
    if (!lastReportText) {
        return;
    }

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

async function runRequest() {
    const endpoint = endpointSelect.value;
    const url = `${BACKEND_BASE_URL}${endpoint}`;

    resultBox.textContent = "Загрузка отчёта...";
    downloadBtn.disabled = true;
    lastReportText = "";

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();
        const reportText = createReport(endpoint, data);

        resultBox.textContent = reportText;
        lastReportText = reportText;
        downloadBtn.disabled = false;

        renderBattlefield(endpoint, data);
    } catch (error) {
        resultBox.textContent = `Ошибка запроса:\n${error.message}`;
    }
}

function switchTab(tabId) {
    tabButtons.forEach((button) => {
        button.classList.toggle("active", button.dataset.tab === tabId);
    });

    tabContents.forEach((content) => {
        content.classList.toggle("active", content.id === tabId);
    });
}

runBtn.addEventListener("click", runRequest);
downloadBtn.addEventListener("click", downloadReport);

tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
        switchTab(button.dataset.tab);
    });
});

renderBattlefield("", {});