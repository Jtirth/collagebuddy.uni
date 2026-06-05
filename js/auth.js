// Auth Logic
const provider = new firebase.auth.GoogleAuthProvider();

function signInWithGoogle() {
    console.log("Attempting Google Sign-In...");
    auth.signInWithPopup(provider)
        .then((result) => {
            // User signed in
            console.log("✅ Sign-In Successful! User:", result.user.email);
            // Redirect to Profile or reload
            window.location.href = "profile.html";
        })
        .catch((error) => {
            console.error("❌ Sign-In Error:", error);

            // Provide specific error messages
            let errorMessage = "Login Failed: ";

            if (error.code === 'auth/unauthorized-domain') {
                errorMessage += "This domain is not authorized. Please add your domain (localhost or 127.0.0.1) to Firebase Console:\n\n" +
                    "1. Go to https://console.firebase.google.com/\n" +
                    "2. Select 'study-buddy-71ae7' project\n" +
                    "3. Go to Authentication → Settings → Authorized domains\n" +
                    "4. Add your domain (e.g., localhost or 127.0.0.1)";
            } else if (error.code === 'auth/popup-blocked') {
                errorMessage += "Popup was blocked by your browser. Please allow popups for this site.";
            } else if (error.code === 'auth/popup-closed-by-user') {
                errorMessage += "Sign-in was cancelled.";
            } else if (error.code === 'auth/operation-not-allowed') {
                errorMessage += "Google Sign-In is not enabled. Please enable it in Firebase Console:\n\n" +
                    "1. Go to Authentication → Sign-in method\n" +
                    "2. Enable 'Google' provider";
            } else {
                errorMessage += error.message + "\n\nError Code: " + error.code;
            }

            alert(errorMessage);
        });
}

function signOut() {
    auth.signOut().then(() => {
        window.location.href = "index.html";
    }).catch((error) => {
        console.error("Error signing out:", error);
    });
}

// Helper function to get user display name
function getUserDisplayName(user) {
    if (!user) return 'Guest';

    // Priority: displayName > email prefix > 'User'
    if (user.displayName) {
        return user.displayName.split(' ')[0]; // Get first name only
    } else if (user.email) {
        // Extract name from email (before @)
        return user.email.split('@')[0].replace(/[._]/g, ' ');
    }
    return 'User';
}

// Global Listener for UI updates
auth.onAuthStateChanged((user) => {
    const accountLink = document.getElementById('account-link');

    if (user) {
        // User is signed in
        console.log("✅ User authenticated:", user.email);

        // Get display name
        const displayName = getUserDisplayName(user);

        // Store user data in localStorage for quick access
        const userData = {
            displayName: displayName,
            email: user.email,
            photoURL: user.photoURL || '',
            uid: user.uid
        };
        localStorage.setItem('userData', JSON.stringify(userData));

        // Update account link
        if (accountLink) {
            accountLink.href = "profile.html";
        }

        // Update user display name on page (if element exists)
        const userDisplayElement = document.getElementById('user-display-name');
        if (userDisplayElement) {
            userDisplayElement.textContent = displayName;
            userDisplayElement.style.opacity = '0';
            setTimeout(() => {
                userDisplayElement.style.transition = 'opacity 0.5s ease';
                userDisplayElement.style.opacity = '1';
            }, 100);
        }

        // Dispatch custom event for other scripts to listen to
        window.dispatchEvent(new CustomEvent('userAuthenticated', {
            detail: userData
        }));

    } else {
        // User is signed out
        console.log("ℹ️ No user authenticated");

        // Clear localStorage
        localStorage.removeItem('userData');

        // Update account link to trigger sign-in
        if (accountLink) {
            accountLink.href = "#";
            accountLink.onclick = (e) => {
                e.preventDefault();
                signInWithGoogle();
            }
        }

        // Update user display name to Guest
        const userDisplayElement = document.getElementById('user-display-name');
        if (userDisplayElement) {
            userDisplayElement.textContent = 'Guest';
        }

        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('userSignedOut'));
    }
});

// On page load, check localStorage for cached user data (prevents flickering)
document.addEventListener('DOMContentLoaded', () => {
    const cachedUserData = localStorage.getItem('userData');
    if (cachedUserData) {
        try {
            const userData = JSON.parse(cachedUserData);
            const userDisplayElement = document.getElementById('user-display-name');
            if (userDisplayElement && userData.displayName) {
                userDisplayElement.textContent = userData.displayName;
            }
        } catch (e) {
            console.error('Error parsing cached user data:', e);
        }
    }
});
