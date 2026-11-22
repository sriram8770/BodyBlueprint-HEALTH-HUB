/* =====================================
   BODYBLUEPRINT - HEALTHHUB
   FRONTEND JAVASCRIPT
===================================== */


// GLOBAL DATA

let user = JSON.parse(localStorage.getItem("healthUser")) || {};

let water = Number(localStorage.getItem("water")) || 0;

let sleepData = JSON.parse(localStorage.getItem("sleepData")) || {
    hours: 0,
    quality: 0,
    bedtime: "",
    waketime: ""
};

let selectedRating = sleepData.quality || 0;

let healthHistory = JSON.parse(localStorage.getItem("healthHistory")) || [];

let profileName = user.name || "Explorer";

let bmi = 0;
let bmr = 0;

let healthChart = null;

let reminderTimer = null;


// HELPER FUNCTION

function saveData() {

    localStorage.setItem("healthUser", JSON.stringify(user));

    localStorage.setItem("water", water);

    localStorage.setItem("sleepData", JSON.stringify(sleepData));

    localStorage.setItem("healthHistory", JSON.stringify(healthHistory));

}


function getToday() {

    const date = new Date();

    return date.toLocaleDateString("en-CA");

}


function updateDate() {

    document.getElementById("currentDate").textContent =
        new Date().toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });

}


// PROFILE

function updateProfileDisplay() {

    document.getElementById("welcomeName").textContent = profileName;

    document.getElementById("sidebarName").textContent = profileName;

}


function openProfile() {

    document.getElementById("profileModal").style.display = "flex";

    document.getElementById("profileName").value = user.name || "";

}


function closeProfile() {

    document.getElementById("profileModal").style.display = "none";

}


function saveProfile() {

    const name = document.getElementById("profileName").value.trim();

    if (!name) {

        alert("Please enter your name.");

        return;

    }

    user.name = name;

    profileName = name;

    saveData();

    updateProfileDisplay();

    closeProfile();

}


// HYDRATION TARGET

function getWaterGoal() {

    if (!user.weight) return 2000;

    // Approximate starting goal: 35 ml per kg.
    // This is an application estimate, not a medical prescription.

    return Math.round(user.weight * 35 / 250) * 250;

}


// BMI AND BMR CALCULATOR

document.getElementById("metricForm").addEventListener("submit", function(event) {

    event.preventDefault();

    const name = document.getElementById("name").value.trim();

    const age = Number(document.getElementById("age").value);

    const height = Number(document.getElementById("height").value);

    const weight = Number(document.getElementById("weight").value);

    const sex = document.getElementById("sex").value;


    if (
        !Number.isFinite(age) ||
        !Number.isFinite(height) ||
        !Number.isFinite(weight) ||
        age < 15 || age > 120 ||
        height < 100 || height > 250 ||
        weight < 20 || weight > 350 ||
        !sex
    ) {

        alert("Please enter valid body information.");

        return;

    }


    // SAVE USER DATA

    user = {
        ...user,
        name: name || user.name || "Explorer",
        age,
        height,
        weight,
        sex
    };


    profileName = user.name;


    // BMI FORMULA

    const heightMeters = height / 100;

    bmi = weight / (heightMeters * heightMeters);


    // MIFFLIN-ST JEOR BMR FORMULA

    if (sex === "male") {

        bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;

    } else {

        bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;

    }


    bmi = Number(bmi.toFixed(1));

    bmr = Math.round(bmr);


    // DISPLAY RESULTS

    document.getElementById("bmiValue").textContent = bmi;

    document.getElementById("bmrValue").textContent = bmr;

    document.getElementById("bmiResult").textContent = bmi;

    document.getElementById("bmrResult").textContent = bmr + " kcal";


    // BMI CATEGORY

    let category = "";

    if (bmi < 18.5) {

        category = "Underweight";

    } else if (bmi < 25) {

        category = "Normal";

    } else if (bmi < 30) {

        category = "Overweight";

    } else {

        category = "Obese";

    }


    document.getElementById("bmiStatus").textContent = category;

    document.getElementById("bmiCategory").textContent = category;


    // BMI GAUGE POSITION

    const markerPosition = Math.min(
        100,
        Math.max(0, ((bmi - 12) / 28) * 100)
    );

    document.getElementById("bmiMarker").style.left =
        markerPosition + "%";


    // HYDRATION TARGET

    document.getElementById("hydrationGoalInfo").textContent =
        "Your estimated starting goal is " + getWaterGoal() + " ml per day.";


    updateProfileDisplay();

    saveData();

    updateDashboard();

    generateAdvice();

    updateHistory();

    updateChart();


    alert("Your BMI and BMR have been calculated successfully!");

});


