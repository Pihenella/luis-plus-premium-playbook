"use strict";

const STORE_KEY = "luisPlusPremiumPlaybook.v3";

const months = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь"
];

const gradeRates = {
  1: 0.0295,
  2: 0.0295,
  3: 0.033,
  4: 0.0353,
  5: 0.0412,
  6: 0.0471
};

const defaultState = {
  grade: "1",
  baseMode: "cashMargin",
  fixedBase: 4,
  showNet: true,
  baseSalary: 75000,
  meals: 11000,
  salaryTaxed: true,
  mealsTaxed: false,
  quarterPlans: [
    { pdzPlan: 1.8, stmPlan: 1.49 },
    { pdzPlan: 1.6, stmPlan: 2 },
    { pdzPlan: 1.5, stmPlan: 1.8 },
    { pdzPlan: 1.35, stmPlan: 1.23 }
  ],
  rows: [
    row(true, 0.8, 0.1, 0.5, 23.157898879699, 0, 40, 0, false),
    row(true, 0.9, 0, 3.1, 1.917073616325, 0, 40, 0, false),
    row(true, 1.1, 0.1, 0.4, 12.964242070028, 0, 40, 0, true),
    row(true, 1.2, 1.2, 0.7, 32.179936821728, 0, 40, 1, false),
    row(false, 0, 0, 0, 20, 0, 40, 0, true),
    row(false, 0, 0, 0, 20, 0, 40, 0, true),
    row(false, 0, 0, 0, 20, 0, 40, 0, true),
    row(false, 0, 0, 0, 20, 0, 40, 0, true),
    row(false, 0, 0, 0, 20, 0, 40, 0, true),
    row(false, 0, 0, 0, 20, 0, 40, 0, true),
    row(false, 0, 0, 0, 20, 0, 40, 0, true),
    row(false, 0, 0, 0, 20, 0, 40, 0, true)
  ]
};

let state = loadState();

const els = {
  grade: document.querySelector("#grade"),
  baseMode: document.querySelector("#baseMode"),
  fixedBase: document.querySelector("#fixedBase"),
  showNet: document.querySelector("#showNet"),
  baseSalary: document.querySelector("#baseSalary"),
  meals: document.querySelector("#meals"),
  salaryTaxed: document.querySelector("#salaryTaxed"),
  mealsTaxed: document.querySelector("#mealsTaxed"),
  quarterSettings: document.querySelector("#quarterSettings"),
  monthRows: document.querySelector("#monthRows"),
  salaryTotal: document.querySelector("#salaryTotal"),
  salaryTotalLabel: document.querySelector("#salaryTotalLabel"),
  salaryTotalHint: document.querySelector("#salaryTotalHint"),
  fixedMonthly: document.querySelector("#fixedMonthly"),
  fixedMonthlyHint: document.querySelector("#fixedMonthlyHint"),
  totalGross: document.querySelector("#totalGross"),
  totalLabel: document.querySelector("#totalLabel"),
  totalNet: document.querySelector("#totalNet"),
  lastMonthGross: document.querySelector("#lastMonthGross"),
  lastMonthName: document.querySelector("#lastMonthName"),
  mainDrag: document.querySelector("#mainDrag"),
  mainDragHint: document.querySelector("#mainDragHint"),
  rateChip: document.querySelector("#rateChip"),
  modeChip: document.querySelector("#modeChip"),
  monthDigest: document.querySelector("#monthDigest"),
  kpiBreakdown: document.querySelector("#kpiBreakdown"),
  presetScreens: document.querySelector("#presetScreens"),
  presetFull: document.querySelector("#presetFull"),
  resetData: document.querySelector("#resetData")
};

function row(active, planGp, factGp, cash, margin, pdz, shipments, stm, specialDone) {
  return { active, planGp, factGp, cash, margin, pdz, shipments, stm, specialDone };
}

function cloneDefault() {
  return JSON.parse(JSON.stringify(defaultState));
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return cloneDefault();
    const parsed = JSON.parse(raw);
    return normalizeState(parsed);
  } catch {
    return cloneDefault();
  }
}

function normalizeState(source) {
  const clean = cloneDefault();
  Object.assign(clean, source);
  clean.rows = months.map((_, index) => ({
    ...defaultState.rows[index],
    ...(source.rows && source.rows[index] ? source.rows[index] : {})
  }));
  clean.quarterPlans = [0, 1, 2, 3].map((_, index) => ({
    ...defaultState.quarterPlans[index],
    ...(source.quarterPlans && source.quarterPlans[index] ? source.quarterPlans[index] : {})
  }));
  return clean;
}

