let selectedImages = [];

document.addEventListener('DOMContentLoaded', () => {
    const commentForm = document.getElementById('commentForm');
    if (commentForm) {
        commentForm.addEventListener('submit', handleCommentSubmit);
    }

    const imageInput = document.getElementById('imageInput');
    if (imageInput) {
        imageInput.addEventListener('change', handleImageSelection);
    }

    const commentsContainer = document.querySelector('.comments-container'); 
    if (commentsContainer) {
        commentsContainer.addEventListener('submit', handleDeleteComment);
    }
});

async function handleCommentSubmit(event) {
    event.preventDefault();

    const commentTextarea = document.querySelector('#commentForm textarea');
    const commentText = commentTextarea.value;
    const postId = document.querySelector('#post-card').dataset.postId; // Assuming you add data-post-id to the post-card div
    const imageInput = document.getElementById('imageInput');
    const files = imageInput.files;

    if (!commentText.trim() && files.length === 0) {
        alert('Please enter a comment or select an image.'); // Basic validation
        return;
    }

    if (!postId) {
        console.error("No Post ID found")
        return;
    }


    const submitButton = document.querySelector('#commentForm button[type="submit"]');
    const spinner = submitButton.querySelector('.spinner-border');
    const buttonText = submitButton.querySelector('.button-text');

    // Show spinner and disable button
    spinner.classList.remove('d-none');
    buttonText.textContent = 'Commenting...';
    submitButton.disabled = true;

    try {
        const formData = new FormData();
        formData.append('postId', postId);
        formData.append('text', commentText);

        selectedImages.forEach(image => {
            formData.append('images', image);
        });


        const response = await fetch('/api/comment', {
            method: 'POST',
            body: formData, 
        });

        const result = await response.json();

        if (response.ok && result.success) {
            commentTextarea.value = '';
            imageInput.value = ''; 
            const imagePreviewContainer = document.getElementById('imagePreviewContainer');
            imagePreviewContainer.innerHTML = ''; 
            // show a success message.
            location.reload();
        } else {
            console.error('Comment submission failed:', result.message);
            alert(`Error posting comment: ${result.message}`);
        }
    } catch (error) {
        console.error('Error submitting comment:', error);
        alert('An error occurred while posting the comment.');
    } finally {
        // Hide spinner and re-enable button
        spinner.classList.add('d-none');
        buttonText.textContent = 'Comment';
        submitButton.disabled = false;
    }
}

function handleImageSelection(event) {
    const files = Array.from(event.target.files)
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
        
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
}


async function handleDeleteComment(event) {
    if (event.target.matches('#delete-comment-form')) { // Check if form was submitted by delete button
        event.preventDefault();
        const deleteForm = event.target.closest('#delete-comment-form');
        const commentId = deleteForm.dataset.commentId;

        if (!commentId) {
            console.error("No Comment ID found on delete form");
            showError('An error occurred while deleting the comment.');
            return;
        }

        if (!confirm('Are you sure you want to delete this comment?')) {
            return; 
        }

        try {
            const response = await fetch(`/api/comments/${commentId}`, {
                method: 'DELETE',
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Remove the comment from the UI.
                location.reload();
                showSuccess('Comment deleted.');
            } else {
                console.error('Comment deletion failed:', result.message);
                showError(`Error deleting comment: ${result.message}`);
            }
        } catch (error) {
            console.error('Error deleting comment:', error);
            showError('An error occurred while deleting the comment.');
        }
    }
    // else if (event.target.id === 'commentForm') { //if the comment form was submitted
    //     handleCommentSubmit(event);
    // }
}