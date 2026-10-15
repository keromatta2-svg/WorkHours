// ========================================
// WorkHours - DATA AND SETTINGS
// ========================================

const todayElement = document.getElementById("today");
const hoursElement = document.getElementById("hours");
const salaryElement = document.getElementById("salary");

const todayShiftList = document.getElementById("today-shift-list");
const historyPreview = document.getElementById("history-preview");
const historyList = document.getElementById("history-list");

const customForm = document.getElementById("custom-form");

const DATA_KEY = "workHoursDataV2";

let appData = {
    activeProfileId: "",
    profiles: [],
    shifts: []
};

let selectedDate = getTodayKey();
let editingNewProfile = false;
let expandedHistoryDate = null;


// ========================================
// DATE FUNCTIONS
// ========================================

function getTodayKey() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function formatDate(dateKey) {
    const date = new Date(`${dateKey}T12:00:00`);

    return date.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}


function formatShortDate(dateKey) {
    const date = new Date(`${dateKey}T12:00:00`);

    return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}


function openDatePicker() {
    const input = document.getElementById("shift-date");

    try {
        if (typeof input.showPicker === "function") {
            input.showPicker();
        } else {
            input.click();
        }
    } catch (error) {
        input.click();
    }
}


function selectDate() {
    const input = document.getElementById("shift-date");

    if (!input.value) {
        return;
    }

    selectedDate = input.value;

    expandedHistoryDate = null;

    updateDateDisplay();
    renderAll();
}


function updateDateDisplay() {
    todayElement.textContent = formatDate(getTodayKey());

    document.getElementById("shift-date").value = selectedDate;

    const description = document.getElementById(
        "selected-date-description"
    );

    if (selectedDate === getTodayKey()) {
        description.textContent = "Add a shift for today.";
    } else {
        description.textContent =
            `Add a shift for ${formatDate(selectedDate)}.`;
    }

    document.getElementById("summary-heading").textContent =
        `Summary for ${formatDate(selectedDate)}`;
}


// ========================================
// PROFILE FUNCTIONS
// ========================================

function createId() {
    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}


function createProfile(name = "My Job") {
    return {
        id: createId(),
        name,
        company: "",
        hourlyRate: 300,
        breakMinutes: 30,
        breakPaid: false,
        paySchedule: "half-month",
        monthlyPayDay: 15
    };
}


function getActiveProfile() {
    return appData.profiles.find(
        profile => profile.id === appData.activeProfileId
    ) || appData.profiles[0] || null;
}


function getProfileShifts(profileId = appData.activeProfileId) {
    return appData.shifts.filter(
        shift => shift.profileId === profileId
    );
}


function populateProfileDropdowns() {
    const activeSelect = document.getElementById("active-profile");
    const settingsSelect = document.getElementById("settings-profile");

    activeSelect.replaceChildren();
    settingsSelect.replaceChildren();

    appData.profiles.forEach(profile => {
        const label = profile.company
            ? `${profile.name} — ${profile.company}`
            : profile.name;

        const activeOption = document.createElement("option");
        activeOption.value = profile.id;
        activeOption.textContent = label;

        activeSelect.appendChild(activeOption);

        const settingsOption = document.createElement("option");
        settingsOption.value = profile.id;
        settingsOption.textContent = label;

        settingsSelect.appendChild(settingsOption);
    });

    activeSelect.value = appData.activeProfileId;

    if (!editingNewProfile) {
        settingsSelect.value = appData.activeProfileId;
    }
}


function changeProfile() {
    const select = document.getElementById("active-profile");

    appData.activeProfileId = select.value;

    editingNewProfile = false;
    expandedHistoryDate = null;

    saveData();

    populateProfileDropdowns();
    loadProfileSettings();

    renderAll();
}


function selectSettingsProfile() {
    const select = document.getElementById("settings-profile");

    appData.activeProfileId = select.value;

    editingNewProfile = false;

    saveData();

    document.getElementById("active-profile").value =
        appData.activeProfileId;

    populateProfileDropdowns();
    loadProfileSettings();
    renderAll();
}