// BMI SCORE

function getBMIScore() {

    if (!user.weight || !bmi) return 0;

    // Full score in adult normal BMI range.
    // Gradual reduction outside the range.

    if (bmi >= 18.5 && bmi < 25) {

        return 100;

    }

    if (bmi < 18.5) {

        return Math.max(0, 100 - (18.5 - bmi) * 12);

    }

    return Math.max(0, 100 - (bmi - 25) * 8);

}


// WATER TRACKER

function addWater(amount) {

    water += amount;

    saveData();

    updateDashboard();

    generateAdvice();

    updateHistory();

    updateChart();

}


function resetWater() {

    const confirmed = confirm("Reset today's water intake?");

    if (!confirmed) return;

    water = 0;

    saveData();

    updateDashboard();

    generateAdvice();

    updateHistory();

    updateChart();

}


// SLEEP TRACKER

document.getElementById("starRating").addEventListener("click", function(event) {

    if (event.target.tagName !== "SPAN") return;

    selectedRating = Number(event.target.dataset.value);

    updateStars();

});


function updateStars() {

    document.querySelectorAll("#starRating span").forEach(function(star) {

        const value = Number(star.dataset.value);

        star.classList.toggle("selected", value <= selectedRating);

    });

}


document.getElementById("sleepForm").addEventListener("submit", function(event) {

    event.preventDefault();

    const bedtime = document.getElementById("bedtime").value;

    const waketime = document.getElementById("waketime").value;


    if (!bedtime || !waketime) {

        alert("Please enter both sleep times.");

        return;

    }

    if (!selectedRating) {

        alert("Please select your sleep quality rating.");

        return;

    }


    const start = bedtime.split(":").map(Number);

    const end = waketime.split(":").map(Number);


    let startMinutes = start[0] * 60 + start[1];

    let endMinutes = end[0] * 60 + end[1];


    if (endMinutes <= startMinutes) {

        endMinutes += 24 * 60;

    }


    const duration = (endMinutes - startMinutes) / 60;


    if (duration > 16 || duration <= 0) {

        alert("Please check your sleep times.");

        return;

    }


    sleepData = {

        hours: Number(duration.toFixed(1)),

        quality: selectedRating,

        bedtime,

        waketime

    };


    saveData();

    updateDashboard();

    generateAdvice();

    updateHistory();

    updateChart();


    document.getElementById("sleepSummary").textContent = sleepData.hours;

    document.getElementById("sleepQuality").textContent =
        "★".repeat(sleepData.quality) +
        "☆".repeat(5 - sleepData.quality);


    let advice = "";

    if (sleepData.hours < 7) {

        advice = "Your sleep duration is below the recommended 7-hour minimum for most adults. Try maintaining a consistent sleep schedule.";

    } else if (sleepData.hours <= 9) {

        advice = "Your sleep duration is within the general adult recommendation. Maintain your consistent routine.";

    } else {

        advice = "You recorded more than 9 hours. Consider how rested you feel and whether your sleep schedule is consistent.";

    }


    document.getElementById("sleepAdvice").textContent = advice;


    alert("Sleep record saved successfully!");

});


// WELLNESS SCORE