function saveState() {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

function toNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const normalized = String(value || "").replace(/\s/g, "").replace(",", ".");
  const number = Number(normalized);
  return Number.isFinite(number) ? number : 0;
}

function formatNumber(value, digits = 0) {
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(value);
}

function formatRub(value, digits = 0) {
  return `${formatNumber(value, digits)} ₽`;
}

function formatPercent(value, digits = 0) {
  return `${formatNumber(value * 100, digits)}%`;
}

function quarterIndex(monthIndex) {
  return Math.floor(monthIndex / 3);
}

function quarterStart(monthIndex) {
  return quarterIndex(monthIndex) * 3;
}

function lookupPlan(value) {
  const table = [
    [0, 0.5],
    [0.7, 0.6],
    [0.8, 0.75],
    [0.85, 0.8],
    [0.9, 0.9],
    [0.95, 0.95],
    [1, 1]
  ];
  return lookup(table, value, 0.5);
}

function lookupPdz(value) {
  const table = [
    [-0.02, 1],
    [0.01, 0.8],
    [0.02, 0.5]
  ];
  return lookup(table, value, 1);
}

function lookupStm(value) {
  const table = [
    [0, 0.5],
    [0.7, 0.8],
    [0.95, 1]
  ];
  return lookup(table, value, 0.5);
}

function lookup(table, value, fallback) {
  let result = fallback;
  for (const [threshold, coefficient] of table) {
    if (value >= threshold) result = coefficient;
    else break;
  }
  return result;
}

function getBase(rowData) {
  if (!rowData.active) return 0;
  if (state.baseMode === "grossProfit") return toNumber(rowData.factGp) * 1_000_000;
  if (state.baseMode === "fixed") return toNumber(state.fixedBase) * 1_000_000;
  return toNumber(rowData.cash) * 1_000_000 * (toNumber(rowData.margin) / 100);
}

function fixedMonthlyGross() {
  return toNumber(state.baseSalary) + toNumber(state.meals);
}

function fixedMonthlyNet() {
  const salary = toNumber(state.baseSalary);
  const meals = toNumber(state.meals);
  return (state.salaryTaxed ? salary * 0.87 : salary) + (state.mealsTaxed ? meals * 0.87 : meals);
}

function displayFixedMonthly() {
  return state.showNet ? fixedMonthlyNet() : fixedMonthlyGross();
}

function compute() {
  const rate = gradeRates[state.grade] || gradeRates[1];
  const results = state.rows.map((rowData, index) => {
    const qStart = quarterStart(index);
    const qPlan = state.rows
      .slice(qStart, index + 1)
      .filter((item) => item.active)
      .reduce((sum, item) => sum + toNumber(item.planGp), 0);
    const qFact = state.rows
      .slice(qStart, index + 1)
      .filter((item) => item.active)
      .reduce((sum, item) => sum + toNumber(item.factGp), 0);

    const q = quarterIndex(index);
    const pdzPlan = toNumber(state.quarterPlans[q].pdzPlan) / 100;
    const stmPlan = toNumber(state.quarterPlans[q].stmPlan);
    const planExecution = qPlan > 0 ? qFact / qPlan : 0;
    const pdzShare = toNumber(rowData.shipments) > 0 ? toNumber(rowData.pdz) / toNumber(rowData.shipments) : 0;
    const stmExecution = stmPlan > 0 ? toNumber(rowData.stm) / stmPlan : 0;

    const kPlan = rowData.active ? lookupPlan(planExecution) : 0;
    const kPdz = rowData.active ? lookupPdz(pdzShare - pdzPlan) : 0;
    const kStm = rowData.active ? lookupStm(stmExecution) : 0;
    const weighted = rowData.active ? 0.8 * kPlan + 0.1 * kPdz + 0.1 * kStm : 0;
    const base = getBase(rowData);
    const beforeTask = base * rate * weighted;
    const afterTask = rowData.specialDone ? beforeTask : beforeTask * 0.9;

    return {
      index,
      active: rowData.active,
      base,
      rate,
      planExecution,
      pdzShare,
      stmExecution,
      kPlan,
      kPdz,
      kStm,
      weighted,
      beforeTask,
      afterTask,
      quarterAdjustment: 0
    };
  });

  for (let q = 0; q < 4; q += 1) {
    const start = q * 3;
    const end = start + 2;
    const quarterRows = state.rows.slice(start, end + 1);
    if (!quarterRows.every((item) => item.active)) continue;

    const final = results[end];
    for (let index = start; index < end; index += 1) {
      const base = results[index].base;
      const planDelta = Math.max(0, base * rate * 0.8 * final.kPlan - base * rate * 0.8 * results[index].kPlan);
      const pdzDelta = Math.max(0, base * rate * 0.1 * final.kPdz - base * rate * 0.1 * results[index].kPdz);
      const stmDelta = Math.max(0, base * rate * 0.1 * final.kStm - base * rate * 0.1 * results[index].kStm);
      results[end].quarterAdjustment += planDelta + pdzDelta + stmDelta;
    }
  }

  return results;
}

