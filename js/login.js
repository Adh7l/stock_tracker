document.getElementById("loginBtn").addEventListener("click", () => {

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    auth.signInWithEmailAndPassword(email, password)

    .then(() => {

        window.location.href = "dealer.html";

    })

    .catch((error) => {

        alert(error.message);

    });

});