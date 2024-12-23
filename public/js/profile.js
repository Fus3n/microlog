const followBtn = document.querySelector('#follow-user-btn');

// when not following
function buttonDefaultState() {
    followBtn.classList.remove("disabled", "btn-primary");
    followBtn.classList.add("btn-outline-primary");
    followBtn.disabled = false;
    followBtn.innerHTML = `
        <i class="bi bi-person-plus"></i> Follow
    `;
}

// when following
function buttonFollowingState() {
    followBtn.classList.remove('disabled', "btn-outline-primary");
    followBtn.classList.add("btn-primary");
    followBtn.disabled = false;
    followBtn.innerHTML = `
        <i class="bi bi-person-dash"></i> Following
    `
}

function followUser() {
    fetch('/api/follow', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userToFollowId: followBtn.dataset.userId }),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                buttonFollowingState();
                
                if (data.data?.newFollowersCount) {
                    const followersCountElement = document.querySelector('#followers-count');
                    followersCountElement.textContent = data.data.newFollowersCount;
                    followBtn.dataset.isFollowing = 'true';
                }

            } else {
                console.error(data.message);
                showAuthPrompt();
                // showError(data.message);
                buttonDefaultState();
            }
        })
        .catch((error) => {
            console.error('Error following user:', error);
            showError(error.message);
            buttonDefaultState();
        });
}

function unfollowUser() {
    fetch('/api/unfollow', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userToUnFollowId: followBtn.dataset.userId }),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                buttonDefaultState();

                if (data.data?.newFollowersCount !== undefined || data.data?.newFollowersCount !== null) {
                    const followersCountElement = document.querySelector('#followers-count');
                    followersCountElement.textContent = data.data.newFollowersCount;
                    followBtn.dataset.isFollowing = 'false';
                }
            } else {
                console.error(data.message);
                showError(data.message);
                buttonFollowingState();
            }
        })
        .catch((error) => {
            console.error('Error unfollowing user:', error);
            showError(error.message);
            buttonFollowingState();
        });
}

followBtn.addEventListener('click', () => {
    followBtn.classList.add('disabled');
    followBtn.disabled = true;

    if (followBtn.dataset.isFollowing !== 'true') {
        followBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Following...';
        followUser();
    } else {
        followBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Unfollowing...';
        unfollowUser();
    }
});