function getHydrationScore() {

    const goal = getWaterGoal();

    return Math.min(100, (water / goal) * 100);

}


function getSleepScore() {

    if (!sleepData.hours) return 0;

    // Seven hours earns the full duration score.
    // More sleep does not increase the score beyond 100.

    const durationScore = Math.min(100, (sleepData.hours / 7) * 100);

    const qualityScore = (sleepData.quality / 5) * 100;

    return durationScore * 0.8 + qualityScore * 0.2;

}


function calculateWellnessScore() {

    const bmiScore = getBMIScore();

    const waterScore = getHydrationScore();

    const sleepScore = getSleepScore();


    const score =

        (bmiScore * 0.30) +

        (waterScore * 0.35) +

        (sleepScore * 0.35);


    return Math.round(score);

}


function updateWellness() {

    const score = calculateWellnessScore();

    document.getElementById("wellnessScore").textContent = score;


    const degrees = score * 3.6;


    document.getElementById("scoreRing").style.background =

        `conic-gradient(
            #5485ff 0deg,
            #a16cff ${degrees}deg,
            #27334b ${degrees}deg
        )`;


    let status = "";

    let description = "";


    if (!user.weight || !sleepData.hours) {

        status = "Getting Started";

        description = "Complete your body metrics and sleep log to build your wellness score.";

    } else if (score >= 85) {

        status = "Excellent Balance ✨";

        description = "Your recorded wellness indicators are performing well. Keep maintaining healthy routines.";

    } else if (score >= 70) {

        status = "Good Progress";

        description = "You're making positive progress. A few improvements can strengthen your daily routine.";

    } else if (score >= 50) {

        status = "Room to Improve";

        description = "Focus on consistent hydration and sufficient sleep.";

    } else {

        status = "Let's Get Started";

        description = "Start with small, achievable improvements to your daily habits.";

    }


    document.getElementById("scoreStatus").textContent = status;

    document.getElementById("scoreDescription").textContent = description;

}


// DASHBOARD UPDATE

function updateDashboard() {

    const goal = getWaterGoal();

    const waterPercentage = Math.min(100, (water / goal) * 100);

    const sleepPercentage = Math.min(100, (sleepData.hours / 8) * 100);


    document.getElementById("waterValue").innerHTML = water + " <small>ml</small>";

    document.getElementById("waterProgress").style.width =
        waterPercentage + "%";


    document.getElementById("waterStatus").textContent =
        Math.round(waterPercentage) + "% of daily target";


    document.getElementById("sleepValue").innerHTML =
        sleepData.hours + " <small>hrs</small>";


    document.getElementById("sleepStatus").textContent =
        sleepData.hours >= 7 ? "Target duration reached" : "Keep improving your sleep";


    document.getElementById("sleepProgress").style.width =
        sleepPercentage + "%";


    // WATER GOAL

    document.getElementById("waterGoalText").textContent =
        water + " / " + goal + " ml";

    document.getElementById("waterPercent").textContent =
        Math.round(waterPercentage) + "%";

    document.getElementById("goalWaterProgress").style.width =
        waterPercentage + "%";


    // SLEEP GOAL

    document.getElementById("sleepGoalText").textContent =
        sleepData.hours + " / 8 hrs";

    document.getElementById("sleepPercent").textContent =
        Math.round(sleepPercentage) + "%";

    document.getElementById("goalSleepProgress").style.width =
        sleepPercentage + "%";


    // METRIC GOAL

    const metricDone = user.weight && user.height && user.age;

    document.getElementById("metricGoalText").textContent =
        metricDone ? "Calculated successfully" : "Not calculated";

    document.getElementById("metricPercent").textContent =
        metricDone ? "100%" : "0%";

    document.getElementById("goalMetricProgress").style.width =
        metricDone ? "100%" : "0%";


    // WATER VISUAL

    document.getElementById("waterGlassFill").style.height =
        waterPercentage + "%";

    document.getElementById("glassPercentage").textContent =
        Math.round(waterPercentage) + "%";


    document.getElementById("waterTotal").textContent =
        water + " ml";

    document.getElementById("waterTargetText").textContent =
        "Daily goal: " + goal + " ml";


    updateWellness();

}


