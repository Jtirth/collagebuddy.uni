// profile-manager.js

// Ensure Auth State
auth.onAuthStateChanged((user) => {
    if (user) {
        // Pre-fill email/name if on onboarding page
        const emailInput = document.getElementById('email');
        const nameInput = document.getElementById('fullName');
        if (emailInput && !emailInput.value) emailInput.value = user.email;
        if (nameInput && !nameInput.value) nameInput.value = user.displayName;

        // Load existing data if on profile page or editing
        loadUserProfile(user.uid);
    } else {
        // Redirect if trying to access protected pages without login
        const path = window.location.pathname;
        if (path.includes('onboarding.html') || path.includes('profile.html')) {
            window.location.href = 'index.html';
        }
    }
});

// Handle Form Submission (Onboarding)
const onboardingForm = document.getElementById('onboarding-form');
if (onboardingForm) {
    onboardingForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const user = auth.currentUser;
        if (!user) return alert("You must be logged in.");

        const submitBtn = document.querySelector('.btn-submit');
        submitBtn.disabled = true;
        submitBtn.textContent = "Saving...";

        // Collect Skills
        const proSkills = Array.from(document.querySelectorAll('#pro-skills .skill-pill.selected')).map(el => el.textContent);
        const softSkills = Array.from(document.querySelectorAll('#soft-skills .skill-pill.selected')).map(el => el.textContent);

        // Simulated File Upload (In real app, upload to Storage and get URL)
        const idFile = document.getElementById('idUpload').files[0];
        const idPhotoName = idFile ? idFile.name : "No file uploaded";

        const profileData = {
            fullName: document.getElementById('fullName').value,
            email: document.getElementById('email').value,
            address: document.getElementById('address').value,
            collegeName: document.getElementById('collegeName').value,
            degree: document.getElementById('degree').value,
            github: document.getElementById('github').value,
            linkedin: document.getElementById('linkedin').value,
            proSkills: proSkills,
            softSkills: softSkills,
            idPhotoName: idPhotoName, // Placeholder
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            await db.collection('users').doc(user.uid).set(profileData, { merge: true });
            alert("Profile Saved Successfully!");
            window.location.href = 'profile.html';
        } catch (error) {
            console.error("Error saving profile:", error);
            alert("Error saving profile: " + error.message);
            submitBtn.disabled = false;
            submitBtn.textContent = "Save Profile";
        }
    });
}

// Load User Profile Data
async function loadUserProfile(userId) {
    try {
        const doc = await db.collection('users').doc(userId).get();
        if (doc.exists) {
            const data = doc.data();

            // Populate Profile Page
            if (document.getElementById('profile-container')) {
                document.getElementById('display-fullname').textContent = data.fullName || auth.currentUser.displayName;
                document.getElementById('display-role').textContent = data.degree || "Student";
                document.getElementById('display-address').textContent = data.address || "No address provided";
                document.getElementById('display-college').textContent = data.collegeName || "Unknown College";

                // Skills
                const skillsContainer = document.getElementById('display-skills');
                if (skillsContainer && data.proSkills) {
                    skillsContainer.innerHTML = data.proSkills.map(s => `<span class="badge bg-primary me-1">${s}</span>`).join('');
                }

                // Links
                if (data.github) document.getElementById('link-github').href = `https://github.com/${data.github}`;
                if (data.linkedin) document.getElementById('link-linkedin').href = data.linkedin;
            }

            // Populate Form (if editing)
            if (document.getElementById('onboarding-form')) {
                document.getElementById('fullName').value = data.fullName || "";
                document.getElementById('address').value = data.address || "";
                document.getElementById('collegeName').value = data.collegeName || "";
                document.getElementById('degree').value = data.degree || "";
                document.getElementById('github').value = data.github || "";
                document.getElementById('linkedin').value = data.linkedin || "";

                // Select saved skills
                if (data.proSkills) {
                    document.querySelectorAll('#pro-skills .skill-pill').forEach(pill => {
                        if (data.proSkills.includes(pill.textContent)) pill.classList.add('selected');
                    });
                }
                if (data.softSkills) {
                    document.querySelectorAll('#soft-skills .skill-pill').forEach(pill => {
                        if (data.softSkills.includes(pill.textContent)) pill.classList.add('selected');
                    });
                }
            }
        }
    } catch (error) {
        console.error("Error loading profile:", error);
    }
}
