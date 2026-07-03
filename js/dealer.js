// ===============================
// Dealer Mapping
// ===============================
const dealerNames = {
    "genson@gmail.com": "Genson Mart, Kochi",
    "aiswarya@gmail.com": "Aiswarya Supermarket",
    "sree@gmail.com": "Sree Super Store"
};

// ===============================
// Global Elements
// ===============================
const container = document.getElementById("products");

// Track expired products
let expiredProducts = {};

// Upper bound for stock/expired quantities — guards against
// fat-finger typos (e.g. an extra zero turning 50 into 5000).
const MAX_QUANTITY = 10000;

// ===============================
// Integer-Only Input Sanitizer
// ===============================
// Strips anything that isn't a digit as the dealer types/pastes,
// so values like "0.5" or "-3" can never be entered in the first place,
// clamps the result to MAX_QUANTITY, and shows a warning message
// next to the field while the entered value is over the limit.
function sanitizeInteger(input) {

    let cleaned = input.value.replace(/[^0-9]/g, "");

    const numericValue = cleaned === "" ? 0 : parseInt(cleaned, 10);
    const isOverMax = numericValue > MAX_QUANTITY;

    if (isOverMax) {
        cleaned = String(MAX_QUANTITY);
    }

    input.value = cleaned;

    const warningEl = document.getElementById(input.dataset.warningId);

    if (warningEl) {
        warningEl.style.display = isOverMax ? "inline" : "none";
    }

}

// Converts a field's value to a safe non-negative integer,
// clamped to MAX_QUANTITY. Used as the final safety net before
// saving to Firestore.
function toSafeInt(value) {

    let num = parseInt(value, 10);

    if (isNaN(num) || num < 0) num = 0;
    if (num > MAX_QUANTITY) num = MAX_QUANTITY;

    return num;

}

// ===============================
// Authentication Check
// ===============================
auth.onAuthStateChanged(async (user) => {

    if (!user) {
        window.location.href = "index.html";
        return;
    }

    document.getElementById("dealerName").textContent =
        dealerNames[user.email] || user.email;

    await loadProducts();

});

// ===============================
// Load Products
// ===============================
async function loadProducts() {

    container.innerHTML = "";

    let savedStock = {};
    expiredProducts = {};

    const user = auth.currentUser;

    if (user) {

        const doc = await db
            .collection("dealerStocks")
            .doc(user.email)
            .get();

        if (doc.exists) {

            savedStock = doc.data().stock || {};
            expiredProducts = doc.data().expired || {};

        }

    }

    products.forEach((product, index) => {

        const stockValue =
            savedStock[product.name] !== undefined
                ? savedStock[product.name]
                : product.stock;

        const expiredValue =
            expiredProducts[product.name] !== undefined
                ? expiredProducts[product.name]
                : 0;

        container.innerHTML += `

        <div class="card">

            <img src="${product.image}" alt="${product.name}">

            <h3>${product.name}</h3>

            <p>${product.unit}</p>

            <label><strong>Available Stock</strong></label>

            <div class="counter">

                <button onclick="changeStock(${index},-1)">−</button>

                <input
                    id="stock${index}"
                    type="number"
                    min="0"
                    max="${MAX_QUANTITY}"
                    step="1"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    data-warning-id="stockLimit${index}"
                    oninput="sanitizeInteger(this)"
                    value="${stockValue}">

                <button onclick="changeStock(${index},1)">+</button>

            </div>

            <small
                id="stockLimit${index}"
                style="color:#c0392b;display:none;">
                Max allowed is ${MAX_QUANTITY}
            </small>

            <br>

            <label><strong>Expired Products</strong></label>

            <div class="counter">

                <button onclick="changeExpired(${index},-1)">−</button>

                <input
                    id="expired${index}"
                    type="number"
                    min="0"
                    max="${MAX_QUANTITY}"
                    step="1"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    data-warning-id="expiredLimit${index}"
                    oninput="sanitizeInteger(this)"
                    value="${expiredValue}">

                <button onclick="changeExpired(${index},1)">+</button>

            </div>

            <small
                id="expiredLimit${index}"
                style="color:#c0392b;display:none;">
                Max allowed is ${MAX_QUANTITY}
            </small>

        </div>

        `;

    });

}
// ===============================
// Change Available Stock
// ===============================
function changeStock(index, amount) {

    const input = document.getElementById(`stock${index}`);

    let value = parseInt(input.value);

    if (isNaN(value)) value = 0;

    value += amount;

    if (value < 0) value = 0;
    if (value > MAX_QUANTITY) value = MAX_QUANTITY;

    input.value = value;

}

