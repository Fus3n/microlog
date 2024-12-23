document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.querySelector('#registerForm');

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(registerForm);

        const username = formData.get('username');
        const email = formData.get('email');
        const password = formData.get('password');
        const confirmPassword = formData.get('confirm-password');

        if (password !== confirmPassword) {
            showError('Passwords do not match');
            return;
        }

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                window.location.href = '/feed';
            } else {
                showError(data.message || 'Something went wrong');
            }
        } catch (error) {
            showError('Network error. Please try again later.');
            console.error('Login error:', error);
        }
    });
});