function render() {
  els.grade.value = state.grade;
  els.baseMode.value = state.baseMode;
  els.fixedBase.value = String(state.fixedBase).replace(".", ",");
  els.showNet.checked = state.showNet;
  els.baseSalary.value = String(state.baseSalary).replace(".", ",");
  els.meals.value = String(state.meals).replace(".", ",");
  els.salaryTaxed.checked = state.salaryTaxed;
  els.mealsTaxed.checked = state.mealsTaxed;
  els.rateChip.textContent = `${formatNumber((gradeRates[state.grade] || gradeRates[1]) * 100, 2)}%`;
  els.modeChip.textContent = baseModeLabel();
  renderQuarterSettings();
  renderRows();
  renderTotals();
}

function renderQuarterSettings() {
  els.quarterSettings.innerHTML = "";
  state.quarterPlans.forEach((quarter, index) => {
    const card = document.createElement("div");
    card.className = "quarter-card";
    card.innerHTML = `
      <strong>${index + 1} квартал</strong>
      <label>ПДЗ, %
        <input data-quarter="${index}" data-q-field="pdzPlan" type="text" inputmode="decimal" value="${String(quarter.pdzPlan).replace(".", ",")}">
      </label>
      <label>СТМ план
        <input data-quarter="${index}" data-q-field="stmPlan" type="text" inputmode="decimal" value="${String(quarter.stmPlan).replace(".", ",")}">
      </label>
    `;
    els.quarterSettings.appendChild(card);
  });
}

function renderRows() {
  const results = compute();
  els.monthRows.innerHTML = "";

  state.rows.forEach((rowData, index) => {
    const result = results[index];
    const tr = document.createElement("tr");
    tr.className = rowData.active ? "" : "is-off";
    tr.innerHTML = `
      <td class="month-name">${months[index]}</td>
      <td>${checkbox(index, "active", rowData.active, "Да")}</td>
      <td>${input(index, "planGp", rowData.planGp)}</td>
      <td>${input(index, "factGp", rowData.factGp)}</td>
      <td>${input(index, "cash", rowData.cash)}</td>
      <td>${input(index, "margin", rowData.margin)}</td>
      <td>${input(index, "pdz", rowData.pdz)}</td>
      <td>${input(index, "shipments", rowData.shipments)}</td>
      <td>${input(index, "stm", rowData.stm)}</td>
      <td>${checkbox(index, "specialDone", rowData.specialDone, "Вып.")}</td>
      <td>${coef(result.kPlan)}</td>
      <td>${coef(result.kPdz)}</td>
      <td>${coef(result.kStm)}</td>
      <td class="premium-cell">${formatRub(result.afterTask + result.quarterAdjustment)}</td>
    `;
    els.monthRows.appendChild(tr);
  });
}

function input(index, field, value) {
  return `<input class="month-input" data-row="${index}" data-field="${field}" type="text" inputmode="decimal" value="${String(value).replace(".", ",")}">`;
}

function checkbox(index, field, checked, label) {
  return `
    <label class="switch">
      <input data-row="${index}" data-field="${field}" type="checkbox" ${checked ? "checked" : ""}>
      <span>${label}</span>
    </label>
  `;
}

function coef(value) {
  const className = value >= 0.95 ? "good" : value >= 0.75 ? "warn" : "bad";
  return `<span class="coef ${className}">${formatPercent(value)}</span>`;
}

