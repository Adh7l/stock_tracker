// ===========================
// Daily Dairy Smart Timer
// ===========================

const slots = [0, 6, 12, 18];

function updateBusinessTimer() {

    const now = new Date();

    document.getElementById("currentTime").textContent =
        now.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });

    let next = new Date(now);

    let nextHour = null;

    for (let hour of slots) {

        if (now.getHours() < hour) {

            nextHour = hour;
            break;

        }

    }

    if (nextHour === null) {

        next.setDate(next.getDate() + 1);

        nextHour = 0;

    }

    next.setHours(nextHour, 0, 0, 0);

    document.getElementById("nextSubmission").textContent =
        next.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });

    const diff = next - now;

    const hours = Math.floor(diff / (1000 * 60 * 60));

    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    document.getElementById("timer").textContent =
        `${String(hours).padStart(2, "0")}:` +
        `${String(minutes).padStart(2, "0")}:` +
        `${String(seconds).padStart(2, "0")}`;

    if (hours === 0 && minutes <= 15) {

        document.getElementById("statusText").innerHTML =
            "🟠 Update Soon";

    }

    if (hours === 0 && minutes === 0) {

        document.getElementById("statusText").innerHTML =
            "🔴 Submit Now";

    }

    if (hours > 0) {

        document.getElementById("statusText").innerHTML =
            "🟢 Waiting";

    }

}

updateBusinessTimer();

setInterval(updateBusinessTimer, 1000);