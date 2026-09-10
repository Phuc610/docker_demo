document.addEventListener('DOMContentLoaded', () => {
    // Current profile state in client
    let currentProfile = {
        name: '',
        email: '',
        interests: []
    };

    let tempInterests = [];

    // DOM Elements
    const viewMode = document.getElementById('viewMode');
    const editMode = document.getElementById('editMode');
    const btnOpenEdit = document.getElementById('btnOpenEdit');
    const btnCancelEdit = document.getElementById('btnCancelEdit');
    const profileForm = document.getElementById('profileForm');

    const viewName = document.getElementById('viewName');
    const viewEmail = document.getElementById('viewEmail');
    const viewInterests = document.getElementById('viewInterests');
    const avatarLetter = document.getElementById('avatarLetter');

    const inputName = document.getElementById('inputName');
    const inputEmail = document.getElementById('inputEmail');
    const inputTag = document.getElementById('inputTag');
    const btnAddTag = document.getElementById('btnAddTag');
    const editTagsList = document.getElementById('editTagsList');

    const nameError = document.getElementById('nameError');
    const emailError = document.getElementById('emailError');
    const btnSaveProfile = document.getElementById('btnSaveProfile');
    const btnText = btnSaveProfile.querySelector('.btn-text');
    const spinner = btnSaveProfile.querySelector('.spinner');

    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');

    // Helper: Compute initials from name
    function getInitials(name) {
        if (!name) return '??';
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) {
            return parts[0].substring(0, 2).toUpperCase();
        }
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }

    // Helper: Show Toast Notification
    let toastTimeout;
    function showToast(message, type = 'success') {
        clearTimeout(toastTimeout);
        toastMessage.textContent = message;
        toast.className = `toast toast-${type}`;
        
        const icon = toast.querySelector('.toast-icon');
        if (type === 'success') {
            icon.className = 'toast-icon fa-solid fa-circle-check';
        } else {
            icon.className = 'toast-icon fa-solid fa-triangle-exclamation';
        }

        toastTimeout = setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }

    // Render View Mode DOM
    function renderViewMode() {
        viewName.textContent = currentProfile.name;
        viewEmail.textContent = currentProfile.email;
        avatarLetter.textContent = getInitials(currentProfile.name);

        viewInterests.innerHTML = '';
        if (currentProfile.interests.length === 0) {
            viewInterests.innerHTML = '<span class="tag" style="color:#94a3b8;border-style:dashed;">Chưa có sở thích nào</span>';
        } else {
            currentProfile.interests.forEach(interest => {
                const tagEl = document.createElement('span');
                tagEl.className = 'tag';
                tagEl.textContent = interest;
                viewInterests.appendChild(tagEl);
            });
        }
    }

    // Render Editable Tags in Form
    function renderEditTags() {
        editTagsList.innerHTML = '';
        if (tempInterests.length === 0) {
            editTagsList.innerHTML = '<span style="color:#94a3b8;font-size:0.85rem;padding:4px;">Chưa có thẻ nào</span>';
            return;
        }

        tempInterests.forEach((tag, index) => {
            const tagEl = document.createElement('span');
            tagEl.className = 'editable-tag';
            tagEl.innerHTML = `
                ${escapeHtml(tag)}
                <button type="button" class="btn-remove-tag" data-index="${index}">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            `;
            editTagsList.appendChild(tagEl);
        });

        // Add event listeners to remove buttons
        editTagsList.querySelectorAll('.btn-remove-tag').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(btn.getAttribute('data-index'), 10);
                tempInterests.splice(idx, 1);
                renderEditTags();
            });
        });
    }

    // Helper: Escape HTML string
    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    // Fetch initial profile from API
    async function fetchProfile() {
        try {
            const res = await fetch('/api/profile');
            if (res.ok) {
                currentProfile = await res.json();
                renderViewMode();
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
            showToast('Không thể tải thông tin profile', 'error');
        }
    }

    // Add Tag handler
    function addTag() {
        const val = inputTag.value.trim();
        if (val) {
            if (!tempInterests.includes(val)) {
                tempInterests.push(val);
                renderEditTags();
            }
            inputTag.value = '';
        }
        inputTag.focus();
    }

    btnAddTag.addEventListener('click', addTag);
    inputTag.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTag();
        }
    });

    // Switch to Edit Mode
    btnOpenEdit.addEventListener('click', () => {
        inputName.value = currentProfile.name;
        inputEmail.value = currentProfile.email;
        tempInterests = [...currentProfile.interests];
        
        nameError.textContent = '';
        emailError.textContent = '';
        
        renderEditTags();
        viewMode.classList.remove('active');
        editMode.classList.add('active');
        inputName.focus();
    });

    // Switch back to View Mode (Cancel)
    btnCancelEdit.addEventListener('click', () => {
        editMode.classList.remove('active');
        viewMode.classList.add('active');
    });

    // Handle Form Submit
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Simple validation
        let isValid = true;
        nameError.textContent = '';
        emailError.textContent = '';

        const nameVal = inputName.value.trim();
        const emailVal = inputEmail.value.trim();

        if (!nameVal) {
            nameError.textContent = 'Vui lòng nhập họ và tên';
            isValid = false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailVal) {
            emailError.textContent = 'Vui lòng nhập địa chỉ email';
            isValid = false;
        } else if (!emailRegex.test(emailVal)) {
            emailError.textContent = 'Email không hợp lệ';
            isValid = false;
        }

        if (!isValid) return;

        // Show spinner loading
        btnSaveProfile.disabled = true;
        btnText.classList.add('hidden');
        spinner.classList.remove('hidden');

        try {
            const payload = {
                name: nameVal,
                email: emailVal,
                interests: tempInterests
            };

            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail?.[0]?.msg || 'Cập nhật thất bại');
            }

            currentProfile = await res.json();
            renderViewMode();

            // Switch back to view mode
            editMode.classList.remove('active');
            viewMode.classList.add('active');

            showToast('Hồ sơ đã được cập nhật thành công!', 'success');
        } catch (err) {
            console.error('Error saving profile:', err);
            showToast(err.message || 'Lỗi khi lưu thông tin', 'error');
        } finally {
            btnSaveProfile.disabled = false;
            btnText.classList.remove('hidden');
            spinner.classList.add('hidden');
        }
    });

    // Initial load
    fetchProfile();
});