function renderTotals() {
  const results = compute();
  const activeResults = results.filter((item) => item.active);
  const activeMonthCount = activeResults.length;
  const monthlyTotal = activeResults.reduce((sum, item) => sum + item.afterTask, 0);
  const quarterTotal = activeResults.reduce((sum, item) => sum + item.quarterAdjustment, 0);
  const total = monthlyTotal + quarterTotal;
  const premiumDisplayTotal = state.showNet ? total * 0.87 : total;
  const fixedDisplayMonthly = displayFixedMonthly();
  const fixedDisplayTotal = fixedDisplayMonthly * activeMonthCount;
  const salaryDisplayTotal = premiumDisplayTotal + fixedDisplayTotal;
  const last = [...activeResults].reverse()[0];
  const lastTotal = last ? last.afterTask + last.quarterAdjustment : 0;
  const lastPremiumDisplay = state.showNet ? lastTotal * 0.87 : lastTotal;
  const lastSalaryDisplay = last ? lastPremiumDisplay + fixedDisplayMonthly : 0;

  els.salaryTotalLabel.textContent = state.showNet ? "ЗП на руки" : "ЗП gross";
  els.salaryTotal.textContent = formatRub(salaryDisplayTotal, state.showNet ? 2 : 0);
  els.salaryTotalHint.textContent = `${activeMonthCount} мес. с окладом и обедами`;
  els.totalLabel.textContent = state.showNet ? "Премия на руки" : "Премия gross";
  els.totalGross.textContent = formatRub(premiumDisplayTotal, state.showNet ? 2 : 0);
  els.totalNet.textContent = state.showNet ? `${formatRub(total)} gross` : "НДФЛ скрыт";
  els.fixedMonthly.textContent = formatRub(fixedDisplayMonthly, state.showNet ? 2 : 0);
  els.fixedMonthlyHint.textContent = state.showNet ? `${formatRub(fixedMonthlyGross())} gross` : "до удержаний";
  els.lastMonthGross.textContent = last ? formatRub(lastSalaryDisplay, state.showNet ? 2 : 0) : "0 ₽";
  els.lastMonthName.textContent = last ? `${months[last.index]}: фикс + премия` : "—";
  renderDigest(results);
  renderDrag(activeResults);
  renderBreakdown(activeResults, monthlyTotal, quarterTotal);
}

function baseModeLabel() {
  if (state.baseMode === "grossProfit") return "База = фактическая валовая прибыль";
  if (state.baseMode === "fixed") return `База = ${formatNumber(toNumber(state.fixedBase), 2)} млн ₽ в месяц`;
  return "База = Д/С факт × рентабельность 6М";
}

function renderDigest(results) {
  els.monthDigest.innerHTML = state.rows
    .map((rowData, index) => {
      const result = results[index];
      const total = result.afterTask + result.quarterAdjustment;
      const premiumDisplay = state.showNet ? total * 0.87 : total;
      const monthSalaryDisplay = premiumDisplay + displayFixedMonthly();
      const taskText = rowData.specialDone ? "спецзадача выполнена" : "минус 10% за спецзадачу";
      const secondaryText = `${formatRub(premiumDisplay, state.showNet ? 2 : 0)} премия`;
      return `
        <article class="month-card ${rowData.active ? "" : "is-off"}">
          <div class="month-card-head">
            <div>
              <h3>${months[index]}</h3>
              <div class="money">${formatRub(monthSalaryDisplay, state.showNet ? 2 : 0)}</div>
              <small>${secondaryText}</small>
            </div>
            <span class="status-pill ${rowData.specialDone ? "" : "miss"}">${taskText}</span>
          </div>

          <div class="mini-facts">
            <div class="mini-fact">
              <span>База</span>
              <strong>${formatRub(result.base)}</strong>
            </div>
            <div class="mini-fact">
              <span>ВП факт / план</span>
              <strong>${formatNumber(toNumber(rowData.factGp), 1)} / ${formatNumber(toNumber(rowData.planGp), 1)} млн</strong>
            </div>
            <div class="mini-fact">
              <span>ПДЗ</span>
              <strong>${formatNumber(toNumber(rowData.pdz), 1)} млн</strong>
            </div>
            <div class="mini-fact">
              <span>СТМ</span>
              <strong>${formatNumber(toNumber(rowData.stm), 2)}</strong>
            </div>
            <div class="mini-fact">
              <span>Фикс. часть</span>
              <strong>${formatRub(displayFixedMonthly(), state.showNet ? 2 : 0)}</strong>
            </div>
          </div>

          <div class="kpi-strips">
            ${strip("ВП", result.kPlan, "rose")}
            ${strip("ПДЗ", result.kPdz, "green")}
            ${strip("СТМ", result.kStm, "teal")}
          </div>
        </article>
      `;
    })
    .join("");
}

function strip(label, value, color) {
  return `
    <div class="strip">
      <span>${label}</span>
      <div class="strip-track"><div class="strip-fill ${color}" style="width: ${Math.max(0, Math.min(value, 1)) * 100}%"></div></div>
      <strong>${formatPercent(value)}</strong>
    </div>
  `;
}

