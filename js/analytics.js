const totalSubmissions = document.getElementById("totalSubmissions");
const activeDealers = document.getElementById("activeDealers");
const criticalProducts = document.getElementById("criticalProducts");
const inventoryHealth = document.getElementById("inventoryHealth");

const criticalList = document.getElementById("criticalList");
const recentList = document.getElementById("recentList");
const dealerTable = document.getElementById("dealerTable");

// ==========================
// Dealer Analytics
// ==========================

db.collection("dealerStocks")
.onSnapshot((snapshot)=>{

    let dealerCount=0;
    let totalProducts=0;
    let healthyProducts=0;
    let criticalCount=0;

    dealerTable.innerHTML="";
    criticalList.innerHTML="";

    snapshot.forEach(doc=>{

        dealerCount++;

        const data=doc.data();

        let health=100;

        let productCount=0;

        for(const product in data.stock){

            productCount++;

            totalProducts++;

            const qty=data.stock[product];

            if(qty<=10){

                health-=20;

                criticalCount++;

                criticalList.innerHTML+=`

                <div class="activity-item">

                    <strong>${product}</strong>

                    <br>

                    Dealer : ${data.dealer}

                    <br>

                    Remaining :

                    <span style="color:red;font-weight:bold;">

                    ${qty}

                    </span>

                </div>

                `;

            }

            else{

                healthyProducts++;

            }

        }

        if(health<0)
            health=0;

        dealerTable.innerHTML+=`

        <tr>

            <td style="padding:12px 0;">

            ${data.dealer}

            </td>

            <td align="center">

            ${productCount}

            </td>

            <td align="right">

            ${health}%

            </td>

        </tr>

        `;

    });

    activeDealers.textContent=dealerCount;

    criticalProducts.textContent=criticalCount;

    const overall=Math.round((healthyProducts/totalProducts)*100)||0;

    inventoryHealth.textContent=overall+"%";

});

// ==========================
// Submission History
// ==========================

db.collection("stockHistory")

.orderBy("updatedAt","desc")

.limit(20)

.onSnapshot(snapshot=>{

    recentList.innerHTML="";

    let submissionCount=0;

    snapshot.forEach(doc=>{

        submissionCount++;

        const data=doc.data();

        let time="";

        if(data.updatedAt){

            time=data.updatedAt.toDate().toLocaleString();

        }

        recentList.innerHTML+=`

        <div class="activity-item">

            <strong>

            ${data.dealer}

            </strong>

            <br>

            Submitted Inventory

            <br>

            Window :

            ${data.submissionWindow}

            <br>

            <small>

            ${time}

            </small>

        </div>

        `;

    });

    totalSubmissions.textContent=submissionCount;

});