function startNewProfile() {
    editingNewProfile = true;

    document.getElementById("profile-form-heading").textContent =
        "Create New Job";

    document.getElementById("profile-name").value = "";
    document.getElementById("company-name").value = "";

    document.getElementById("profile-hourly-rate").value = 300;
    document.getElementById("profile-break-time").value = 30;

    document.getElementById("profile-break-paid").checked = false;

    document.getElementById("pay-schedule").value = "half-month";
    document.getElementById("monthly-pay-day").value = 15;

    document.getElementById("delete-profile-button").hidden = true;

    document.getElementById("profile-name").focus();
}


function loadProfileSettings() {
    const profile = getActiveProfile();

    if (!profile || editingNewProfile) {
        return;
    }

    document.getElementById("profile-form-heading").textContent =
        "Job Details";

    document.getElementById("profile-name").value = profile.name;
    document.getElementById("company-name").value = profile.company;

    document.getElementById("profile-hourly-rate").value =
        profile.hourlyRate;

    document.getElementById("profile-break-time").value =
        profile.breakMinutes;

    document.getElementById("profile-break-paid").checked =
        profile.breakPaid;

    document.getElementById("pay-schedule").value =
        profile.paySchedule;

    document.getElementById("monthly-pay-day").value =
        profile.monthlyPayDay;

    document.getElementById("delete-profile-button").hidden = false;
}


function saveJobProfile() {
    const name = document.getElementById("profile-name").value.trim();
    const company = document.getElementById("company-name").value.trim();

    const rateInput = document.getElementById("profile-hourly-rate");
    const breakInput = document.getElementById("profile-break-time");

    const hourlyRate = Number(rateInput.value);
    const breakMinutes = Number(breakInput.value);

    const breakPaid =
        document.getElementById("profile-break-paid").checked;

    const paySchedule =
        document.getElementById("pay-schedule").value;

    const monthlyPayDay = Number(
        document.getElementById("monthly-pay-day").value
    );

    if (!name) {
        alert("Please enter a job title.");
        return;
    }

    if (
        rateInput.value.trim() === "" ||
        !Number.isFinite(hourlyRate) ||
        hourlyRate < 0
    ) {
        alert("Please enter a valid hourly rate.");
        return;
    }

    if (
        breakInput.value.trim() === "" ||
        !Number.isInteger(breakMinutes) ||
        breakMinutes < 0
    ) {
        alert("Please enter a valid break duration.");
        return;
    }

    if (
        !Number.isInteger(monthlyPayDay) ||
        monthlyPayDay < 1 ||
        monthlyPayDay > 31
    ) {
        alert("Monthly payday must be between 1 and 31.");
        return;
    }

    let profile;

    if (editingNewProfile) {
        profile = createProfile(name);

        appData.profiles.push(profile);
        appData.activeProfileId = profile.id;

        editingNewProfile = false;
    } else {
        profile = getActiveProfile();

        if (!profile) {
            alert("Please select a job.");
            return;
        }
    }

    profile.name = name;
    profile.company = company;
    profile.hourlyRate = hourlyRate;
    profile.breakMinutes = breakMinutes;
    profile.breakPaid = breakPaid;
    profile.paySchedule = paySchedule;
    profile.monthlyPayDay = monthlyPayDay;

    if (!saveData()) {
        alert("Could not save the job settings.");
        return;
    }

    populateProfileDropdowns();
    loadProfileSettings();
    renderAll();

    alert("Job settings saved successfully.");
}


