const BACKEND_BASE_URL = "http://127.0.0.1:8000";

const runBtn = document.getElementById("run-btn");
const endpointSelect = document.getElementById("endpoint-select");
const resultBox = document.getElementById("result-box");

const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

async function runRequest() {
    const endpoint = endpointSelect.value;
    const url = `${BACKEND_BASE_URL}${endpoint}`;

    resultBox.textContent = "Загрузка...";

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();
        resultBox.textContent = JSON.stringify(data, null, 2);
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

tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
        switchTab(button.dataset.tab);
    });
});