// PERSONALIZED ADVICE ENGINE

function generateAdvice() {

    const adviceList = document.getElementById("adviceList");

    let advice = [];


    if (!user.weight) {

        advice.push({

            title: "Complete Your Body Profile",

            text: "Enter your height, weight, age and biological sex to calculate BMI and BMR."

        });

    } else {

        if (bmi < 18.5) {

            advice.push({

                title: "BMI Below Adult Reference Range",

                text: "Consider discussing your weight and nutritional needs with a qualified healthcare professional."

            });

        } else if (bmi >= 25) {

            advice.push({

                title: "BMI Above Adult Reference Range",

                text: "BMI is only a screening measure. Consider discussing your overall health with a qualified professional."

            });

        } else {

            advice.push({

                title: "BMI Within Adult Reference Range",

                text: "Your BMI is within the WHO adult normal range. Continue focusing on balanced nutrition and regular activity."

            });

        }

    }


    if (water < getWaterGoal()) {

        advice.push({

            title: "Hydration Progress",

            text: "You have recorded " + water + " ml. Continue drinking water regularly according to your needs."

        });

    } else {

        advice.push({

            title: "Hydration Goal Reached",

            text: "You have reached your estimated hydration target. Maintain a comfortable hydration routine."

        });

    }


    if (!sleepData.hours) {

        advice.push({

            title: "Sleep Record Missing",

            text: "Record your bedtime and wake-up time to understand your sleep duration."

        });

    } else if (sleepData.hours < 7) {

        advice.push({

            title: "Sleep Deficit Detected",

            text: "You recorded fewer than 7 hours of sleep. Try establishing a consistent bedtime. Drinking water does not replace adequate sleep."

        });

    } else if (sleepData.hours <= 9) {

        advice.push({

            title: "Sleep Duration Looking Good",

            text: "Your recorded sleep duration is within the general adult recommendation of 7–9 hours."

        });

    } else {

        advice.push({

            title: "Sleep Pattern Observation",

            text: "You recorded more than 9 hours. Monitor your restfulness and sleep consistency."

        });

    }


    if (sleepData.hours && sleepData.quality <= 2) {

        advice.push({

            title: "Sleep Quality",

            text: "You reported low sleep quality. Consider a relaxing bedtime routine and seek professional advice if sleep difficulties persist."

        });

    }


    adviceList.innerHTML = "";


    advice.forEach(function(item) {

        const card = document.createElement("div");

        card.className = "advice-card";

        const icon = document.createElement("span");

        icon.textContent = "✦";

        const content = document.createElement("div");

        const title = document.createElement("h4");

        title.textContent = item.title;

        const paragraph = document.createElement("p");

        paragraph.textContent = item.text;

        content.appendChild(title);

        content.appendChild(paragraph);

        card.appendChild(icon);

        card.appendChild(content);

        adviceList.appendChild(card);

    });

}


// CALORIE ESTIMATOR

function calculateCalories() {

    if (!bmr) {

        alert("Please calculate your BMI and BMR first.");

        return;

    }


    const goal = document.getElementById("fitnessGoal").value;

    let calories = 0;

    let description = "";


    // Simplified estimates using BMR.
    // Activity level is not included in this basic estimator.

    if (goal === "cut") {

        calories = bmr * 0.90;

        description = "A simplified 10% reduction from BMR.";

    } else if (goal === "maintain") {

        calories = bmr;

        description = "Based on your estimated BMR, not total daily energy expenditure.";

    } else {

        calories = bmr * 1.10;

        description = "A simplified 10% increase from BMR.";

    }


    document.getElementById("calorieValue").textContent =
        Math.round(calories).toLocaleString("en-IN");


    document.getElementById("calorieDescription").textContent =
        description;

}


