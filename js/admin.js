const dealerContainer = document.getElementById("dealerData");
const criticalContainer = document.getElementById("criticalProducts");
const expiredContainer = document.getElementById("expiredProducts");
const activityContainer = document.getElementById("recentActivity");

// ---------------------------
// Helpers
// ---------------------------

// Prevent stored/reflected XSS from dealer names, product names, etc.
function escapeHTML(str) {
    return String(str ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function getCurrentWindow() {
    const hour = new Date().getHours();
    if (hour < 6) return "12 AM";
    if (hour < 12) return "6 AM";
    if (hour < 18) return "12 PM";
    return "6 PM";
}

function getUnit(product) {
    return product === "Milk" ? "L" : "Packs";
}

// Returns { badge, healthPenalty, isCritical, isExpired }
function evaluateStock(qty, expired) {
    let badge = "🟢";
    let healthPenalty = 0;
    let isCritical = false;
    const isExpired = expired > 0;

    if (qty <= 10) {
        badge = "🔴";
        healthPenalty += 20;
        isCritical = true;
    } else if (qty <= 20) {
        badge = "🟠";
        healthPenalty += 10;
    }

    if (isExpired) {
        healthPenalty += 5;
    }

    return { badge, healthPenalty, isCritical, isExpired };
}

function renderProductRow(product, qty, expired) {
    const unit = getUnit(product);
    const { badge, isExpired } = evaluateStock(qty, expired);

    return `
        <div class="product-row">
            <div>
                <strong>${escapeHTML(product)}</strong>
                <br>
                <small>
                    Stock : ${qty} ${unit}
                    <br>
                    Expired : <span style="${isExpired ? "color:#c0392b;font-weight:bold;" : ""}">${expired} ${unit}</span>
                </small>
            </div>
            <span>${badge}</span>
        </div>
    `;
}

function renderCriticalItem(product, dealer, qty) {
    return `
        <div class="activity-item">
            <strong>${escapeHTML(product)}</strong>
            <br>
            ${escapeHTML(dealer)}
            <span style="float:right;color:red">${qty}</span>
        </div>
    `;
}

function renderExpiredItem(product, dealer, expired, unit) {
    return `
        <div class="activity-item">
            <strong>${escapeHTML(product)}</strong>
            <br>
            ${escapeHTML(dealer)}
            <span style="float:right;color:#c0392b;">${expired} ${unit}</span>
        </div>
    `;
}

function renderDealerCard(data, updated) {
    let health = 100;
    let productsHTML = "";
    let criticalHTML = "";
    let expiredHTML = "";
    let criticalCount = 0;
    let expiredItemCount = 0;
    let expiredUnitTotal = 0;

    for (const product in data.stock) {
        const qty = data.stock[product];
        const expired = data.expired?.[product] ?? 0;

        const { healthPenalty, isCritical, isExpired } = evaluateStock(qty, expired);
        health -= healthPenalty;

        if (isCritical) {
            criticalCount++;
            criticalHTML += renderCriticalItem(product, data.dealer, qty);
        }

        if (isExpired) {
            expiredItemCount++;
            expiredUnitTotal += expired;
            expiredHTML += renderExpiredItem(product, data.dealer, expired, getUnit(product));
        }

        productsHTML += renderProductRow(product, qty, expired);
    }

    if (health < 0) health = 0;

    const cardHTML = `
        <div class="dealer-card">
            <div class="dealer-top">
                <div>
                    <h2>${escapeHTML(data.dealer)}</h2>
                    <small>${escapeHTML(data.email)}</small>
                </div>
                <div>
                    ${updated
                        ? "<span class='status-green'>Updated</span>"
                        : "<span class='status-red'>Missed</span>"
                    }
                </div>
            </div>
            <br>
            <strong>Inventory Health</strong>
            <div class="health-bar">
                <div class="health-fill" style="width:${health}%"></div>
            </div>
            <br>
            ${productsHTML}
            <br>
            <small>
                Last Update
                <br>
                ${data.updatedAt ? data.updatedAt.toDate().toLocaleString() : "-"}
            </small>
        </div>
    `;

    return { cardHTML, criticalHTML, expiredHTML, criticalCount, expiredItemCount, expiredUnitTotal };
}

// ---------------------------
// Dealer Dashboard
// ---------------------------

db.collection("dealerStocks")
    .orderBy("dealer")
    .onSnapshot(
        snapshot => {
            const currentWindow = getCurrentWindow(); // recomputed on every update

            let dealerCount = 0;
            let updatedCount = 0;
            let missedCount = 0;
            let lowStockCount = 0;
            let expiredCount = 0; // number of expired product entries across all dealers

            const dealerCards = [];
            const criticalItems = [];
            const expiredItems = [];

            snapshot.forEach(doc => {
                dealerCount++;

                const data = doc.data();
                const updated = data.submissionWindow === currentWindow;

                updated ? updatedCount++ : missedCount++;

                const {
                    cardHTML,
                    criticalHTML,
                    expiredHTML,
                    criticalCount,
                    expiredItemCount
                } = renderDealerCard(data, updated);

                dealerCards.push(cardHTML);
                if (criticalHTML) criticalItems.push(criticalHTML);
                if (expiredHTML) expiredItems.push(expiredHTML);

                lowStockCount += criticalCount;
                expiredCount += expiredItemCount;
            });

            // Single DOM write instead of repeated += in the loop
            dealerContainer.innerHTML = dealerCards.join("");

            criticalContainer.innerHTML = criticalItems.length
                ? criticalItems.join("")
                : "<p>No critical products.</p>";

            if (expiredContainer) {
                expiredContainer.innerHTML = expiredItems.length
                    ? expiredItems.join("")
                    : "<p>No expired products.</p>";
            }

            document.getElementById("dealerCount").textContent = dealerCount;
            document.getElementById("updatedCount").textContent = updatedCount;
            document.getElementById("missedCount").textContent = missedCount;
            document.getElementById("lowStockCount").textContent = lowStockCount;

            const expiredCountEl = document.getElementById("expiredCount");
            if (expiredCountEl) expiredCountEl.textContent = expiredCount;
        },
        error => {
            console.error("Failed to load dealer stocks:", error);
            dealerContainer.innerHTML = "<p>Failed to load dealer data. Please refresh.</p>";
        }
    );

// ---------------------------
// Recent Activity
// ---------------------------

db.collection("stockHistory")
    .orderBy("submittedAt", "desc")
    .limit(10)
    .onSnapshot(
        snapshot => {
            const items = [];

            snapshot.forEach(doc => {
                const data = doc.data();
                items.push(`
                    <div class="activity-item">
                        <strong>${escapeHTML(data.dealer)}</strong>
                        <br>
                        Submitted inventory
                        <br>
                        <small>${escapeHTML(data.submissionWindow)}</small>
                    </div>
                `);
            });

            activityContainer.innerHTML = items.join("");
        },
        error => {
            console.error("Failed to load recent activity:", error);
            activityContainer.innerHTML = "<p>Failed to load recent activity.</p>";
        }
    );
