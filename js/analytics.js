const totalSubmissions = document.getElementById("totalSubmissions");
const activeDealers = document.getElementById("activeDealers");
const criticalProducts = document.getElementById("criticalProducts");
const inventoryHealth = document.getElementById("inventoryHealth");
const totalExpired = document.getElementById("totalExpired");

const criticalList = document.getElementById("criticalList");
const expiredList = document.getElementById("expiredList");
const recentList = document.getElementById("recentList");
const dealerTable = document.getElementById("dealerTable");

// ---------------------------
// Helpers
// ---------------------------

function escapeHTML(str) {
    return String(str ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function getUnit(product) {
    return product === "Milk" ? "L" : "Packs";
}

// ==========================
// Dealer Analytics
// ==========================

db.collection("dealerStocks")
    .onSnapshot(
        snapshot => {

            let dealerCount = 0;
            let totalProducts = 0;
            let healthyProducts = 0;
            let criticalCount = 0;
            let expiredItemCount = 0;
            let expiredUnitTotal = 0;

            const dealerRows = [];
            const criticalItems = [];
            const expiredItems = [];

            snapshot.forEach(doc => {

                dealerCount++;

                const data = doc.data();

                let health = 100;
                let productCount = 0;

                for (const product in data.stock) {

                    productCount++;
                    totalProducts++;

                    const qty = data.stock[product];
                    const expired = data.expired?.[product] ?? 0;

                    let isHealthy = true;

                    if (qty <= 10) {

                        health -= 20;
                        criticalCount++;
                        isHealthy = false;

                        criticalItems.push(`
                            <div class="activity-item">
                                <strong>${escapeHTML(product)}</strong>
                                <br>
                                Dealer : ${escapeHTML(data.dealer)}
                                <br>
                                Remaining :
                                <span style="color:red;font-weight:bold;">${qty}</span>
                            </div>
                        `);

                    } else if (qty <= 20) {

                        health -= 10;

                    }

                    if (expired > 0) {

                        health -= 5;
                        expiredItemCount++;
                        expiredUnitTotal += expired;

                        expiredItems.push(`
                            <div class="activity-item">
                                <strong>${escapeHTML(product)}</strong>
                                <br>
                                Dealer : ${escapeHTML(data.dealer)}
                                <br>
                                Expired :
                                <span style="color:#c0392b;font-weight:bold;">${expired} ${getUnit(product)}</span>
                            </div>
                        `);

                    }

                    if (isHealthy) {
                        healthyProducts++;
                    }

                }

                if (health < 0) health = 0;

                dealerRows.push(`
                    <tr>
                        <td style="padding:12px 0;">${escapeHTML(data.dealer)}</td>
                        <td align="center">${productCount}</td>
                        <td align="right">${health}%</td>
                    </tr>
                `);

            });

            dealerTable.innerHTML = dealerRows.join("");

            criticalList.innerHTML = criticalItems.length
                ? criticalItems.join("")
                : "<p>No critical products.</p>";

            if (expiredList) {
                expiredList.innerHTML = expiredItems.length
                    ? expiredItems.join("")
                    : "<p>No expired products.</p>";
            }

            activeDealers.textContent = dealerCount;
            criticalProducts.textContent = criticalCount;

            if (totalExpired) {
                totalExpired.textContent = expiredItemCount;
            }

            const overall = Math.round((healthyProducts / totalProducts) * 100) || 0;
            inventoryHealth.textContent = overall + "%";

        },
        error => {
            console.error("Failed to load dealer analytics:", error);
            dealerTable.innerHTML = "<tr><td colspan='3'>Failed to load data.</td></tr>";
        }
    );

// ==========================
// Submission History
// ==========================

db.collection("stockHistory")
    .orderBy("updatedAt", "desc")
    .limit(20)
    .onSnapshot(
        snapshot => {

            const items = [];

            snapshot.forEach(doc => {

                const data = doc.data();

                const time = data.updatedAt
                    ? data.updatedAt.toDate().toLocaleString()
                    : "";

                items.push(`
                    <div class="activity-item">
                        <strong>${escapeHTML(data.dealer)}</strong>
                        <br>
                        Submitted Inventory
                        <br>
                        Window : ${escapeHTML(data.submissionWindow)}
                        <br>
                        <small>${time}</small>
                    </div>
                `);

            });

            recentList.innerHTML = items.join("");
            totalSubmissions.textContent = items.length;

        },
        error => {
            console.error("Failed to load submission history:", error);
            recentList.innerHTML = "<p>Failed to load recent submissions.</p>";
        }
    );