// HISTORY

function updateHistory() {

    const historyList = document.getElementById("historyList");

    const today = getToday();

    let todayEntry = {

        date: today,

        water,

        sleep: sleepData.hours,

        weight: user.weight || 0

    };


    const index = healthHistory.findIndex(item => item.date === today);

    if (index >= 0) {

        healthHistory[index] = todayEntry;

    } else {

        healthHistory.push(todayEntry);

    }


    healthHistory.sort((a, b) => a.date.localeCompare(b.date));

    healthHistory = healthHistory.slice(-30);

    saveData();


    historyList.innerHTML = "";


    healthHistory.slice().reverse().forEach(function(item) {

        const row = document.createElement("div");

        row.className = "history-entry";


        const date = document.createElement("span");

        date.textContent = item.date;


        const waterInfo = document.createElement("b");

        waterInfo.textContent = item.water + " ml";


        const sleepInfo = document.createElement("span");

        sleepInfo.textContent = item.sleep + " hrs";


        const weightInfo = document.createElement("span");

        weightInfo.textContent = item.weight ? item.weight + " kg" : "--";


        row.appendChild(date);

        row.appendChild(waterInfo);

        row.appendChild(sleepInfo);

        row.appendChild(weightInfo);


        historyList.appendChild(row);

    });

}


// CHART.JS ANALYTICS

function updateChart() {

    const canvas = document.getElementById("healthChart");

    if (!canvas) return;


    const labels = [];

    const waterData = [];

    const sleepDataValues = [];

    const weightData = [];


    const today = new Date();


    for (let i = 6; i >= 0; i--) {

        const date = new Date(today);

        date.setDate(today.getDate() - i);

        const dateString = date.toLocaleDateString("en-CA");


        const record = healthHistory.find(
            item => item.date === dateString
        );


        labels.push(
            date.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short"
            })
        );


        waterData.push(record ? record.water : 0);

        sleepDataValues.push(record ? record.sleep : 0);

        weightData.push(record ? record.weight : null);

    }


    if (healthChart) {

        healthChart.destroy();

    }


    healthChart = new Chart(canvas, {

        type: "line",

        data: {

            labels,

            datasets: [

                {

                    label: "Water (ml)",

                    data: waterData,

                    borderColor: "#26d9e8",

                    backgroundColor: "#26d9e822",

                    yAxisID: "y",

                    tension: 0.4,

                    fill: true

                },

                {

                    label: "Sleep (hours)",

                    data: sleepDataValues,

                    borderColor: "#a16cff",

                    backgroundColor: "#a16cff22",

                    yAxisID: "y1",

                    tension: 0.4,

                    fill: true

                },

                {

                    label: "Weight (kg)",

                    data: weightData,

                    borderColor: "#ffad62",

                    backgroundColor: "#ffad6222",

                    yAxisID: "y2",

                    tension: 0.4,

                    spanGaps: true,

                    fill: false

                }

            ]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            interaction: {

                mode: "index",

                intersect: false

            },

            plugins: {

                legend: {

                    labels: {

                        color: "#aab8d0",

                        usePointStyle: true,

                        padding: 20

                    }

                }

            },

            scales: {

                x: {

                    ticks: {

                        color: "#8998b4"

                    },

                    grid: {

                        color: "#ffffff08"

                    }

                },

                y: {

                    type: "linear",

                    position: "left",

                    min: 0,

                    ticks: {

                        color: "#26d9e8"

                    },

                    grid: {

                        color: "#ffffff08"

                    }

                },

                y1: {

                    type: "linear",

                    position: "right",

                    min: 0,

                    max: 12,

                    ticks: {

                        color: "#a16cff"

                    },

                    grid: {

                        drawOnChartArea: false

                    }

                },

                y2: {

                    type: "linear",

                    display: false,

                    position: "right"

                }

            }

        }

    });

}


// HYDRATION REMINDERS

