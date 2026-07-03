// ===============================
// Dealer Mapping
// ===============================
const dealerNames = {
    "freshmart@gmail.com": "Fresh Mart, Kochi",
    "metro@gmail.com": "Metro Supermarket",
    "citysuper@gmail.com": "City Super Store"
};

// ===============================
// Authentication Check
// ===============================
auth.onAuthStateChanged((user) => {

    if (!user) {
        window.location.href = "index.html";
        return;
    }

   document.getElementById("dealerName").textContent =
dealerNames[user.email] || user.email;

loadProducts();

});

// ===============================
// Product Cards
// ===============================
// ===============================
// Load Products from Firestore
// ===============================
const container = document.getElementById("products");

async function loadProducts() {

    container.innerHTML = "";

    let savedStock = {};

    const user = auth.currentUser;

    if (user) {

        const doc = await db.collection("dealerStocks")
            .doc(user.email)
            .get();

        if (doc.exists) {

            savedStock = doc.data().stock || {};

        }

    }

    products.forEach((product, index) => {

        const value =
            savedStock[product.name] !== undefined
            ? savedStock[product.name]
            : product.stock;

        container.innerHTML += `

        <div class="card">

            <img src="${product.image}" alt="${product.name}">

            <h3>${product.name}</h3>

            <p>${product.unit}</p>

            <div class="counter">

                <button onclick="change(${index},-1)">−</button>

                <input
                    id="stock${index}"
                    type="number"
                    value="${value}"
                    min="0">

                <button onclick="change(${index},1)">+</button>

            </div>

        </div>

        `;

    });

}

// ===============================
// Increase / Decrease Stock
// ===============================
function change(index, amount) {

    const input = document.getElementById(`stock${index}`);

    let value = parseInt(input.value) || 0;

    value += amount;

    if (value < 0) value = 0;

    input.value = value;

}

// ===============================
// Countdown Timer
// ===============================



// ===============================
// Submit Stock
// ===============================
// ===============================
// Submit Stock
// ===============================
// ===============================
// Submit Stock
// ===============================
document.getElementById("submitBtn").addEventListener("click", async () => {

    const stockData = {};

    products.forEach((product, index) => {

        stockData[product.name] = Number(
            document.getElementById(`stock${index}`).value
        );

    });

    const dealerEmail = auth.currentUser.email;

    const dealerName =
        dealerNames[dealerEmail] || dealerEmail;

    const now = new Date();

    let currentWindow = "";

    if (now.getHours() < 6)
        currentWindow = "12 AM";
    else if (now.getHours() < 12)
        currentWindow = "6 AM";
    else if (now.getHours() < 18)
        currentWindow = "12 PM";
    else
        currentWindow = "6 PM";

    const latestData = {

        dealer: dealerName,

        email: dealerEmail,

        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),

        submissionWindow: currentWindow,

        stock: stockData

    };

    try {

        // Update latest stock
        await db.collection("dealerStocks")
            .doc(dealerEmail)
            .set(latestData);

        // Save history
        await db.collection("stockHistory")
            .add({

                ...latestData,

                submittedAt: new Date()

            });

        alert("✅ Stock Submitted Successfully!");

    }

    catch (error) {

        console.error(error);

        alert("Error saving stock.");

    }

});
// ===============================
// Logout
// ===============================
document.getElementById("logoutBtn").addEventListener("click", () => {

    auth.signOut()
        .then(() => {

            window.location.href = "index.html";

        });

});