function deleteActiveProfile() {
    const profile = getActiveProfile();

    if (!profile) {
        return;
    }

    if (appData.profiles.length <= 1) {
        alert("You must keep at least one job profile.");
        return;
    }

    const confirmed = confirm(
        `Delete "${profile.name}" and all its recorded shifts? This cannot be undone.`
    );

    if (!confirmed) {
        return;
    }

    const oldData = JSON.parse(JSON.stringify(appData));

    appData.profiles = appData.profiles.filter(
        item => item.id !== profile.id
    );

    appData.shifts = appData.shifts.filter(
        shift => shift.profileId !== profile.id
    );

    appData.activeProfileId = appData.profiles[0].id;

    if (!saveData()) {
        appData = oldData;
        alert("Could not save the changes.");
        return;
    }

    editingNewProfile = false;

    populateProfileDropdowns();
    loadProfileSettings();
    renderAll();

    alert("Job and its shifts deleted.");
}


// ========================================
// LOAD AND MIGRATE DATA
// ========================================

function loadData() {
    try {
        const savedData = localStorage.getItem(DATA_KEY);

        if (savedData) {
            const parsed = JSON.parse(savedData);

            if (
                parsed &&
                Array.isArray(parsed.profiles) &&
                Array.isArray(parsed.shifts)
            ) {
                appData = parsed;
            }
        }

        if (appData.profiles.length === 0) {
            migrateOldData();
        }

        appData.shifts = appData.shifts.filter(shift =>
            shift &&
            typeof shift.id === "string" &&
            typeof shift.date === "string" &&
            typeof shift.start === "string" &&
            typeof shift.end === "string" &&
            Number.isFinite(shift.hours) &&
            Number.isFinite(shift.salary) &&
            Number.isFinite(shift.hourlyRate) &&
            Number.isFinite(shift.breakMinutes)
        );

        const validProfileIds = new Set(
            appData.profiles.map(profile => profile.id)
        );

        appData.shifts = appData.shifts.filter(
            shift => validProfileIds.has(shift.profileId)
        );

        if (
            !appData.profiles.some(
                profile => profile.id === appData.activeProfileId
            )
        ) {
            appData.activeProfileId = appData.profiles[0].id;
        }

    } catch (error) {
        console.error("Could not load saved data:", error);

        alert(
            "Saved data could not be loaded. Your original browser data has not been intentionally deleted."
        );

        appData = {
            activeProfileId: "",
            profiles: [],
            shifts: []
        };

        migrateOldData();
    }

    saveData();
}


function migrateOldData() {
    const oldSettingsText = localStorage.getItem("workHoursSettings");
    const oldShiftsText = localStorage.getItem("workHoursShifts");

    let oldSettings = {
        hourlyRate: 300,
        breakMinutes: 30
    };

    let oldShifts = [];

    try {
        if (oldSettingsText) {
            const parsedSettings = JSON.parse(oldSettingsText);

            if (parsedSettings && typeof parsedSettings === "object") {
                if (
                    Number.isFinite(parsedSettings.hourlyRate) &&
                    parsedSettings.hourlyRate >= 0
                ) {
                    oldSettings.hourlyRate = parsedSettings.hourlyRate;
                }

                if (
                    Number.isInteger(parsedSettings.breakMinutes) &&
                    parsedSettings.breakMinutes >= 0
                ) {
                    oldSettings.breakMinutes = parsedSettings.breakMinutes;
                }
            }
        }

        if (oldShiftsText) {
            const parsedShifts = JSON.parse(oldShiftsText);

            if (Array.isArray(parsedShifts)) {
                oldShifts = parsedShifts;
            }
        }
    } catch (error) {
        console.error("Could not migrate old data:", error);
    }

    const profile = createProfile("Current Job");

    profile.hourlyRate = oldSettings.hourlyRate;
    profile.breakMinutes = oldSettings.breakMinutes;

    appData.profiles = [profile];
    appData.activeProfileId = profile.id;

    appData.shifts = oldShifts
        .filter(shift =>
            shift &&
            typeof shift.id === "string" &&
            typeof shift.date === "string" &&
            typeof shift.start === "string" &&
            typeof shift.end === "string" &&
            Number.isFinite(shift.hours) &&
            Number.isFinite(shift.salary) &&
            Number.isFinite(shift.hourlyRate) &&
            Number.isFinite(shift.breakMinutes)
        )
        .map(shift => ({
            ...shift,
            profileId: profile.id,
            breakPaid: false
        }));

    console.log(
        "Migration complete. Original data keys have been preserved."
    );
}


