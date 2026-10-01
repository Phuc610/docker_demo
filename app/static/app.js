document.addEventListener('DOMContentLoaded', () => {
    // Dùng relative path để FastAPI chuyển tiếp ngầm sang NestJS
    const NEST_API_URL = '';

    // Default guest profile
    const DEFAULT_GUEST_PROFILE = {
        name: "Nguyễn Văn A",
        email: "nguyenvana@example.com",
        interests: ["Python", "FastAPI", "Docker", "DevOps"],
        avatar: ""
    };

    // State
    let currentProfile = { ...DEFAULT_GUEST_PROFILE, interests: [...DEFAULT_GUEST_PROFILE.interests] };
    let currentUser = null; // Thông tin tài khoản NestJS đã đăng nhập
    let tempInterests = [];

    // DOM Elements - Profile Card
    const viewMode = document.getElementById('viewMode');
    const editMode = document.getElementById('editMode');
    const btnOpenEdit = document.getElementById('btnOpenEdit');
    const btnCancelEdit = document.getElementById('btnCancelEdit');
    const profileForm = document.getElementById('profileForm');

    const viewName = document.getElementById('viewName');
    const viewEmail = document.getElementById('viewEmail');
    const viewInterests = document.getElementById('viewInterests');
    const avatarLetter = document.getElementById('avatarLetter');
    const avatarImage = document.getElementById('avatarImage');
    const avatarFileInput = document.getElementById('avatarFileInput');
    const btnUploadAvatar = document.getElementById('btnUploadAvatar');

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

    // DOM Elements - Navbar Auth & Dropdown
    const navGuest = document.getElementById('navGuest');
    const navUser = document.getElementById('navUser');
    const navUserEmail = document.getElementById('navUserEmail');
    const btnNavLogin = document.getElementById('btnNavLogin');
    const btnNavRegister = document.getElementById('btnNavRegister');
    const btnLogout = document.getElementById('btnLogout');
    const btnUserDropdown = document.getElementById('btnUserDropdown');
    const userMenuWrapper = document.getElementById('userMenuWrapper');
    const userDropdownMenu = document.getElementById('userDropdownMenu');
    const dropdownUserName = document.getElementById('dropdownUserName');
    const dropdownUserEmail = document.getElementById('dropdownUserEmail');
    const btnOpenChangePassword = document.getElementById('btnOpenChangePassword');

    // DOM Elements - Change Password Modal
    const changePasswordModal = document.getElementById('changePasswordModal');
    const btnCloseChangePassword = document.getElementById('btnCloseChangePassword');
    const btnCancelChangePassword = document.getElementById('btnCancelChangePassword');
    const formChangePassword = document.getElementById('formChangePassword');
    const currentPasswordInput = document.getElementById('currentPassword');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmNewPasswordInput = document.getElementById('confirmNewPassword');
    const changePasswordError = document.getElementById('changePasswordError');
    const btnSubmitChangePassword = document.getElementById('btnSubmitChangePassword');

    // DOM Elements - Auth Modal
    const authModal = document.getElementById('authModal');
    const btnCloseAuthModal = document.getElementById('btnCloseAuthModal');
    const tabBtnLogin = document.getElementById('tabBtnLogin');
    const tabBtnRegister = document.getElementById('tabBtnRegister');
    const formLogin = document.getElementById('formLogin');
    const formRegister = document.getElementById('formRegister');

    const loginEmail = document.getElementById('loginEmail');
    const loginPassword = document.getElementById('loginPassword');
    const loginError = document.getElementById('loginError');
    const btnSubmitLogin = document.getElementById('btnSubmitLogin');

    const regName = document.getElementById('regName');
    const regEmail = document.getElementById('regEmail');
    const regPassword = document.getElementById('regPassword');
    const regInterests = document.getElementById('regInterests');
    const registerError = document.getElementById('registerError');
    const btnSubmitRegister = document.getElementById('btnSubmitRegister');

    // --- Helpers ---
    function getInitials(name) {
        if (!name) return '??';
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) {
            return parts[0].substring(0, 2).toUpperCase();
        }
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }

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
        }, 3500);
    }

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

    // Token Helpers
    function getToken() {
        return localStorage.getItem('access_token');
    }

    function setToken(token) {
        localStorage.setItem('access_token', token);
    }

    function removeToken() {
        localStorage.removeItem('access_token');
    }

    // User dropdown controls
    function toggleUserDropdown() {
        if (!userMenuWrapper) return;
        const isOpen = userMenuWrapper.classList.toggle('open');
        if (isOpen) {
            userDropdownMenu.classList.remove('hidden');
            btnUserDropdown.setAttribute('aria-expanded', 'true');
        } else {
            closeUserDropdown();
        }
    }

    function closeUserDropdown() {
        if (!userMenuWrapper) return;
        userMenuWrapper.classList.remove('open');
        if (userDropdownMenu) userDropdownMenu.classList.add('hidden');
        if (btnUserDropdown) btnUserDropdown.setAttribute('aria-expanded', 'false');
    }

    // Update Navbar Auth UI
    function updateAuthUI(user) {
        currentUser = user;
        if (user) {
            navGuest.classList.add('hidden');
            navUser.classList.remove('hidden');
            navUserEmail.textContent = user.email || 'user@example.com';
            if (dropdownUserName) dropdownUserName.textContent = user.name || 'Người dùng';
            if (dropdownUserEmail) dropdownUserEmail.textContent = user.email || '';
        } else {
            navGuest.classList.remove('hidden');
            navUser.classList.add('hidden');
            closeUserDropdown();
        }
    }

    // Render View Mode DOM
    function renderViewMode() {
        viewName.textContent = currentProfile.name;
        viewEmail.textContent = currentProfile.email;

        if (currentProfile.avatar) {
            avatarImage.src = currentProfile.avatar;
            avatarImage.classList.remove('hidden');
            avatarLetter.classList.add('hidden');
        } else {
            avatarLetter.textContent = getInitials(currentProfile.name);
            avatarLetter.classList.remove('hidden');
            avatarImage.classList.add('hidden');
        }

        viewInterests.innerHTML = '';
        if (!currentProfile.interests || currentProfile.interests.length === 0) {
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

        editTagsList.querySelectorAll('.btn-remove-tag').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.getAttribute('data-index'), 10);
                tempInterests.splice(idx, 1);
                renderEditTags();
            });
        });
    }

    // Fetch FastAPI fallback profile
    async function fetchFastAPIProfile() {
        try {
            const res = await fetch('/api/profile');
            if (res.ok) {
                currentProfile = await res.json();
                renderViewMode();
            }
        } catch (err) {
            console.error('Error fetching profile from FastAPI:', err);
        }
    }

    // Check Auth with NestJS
    async function checkAuthAndLoadProfile() {
        const token = getToken();
        if (!token) {
            updateAuthUI(null);
            currentProfile = { ...DEFAULT_GUEST_PROFILE, interests: [...DEFAULT_GUEST_PROFILE.interests] };
            renderViewMode();
            return;
        }

        try {
            const res = await fetch(`${NEST_API_URL}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                const user = await res.json();
                updateAuthUI(user);
                currentProfile = {
                    name: user.name,
                    email: user.email,
                    interests: user.interests || [],
                    avatar: user.avatar || ''
                };
                renderViewMode();
            } else {
                // Token hết hạn hoặc không hợp lệ
                removeToken();
                updateAuthUI(null);
                currentProfile = { ...DEFAULT_GUEST_PROFILE, interests: [...DEFAULT_GUEST_PROFILE.interests] };
                renderViewMode();
            }
        } catch (err) {
            console.warn('NestJS Backend chưa sẵn sàng hoặc không kết nối được:', err);
            updateAuthUI(null);
            currentProfile = { ...DEFAULT_GUEST_PROFILE, interests: [...DEFAULT_GUEST_PROFILE.interests] };
            renderViewMode();
        }
    }

    // --- Modal Event Listeners ---
    function openModal(tab = 'login') {
        authModal.classList.remove('hidden');
        loginError.classList.add('hidden');
        registerError.classList.add('hidden');
        switchTab(tab);
    }

    function closeModal() {
        authModal.classList.add('hidden');
    }

    function switchTab(tab) {
        if (tab === 'login') {
            tabBtnLogin.classList.add('active');
            tabBtnRegister.classList.remove('active');
            formLogin.classList.add('active');
            formLogin.classList.remove('hidden');
            formRegister.classList.remove('active');
            formRegister.classList.add('hidden');
            loginEmail.focus();
        } else {
            tabBtnRegister.classList.add('active');
            tabBtnLogin.classList.remove('active');
            formRegister.classList.add('active');
            formRegister.classList.remove('hidden');
            formLogin.classList.remove('active');
            formLogin.classList.add('hidden');
            regName.focus();
        }
    }

    if (btnNavLogin) btnNavLogin.addEventListener('click', () => openModal('login'));
    if (btnNavRegister) btnNavRegister.addEventListener('click', () => openModal('register'));
    if (btnCloseAuthModal) btnCloseAuthModal.addEventListener('click', closeModal);

    authModal.addEventListener('click', (e) => {
        if (e.target === authModal) closeModal();
    });

    tabBtnLogin.addEventListener('click', () => switchTab('login'));
    tabBtnRegister.addEventListener('click', () => switchTab('register'));

    // --- User Dropdown Handlers ---
    if (btnUserDropdown) {
        btnUserDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleUserDropdown();
        });
    }

    document.addEventListener('click', (e) => {
        if (userMenuWrapper && !userMenuWrapper.contains(e.target)) {
            closeUserDropdown();
        }
    });

    // --- Change Password Modal Handlers ---
    function openChangePasswordModal() {
        closeUserDropdown();
        if (!changePasswordModal) return;
        changePasswordModal.classList.remove('hidden');
        if (changePasswordError) changePasswordError.classList.add('hidden');
        if (formChangePassword) formChangePassword.reset();
        setTimeout(() => currentPasswordInput?.focus(), 50);
    }

    function closeChangePasswordModal() {
        if (!changePasswordModal) return;
        changePasswordModal.classList.add('hidden');
        if (changePasswordError) changePasswordError.classList.add('hidden');
        if (formChangePassword) formChangePassword.reset();
    }

    if (btnOpenChangePassword) {
        btnOpenChangePassword.addEventListener('click', () => {
            openChangePasswordModal();
        });
    }

    if (btnCloseChangePassword) btnCloseChangePassword.addEventListener('click', closeChangePasswordModal);
    if (btnCancelChangePassword) btnCancelChangePassword.addEventListener('click', closeChangePasswordModal);

    if (changePasswordModal) {
        changePasswordModal.addEventListener('click', (e) => {
            if (e.target === changePasswordModal) closeChangePasswordModal();
        });
    }

    if (formChangePassword) {
        formChangePassword.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (changePasswordError) changePasswordError.classList.add('hidden');

            const currentPassword = currentPasswordInput.value;
            const newPassword = newPasswordInput.value;
            const confirmNewPassword = confirmNewPasswordInput.value;

            if (newPassword.length < 6) {
                changePasswordError.textContent = 'Mật khẩu mới phải có tối thiểu 6 ký tự!';
                changePasswordError.classList.remove('hidden');
                newPasswordInput.focus();
                return;
            }

            if (newPassword !== confirmNewPassword) {
                changePasswordError.textContent = 'Xác nhận mật khẩu mới không khớp!';
                changePasswordError.classList.remove('hidden');
                confirmNewPasswordInput.focus();
                return;
            }

            if (currentPassword === newPassword) {
                changePasswordError.textContent = 'Mật khẩu mới không được trùng với mật khẩu hiện tại!';
                changePasswordError.classList.remove('hidden');
                newPasswordInput.focus();
                return;
            }

            const token = getToken();
            if (!token) {
                showToast('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!', 'error');
                closeChangePasswordModal();
                openModal('login');
                return;
            }

            // Button loading state
            const btnText = btnSubmitChangePassword.querySelector('.btn-text');
            const spinner = btnSubmitChangePassword.querySelector('.spinner');
            btnSubmitChangePassword.disabled = true;
            if (btnText) btnText.classList.add('hidden');
            if (spinner) spinner.classList.remove('hidden');

            try {
                const res = await fetch('/auth/change-password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ currentPassword, newPassword })
                });

                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.message || 'Không thể đổi mật khẩu');
                }

                showToast(data.message || 'Đổi mật khẩu thành công!', 'success');
                closeChangePasswordModal();
            } catch (err) {
                console.error('Change password error:', err);
                changePasswordError.textContent = err.message || 'Lỗi khi đổi mật khẩu';
                changePasswordError.classList.remove('hidden');
            } finally {
                btnSubmitChangePassword.disabled = false;
                if (btnText) btnText.classList.remove('hidden');
                if (spinner) spinner.classList.add('hidden');
            }
        });
    }

    // --- Logout Handler ---
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            closeUserDropdown();
            removeToken();
            updateAuthUI(null);
            currentProfile = { ...DEFAULT_GUEST_PROFILE, interests: [...DEFAULT_GUEST_PROFILE.interests] };
            renderViewMode();
            showToast('Đã đăng xuất tài khoản', 'success');
        });
    }

    // --- Avatar Upload Handler ---
    if (avatarFileInput && btnUploadAvatar) {
        avatarFileInput.addEventListener('change', async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            const token = getToken();
            if (!token) {
                showToast('Vui lòng đăng nhập để thay đổi ảnh đại diện!', 'error');
                openModal('login');
                avatarFileInput.value = '';
                return;
            }

            if (file.size > 3 * 1024 * 1024) {
                showToast('Dung lượng ảnh tối đa là 3MB', 'error');
                avatarFileInput.value = '';
                return;
            }

            const icon = btnUploadAvatar.querySelector('i');
            btnUploadAvatar.classList.add('uploading');
            if (icon) icon.className = 'fa-solid fa-circle-notch fa-spin';

            try {
                const formData = new FormData();
                formData.append('avatar', file);

                const res = await fetch('/auth/avatar', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });

                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.message || 'Lỗi khi tải ảnh lên');
                }

                currentProfile.avatar = data.avatarUrl;
                renderViewMode();
                showToast('Cập nhật ảnh đại diện thành công!', 'success');
            } catch (err) {
                console.error('Avatar upload error:', err);
                showToast(err.message || 'Lỗi khi tải ảnh', 'error');
            } finally {
                btnUploadAvatar.classList.remove('uploading');
                if (icon) icon.className = 'fa-solid fa-camera';
                avatarFileInput.value = '';
            }
        });
    }

    // --- Login Form Submit ---
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginError.classList.add('hidden');

        const email = loginEmail.value.trim();
        const password = loginPassword.value.trim();

        if (!email || !password) {
            loginError.textContent = 'Vui lòng nhập đầy đủ email và mật khẩu';
            loginError.classList.remove('hidden');
            return;
        }

        const btnSpinner = btnSubmitLogin.querySelector('.spinner');
        const btnTxt = btnSubmitLogin.querySelector('.btn-text');
        btnSubmitLogin.disabled = true;
        btnTxt.classList.add('hidden');
        btnSpinner.classList.remove('hidden');

        try {
            const res = await fetch(`${NEST_API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Đăng nhập không thành công');
            }

            setToken(data.accessToken);
            closeModal();
            showToast(`Chào mừng ${data.user?.name || 'bạn'} trở lại!`, 'success');
            await checkAuthAndLoadProfile();
            formLogin.reset();
        } catch (err) {
            loginError.textContent = Array.isArray(err.message) ? err.message.join(', ') : err.message;
            loginError.classList.remove('hidden');
        } finally {
            btnSubmitLogin.disabled = false;
            btnTxt.classList.remove('hidden');
            btnSpinner.classList.add('hidden');
        }
    });

    // --- Register Form Submit ---
    formRegister.addEventListener('submit', async (e) => {
        e.preventDefault();
        registerError.classList.add('hidden');

        const name = regName.value.trim();
        const email = regEmail.value.trim();
        const password = regPassword.value.trim();
        const interestsRaw = regInterests.value.trim();

        const interests = interestsRaw
            ? interestsRaw.split(',').map(s => s.trim()).filter(Boolean)
            : [];

        if (!name || !email || !password) {
            registerError.textContent = 'Vui lòng điền đủ họ tên, email và mật khẩu';
            registerError.classList.remove('hidden');
            return;
        }

        if (password.length < 6) {
            registerError.textContent = 'Mật khẩu phải có tối thiểu 6 ký tự';
            registerError.classList.remove('hidden');
            return;
        }

        const btnSpinner = btnSubmitRegister.querySelector('.spinner');
        const btnTxt = btnSubmitRegister.querySelector('.btn-text');
        btnSubmitRegister.disabled = true;
        btnTxt.classList.add('hidden');
        btnSpinner.classList.remove('hidden');

        try {
            const res = await fetch(`${NEST_API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, interests })
            });

            const data = await res.json();
            if (!res.ok) {
                const msg = Array.isArray(data.message) ? data.message.join(', ') : (data.message || 'Đăng ký thất bại');
                throw new Error(msg);
            }

            setToken(data.accessToken);
            closeModal();
            showToast('Đăng ký tài khoản thành công!', 'success');
            await checkAuthAndLoadProfile();
            formRegister.reset();
        } catch (err) {
            registerError.textContent = err.message;
            registerError.classList.remove('hidden');
        } finally {
            btnSubmitRegister.disabled = false;
            btnTxt.classList.remove('hidden');
            btnSpinner.classList.add('hidden');
        }
    });

    // --- Tags Input Handler ---
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

    // --- Switch to Edit Mode ---
    btnOpenEdit.addEventListener('click', () => {
        const token = getToken();
        if (!token) {
            showToast('Vui lòng đăng nhập để chỉnh sửa thông tin hồ sơ của bạn!', 'error');
            openModal('login');
            return;
        }

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

    // --- Cancel Edit Mode ---
    btnCancelEdit.addEventListener('click', () => {
        editMode.classList.remove('active');
        viewMode.classList.add('active');
    });

    // --- Save Profile (NestJS Auth Sync) ---
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();

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

        const token = getToken();
        if (!token) {
            showToast('Vui lòng đăng nhập để lưu thay đổi hồ sơ!', 'error');
            openModal('login');
            return;
        }

        btnSaveProfile.disabled = true;
        btnText.classList.add('hidden');
        spinner.classList.remove('hidden');

        try {
            const payload = {
                name: nameVal,
                email: emailVal,
                interests: tempInterests
            };

            const res = await fetch('/auth/me', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Cập nhật thất bại');
            }

            if (data.accessToken) {
                setToken(data.accessToken);
            }

            const updatedUser = data.user;
            currentUser = updatedUser;
            currentProfile = {
                name: updatedUser.name,
                email: updatedUser.email,
                interests: updatedUser.interests || [],
                avatar: updatedUser.avatar || ''
            };

            updateAuthUI(updatedUser);
            renderViewMode();

            editMode.classList.remove('active');
            viewMode.classList.add('active');

            showToast('Hồ sơ đã được lưu thành công!', 'success');
        } catch (err) {
            console.error('Error saving profile:', err);
            showToast(err.message || 'Lỗi khi lưu thông tin', 'error');
        } finally {
            btnSaveProfile.disabled = false;
            btnText.classList.remove('hidden');
            spinner.classList.add('hidden');
        }
    });

    // --- System Health Check (FastAPI & NestJS) ---
    const systemStatusBadge = document.getElementById('systemStatusBadge');
    const statusText = document.getElementById('statusText');

    async function checkHealth() {
        if (!systemStatusBadge || !statusText) return;
        systemStatusBadge.className = 'status-badge';
        statusText.textContent = 'Đang kiểm tra kết nối...';

        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        let fastApiOk = false;
        let nestJsOk = false;

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000);
            const resFastApi = await fetch('/api/health', { signal: controller.signal });
            clearTimeout(timeoutId);
            if (resFastApi.ok) {
                const data = await resFastApi.json();
                fastApiOk = data.database === 'connected';
            }
        } catch (e) {
            console.warn('FastAPI health check failed:', e);
        }

        if (isLocal) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 2000);
                const resNest = await fetch(`${NEST_API_URL}/auth/me`, {
                    headers: { 'Authorization': 'Bearer test' },
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                // 401 Unauthorized nghĩa là NestJS đang chạy tốt và guard hoạt động đúng
                nestJsOk = (resNest.status === 401 || resNest.ok);
            } catch (e) {}
        }

        if (isLocal) {
            if (fastApiOk && nestJsOk) {
                systemStatusBadge.className = 'status-badge online';
                statusText.textContent = 'Hệ thống hoạt động';
            } else if (fastApiOk) {
                systemStatusBadge.className = 'status-badge online';
                statusText.textContent = 'Hệ thống hoạt động';
            } else {
                systemStatusBadge.className = 'status-badge offline';
                statusText.textContent = 'Hệ thống ngoại tuyến';
            }
        } else {
            // Khi chạy trên Render hoặc Cloud
            if (fastApiOk) {
                systemStatusBadge.className = 'status-badge online';
                statusText.textContent = 'Hệ thống hoạt động';
            } else {
                systemStatusBadge.className = 'status-badge offline';
                statusText.textContent = 'Hệ thống ngoại tuyến';
            }
        }
    }

    // --- User Search & Public Profile Feature ---
    const navSearchWrapper = document.getElementById('navSearchWrapper');
    const inputSearchUsers = document.getElementById('inputSearchUsers');
    const btnClearSearch = document.getElementById('btnClearSearch');
    const searchSpinner = document.getElementById('searchSpinner');
    const searchResultsDropdown = document.getElementById('searchResultsDropdown');
    const searchResultsCount = document.getElementById('searchResultsCount');
    const searchResultsList = document.getElementById('searchResultsList');

    const userProfileModal = document.getElementById('userProfileModal');
    const btnCloseUserProfileModal = document.getElementById('btnCloseUserProfileModal');
    const btnClosePublicProfile = document.getElementById('btnClosePublicProfile');
    const publicAvatarLetter = document.getElementById('publicAvatarLetter');
    const publicAvatarImage = document.getElementById('publicAvatarImage');
    const publicUserName = document.getElementById('publicUserName');
    const publicUserEmail = document.getElementById('publicUserEmail');
    const publicUserInterests = document.getElementById('publicUserInterests');

    let searchDebounceTimeout = null;

    function openPublicProfileModal(user) {
        if (!userProfileModal) return;
        if (searchResultsDropdown) searchResultsDropdown.classList.add('hidden');

        publicUserName.textContent = user.name || 'Người dùng';
        publicUserEmail.innerHTML = `<i class="fa-regular fa-envelope"></i> ${user.email || ''}`;

        if (user.avatar) {
            publicAvatarImage.src = user.avatar;
            publicAvatarImage.classList.remove('hidden');
            publicAvatarLetter.classList.add('hidden');
        } else {
            publicAvatarImage.classList.add('hidden');
            publicAvatarLetter.classList.remove('hidden');
            publicAvatarLetter.textContent = getInitials(user.name || user.email);
        }

        // Render interests
        publicUserInterests.innerHTML = '';
        const interests = user.interests || [];
        if (interests.length > 0) {
            interests.forEach((tag) => {
                const span = document.createElement('span');
                span.className = 'tag';
                span.textContent = tag;
                publicUserInterests.appendChild(span);
            });
        } else {
            const span = document.createElement('span');
            span.style.color = '#94a3b8';
            span.style.fontSize = '0.82rem';
            span.textContent = 'Chưa có kỹ năng/sở thích nào được liệt kê.';
            publicUserInterests.appendChild(span);
        }

        userProfileModal.classList.remove('hidden');
    }

    function closePublicProfileModal() {
        if (!userProfileModal) return;
        userProfileModal.classList.add('hidden');
    }

    if (btnCloseUserProfileModal) btnCloseUserProfileModal.addEventListener('click', closePublicProfileModal);
    if (btnClosePublicProfile) btnClosePublicProfile.addEventListener('click', closePublicProfileModal);
    if (userProfileModal) {
        userProfileModal.addEventListener('click', (e) => {
            if (e.target === userProfileModal) closePublicProfileModal();
        });
    }

    async function executeSearch(query) {
        if (!query || !query.trim()) {
            if (searchResultsDropdown) searchResultsDropdown.classList.add('hidden');
            if (btnClearSearch) btnClearSearch.classList.add('hidden');
            return;
        }

        if (btnClearSearch) btnClearSearch.classList.remove('hidden');
        if (searchSpinner) searchSpinner.classList.remove('hidden');

        try {
            const res = await fetch(`/auth/users/search?q=${encodeURIComponent(query.trim())}`);
            const users = await res.json();

            if (!res.ok) {
                throw new Error('Lỗi tìm kiếm');
            }

            searchResultsList.innerHTML = '';
            if (!users || users.length === 0) {
                searchResultsCount.textContent = 'Kết quả tìm kiếm';
                searchResultsList.innerHTML = `
                    <div class="search-empty-state">
                        <i class="fa-solid fa-user-slash"></i>
                        Không tìm thấy tài khoản phù hợp với "${query.trim()}"
                    </div>
                `;
            } else {
                searchResultsCount.textContent = `${users.length} tài khoản tìm thấy`;
                users.forEach((user) => {
                    const item = document.createElement('button');
                    item.type = 'button';
                    item.className = 'search-result-item';

                    const avatarHtml = user.avatar
                        ? `<img src="${user.avatar}" alt="${user.name}">`
                        : getInitials(user.name || user.email);

                    const tagsHtml = (user.interests || []).slice(0, 3).map((tag) => 
                        `<span class="search-tag-chip">${tag}</span>`
                    ).join('');

                    item.innerHTML = `
                        <div class="search-item-avatar">${avatarHtml}</div>
                        <div class="search-item-info">
                            <span class="search-item-name">${user.name || 'Người dùng'}</span>
                            <span class="search-item-email">${user.email || ''}</span>
                            ${tagsHtml ? `<div class="search-item-tags">${tagsHtml}</div>` : ''}
                        </div>
                    `;

                    item.addEventListener('click', () => {
                        openPublicProfileModal(user);
                    });

                    searchResultsList.appendChild(item);
                });
            }

            searchResultsDropdown.classList.remove('hidden');
        } catch (err) {
            console.error('Search error:', err);
        } finally {
            if (searchSpinner) searchSpinner.classList.add('hidden');
        }
    }

    if (inputSearchUsers) {
        inputSearchUsers.addEventListener('input', (e) => {
            const query = e.target.value;
            clearTimeout(searchDebounceTimeout);
            searchDebounceTimeout = setTimeout(() => {
                executeSearch(query);
            }, 250);
        });

        inputSearchUsers.addEventListener('focus', () => {
            if (inputSearchUsers.value.trim()) {
                executeSearch(inputSearchUsers.value);
            }
        });
    }

    if (btnClearSearch) {
        btnClearSearch.addEventListener('click', () => {
            inputSearchUsers.value = '';
            btnClearSearch.classList.add('hidden');
            searchResultsDropdown.classList.add('hidden');
            inputSearchUsers.focus();
        });
    }

    document.addEventListener('click', (e) => {
        if (navSearchWrapper && !navSearchWrapper.contains(e.target)) {
            if (searchResultsDropdown) searchResultsDropdown.classList.add('hidden');
        }
    });

    if (systemStatusBadge) {
        systemStatusBadge.addEventListener('click', () => {
            checkHealth();
            showToast('Đang làm mới trạng thái hệ thống...', 'success');
        });
    }

    // Khởi chạy khi load trang
    checkAuthAndLoadProfile();
    checkHealth();
});