// ===============================
// Change Expired Products
// ===============================
function changeExpired(index, amount) {

    const input = document.getElementById(`expired${index}`);

    let value = parseInt(input.value);

    if (isNaN(value)) value = 0;

    value += amount;

    if (value < 0) value = 0;
    if (value > MAX_QUANTITY) value = MAX_QUANTITY;

    input.value = value;

}

// ===============================
// Get Current Submission Window
// ===============================
function getSubmissionWindow() {

    const now = new Date();

    const hour = now.getHours();

    if (hour < 6) {
        return "12 AM";
    }

    if (hour < 12) {
        return "6 AM";
    }

    if (hour < 18) {
        return "12 PM";
    }

    return "6 PM";

}

// ===============================
// Submit Stock
// ===============================
document.getElementById("submitBtn").addEventListener("click", async () => {

    const stockData = {};
    const expiredData = {};

    products.forEach((product, index) => {

        stockData[product.name] = toSafeInt(
            document.getElementById(`stock${index}`).value
        );

        expiredData[product.name] = toSafeInt(
            document.getElementById(`expired${index}`).value
        );

    });

    const dealerEmail = auth.currentUser.email;

    const dealerName =
        dealerNames[dealerEmail] || dealerEmail;

    const latestData = {

        dealer: dealerName,

        email: dealerEmail,

        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),

        submissionWindow: getSubmissionWindow(),

        stock: stockData,

        expired: expiredData

    };

    try {        // Save latest stock
        await db
            .collection("dealerStocks")
            .doc(dealerEmail)
            .set(latestData);

        // Save history
        await db
            .collection("stockHistory")
            .add({

                ...latestData,

                submittedAt: new Date()

            });

        alert("✅ Stock Submitted Successfully!");

    } catch (error) {

        console.error(error);

        alert("❌ Error saving stock.");

    }

});

// ===============================
// Current Time & Countdown Timer
// ===============================
function updateTimer() {

    const now = new Date();

    const currentTimeElement = document.getElementById("currentTime");
    const nextSubmissionElement = document.getElementById("nextSubmission");
    const timerElement = document.getElementById("timer");
    const statusElement = document.getElementById("statusText");

    currentTimeElement.textContent =
        now.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });

    let next = new Date(now);

    const hour = now.getHours();

    if (hour < 6) {

        next.setHours(6, 0, 0, 0);

    } else if (hour < 12) {

        next.setHours(12, 0, 0, 0);

    } else if (hour < 18) {

        next.setHours(18, 0, 0, 0);

    } else {

        next.setDate(next.getDate() + 1);
        next.setHours(0, 0, 0, 0);

    }

    nextSubmissionElement.textContent =
        next.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });

    const diff = next - now;

    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    timerElement.textContent =
        `${String(hours).padStart(2, "0")}:` +
        `${String(minutes).padStart(2, "0")}:` +
        `${String(seconds).padStart(2, "0")}`;
            if (diff <= 3600000) {

        statusElement.textContent = "🔴 Submit Soon";

    } else {

        statusElement.textContent = "🟢 Waiting";

    }

}

setInterval(updateTimer, 1000);
updateTimer();

// ===============================
// Auto Refresh After Submission
// ===============================
window.addEventListener("focus", () => {
    updateTimer();
});

// ===============================
// Helper Functions
// ===============================
function getTotalStock() {

    let total = 0;

    products.forEach((product, index) => {

        total += toSafeInt(
            document.getElementById(`stock${index}`).value
        );

    });

    return total;

}

function getTotalExpired() {

    let total = 0;

    products.forEach((product, index) => {

        total += toSafeInt(
            document.getElementById(`expired${index}`).value
        );

    });

    return total;

}

// Optional console summary for debugging
function printSummary() {

    console.log("========== Dealer Summary ==========");
    console.log("Dealer :", dealerNames[auth.currentUser.email]);
    console.log("Total Stock :", getTotalStock());
    console.log("Total Expired :", getTotalExpired());
    console.log("====================================");

}
// ===============================
// Logout
// ===============================
document.getElementById("logoutBtn").addEventListener("click", () => {

    auth.signOut()
        .then(() => {

            window.location.href = "index.html";

        })
        .catch((error) => {

            console.error("Logout Error:", error);
            alert("Unable to logout. Please try again.");

        });

});

// ===============================
// Make Functions Available Globally
// (Required because the HTML uses onclick="...")
// ===============================
window.changeStock = changeStock;
window.changeExpired = changeExpired;
window.sanitizeInteger = sanitizeInteger;

// ===============================
// End of dealer.js
// ===============================