function saveData() {
    try {
        localStorage.setItem(DATA_KEY, JSON.stringify(appData));
        return true;
    } catch (error) {
        console.error("Could not save data:", error);

        alert(
            "Could not save data. Please check available browser storage."
        );

        return false;
    }
}


// ========================================
// SHIFT CALCULATION
// ========================================

function calculateShift(start, end, breakMinutes, breakPaid = false) {
    const startParts = start.split(":").map(Number);
    const endParts = end.split(":").map(Number);

    const startMinutes = startParts[0] * 60 + startParts[1];

    let endMinutes = endParts[0] * 60 + endParts[1];

    if (
        !Number.isInteger(startMinutes) ||
        !Number.isInteger(endMinutes) ||
        startMinutes < 0 ||
        startMinutes >= 1440 ||
        endMinutes < 0 ||
        endMinutes >= 1440
    ) {
        throw new Error("Invalid shift time.");
    }

    if (endMinutes <= startMinutes) {
        endMinutes += 1440;
    }

    const totalMinutes = endMinutes - startMinutes;

    if (
        !Number.isInteger(breakMinutes) ||
        breakMinutes < 0 ||
        breakMinutes > totalMinutes
    ) {
        throw new Error("The break duration is invalid.");
    }

    const paidMinutes = breakPaid
        ? totalMinutes
        : totalMinutes - breakMinutes;

    return {
        hours: paidMinutes / 60,
        totalMinutes,
        paidMinutes
    };
}


// ========================================
// ADD SHIFTS
// ========================================

function addQuickShift(startHour, endHour) {
    const start = `${String(startHour).padStart(2, "0")}:00`;
    const end = `${String(endHour).padStart(2, "0")}:00`;

    addShift(start, end);
}


function showCustomShift() {
    customForm.hidden = !customForm.hidden;
}


function addCustomShift() {
    const start = document.getElementById("start-time").value;
    const end = document.getElementById("end-time").value;

    if (!start || !end) {
        alert("Please select the start and end times.");
        return;
    }

    addShift(start, end);
}


function addShift(start, end) {
    const profile = getActiveProfile();

    if (!profile) {
        alert("Please create or select a job first.");
        return;
    }

    try {
        const result = calculateShift(
            start,
            end,
            profile.breakMinutes,
            profile.breakPaid
        );

        const shift = {
            id: createId(),
            profileId: profile.id,
            date: selectedDate,
            start,
            end,

            breakMinutes: profile.breakMinutes,
            breakPaid: profile.breakPaid,

            hourlyRate: profile.hourlyRate,

            hours: result.hours,
            salary: result.hours * profile.hourlyRate
        };

        appData.shifts.push(shift);

        if (!saveData()) {
            appData.shifts.pop();
            return;
        }

        customForm.hidden = true;

        renderAll();

    } catch (error) {
        alert(error.message);
    }
}


function deleteShift(id) {
    const confirmed = confirm("Delete this shift?");

    if (!confirmed) {
        return;
    }

    const oldShifts = appData.shifts;

    appData.shifts = appData.shifts.filter(
        shift => shift.id !== id
    );

    if (!saveData()) {
        appData.shifts = oldShifts;
        return;
    }

    renderAll();
}
// ========================================
// VIEW NAVIGATION
// ========================================