async function enableReminders() {

    if (!("Notification" in window)) {

        alert("Your browser does not support notifications.");

        return;

    }


    const permission = await Notification.requestPermission();


    if (permission !== "granted") {

        alert("Please allow notifications in your browser settings.");

        return;

    }


    if (reminderTimer) {

        clearInterval(reminderTimer);

    }


    alert("Hydration reminders enabled! You'll receive reminders every 90 minutes while this page remains open.");


    reminderTimer = setInterval(function() {

        const hour = new Date().getHours();


        if (hour >= 8 && hour < 21) {

            new Notification("BodyBlueprint 💧", {

                body: "Time for a hydration break! Drink water according to your needs.",

                icon: ""

            });

        }

    }, 90 * 60 * 1000);

}


// PRINTABLE HEALTH REPORT

function downloadReport() {

    if (!user.weight) {

        alert("Please calculate your body metrics first.");

        return;

    }


    const report = `

BODYBLUEPRINT - HEALTHHUB

PERSONAL WELLNESS SUMMARY

Date: ${new Date().toLocaleDateString()}

Name: ${profileName}

-----------------------------------

BODY METRICS

Age: ${user.age} years

Height: ${user.height} cm

Weight: ${user.weight} kg

BMI: ${bmi}

BMR: ${bmr} kcal/day

BMI Category: ${bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal" : bmi < 30 ? "Overweight" : "Obese"}


-----------------------------------

DAILY HEALTH LOG

Water Intake: ${water} ml

Estimated Water Goal: ${getWaterGoal()} ml

Sleep Duration: ${sleepData.hours} hours

Sleep Quality: ${sleepData.quality}/5


-----------------------------------

DAILY WELLNESS SCORE

${calculateWellnessScore()} / 100


-----------------------------------

MEDICAL DISCLAIMER

This report contains general wellness information.
It is not a medical diagnosis or substitute for professional medical advice.

Generated by BodyBlueprint HealthHub.

    `;


    const blob = new Blob([report], {

        type: "text/plain"

    });


    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);

    link.download = "BodyBlueprint_Health_Report.txt";

    link.click();

    URL.revokeObjectURL(link.href);


    // Open print-friendly PDF option

    window.print();

}


// NAVIGATION

document.querySelectorAll(".nav-item").forEach(function(item) {

    item.addEventListener("click", function() {

        document.querySelectorAll(".nav-item").forEach(function(nav) {

            nav.classList.remove("active");

        });

        item.classList.add("active");

    });

});


// RESTORE SAVED DATA

function restoreData() {

    if (user.age) {

        document.getElementById("age").value = user.age;

        document.getElementById("height").value = user.height;

        document.getElementById("weight").value = user.weight;

        document.getElementById("sex").value = user.sex;

        document.getElementById("name").value = user.name || "";


        const heightMeters = user.height / 100;

        bmi = Number((user.weight / (heightMeters * heightMeters)).toFixed(1));


        if (user.sex === "male") {

            bmr = Math.round(
                (10 * user.weight) +
                (6.25 * user.height) -
                (5 * user.age) + 5
            );

        } else {

            bmr = Math.round(
                (10 * user.weight) +
                (6.25 * user.height) -
                (5 * user.age) - 161
            );

        }


        document.getElementById("bmiValue").textContent = bmi;

        document.getElementById("bmrValue").textContent = bmr;

        document.getElementById("bmiResult").textContent = bmi;

        document.getElementById("bmrResult").textContent = bmr + " kcal";


        const category =
            bmi < 18.5 ? "Underweight" :
            bmi < 25 ? "Normal" :
            bmi < 30 ? "Overweight" : "Obese";


        document.getElementById("bmiStatus").textContent = category;

        document.getElementById("bmiCategory").textContent = category;


        const markerPosition = Math.min(
            100,
            Math.max(0, ((bmi - 12) / 28) * 100)
        );

        document.getElementById("bmiMarker").style.left =
            markerPosition + "%";

    }


    document.getElementById("sleepSummary").textContent =
        sleepData.hours;


    if (sleepData.quality) {

        document.getElementById("sleepQuality").textContent =
            "★".repeat(sleepData.quality) +
            "☆".repeat(5 - sleepData.quality);

    }


    if (sleepData.bedtime) {

        document.getElementById("bedtime").value =
            sleepData.bedtime;

    }


    if (sleepData.waketime) {

        document.getElementById("waketime").value =
            sleepData.waketime;

    }


    selectedRating = sleepData.quality || 0;

    updateStars();

    updateProfileDisplay();

}


