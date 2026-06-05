document.getElementById('loginForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const role = document.getElementById('role').value;
  
  // Example placeholder - send data to your backend here.
  alert(`Email: ${email}\nPassword: ${'*'.repeat(password.length)}\nRole: ${role}`);

  // After successful sign-in (or form handling)
  // Redirect to the home page
  window.location.href = 'index.html';
});

// Google OAuth callback to handle the credential response
window.handleCredentialResponse = function(response) {
  // response.credential contains the ID token
  console.log('Google ID token:', response.credential);

  // TODO: Send token to backend for verification and sign-in

  // Once signed in successfully, redirect to index.html
  window.location.href = 'index.html';
};
