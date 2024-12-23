document.addEventListener('DOMContentLoaded', () => {
    const postForm = document.querySelector('#postForm');
    const imageInput = document.querySelector('#imageInput');
    const imagePreviewContainer = document.querySelector('#imagePreviewContainer');
    const submitButton = document.querySelector('#submitPost');
    const spinner = submitButton.querySelector('.spinner-border');
    const buttonText = submitButton.querySelector('.button-text');

    let selectedImages = [];

    imageInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        
        // Check if more than 4 images are selected
        if (selectedImages.length + files.length > 4) {
            showError('You can only upload up to 4 images');
            imageInput.value = '';
            return;
        }

        // Preview each selected image
        files.forEach(file => {
            if (!file.type.startsWith('image/')) {
                showError('Please select only image files');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const previewDiv = document.createElement('div');
                previewDiv.className = 'position-relative';
                previewDiv.innerHTML = `
                    <img src="${e.target.result}" class="img-thumbnail" style="width: 100px; height: 100px; object-fit: cover;">
                    <button type="button" class="btn-close position-absolute top-0 end-0 m-1" 
                            style="background-color: white;" aria-label="Remove image"></button>
                `;

                // Add remove functionality
                const removeBtn = previewDiv.querySelector('.btn-close');
                removeBtn.addEventListener('click', () => {
                    selectedImages = selectedImages.filter(img => img !== file);
                    previewDiv.remove();
                });

                imagePreviewContainer.appendChild(previewDiv);
                selectedImages.push(file);
            };
            reader.readAsDataURL(file);
        });
    });

    postForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Show loading state
        spinner.classList.remove('d-none');
        buttonText.textContent = 'Posting...';
        submitButton.disabled = true;

        const formData = new FormData(postForm);
        
        formData.delete('images');
        selectedImages.forEach(image => {
            formData.append('images', image);
        });

        for (const file of selectedImages) {
            if (file.size > 10 * 1024 * 1024) {
                showError('One or more images exceed the 10MB limit.');
                spinner.classList.add('d-none');
                buttonText.textContent = 'Post';
                submitButton.disabled = false;
                return;
            }
        }


        try {
            const response = await fetch('api/post', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            if (data.success) {
                postForm.reset();
                imagePreviewContainer.innerHTML = '';
                selectedImages = [];
                showSuccess("Post created successfully");
                location.reload();
            } else {
                showError(data.message || 'Failed to create post');
            }
        } catch (err) {
            console.error(err);
            showError('Network error. Please try again later.');
        } finally {
            // Reset loading state
            spinner.classList.add('d-none');
            buttonText.textContent = 'Post';
            submitButton.disabled = false;
        }
    });
});