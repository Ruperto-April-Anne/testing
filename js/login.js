document.addEventListener('DOMContentLoaded', () => {
    
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const rememberMeCheckbox = document.getElementById('rememberMe');
    const toggleIcon = document.getElementById('togglePassword');

    // --- 0. CHECK FOR SAVED CREDENTIALS ON LOAD ---
    const savedCreds = JSON.parse(localStorage.getItem('bleum_remembered_user'));
    if (savedCreds) {
        emailInput.value = savedCreds.email;
        passwordInput.value = savedCreds.password;
        if (rememberMeCheckbox) rememberMeCheckbox.checked = true;
        
        // Auto-trigger label animation
        const event = new Event('input', { bubbles: true });
        emailInput.dispatchEvent(event);
        passwordInput.dispatchEvent(event);
    }

    // --- HELPER: CUSTOM ALERTS & PROMPTS ---
    function showCustomAlert(message, title = "Notification", callback = null) {
        const modal = document.getElementById('customAlertModal');
        const msgElem = document.getElementById('alertMessage');
        const titleElem = document.getElementById('alertTitle');
        const okBtn = document.getElementById('alertOkBtn');

        msgElem.textContent = message;
        titleElem.textContent = title;
        modal.style.display = 'flex';

        const handleOk = () => {
            modal.style.display = 'none';
            if (callback) callback();
        };

        const newOkBtn = okBtn.cloneNode(true);
        okBtn.parentNode.replaceChild(newOkBtn, okBtn);
        newOkBtn.addEventListener('click', handleOk);
    }

    function showCustomPrompt(title, defaultValue = "") {
        return new Promise((resolve) => {
            const modal = document.getElementById('customPromptModal');
            const titleElem = document.getElementById('promptTitle');
            const inputElem = document.getElementById('promptInput');
            const confirmBtn = document.getElementById('promptConfirmBtn');
            const cancelBtn = document.getElementById('promptCancelBtn');

            titleElem.textContent = title;
            inputElem.value = defaultValue;
            modal.style.display = 'flex';
            inputElem.focus();

            const handleConfirm = () => { cleanup(); resolve(inputElem.value); };
            const handleCancel = () => { cleanup(); resolve(null); };
            const handleKeyPress = (e) => {
                if (e.key === 'Enter') handleConfirm();
                if (e.key === 'Escape') handleCancel();
            };

            function cleanup() {
                modal.style.display = 'none';
                confirmBtn.removeEventListener('click', handleConfirm);
                cancelBtn.removeEventListener('click', handleCancel);
                inputElem.removeEventListener('keydown', handleKeyPress);
            }

            confirmBtn.addEventListener('click', handleConfirm);
            cancelBtn.addEventListener('click', handleCancel);
            inputElem.addEventListener('keydown', handleKeyPress);
        });
    }

    // --- HELPER: HANDLE REMEMBER ME ---
    function handleRememberMe(email, password) {
        if (rememberMeCheckbox && rememberMeCheckbox.checked) {
            localStorage.setItem('bleum_remembered_user', JSON.stringify({
                email: email,
                password: password
            }));
        } else {
            localStorage.removeItem('bleum_remembered_user');
        }
    }

    // --- HELPER: HANDLE SUCCESSFUL LOGIN (ADDED THIS BACK) ---
    function handleSuccessfulLogin(user, role) {
        // 1. Save Session
        sessionStorage.setItem("currentUser", JSON.stringify(user));
        sessionStorage.setItem("userRole", role);

        // 2. [IMPORTANT] Update "Last Login" Timestamp in the Database
        if (role !== 'admin') {
            let allUsers = JSON.parse(localStorage.getItem('registeredUsers')) || [];
            // Find the user in the main list and update their time
            const userIndex = allUsers.findIndex(u => u.email === user.email);
            if(userIndex !== -1) {
                allUsers[userIndex].lastLogin = new Date().toISOString(); // <--- THIS SAVES THE DATE
                localStorage.setItem('registeredUsers', JSON.stringify(allUsers));
            }
        }

        // 3. Redirect
        if (role === 'admin') {
            window.location.href = "admin_dashboard.html";
        } else {
            window.location.href = "client/client_dashboard.html";
        }
    }

    // --- 1. SOCIAL LOGIN LOGIC ---
    const socialBtns = document.querySelectorAll('.social-btn');
    socialBtns.forEach(btn => {
        btn.addEventListener('click', async function() {
            let provider = "Unknown";
            if (this.classList.contains('google')) provider = "Google";
            if (this.classList.contains('facebook')) provider = "Facebook";
            if (this.classList.contains('apple')) provider = "Apple";

            const mockEmail = await showCustomPrompt(
                `Enter your ${provider} email to login:`, 
                `user@${provider.toLowerCase()}.com`
            );

            if (mockEmail) {
                const users = JSON.parse(localStorage.getItem('registeredUsers')) || [];
                const user = users.find(u => u.email === mockEmail.trim().toLowerCase());

                if (user) {
                    if (user.provider === provider) {
                        showCustomAlert(`Login Successful via ${user.provider}!`, "Success", () => {
                            // Use the new helper function
                            handleSuccessfulLogin(user, user.role || 'client');
                        });
                    } else {
                        showCustomAlert(`This email is registered via ${user.provider}. Please use that instead.`, "Wrong Provider");
                    }
                } else {
                    showCustomAlert("No account found. Please Sign Up first.", "Account Not Found", () => {
                        window.location.href = "signup.html";
                    });
                }
            }
        });
    });

    // --- 2. STANDARD LOGIN LOGIC ---
    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const emailValue = emailInput.value.trim().toLowerCase();
            const passwordValue = passwordInput.value.trim();
            
            // Hardcoded Admin Credentials
            const admins = [
                { email: "admin@bleumnails.com", pass: "admin123" },
                { email: "micah@bleumnails.com", pass: "micah123" }
            ];

            // A. Check Admin Hardcoded List
            const adminAccount = admins.find(a => a.email === emailValue);
            if (adminAccount) {
                if (passwordValue === adminAccount.pass) {
                    handleRememberMe(emailValue, passwordValue);
                    showCustomAlert("Welcome, Admin!", "Access Granted", () => {
                        const adminUser = { fullName: "Admin User", email: emailValue, role: "admin" };
                        // Use the new helper function
                        handleSuccessfulLogin(adminUser, "admin");
                    });
                } else {
                    showCustomAlert("Incorrect Admin Password.", "Error");
                }
                return;
            }

            // B. Check Registered Users (Local Storage)
            const users = JSON.parse(localStorage.getItem('registeredUsers')) || [];
            const user = users.find(u => u.email === emailValue);

            if (user) {
                if (user.provider !== 'Local') {
                    showCustomAlert(`This email is linked to ${user.provider}. Please use the social login button.`, "Social Login Required");
                } else if (user.password === passwordValue) {
                    handleRememberMe(emailValue, passwordValue);
                    showCustomAlert("Login successful!", "Success", () => {
                        // Use the new helper function
                        handleSuccessfulLogin(user, "client");
                    });
                } else {
                    showCustomAlert("Incorrect Password.", "Error");
                }
            } else {
                showCustomAlert("Account not found. Please Sign Up.", "Error");
            }
        });
    }

    // --- 3. EYE ICON TOGGLE ---
    if (toggleIcon) {
        toggleIcon.addEventListener('click', function () {
            const isPassword = passwordInput.getAttribute('type') === 'password';
            passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    }
});