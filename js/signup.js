document.addEventListener('DOMContentLoaded', () => {

    const signupForm = document.getElementById('signupForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmInput = document.getElementById('confirmPassword');
    
    // --- HELPER FUNCTIONS FOR CUSTOM MODALS ---

    function showCustomAlert(message, title = "Notification", callback = null) {
        const modal = document.getElementById('customAlertModal');
        const msgElem = document.getElementById('alertMessage');
        const titleElem = document.getElementById('alertTitle');
        const okBtn = document.getElementById('alertOkBtn');

        msgElem.textContent = message;
        titleElem.textContent = title;
        modal.style.display = 'flex';

        // Clone button to remove old listeners
        const newOkBtn = okBtn.cloneNode(true);
        okBtn.parentNode.replaceChild(newOkBtn, okBtn);

        newOkBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            if (callback) callback();
        });
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

            const handleConfirm = () => {
                cleanup();
                resolve(inputElem.value);
            };

            const handleCancel = () => {
                cleanup();
                resolve(null);
            };

            function cleanup() {
                modal.style.display = 'none';
                confirmBtn.removeEventListener('click', handleConfirm);
                cancelBtn.removeEventListener('click', handleCancel);
            }

            confirmBtn.addEventListener('click', handleConfirm);
            cancelBtn.addEventListener('click', handleCancel);
        });
    }

    // --- 1. SOCIAL SIGNUP LOGIC ---
    const socialBtns = document.querySelectorAll('.social-btn');
    
    socialBtns.forEach(btn => {
        btn.addEventListener('click', async function() {
            let provider = "Unknown";
            if (this.querySelector('.fa-google')) provider = "Google";
            if (this.querySelector('.fa-facebook-f')) provider = "Facebook";
            if (this.querySelector('.fa-apple')) provider = "Apple";

            // Use Custom Prompt (await ensures we wait for input)
            const mockEmail = await showCustomPrompt(
                `Enter your ${provider} email to sign up:`, 
                `user@${provider.toLowerCase()}.com`
            );
            
            if (mockEmail) {
                handleSocialRegistration(mockEmail, provider);
            }
        });
    });

    function handleSocialRegistration(email, provider) {
        const users = JSON.parse(localStorage.getItem('registeredUsers')) || [];
        const userExists = users.find(user => user.email === email);

        if (userExists) {
            showCustomAlert(
                `Welcome back! You already have an account with ${userExists.provider}. Logging you in...`, 
                "Account Exists",
                () => {
                    sessionStorage.setItem("userRole", "client");
                    window.location.href = "client_dashboard.html";
                }
            );
        } else {
            const newUser = {
                email: email,
                password: null,
                provider: provider,
                role: 'client',
                dateJoined: new Date().toISOString()
            };
            
            users.push(newUser);
            localStorage.setItem('registeredUsers', JSON.stringify(users));
            
            showCustomAlert(
                `Successfully connected with ${provider}! Account created.`, 
                "Success",
                () => {
                    sessionStorage.setItem("userRole", "client");
                    window.location.href = "client_dashboard.html";
                }
            );
        }
    }

    // --- 2. STANDARD EMAIL SIGNUP ---
    if (signupForm) {
        signupForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const emailValue = emailInput.value.trim();
            const passwordValue = passwordInput.value.trim();
            const confirmValue = confirmInput.value.trim();

            if (passwordValue !== confirmValue) {
                showCustomAlert("Passwords do not match!", "Validation Error");
                return;
            }

            // Check if user exists
            const users = JSON.parse(localStorage.getItem('registeredUsers')) || [];
            if (users.some(user => user.email === emailValue)) {
                showCustomAlert(
                    "This email is already registered. Please login.", 
                    "Account Exists", 
                    () => window.location.href = "login.html"
                );
                return;
            }

            // Save new user
            users.push({
                email: emailValue,
                password: passwordValue,
                provider: 'Local',
                role: 'client',
                dateJoined: new Date().toISOString()
            });
            
            localStorage.setItem('registeredUsers', JSON.stringify(users));
            
            showCustomAlert(
                "Account created successfully!", 
                "Success", 
                () => window.location.href = "login.html"
            );
        });
    }

    // --- 3. EYE ICON TOGGLE ---
    
    function toggleVisibility(inputId, iconId) {
        const input = document.getElementById(inputId);
        const icon = document.getElementById(iconId);
        
        if (input && icon) {
            icon.addEventListener('click', () => {
                const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
                input.setAttribute('type', type);
                icon.classList.toggle('fa-eye');
                icon.classList.toggle('fa-eye-slash');
            });
        }
    }

    toggleVisibility('password', 'togglePassword');
    toggleVisibility('confirmPassword', 'toggleConfirmPassword');

});