const profileForm = document.querySelector('form');
// const errorToastElement = document.querySelector('.toast.text-bg-danger');
// const successToastElement = document.querySelector('.toast.text-bg-success');
// const errorToast = new bootstrap.Toast(errorToastElement);
// const successToast = new bootstrap.Toast(successToastElement, {
//     animation: true,
//     autohide: true,
//     delay: 3000
// });

// const showError = (message) => {
//     const toastMessageElement = errorToastElement.querySelector('.toast-message');
//     toastMessageElement.textContent = message;
//     errorToast.show();
// };

// const showSuccess = (message) => {
//     const toastMessageElement = successToastElement.querySelector('.toast-message');
//     toastMessageElement.textContent = message;
//     successToast.show();
// };

const getImgFile = async (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = (error) => reject(error);
            img.src = reader.result;
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
};

const setLoading = (isLoading) => {
    const saveButton = document.getElementById('save-button');
    const buttonText = saveButton.querySelector('.button-text');
    const buttonSpinner = saveButton.querySelector('.button-spinner');
    const form = document.querySelector('form');
    const inputs = form.querySelectorAll('input, textarea, select, button');

    if (isLoading) {
        buttonText.classList.add('invisible');
        buttonSpinner.classList.remove('d-none');
        saveButton.disabled = true;
        inputs.forEach(input => {
            if (input !== saveButton) {
                input.disabled = true;
            }
        });
    } else {
        buttonText.classList.remove('invisible');
        buttonSpinner.classList.add('d-none');
        saveButton.disabled = false;
        inputs.forEach(input => {
            if (input !== saveButton) {
                input.disabled = false;
            }
        });
    }
};

profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Get form data
    const formData = new FormData(profileForm);
    
    const profilePicture = formData.get('profilePicture');
    if (profilePicture?.size) {
        const MAX_SIZE_MB = 1.5;
        const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

        if (profilePicture.size > MAX_SIZE_BYTES) {
            showError(`Profile picture must be smaller than ${MAX_SIZE_MB}MB`);
            return;
        }

        const img = await getImgFile(profilePicture)
        if (img.width < 400 || img.height < 400) {
          showError('Profile picture must be at least 400x400 pixels');
          return;
      }
    }

    // check if bio greater than 250 characters
    const bio = formData.get('bio');
    if (bio && bio.length > 250) {
        showError('Bio must be less than 250 characters');
        return;
    }

    // check if location is greater than 50 characters
    const location = formData.get('location');
    if (location && location.length > 50) {
        showError('Location must be less than 50 characters');
        return;
    }

    // check if fullName is greater than 50 characters
    const fullName = formData.get('fullName');
    if (fullName && fullName.length > 60) {
        showError('Full name must be less than 60 characters');
        return;
    }

    try {
        setLoading(true);

        const response = await fetch('/me/edit', {
            method: 'PUT',
            body: formData,
        });

        const data = await response.json();

        if (data.success) {
            showSuccess('Profile updated successfully!');
            // Wait for the success message to be shown before redirecting
            setTimeout(() => {
                window.location.href = '/me';
            }, 1000);
        } else {
            showError(data.message || 'Error updating profile');
            setLoading(false);
        }
    } catch (err) {
        console.error('Error:', err);
        showError('An error occurred while updating your profile');
        setLoading(false);
    }
});

// Handle profile picture upload preview
const profilePictureInput = document.querySelector('input[name="profilePicture"]');
const uploadSpinner = document.querySelector('.upload-spinner');

if (profilePictureInput) {
    profilePictureInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            // Show loading spinner
            uploadSpinner.classList.remove('d-none');
            profilePictureInput.parentElement.classList.add('disabled');

            const reader = new FileReader();
            reader.onload = function (e) {
                const preview = document.querySelector('#profile-picture-preview');
                if (preview) {
                    preview.src = e.target.result;
                }
                // Hide loading spinner
                uploadSpinner.classList.add('d-none');
                profilePictureInput.parentElement.classList.remove('disabled');
            };
            reader.onerror = function () {
                showError('Error loading profile picture');
                uploadSpinner.classList.add('d-none');
                profilePictureInput.parentElement.classList.remove('disabled');
            };
            reader.readAsDataURL(file);
        }
    });
}
