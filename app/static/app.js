document.addEventListener('DOMContentLoaded', () => {
    // NestJS Backend URL (cùng host, port 3000)
    const NEST_API_URL = `${window.location.protocol}//${window.location.hostname}:3000`;

    // State
    let currentProfile = {
        name: '',
        email: '',
        interests: []
    };
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

    // DOM Elements - Navbar Auth
    const navGuest = document.getElementById('navGuest');
    const navUser = document.getElementById('navUser');
    const navUserEmail = document.getElementById('navUserEmail');
    const btnNavLogin = document.getElementById('btnNavLogin');
    const btnNavRegister = document.getElementById('btnNavRegister');
    const btnLogout = document.getElementById('btnLogout');

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

    // Update Navbar Auth UI
    function updateAuthUI(user) {
        currentUser = user;
        if (user) {
            navGuest.classList.add('hidden');
            navUser.classList.remove('hidden');
            navUserEmail.textContent = user.email || 'user@example.com';
        } else {
            navGuest.classList.remove('hidden');
            navUser.classList.add('hidden');
        }
    }

    // Render View Mode DOM
    function renderViewMode() {
        viewName.textContent = currentProfile.name;
        viewEmail.textContent = currentProfile.email;
        avatarLetter.textContent = getInitials(currentProfile.name);

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
            await fetchFastAPIProfile();
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
                    interests: user.interests || []
                };
                renderViewMode();
            } else {
                // Token hết hạn hoặc không hợp lệ
                removeToken();
                updateAuthUI(null);
                await fetchFastAPIProfile();
            }
        } catch (err) {
            console.warn('NestJS Backend chưa sẵn sàng hoặc không kết nối được:', err);
            updateAuthUI(null);
            await fetchFastAPIProfile();
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

    // --- Logout Handler ---
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            removeToken();
            updateAuthUI(null);
            showToast('Đã đăng xuất tài khoản', 'success');
            checkAuthAndLoadProfile();
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

    // --- Save Profile (FastAPI sync) ---
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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail?.[0]?.msg || 'Cập nhật thất bại');
            }

            currentProfile = await res.json();
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
                statusText.textContent = 'Hệ thống: FastAPI + NestJS Online';
            } else if (fastApiOk) {
                systemStatusBadge.className = 'status-badge online';
                statusText.textContent = 'FastAPI: Online (NestJS: Chờ khởi động)';
            } else {
                systemStatusBadge.className = 'status-badge offline';
                statusText.textContent = 'Hệ thống ngoại tuyến / Lỗi DB';
            }
        } else {
            // Khi chạy trên Render hoặc Cloud
            if (fastApiOk) {
                systemStatusBadge.className = 'status-badge online';
                statusText.textContent = 'Hệ thống & DB: Hoạt động';
            } else {
                systemStatusBadge.className = 'status-badge offline';
                statusText.textContent = 'Lỗi kết nối MongoDB';
            }
        }
    }

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