function renderDrag(activeResults) {
  if (!activeResults.length) {
    els.mainDrag.textContent = "—";
    els.mainDragHint.textContent = "Нет активных месяцев";
    return;
  }

  const averages = {
    "ВП": average(activeResults.map((item) => item.kPlan)),
    "ПДЗ": average(activeResults.map((item) => item.kPdz)),
    "СТМ": average(activeResults.map((item) => item.kStm))
  };
  const [name, value] = Object.entries(averages).sort((a, b) => a[1] - b[1])[0];
  els.mainDrag.textContent = name;
  els.mainDragHint.textContent = `Средний коэффициент ${formatPercent(value)}`;
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, item) => sum + item, 0) / values.length;
}

function renderBreakdown(activeResults, monthlyTotal, quarterTotal) {
  const totalBase = activeResults.reduce((sum, item) => sum + item.base, 0);
  const avgWeighted = average(activeResults.map((item) => item.weighted));
  const avgPlan = average(activeResults.map((item) => item.kPlan));
  const avgPdz = average(activeResults.map((item) => item.kPdz));
  const avgStm = average(activeResults.map((item) => item.kStm));

  const rows = [
    ["База", totalBase ? Math.min(totalBase / 4_000_000, 1) : 0, formatRub(totalBase), "teal"],
    ["ВП", avgPlan, formatPercent(avgPlan), "rose"],
    ["ПДЗ", avgPdz, formatPercent(avgPdz), "green"],
    ["СТМ", avgStm, formatPercent(avgStm), "rose"],
    ["KPI итог", avgWeighted, formatPercent(avgWeighted), "teal"],
    ["Премия", monthlyTotal ? 1 : 0, formatRub(monthlyTotal + quarterTotal), "green"]
  ];

  els.kpiBreakdown.innerHTML = rows
    .map(([label, value, text, color]) => `
      <div class="bar-row">
        <strong>${label}</strong>
        <div class="bar-track"><div class="bar-fill ${color}" style="width: ${Math.max(0, Math.min(value, 1)) * 100}%"></div></div>
        <span>${text}</span>
      </div>
    `)
    .join("");
}

function bindEvents() {
  els.grade.addEventListener("change", () => {
    state.grade = els.grade.value;
    saveAndRender();
  });

  els.baseMode.addEventListener("change", () => {
    state.baseMode = els.baseMode.value;
    saveAndRender();
  });

  els.fixedBase.addEventListener("input", () => {
    state.fixedBase = toNumber(els.fixedBase.value);
    saveAndRender();
  });

  els.showNet.addEventListener("change", () => {
    state.showNet = els.showNet.checked;
    saveAndRender();
  });

  els.baseSalary.addEventListener("input", () => {
    state.baseSalary = toNumber(els.baseSalary.value);
    saveAndRender();
  });

  els.meals.addEventListener("input", () => {
    state.meals = toNumber(els.meals.value);
    saveAndRender();
  });

  els.salaryTaxed.addEventListener("change", () => {
    state.salaryTaxed = els.salaryTaxed.checked;
    saveAndRender();
  });

  els.mealsTaxed.addEventListener("change", () => {
    state.mealsTaxed = els.mealsTaxed.checked;
    saveAndRender();
  });

  els.quarterSettings.addEventListener("input", (event) => {
    const target = event.target;
    const q = Number(target.dataset.quarter);
    const field = target.dataset.qField;
    if (!Number.isInteger(q) || !field) return;
    state.quarterPlans[q][field] = toNumber(target.value);
    saveAndRender();
  });

  els.monthRows.addEventListener("input", updateMonthField);
  els.monthRows.addEventListener("change", updateMonthField);

  els.presetScreens.addEventListener("click", () => {
    state = cloneDefault();
    saveAndRender();
  });

  els.presetFull.addEventListener("click", () => {
    state.rows = state.rows.map((item, index) => {
      const q = quarterIndex(index);
      return {
        ...item,
        active: index < 1,
        planGp: 1,
        factGp: 1,
        cash: 5,
        margin: 20,
        pdz: 0,
        shipments: 40,
        stm: state.quarterPlans[q].stmPlan,
        specialDone: true
      };
    });
    saveAndRender();
  });

  els.resetData.addEventListener("click", () => {
    localStorage.removeItem(STORE_KEY);
    state = cloneDefault();
    saveAndRender();
  });
}

function updateMonthField(event) {
  const target = event.target;
  const index = Number(target.dataset.row);
  const field = target.dataset.field;
  if (!Number.isInteger(index) || !field) return;
  if (target.type === "checkbox") {
    state.rows[index][field] = target.checked;
  } else {
    state.rows[index][field] = toNumber(target.value);
  }
  saveAndRender();
}

function saveAndRender() {
  saveState();
  render();
}

bindEvents();
render();
