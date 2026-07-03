const dealerContainer = document.getElementById("dealerData");
const criticalContainer = document.getElementById("criticalProducts");
const activityContainer = document.getElementById("recentActivity");

// ---------------------------
// Determine Current Window
// ---------------------------

function getCurrentWindow(){

    const hour = new Date().getHours();

    if(hour < 6) return "12 AM";

    if(hour < 12) return "6 AM";

    if(hour < 18) return "12 PM";

    return "6 PM";

}

const currentWindow = getCurrentWindow();


// ---------------------------
// Dealer Dashboard
// ---------------------------

db.collection("dealerStocks")

.orderBy("dealer")

.onSnapshot(snapshot=>{

    dealerContainer.innerHTML="";

    criticalContainer.innerHTML="";

    let dealerCount=0;
    let updatedCount=0;
    let missedCount=0;
    let lowStockCount=0;

    let criticalHTML="";

    snapshot.forEach(doc=>{

        dealerCount++;

        const data=doc.data();

        const updated=data.submissionWindow===currentWindow;

        if(updated)
            updatedCount++;
        else
            missedCount++;

        let health=100;

        let productsHTML="";

        for(const product in data.stock){

            const qty=data.stock[product];

            let badge="🟢";

            if(qty<=10){

                badge="🔴";

                health-=20;

                lowStockCount++;

                criticalHTML+=`

                <div class="activity-item">

                    <strong>${product}</strong>

                    <br>

                    ${data.dealer}

                    <span style="float:right;color:red">

                        ${qty}

                    </span>

                </div>

                `;

            }

            else if(qty<=20){

                badge="🟠";

                health-=10;

            }

            productsHTML+=`

            <div class="product-row">

                <span>${product}</span>

                <span>${qty} ${badge}</span>

            </div>

            `;

        }

        if(health<0)
            health=0;

        dealerContainer.innerHTML+=`

        <div class="dealer-card">

            <div class="dealer-top">

                <div>

                    <h2>${data.dealer}</h2>

                    <small>${data.email}</small>

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

                <div class="health-fill"

                style="width:${health}%">

                </div>

            </div>

            <br>

            ${productsHTML}

            <br>

            <small>

            Last Update

            <br>

            ${data.updatedAt
                ? data.updatedAt.toDate().toLocaleString()
                : "-"}

            </small>

        </div>

        `;

    });

    if(criticalHTML==="")

        criticalHTML="<p>No critical products.</p>";

    criticalContainer.innerHTML=criticalHTML;

    document.getElementById("dealerCount").textContent=dealerCount;

    document.getElementById("updatedCount").textContent=updatedCount;

    document.getElementById("missedCount").textContent=missedCount;

    document.getElementById("lowStockCount").textContent=lowStockCount;

});


// ---------------------------
// Recent Activity
// ---------------------------

db.collection("stockHistory")

.orderBy("submittedAt","desc")

.limit(10)

.onSnapshot(snapshot=>{

    activityContainer.innerHTML="";

    snapshot.forEach(doc=>{

        const data=doc.data();

        activityContainer.innerHTML+=`

        <div class="activity-item">

            <strong>${data.dealer}</strong>

            <br>

            Submitted inventory

            <br>

            <small>

            ${data.submissionWindow}

            </small>

        </div>

        `;

    });

});