function showView(viewName) {
    document.getElementById("main-view").hidden =
        viewName !== "main";

    document.getElementById("history-view").hidden =
        viewName !== "history";

    document.getElementById("settings-view").hidden =
        viewName !== "settings";

    if (viewName === "history") {
        renderHistory();
    }

    if (viewName === "settings") {
        editingNewProfile = false;

        populateProfileDropdowns();
        loadProfileSettings();
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// ========================================
// RENDER ALL MAIN CONTENT
// ========================================

function renderAll() {
    updateDateDisplay();

    renderSelectedDaySummary();
    renderPayPeriod();
    renderTodayShifts();
    renderHistoryPreview();

    if (!document.getElementById("history-view").hidden) {
        renderHistory();
    }
}


// ========================================
// SELECTED DAY SUMMARY
// ========================================

function renderSelectedDaySummary() {
    const shifts = getProfileShifts().filter(
        shift => shift.date === selectedDate
    );

    let totalHours = 0;
    let totalSalary = 0;

    shifts.forEach(shift => {
        totalHours += shift.hours;
        totalSalary += shift.salary;
    });

    hoursElement.textContent = `${totalHours.toFixed(2)} h`;

    salaryElement.textContent =
        `${totalSalary.toFixed(2)} ₽`;
}


// ========================================
// TODAY'S SHIFTS
// ========================================

function renderTodayShifts() {
    todayShiftList.replaceChildren();

    const shifts = getProfileShifts()
        .filter(shift => shift.date === getTodayKey())
        .sort((a, b) => a.start.localeCompare(b.start));

    if (shifts.length === 0) {
        const message = document.createElement("p");

        message.className = "description";
        message.textContent = "No shifts recorded for today.";

        todayShiftList.appendChild(message);
        return;
    }

    shifts.forEach(shift => {
        todayShiftList.appendChild(createShiftElement(shift));
    });
}


// ========================================
// CREATE SHIFT ELEMENT
// ========================================

function createShiftElement(shift) {
    const item = document.createElement("div");

    item.className = "shift-item";

    const title = document.createElement("strong");

    title.textContent =
        `${shift.start} – ${shift.end}`;

    const details = document.createElement("p");

    details.textContent =
        `${shift.hours.toFixed(2)} paid hours · ` +
        `${shift.salary.toFixed(2)} ₽`;

    const breakInfo = document.createElement("p");

    breakInfo.textContent = shift.breakPaid
        ? `Paid break: ${shift.breakMinutes} minutes`
        : `Unpaid break: ${shift.breakMinutes} minutes`;

    const rateInfo = document.createElement("p");

    rateInfo.textContent =
        `Hourly rate: ${shift.hourlyRate} ₽`;

    const deleteButton = document.createElement("button");

    deleteButton.type = "button";
    deleteButton.className = "delete-button";
    deleteButton.textContent = "Delete";

    deleteButton.addEventListener("click", () => {
        deleteShift(shift.id);
    });

    item.append(
        title,
        details,
        breakInfo,
        rateInfo,
        deleteButton
    );

    return item;
}


// ========================================
// PAY PERIOD
// ========================================

function getPayPeriod(dateKey, profile) {
    const date = new Date(`${dateKey}T12:00:00`);

    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();

    let start;
    let end;

    if (profile.paySchedule === "monthly") {
        start = new Date(year, month, 1);
        end = new Date(year, month + 1, 0);
    } else if (day <= 15) {
        start = new Date(year, month, 1);
        end = new Date(year, month, 15);
    } else {
        start = new Date(year, month, 16);
        end = new Date(year, month + 1, 0);
    }

    function toKey(value) {
        const y = value.getFullYear();
        const m = String(value.getMonth() + 1).padStart(2, "0");
        const d = String(value.getDate()).padStart(2, "0");

        return `${y}-${m}-${d}`;
    }

    return {
        start: toKey(start),
        end: toKey(end)
    };
}


function renderPayPeriod() {
    const profile = getActiveProfile();

    if (!profile) {
        return;
    }

    const period = getPayPeriod(selectedDate, profile);

    const shifts = getProfileShifts().filter(
        shift =>
            shift.date >= period.start &&
            shift.date <= period.end
    );

    const workingDates = new Set(
        shifts.map(shift => shift.date)
    );

    const totalHours = shifts.reduce(
        (sum, shift) => sum + shift.hours,
        0
    );

    const totalSalary = shifts.reduce(
        (sum, shift) => sum + shift.salary,
        0
    );

    document.getElementById("period-dates").textContent =
        `${formatShortDate(period.start)} – ${formatShortDate(period.end)}`;

    document.getElementById("period-days").textContent =
        workingDates.size;

    document.getElementById("period-hours").textContent =
        `${totalHours.toFixed(2)} h`;

    document.getElementById("period-salary").textContent =
        `${totalSalary.toFixed(2)} ₽`;
}


// ========================================
// HISTORY GROUPING
// ========================================

function groupShiftsByDate(shifts) {
    const groups = {};

    shifts.forEach(shift => {
        if (!groups[shift.date]) {
            groups[shift.date] = [];
        }

        groups[shift.date].push(shift);
    });

    return groups;
}


// ========================================
// HISTORY PREVIEW
// ========================================

function renderHistoryPreview() {
    historyPreview.replaceChildren();

    const previousShifts = getProfileShifts()
        .filter(shift => shift.date < getTodayKey());

    const groups = groupShiftsByDate(previousShifts);

    const dates = Object.keys(groups).sort(
        (a, b) => b.localeCompare(a)
    );

    if (dates.length === 0) {
        const message = document.createElement("p");

        message.className = "description";
        message.textContent = "Your previous shifts will appear here.";

        historyPreview.appendChild(message);
        return;
    }

    dates.slice(0, 5).forEach(dateKey => {
        const dayShifts = groups[dateKey];

        const totalHours = dayShifts.reduce(
            (sum, shift) => sum + shift.hours,
            0
        );

        const totalSalary = dayShifts.reduce(
            (sum, shift) => sum + shift.salary,
            0
        );

        const item = document.createElement("div");

        item.className = "history-day";

        const title = document.createElement("h3");
        title.textContent = formatDate(dateKey);

        const details = document.createElement("p");

        details.textContent =
            `${totalHours.toFixed(2)} hours · ` +
            `${totalSalary.toFixed(2)} ₽`;

        const button = document.createElement("button");

        button.type = "button";
        button.className = "text-button";
        button.textContent = "View shifts →";

        button.addEventListener("click", () => {
            selectedDate = dateKey;

            showView("main");
            renderAll();

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        });

        item.append(title, details, button);

        historyPreview.appendChild(item);
    });
}


// ========================================
// FULL HISTORY
// ========================================

function changeHistoryFilter() {
    const filter = document.getElementById("history-filter").value;

    const customFields = document.getElementById(
        "custom-period-fields"
    );

    customFields.hidden = filter !== "custom";

    renderHistory();
}


function renderHistory() {
    historyList.replaceChildren();

    const filter = document.getElementById("history-filter").value;

    const now = new Date();

    const thisMonth =
        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const thisYear = String(now.getFullYear());

    let shifts = getProfileShifts();

    let startDate = "";
    let endDate = "";

    // All recorded shifts
    if (filter === "all") {
        // No date restriction
    }

    // Entire current month
    else if (filter === "month") {
        startDate = `${thisMonth}-01`;

        const lastDay = new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            0
        ).getDate();

        endDate = `${thisMonth}-${String(lastDay).padStart(2, "0")}`;
    }

    // Entire current year
    else if (filter === "year") {
        startDate = `${thisYear}-01-01`;
        endDate = `${thisYear}-12-31`;
    }

    // Days 1–15 of the selected date's month
    else if (filter === "first-half") {
        const date = new Date(`${selectedDate}T12:00:00`);

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");

        startDate = `${year}-${month}-01`;
        endDate = `${year}-${month}-15`;
    }

    // Day 16 through the end of the selected date's month
    else if (filter === "second-half") {
        const date = new Date(`${selectedDate}T12:00:00`);

        const year = date.getFullYear();
        const monthNumber = date.getMonth() + 1;

        const month = String(monthNumber).padStart(2, "0");

        const lastDay = new Date(
            year,
            monthNumber,
            0
        ).getDate();

        startDate = `${year}-${month}-16`;
        endDate = `${year}-${month}-${String(lastDay).padStart(2, "0")}`;
    }

    // Custom date range
    else if (filter === "custom") {
        startDate = document.getElementById(
            "history-start-date"
        ).value;

        endDate = document.getElementById(
            "history-end-date"
        ).value;

        if (!startDate || !endDate) {
            updateHistoryTotals([]);
            showHistoryMessage(
                "Choose a start date and an end date to calculate your salary."
            );
            return;
        }

        if (startDate > endDate) {
            updateHistoryTotals([]);
            showHistoryMessage(
                "The start date must be before or equal to the end date."
            );
            return;
        }
    }

    // Apply selected date range
    if (startDate && endDate) {
        shifts = shifts.filter(
            shift =>
                shift.date >= startDate &&
                shift.date <= endDate
        );
    }

    // Calculate total working days, hours, and salary
    updateHistoryTotals(shifts);

    // Group shifts by day
    const groups = groupShiftsByDate(shifts);

    const dates = Object.keys(groups).sort(
        (a, b) => b.localeCompare(a)
    );

    if (dates.length === 0) {
        showHistoryMessage(
            "No shifts recorded during this period."
        );
        return;
    }

    dates.forEach(dateKey => {
        const dayShifts = groups[dateKey];

        const dayHours = dayShifts.reduce(
            (sum, shift) => sum + shift.hours,
            0
        );

        const daySalary = dayShifts.reduce(
            (sum, shift) => sum + shift.salary,
            0
        );

        const item = document.createElement("div");

        item.className = "history-day";

        const title = document.createElement("h3");

        title.textContent = formatDate(dateKey);

        const details = document.createElement("p");

        details.textContent =
            `${dayHours.toFixed(2)} hours · ` +
            `${daySalary.toFixed(2)} ₽ · ` +
            `${dayShifts.length} shift(s)`;

        const button = document.createElement("button");

        button.type = "button";
        button.className = "text-button";

        button.textContent =
            expandedHistoryDate === dateKey
                ? "Hide shifts"
                : "View shifts";

        item.append(title, details, button);

        button.addEventListener("click", () => {
            expandedHistoryDate =
                expandedHistoryDate === dateKey
                    ? null
                    : dateKey;

            renderHistory();
        });

        if (expandedHistoryDate === dateKey) {
            dayShifts.forEach(shift => {
                item.appendChild(createShiftElement(shift));
            });

            const addForDate = document.createElement("button");

            addForDate.type = "button";
            addForDate.className = "secondary-button";
            addForDate.textContent = "Add Shift on This Date";

            addForDate.addEventListener("click", () => {
                selectedDate = dateKey;

                showView("main");
                renderAll();
            });

            item.appendChild(addForDate);
        }

        historyList.appendChild(item);
    });
}


// Update History totals
function updateHistoryTotals(shifts) {
    const groups = groupShiftsByDate(shifts);

    const totalHours = shifts.reduce(
        (sum, shift) => sum + shift.hours,
        0
    );

    const totalSalary = shifts.reduce(
        (sum, shift) => sum + shift.salary,
        0
    );

    document.getElementById("history-days").textContent =
        Object.keys(groups).length;

    document.getElementById("history-hours").textContent =
        `${totalHours.toFixed(2)} h`;

    document.getElementById("history-salary").textContent =
        `${totalSalary.toFixed(2)} ₽`;
}


// Show a message when the selected period has no results
function showHistoryMessage(messageText) {
    const message = document.createElement("p");

    message.className = "description";
    message.textContent = messageText;

    historyList.appendChild(message);
}


// ========================================
// BACKUP EXPORT
// ========================================

function exportBackup() {
    const content = JSON.stringify(appData, null, 2);

    const blob = new Blob(
        [content],
        { type: "application/json" }
    );

    downloadBlob(
        blob,
        `WorkHours-Backup-${getTodayKey()}.json`
    );
}


// ========================================
// BACKUP IMPORT
// ========================================

function importBackup(event) {
    const file = event.target.files[0];

    if (!file) {
        return;
    }

    const reader = new FileReader();

    reader.onload = function () {
        try {
            const imported = JSON.parse(reader.result);

            if (
                !imported ||
                !Array.isArray(imported.profiles) ||
                !Array.isArray(imported.shifts) ||
                imported.profiles.length === 0
            ) {
                throw new Error("Invalid backup file.");
            }

            const confirmed = confirm(
                "Importing this backup will replace your current WorkHours data. Have you exported a backup of your current data?"
            );

            if (!confirmed) {
                event.target.value = "";
                return;
            }

            const oldData = appData;

            appData = imported;

            const validProfiles = appData.profiles.every(profile =>
                profile &&
                typeof profile.id === "string" &&
                typeof profile.name === "string" &&
                Number.isFinite(profile.hourlyRate) &&
                Number.isFinite(profile.breakMinutes)
            );

            const validShifts = appData.shifts.every(shift =>
                shift &&
                typeof shift.id === "string" &&
                typeof shift.profileId === "string" &&
                typeof shift.date === "string" &&
                Number.isFinite(shift.hours) &&
                Number.isFinite(shift.salary)
            );

            if (!validProfiles || !validShifts) {
                appData = oldData;
                throw new Error("The backup contains invalid records.");
            }

            const profileIds = new Set(
                appData.profiles.map(profile => profile.id)
            );

            if (
                !profileIds.has(appData.activeProfileId)
            ) {
                appData.activeProfileId = appData.profiles[0].id;
            }

            if (!saveData()) {
                appData = oldData;
                return;
            }

            editingNewProfile = false;
            expandedHistoryDate = null;

            populateProfileDropdowns();
            loadProfileSettings();
            renderAll();

            alert("Backup imported successfully.");

        } catch (error) {
            console.error("Backup import failed:", error);

            alert(
                "Could not import this backup. Please select a valid WorkHours JSON backup."
            );
        } finally {
            event.target.value = "";
        }
    };

    reader.readAsText(file);
}


// ========================================
// EXCEL-COMPATIBLE CSV EXPORT
// ========================================

function exportExcel() {
    const profile = getActiveProfile();

    if (!profile) {
        alert("Please select a job first.");
        return;
    }

    const shifts = getProfileShifts().sort(
        (a, b) =>
            a.date.localeCompare(b.date) ||
            a.start.localeCompare(b.start)
    );

    const rows = [
        [
            "Job",
            "Company",
            "Date",
            "Start",
            "End",
            "Paid Hours",
            "Hourly Rate",
            "Break Minutes",
            "Break Paid",
            "Salary"
        ]
    ];

    shifts.forEach(shift => {
        rows.push([
            profile.name,
            profile.company,
            shift.date,
            shift.start,
            shift.end,
            shift.hours,
            shift.hourlyRate,
            shift.breakMinutes,
            shift.breakPaid ? "Yes" : "No",
            shift.salary
        ]);
    });

    const csv = rows.map(row =>
        row.map(value => {
            const text = String(value ?? "");
            return `"${text.replace(/"/g, '""')}"`;
        }).join(",")
    ).join("\r\n");

    const blob = new Blob(
        ["\uFEFF", csv],
        { type: "text/csv;charset=utf-8;" }
    );

    downloadBlob(
        blob,
        `WorkHours-${profile.name.replace(/[^a-z0-9_-]/gi, "_")}-${getTodayKey()}.csv`
    );
}


// ========================================
// DOWNLOAD FILE
// ========================================

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 1000);
}


// ========================================
// START APPLICATION
// ========================================

function startApp() {
    loadData();

    populateProfileDropdowns();
    loadProfileSettings();

    document.getElementById("shift-date").value = selectedDate;

    updateDateDisplay();
    renderAll();

    console.log("WorkHours is ready.");
}


startApp();