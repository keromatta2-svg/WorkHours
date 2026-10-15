import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";

import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";


const firebaseConfig = {
    apiKey: "AIzaSyCGHIqUB5ixuSg8tzM2ULR52nYBGpifd8Q",
    authDomain: "workhours-df4e8.firebaseapp.com",
    projectId: "workhours-df4e8",
    storageBucket: "workhours-df4e8.firebasestorage.app",
    messagingSenderId: "49254836336",
    appId: "1:49254836336:web:95e2aea29b2ab228d3acb5",
    measurementId: "G-DDG3X0FCBS"
};


const firebaseApp = initializeApp(firebaseConfig);

const auth = getAuth(firebaseApp);

const db = getFirestore(firebaseApp);

const googleProvider = new GoogleAuthProvider();


window.workHoursFirebase = {
    auth,
    db,
    googleProvider
};


window.loginWithGoogle = async function () {
    try {
        await signInWithPopup(auth, googleProvider);
    } catch (error) {
        if (
            error.code === "auth/popup-blocked" ||
            error.code === "auth/popup-closed-by-user" ||
            error.code === "auth/operation-not-supported-in-this-environment"
        ) {
            await signInWithRedirect(auth, googleProvider);
            return;
        }

        console.error("Google login error:", error);

        alert("فشل تسجيل الدخول. حاول مرة أخرى.");
    }
};


window.logoutFromGoogle = async function () {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Logout error:", error);
        alert("حصلت مشكلة أثناء تسجيل الخروج.");
    }
};


onAuthStateChanged(auth, function (user) {
    if (user) {
        console.log("Logged in:", user.email);

        window.workHoursUser = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName
        };
    } else {
        console.log("Not logged in");

        window.workHoursUser = null;
    }

    window.dispatchEvent(new CustomEvent("workhours-auth-changed", {
        detail: {
            user: window.workHoursUser
        }
    }));
});


getRedirectResult(auth).catch(function (error) {
    console.error("Google redirect error:", error);
});
window.addEventListener("workhours-auth-changed", function (event) {
    const user = event.detail.user;

    const status = document.getElementById("google-account-status");
    const loginButton = document.getElementById("google-login-button");
    const logoutButton = document.getElementById("google-logout-button");

    if (!status || !loginButton || !logoutButton) {
        return;
    }

    if (user) {
        status.textContent = "Signed in: " + user.email;
        loginButton.style.display = "none";
        logoutButton.style.display = "inline-block";
    } else {
        status.textContent = "Not signed in";
        loginButton.style.display = "inline-block";
        logoutButton.style.display = "none";
    }
});