// INITIALIZATION

function initializeApp() {

    updateDate();

    restoreData();

    updateDashboard();

    generateAdvice();

    updateHistory();

    updateChart();


    if (sleepData.hours) {

        let advice = "";

        if (sleepData.hours < 7) {

            advice = "Your sleep duration is below the recommended 7-hour minimum for most adults. Try maintaining a consistent sleep schedule.";

        } else if (sleepData.hours <= 9) {

            advice = "Your sleep duration is within the general adult recommendation. Maintain your consistent routine.";

        } else {

            advice = "You recorded more than 9 hours. Monitor your sleep pattern and restfulness.";

        }

        document.getElementById("sleepAdvice").textContent = advice;

    }


    document.getElementById("hydrationGoalInfo").textContent =
        "Your estimated starting goal is " + getWaterGoal() + " ml per day.";

}


initializeApp();


// LOGOUT

function logout() {

    const confirmed = confirm("Do you want to log out?");

    if (!confirmed) return;

    localStorage.removeItem("bbSession");

    window.location.reload();

}


/* =====================================
   LOGIN / SIGNUP
===================================== */

(function () {

    const USERS_KEY = "bbUsers";
    const SESSION_KEY = "bbSession";

    const tabLogin = document.getElementById("tabLogin");
    const tabSignup = document.getElementById("tabSignup");
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");
    const authTitle = document.getElementById("authTitle");
    const authSubtitle = document.getElementById("authSubtitle");
    const authMessage = document.getElementById("authMessage");
    const switchText = document.getElementById("switchText");


    // ---------- HELPERS ----------

    function getUsers() {
        try {
            return JSON.parse(localStorage.getItem(USERS_KEY)) || {};
        } catch (e) {
            return {};
        }
    }

    function saveUsers(users) {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    // SHA-256 hash (simple fallback if crypto.subtle is unavailable, e.g. some file:// setups)
    async function hashPassword(password) {
        if (window.crypto && window.crypto.subtle) {
            const data = new TextEncoder().encode(password);
            const buffer = await crypto.subtle.digest("SHA-256", data);
            return Array.from(new Uint8Array(buffer))
                .map(b => b.toString(16).padStart(2, "0"))
                .join("");
        }

        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            hash = (hash << 5) - hash + password.charCodeAt(i);
            hash |= 0;
        }
        return "fallback-" + hash;
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function showMessage(text, type) {
        authMessage.textContent = text;
        authMessage.className = "auth-message " + type;
    }

    function clearMessage() {
        authMessage.textContent = "";
        authMessage.className = "auth-message";
        document.querySelectorAll("#authScreen .input-group input").forEach(i => i.classList.remove("invalid"));
    }

    function markInvalid(id) {
        document.getElementById(id).classList.add("invalid");
    }


    // ---------- TAB SWITCHING ----------

    function showLogin() {
        clearMessage();
        tabLogin.classList.add("active");
        tabSignup.classList.remove("active");
        loginForm.classList.remove("hidden");
        signupForm.classList.add("hidden");
        authTitle.textContent = "Welcome back 👋";
        authSubtitle.textContent = "Sign in to continue to your dashboard.";
        switchText.innerHTML = 'Don\'t have an account? <a href="#" id="switchLink">Create one</a>';
        bindSwitchLink();
    }

    function showSignup() {
        clearMessage();
        tabSignup.classList.add("active");
        tabLogin.classList.remove("active");
        signupForm.classList.remove("hidden");
        loginForm.classList.add("hidden");
        authTitle.textContent = "Create your account ✨";
        authSubtitle.textContent = "Start building your health blueprint today.";
        switchText.innerHTML = 'Already have an account? <a href="#" id="switchLink">Sign in</a>';
        bindSwitchLink();
    }

    function bindSwitchLink() {
        document.getElementById("switchLink").addEventListener("click", function (e) {
            e.preventDefault();
            if (loginForm.classList.contains("hidden")) {
                showLogin();
            } else {
                showSignup();
            }
        });
    }

    tabLogin.addEventListener("click", showLogin);
    tabSignup.addEventListener("click", showSignup);
    bindSwitchLink();


    // ---------- SHOW / HIDE PASSWORD ----------

    document.querySelectorAll("#authScreen .toggle-pass").forEach(function (btn) {
        btn.addEventListener("click", function () {
            const input = document.getElementById(btn.dataset.target);
            const show = input.type === "password";
            input.type = show ? "text" : "password";
            btn.textContent = show ? "Hide" : "Show";
        });
    });


    // ---------- SIGN UP ----------

    signupForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        clearMessage();

        const name = document.getElementById("signupName").value.trim();
        const email = document.getElementById("signupEmail").value.trim().toLowerCase();
        const password = document.getElementById("signupPassword").value;
        const confirmPass = document.getElementById("signupConfirm").value;

        if (!name) {
            markInvalid("signupName");
            return showMessage("Please enter your name.", "error");
        }

        if (!isValidEmail(email)) {
            markInvalid("signupEmail");
            return showMessage("Please enter a valid email address.", "error");
        }

        if (password.length < 6) {
            markInvalid("signupPassword");
            return showMessage("Password must be at least 6 characters.", "error");
        }

        if (password !== confirmPass) {
            markInvalid("signupConfirm");
            return showMessage("Passwords do not match.", "error");
        }

        const users = getUsers();

        if (users[email]) {
            markInvalid("signupEmail");
            return showMessage("An account with this email already exists. Please sign in.", "error");
        }

        users[email] = {
            name,
            email,
            passwordHash: await hashPassword(password),
            createdAt: new Date().toISOString()
        };

        saveUsers(users);

        startSession(users[email]);
    });


    // ---------- LOGIN ----------

    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        clearMessage();

        const email = document.getElementById("loginEmail").value.trim().toLowerCase();
        const password = document.getElementById("loginPassword").value;

        if (!isValidEmail(email)) {
            markInvalid("loginEmail");
            return showMessage("Please enter a valid email address.", "error");
        }

        if (!password) {
            markInvalid("loginPassword");
            return showMessage("Please enter your password.", "error");
        }

        const users = getUsers();
        const account = users[email];

        if (!account) {
            markInvalid("loginEmail");
            return showMessage("No account found with this email. Please create one.", "error");
        }

        const hash = await hashPassword(password);

        if (hash !== account.passwordHash) {
            markInvalid("loginPassword");
            return showMessage("Incorrect password. Please try again.", "error");
        }

        startSession(account);
    });


    // ---------- START SESSION ----------

    function startSession(account) {

        localStorage.setItem(SESSION_KEY, JSON.stringify({
            name: account.name,
            email: account.email,
            loggedInAt: Date.now()
        }));

        // Pass the account name to the dashboard profile
        let healthUser = {};
        try {
            healthUser = JSON.parse(localStorage.getItem("healthUser")) || {};
        } catch (e) {
            healthUser = {};
        }

        if (!healthUser.name) {
            healthUser.name = account.name;
            localStorage.setItem("healthUser", JSON.stringify(healthUser));
        }

        showMessage("Success! Opening your dashboard...", "success");

        // Reload so the dashboard loads fresh with the saved session
        setTimeout(function () {
            window.location.reload();
        }, 700);
    }

})();
