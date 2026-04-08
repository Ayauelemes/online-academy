document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('http://localhost:5001/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();
                if (response.ok) {
                    alert("Қош келдіңіз!");

                    const user = data.user || { id: '', email: '', role: 'student' };
                    const token = data.token || '';

                    localStorage.setItem('currentUser', JSON.stringify({
                        id: user.id,
                        email: user.email,
                        role: user.role,
                        token
                    }));
                    localStorage.setItem('token', token);
                    localStorage.setItem('role', user.role);
                    localStorage.setItem('studentName', user.email.split('@')[0]);

                    redirectByRole(user.role);
                } else {
                    alert(data.error || "Логин немесе пароль қате!");
                }
            } catch (err) {
                console.error("Fetch қатесі:", err);
                alert("Сервермен байланыс жоқ!");
            }
        });
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (password !== confirmPassword) {
                alert("Құпия сөздер сәйкес келмейді!");
                return;
            }

            try {
                const response = await fetch('http://localhost:5001/api/register', {
                    method: 'POST',
                    mode: 'cors',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                if (response.ok) {
                    alert("Тіркелу сәтті өтті!");
                    window.location.href = 'login.html';
                } else {
                    const data = await response.json();
                    alert(data.error || "Қате орын алды");
                }
            } catch (err) {
                console.error("Register қатесі:", err);
                alert("Серверге қосылу мүмкін болмады!");
            }
        });
    }

    if (window.location.pathname.includes('dashboard.html')) {
        checkAuth();
        initDashboard();
    }
});

// ─────────────────────────────────────────────────────────────
//  AUTH & ROUTING
// ─────────────────────────────────────────────────────────────
function checkAuth() {
    const user = localStorage.getItem('currentUser');
    if (!user) {
        window.location.href = 'login.html';
    }
}

function redirectByRole(role) {
    switch (role) {
        case 'admin':   window.location.href = 'dashboard.html?role=admin';   break;
        case 'teacher': window.location.href = 'dashboard.html?role=teacher'; break;
        default:        window.location.href = 'dashboard.html?role=student'; break;
    }
}

function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}

function getRoleLabel(role) {
    const labels = {
        admin:   '👨‍💼 АДМИН',
        teacher: '👨‍🏫 МҰҒАЛІМ',
        student: '👨‍🎓 СТУДЕНТ'
    };
    return labels[role] || 'ӘРЕКЕТШІ';
}

// ─────────────────────────────────────────────────────────────
//  DASHBOARD INIT
// ─────────────────────────────────────────────────────────────
function initDashboard() {
    const role = localStorage.getItem('role') || 'student';
    console.log("Dashboard инициализ., роль:", role);

    // Hide all panels first
    document.querySelectorAll('.role-panel').forEach(p => p.style.display = 'none');

    // Show the correct panel
    const panel = document.getElementById(`${role}-panel`);
    if (panel) {
        panel.style.display = 'block';
    } else {
        console.error(`❌ Панель #${role}-panel табылмады!`);
    }

    // Update header
    const nameDisplay = document.getElementById('userNameDisplay');
    const badge = document.getElementById('userRoleBadge');
    const studentName = localStorage.getItem('studentName') || 'Студент';

    if (nameDisplay) nameDisplay.innerText = studentName;
    if (badge) {
        badge.innerText = getRoleLabel(role);
        badge.className = `role-badge role-${role}`;
    }

    // Load role-specific data
    if (role === 'student') {
        displayEnrolledCourses();
        loadPaymentHistory();
        loadFreezeInfo();
    } else if (role === 'teacher') {
        loadTeacherDashboard();
    } else if (role === 'admin') {
        loadAdminStats();
    }
}

function showSection(sectionName) {
    document.querySelectorAll('.role-panel').forEach(p => p.style.display = 'none');
    const calendarSection = document.getElementById('calendar-section');
    if (calendarSection) calendarSection.style.display = 'none';

    if (sectionName === 'dashboard') {
        const role = localStorage.getItem('role') || 'student';
        const panel = document.getElementById(`${role}-panel`);
        if (panel) panel.style.display = 'block';
    } else if (sectionName === 'calendar') {
        if (calendarSection) calendarSection.style.display = 'block';
        renderCalendar();
    }
}

// ─────────────────────────────────────────────────────────────
//  STUDENT: COURSES
// ─────────────────────────────────────────────────────────────
async function displayEnrolledCourses() {
    const token = localStorage.getItem('token');
    const coursesGrid = document.getElementById('my-courses-grid');
    if (!coursesGrid) return;

    if (!token) {
        coursesGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; background: #1a1a1a; border-radius: 12px;">
                <p style="color: #999; font-size: 1.1rem;">Логинге кіріңіз</p>
            </div>`;
        return;
    }

    try {
        const response = await fetch('http://localhost:5001/api/my-courses', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        const courses = await response.json();

        if (!courses || courses.length === 0) {
            coursesGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px; background: #1a1a1a; border-radius: 12px;">
                    <i class="fas fa-book-open" style="font-size: 3rem; color: #888; margin-bottom: 15px;"></i>
                    <p style="color: #999; font-size: 1.1rem;">Әлі курс таңдалмады</p>
                    <a href="courses.html" style="margin-top: 15px; display: inline-block; padding: 12px 24px; background: #e2f113; color: black; text-decoration: none; border-radius: 8px; font-weight: bold;">Курстарды көру</a>
                </div>`;
            return;
        }

        coursesGrid.innerHTML = courses.map(course => `
            <div style="background: #1a1a1a; border-radius: 12px; padding: 20px; border: 1px solid #333;">
                <img src="${course.image_url || 'https://via.placeholder.com/350x200?text=' + encodeURIComponent(course.name)}"
                     alt="${course.name}"
                     style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 15px;"
                     onerror="this.src='https://via.placeholder.com/350x200?text=${encodeURIComponent(course.name)}'">
                <h3 style="margin: 15px 0; font-size: 1.2rem; color: #fff;">${course.name}</h3>
                <div style="background: #0a0a0a; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
                        <div>
                            <p style="color: #888; font-size: 0.85rem; margin: 0;">Баға</p>
                            <p style="color: #e2f113; font-weight: bold; margin: 5px 0 0 0;">${course.price || 0} ₸/ай</p>
                        </div>
                        <div>
                            <p style="color: #888; font-size: 0.85rem; margin: 0;">Статусы</p>
                            <p style="color: #2ecc71; font-weight: bold; margin: 5px 0 0 0;">✓ ${course.status || 'active'}</p>
                        </div>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <button onclick="goToCourse('${course.name}')" style="width: 100%; padding: 12px; background: #e2f113; color: black; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">Ашу</button>
                    <button onclick="downloadMaterials('${course.name}')" style="width: 100%; padding: 12px; background: #333; color: #e2f113; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">Материалдар</button>
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error("Курстарды жүктеу қатесі:", err);
        coursesGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; background: #1a1a1a; border-radius: 12px;">
                <p style="color: #ff6b6b;">Қате: ${err.message}</p>
            </div>`;
    }
}

function goToCourse(courseName) {
    window.location.href = 'course-content.html?course=' + encodeURIComponent(courseName);
}

function downloadMaterials(courseName) {
    alert(`${courseName} материалдарын жүктеуде...`);
}

/**
 * БАГ ТҮЗЕТУ: selectCourse енді course_id-ты да сақтайды.
 * Бұрын тек атауы (name) сақталатын, ал /api/enroll course_id қажет.
 */
function selectCourse(courseId, courseName, courseImg, price) {
    localStorage.setItem('selectedCourseId', courseId);       // ← ЖАҢА: ID сақталады
    localStorage.setItem('selectedCourseName', courseName);
    localStorage.setItem('selectedCourseImg', courseImg);
    localStorage.setItem('selectedPrice', price);
    window.location.href = 'pricing.html';
}

// ─────────────────────────────────────────────────────────────
//  STUDENT: ENROLLMENT  ← БАГ ТҮЗЕТУ
//  enrollToCourse() — тіркелу функциясы. Checkout/payment
//  аяқталғаннан кейін міндетті түрде шақырылуы тиіс.
// ─────────────────────────────────────────────────────────────
async function enrollToCourse(courseId) {
    const token = localStorage.getItem('token');
    if (!token) { alert('Логинге кіріңіз'); return false; }
    if (!courseId) { console.error('enrollToCourse: courseId жоқ!'); return false; }

    try {
        const response = await fetch('http://localhost:5001/api/enroll', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ course_id: parseInt(courseId) })
        });

        if (response.ok) {
            console.log('✅ Курсқа жазылу сәтті болды, course_id:', courseId);
            return true;
        } else {
            const err = await response.json();
            // "Already enrolled" — бұл қате емес, студент бұрын жазылған
            if (err.error === 'Already enrolled') {
                console.log('ℹ️ Студент бұл курсқа бұрын жазылған');
                return true;
            }
            console.error('❌ Жазылу қатесі:', err.error);
            return false;
        }
    } catch (err) {
        console.error('❌ enrollToCourse fetch қатесі:', err);
        return false;
    }
}

// ─────────────────────────────────────────────────────────────
//  STUDENT: PAYMENTS
// ─────────────────────────────────────────────────────────────
async function loadPaymentHistory() {
    const token = localStorage.getItem('token');
    const tableBody = document.getElementById('paymentHistoryTable');
    if (!tableBody || !token) return;

    try {
        const response = await fetch('http://localhost:5001/api/payments', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('API Error');
        const payments = await response.json();

        if (!payments || payments.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: #888;">Төлем тарихы жоқ</td></tr>`;
            return;
        }

        tableBody.innerHTML = payments.map(p => `
            <tr>
                <td>${p.month_name || 'Белгісіз'}</td>
                <td>${new Date(p.payment_date).toLocaleDateString('kk-KZ')}</td>
                <td>${p.amount} ₸</td>
            </tr>
        `).join('');

        const paidEl = document.getElementById('paidMonthsCount');
        const totalEl = document.getElementById('totalPaidDisplay');
        if (paidEl) paidEl.innerText = payments.length;
        if (totalEl) {
            const total = payments.reduce((s, p) => s + (p.amount || 0), 0);
            totalEl.innerText = total.toLocaleString() + " ₸";
        }
    } catch (err) {
        console.error("Төлем тарихы қатесі:", err);
        if (tableBody) tableBody.innerHTML = `<tr><td colspan="3" style="color: #ff6b6b;">Қате</td></tr>`;
    }
}

/**
 * БАГ ТҮЗЕТУ: processMonthlyPayment енді төлемнен кейін
 * enrollToCourse() да шақырады → enrollments кестесіне жазба қосылады →
 * /api/my-courses курсты қайтарады → кабинетте курс көрінеді.
 */


// Refresh payment summary totals in the UI
function updatePaymentUI() {
    loadPaymentHistory();
}

function getNextMonth() {
    const months = ["Қаңтар","Ақпан","Наурыз","Сәуір","Мамыр","Маусым",
                    "Шілде","Тамыз","Қыркүйек","Қазан","Қараша","Желтоқсан"];
    return months[(new Date().getMonth() + 1) % 12];
}

// ─────────────────────────────────────────────────────────────
//  STUDENT: FREEZE
// ─────────────────────────────────────────────────────────────
async function loadFreezeInfo() {
    const token = localStorage.getItem('token');
    const el = document.getElementById('freezeDaysDisplay');
    if (!el || !token) return;

    try {
        const response = await fetch('http://localhost:5001/api/freeze-info', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('API Error');
        const freeze = await response.json();
        el.innerText = freeze.freeze_days ?? 30;
    } catch (err) {
        console.error("Freeze ақпараты қатесі:", err);
        el.innerText = '30';
    }
}

async function useFreeze() {
    const token = localStorage.getItem('token');
    if (!token) { alert('Логинге кіріңіз'); return; }

    try {
        const response = await fetch('http://localhost:5001/api/use-freeze', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (response.ok) {
            alert(`✅ Заморозка қолданылды!\nҚалған күндер: ${data.remaining}`);
            loadFreezeInfo();
            renderCalendar();
        } else {
            alert(data.error || 'Қате орын алды');
        }
    } catch (err) {
        console.error("Заморозка қатесі:", err);
        alert('Сервер қатесі');
    }
}

// ─────────────────────────────────────────────────────────────
//  STUDENT: PLAN SELECTION
// ─────────────────────────────────────────────────────────────
function selectPlan(planName, price) {
    const token = localStorage.getItem('token');
    if (!token) { alert("Әуелі логинге кіріңіз!"); window.location.href = 'login.html'; return; }

    const courseId   = localStorage.getItem('selectedCourseId');
    const courseName = localStorage.getItem('selectedCourseName');

    if (!courseId && !courseName) {
        alert("Курсты алдымен таңдаңыз!");
        window.location.href = 'courses.html';
        return;
    }

    localStorage.setItem('selectedPlan', planName);
    localStorage.setItem('planPrice', price);
    window.location.href = 'checkout.html';
}

// ─────────────────────────────────────────────────────────────
//  STUDENT: HOMEWORK SUBMIT
// ─────────────────────────────────────────────────────────────
// async function submitHomework() {
//     const urlInput = document.getElementById('homeworkUrl');
//     const homeworkUrl = urlInput ? urlInput.value.trim() : '';
//     const token = localStorage.getItem('token');

//     if (!homeworkUrl) { alert("Сілтемені енгізіңіз!"); return; }

//     try {
//         const response = await fetch('http://localhost:5001/api/submit-task', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Authorization': `Bearer ${token}`
//             },
//             body: JSON.stringify({ homework_url: homeworkUrl })
//         });
//         const data = await response.json();
//         if (response.ok) {
//             alert('✅ Тапсырма сәтті жіберілді!');
//             if (urlInput) urlInput.value = '';
//         } else {
//             alert('Қате: ' + (data.error || 'Белгісіз қате'));
//         }
//     } catch (err) {
//         console.error('Жіберу қатесі:', err);
//         alert('Сервермен байланыс жоқ!');
//     }
// }

// ─────────────────────────────────────────────────────────────
//  TEACHER PANEL
// ─────────────────────────────────────────────────────────────
async function loadTeacherDashboard() {
    const token = localStorage.getItem('token');
    const teacherStudentList = document.getElementById('teacher-student-list');
    if (!teacherStudentList || !token) return;

    try {
        const response = await fetch('http://localhost:5001/api/teacher/homework', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('API Error');
        const homeworks = await response.json();

        if (!homeworks || homeworks.length === 0) {
            teacherStudentList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #888;">
                    <p>📭 Әлі тапсырма жіберілмеген</p>
                </div>`;
            return;
        }

        let html = `
            <table style="width: 100%; color: white; border-collapse: collapse;">
                <thead>
                    <tr style="background: #222; border-bottom: 2px solid #e2f113;">
                        <th style="padding: 12px; text-align: left;">Студент Email</th>
                        <th style="padding: 12px; text-align: left;">Статусы</th>
                        <th style="padding: 12px; text-align: left;">Жіберілген уақыты</th>
                        <th style="padding: 12px; text-align: left;">Әрекет</th>
                    </tr>
                </thead>
                <tbody>`;

        homeworks.forEach((hw, index) => {
            const email = hw.student_email || hw.email;
            const submittedDate = new Date(hw.submitted_at).toLocaleDateString('kk-KZ');
            let statusText = '⏳ Тексеру ішінде', statusColor = '#ffa500';
            if (hw.status === 'approved') { statusText = '✅ Қабылданды'; statusColor = '#2ecc71'; }
            else if (hw.status === 'rejected') { statusText = '❌ Қабылданбады'; statusColor = '#e74c3c'; }

            html += `
                <tr style="border-bottom: 1px solid #333;">
                    <td style="padding: 12px;">${email}</td>
                    <td style="padding: 12px;"><span style="color: ${statusColor}; font-weight: bold;">${statusText}</span></td>
                    <td style="padding: 12px;">${submittedDate}</td>
                    <td style="padding: 12px;">
                        <button class="review-btn" data-index="${index}"
                            style="background: #e2f113; color: black; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold;">
                            📋 Тексеру
                        </button>
                    </td>
                </tr>`;
        });

        html += `</tbody></table>`;
        teacherStudentList.innerHTML = html;

        teacherStudentList.querySelectorAll('.review-btn').forEach((btn, idx) => {
            btn.addEventListener('click', () => {
                const hw = homeworks[idx];
                openReviewModal(hw.student_email || hw.email, hw.homework_url || '', hw.id);
            });
        });
    } catch (err) {
        console.error("Қате:", err);
        teacherStudentList.innerHTML = `<p style="color: #ff6b6b; text-align: center;">❌ Қате болды: ${err.message}</p>`;
    }
}

function openReviewModal(email, homeworkUrl, homeworkId) {
    const modal = document.getElementById('reviewModal');
    if (!modal) return;

    const emailEl = document.getElementById('studentEmailDisplay');
    if (emailEl) emailEl.textContent = email || 'Белгісіз';

    const linkEl = document.getElementById('taskUrlDisplay');
    if (linkEl) {
        if (homeworkUrl && homeworkUrl.trim() !== '' && homeworkUrl !== 'undefined') {
            linkEl.href = homeworkUrl;
            linkEl.textContent = '📋 Студенттің жұмысын ашу →';
            linkEl.style.pointerEvents = 'auto';
        } else {
            linkEl.href = '#';
            linkEl.textContent = '❌ Сілтеме жоқ';
            linkEl.style.pointerEvents = 'none';
        }
        linkEl.target = "_blank";
    }

    modal.dataset.currentId = homeworkId;
    modal.style.display = 'flex';
}

async function approveTask() {
    const modal = document.getElementById('reviewModal');
    const homeworkId = modal.dataset.currentId;
    const token = localStorage.getItem('token');
    if (!homeworkId) { alert("Тапсырма ID табылмады!"); return; }

    try {
        const response = await fetch('http://localhost:5001/api/teacher/approve-homework', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ homework_id: parseInt(homeworkId), status: 'approved' })
        });
        if (response.ok) {
            alert('✅ Тапсырма қабылданды!');
            closeModal('reviewModal');
            setTimeout(loadTeacherDashboard, 500);
        } else {
            const err = await response.json();
            alert("Қате: " + (err.error || "Белгісіз қате"));
        }
    } catch (err) {
        alert('Сервер қатесі: ' + err.message);
    }
}

async function rejectTask() {
    const modal = document.getElementById('reviewModal');
    const homeworkId = modal.dataset.currentId;
    const token = localStorage.getItem('token');
    if (!homeworkId) { alert("Тапсырма ID табылмады!"); return; }

    try {
        const response = await fetch('http://localhost:5001/api/teacher/approve-homework', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ homework_id: parseInt(homeworkId), status: 'rejected' })
        });
        if (response.ok) {
            alert('❌ Тапсырма қабылданбады!');
            closeModal('reviewModal');
            setTimeout(loadTeacherDashboard, 500);
        } else {
            const err = await response.json();
            alert("Қате: " + (err.error || "Белгісіз қате"));
        }
    } catch (err) {
        alert('Сервер қатесі: ' + err.message);
    }
}

function closeModal(modalId = 'reviewModal') {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}

// ─────────────────────────────────────────────────────────────
//  ADMIN PANEL
// ─────────────────────────────────────────────────────────────
async function loadAdminStats() {
    const token = localStorage.getItem('token');
    if (!token) { console.error('❌ Token жоқ'); return; }

    console.log('📊 Admin stats жүктелуде...');

    try {
        // 1. Stats
        const statsRes = await fetch('http://localhost:5001/api/admin/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!statsRes.ok) throw new Error(`Stats API Error ${statsRes.status}`);
        const stats = await statsRes.json();

        const userCountEl = document.getElementById('admin-user-count');
        const totalMoneyEl = document.getElementById('admin-total-money');
        if (userCountEl) userCountEl.innerText = stats.users || 0;
        if (totalMoneyEl) totalMoneyEl.innerText = (stats.revenue || 0).toLocaleString() + ' ₸';

        // 2. Users list
        const usersRes = await fetch('http://localhost:5001/api/students', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!usersRes.ok) throw new Error(`Students API Error ${usersRes.status}`);
        const users = await usersRes.json();

        const tbody = document.getElementById('admin-users-table');
        if (tbody) {
            if (Array.isArray(users) && users.length > 0) {
                tbody.innerHTML = users.map(u => `
                    <tr>
                        <td>#${u.id}</td>
                        <td>${u.email}</td>
                        <td>${u.role === 'admin' ? '👨‍💼 АДМИН' : u.role === 'teacher' ? '👨‍🏫 МҰҒАЛІМ' : '👨‍🎓 СТУДЕНТ'}</td>
                        <td>
                            <button onclick="changeUserRole(${u.id}, '${u.email}')"
                                    style="background: #e2f113; color: #000; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-weight: bold;">
                                Өзгерт
                            </button>
                        </td>
                    </tr>
                `).join('');
            } else {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#888; padding:16px;">Пайдаланушы жоқ</td></tr>';
            }
        }

        // 3. Payments
        const paymentsRes = await fetch('http://localhost:5001/api/admin/payments', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!paymentsRes.ok) throw new Error(`Payments API Error ${paymentsRes.status}`);
        const payments = await paymentsRes.json();

        const paymentsTbody = document.getElementById('admin-payments-table');
        if (paymentsTbody) {
            if (Array.isArray(payments) && payments.length > 0) {
                paymentsTbody.innerHTML = payments.map(p => `
                    <tr>
                        <td>${p.email}</td>
                        <td>${p.amount} ₸</td>
                        <td>${p.month_name || '—'}</td>
                        <td>${new Date(p.payment_date).toLocaleDateString('kk-KZ')}</td>
                    </tr>
                `).join('');
            } else {
                paymentsTbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#888; padding:16px;">Төлем жоқ</td></tr>';
            }
        }

        // 4. Courses
        await loadCourseManagement();

        console.log('✅ Admin stats дайын!');
    } catch (err) {
        console.error('❌ Admin stats қатесі:', err);
        const tbody = document.getElementById('admin-users-table');
        if (tbody) tbody.innerHTML = `<tr><td colspan="4" style="color:#ff6b6b; padding:16px;">❌ ${err.message}</td></tr>`;
    }
}

// ─────────────────────────────────────────────────────────────
//  ADMIN: COURSE MANAGEMENT
// ─────────────────────────────────────────────────────────────
async function loadCourseManagement() {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch('http://localhost:5001/api/courses', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const courses = await res.json();

        const list = document.getElementById('course-management-list');
        if (list) {
            if (Array.isArray(courses) && courses.length > 0) {
                list.innerHTML = courses.map(c => `
                    <div style="background: #1a1a1a; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 3px solid #e2f113;">
                        <h4 style="margin: 0 0 6px 0;">${c.name}</h4>
                        <p style="color: #888; margin: 0 0 10px 0;">Баға: ${c.price} ₸</p>
                        <div style="display: flex; gap: 10px;">
                            <button onclick="editCourse(${c.id}, '${escapeAttr(c.name)}', ${c.price}, '${escapeAttr(c.image_url || '')}', '${escapeAttr(c.description || '')}')"
                                    style="background: #2196F3; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer;">✏️ Өңдеу</button>
                            <button onclick="deleteCourse(${c.id})"
                                    style="background: #f44336; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer;">🗑️ Өшіру</button>
                        </div>
                    </div>
                `).join('');
            } else {
                list.innerHTML = '<p style="color:#888; text-align:center; padding:20px;">Курс жоқ</p>';
            }
        }

        const countEl = document.getElementById('admin-courses-count');
        if (countEl) countEl.innerText = Array.isArray(courses) ? courses.length : 0;

    } catch (err) {
        console.error('Course management қатесі:', err);
    }
}

function escapeAttr(str) {
    return String(str).replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function showAddCourseForm() {
    closeEditCourseForm();
    document.getElementById('addCourseModal').style.display = 'flex';
}

async function addNewCourse() {
    const token = localStorage.getItem('token');
    const name        = document.getElementById('courseName').value.trim();
    const price       = parseInt(document.getElementById('coursePrice').value);
    const image_url   = document.getElementById('courseImage').value.trim();
    const description = document.getElementById('courseDesc').value.trim();

    if (!name || !price) { alert('Барлық өрістерді толтырыңыз!'); return; }

    try {
        const res = await fetch('http://localhost:5001/api/courses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ name, price, image_url, description })
        });
        if (res.ok) {
            alert('✅ Курс қосылды!');
            closeModal('addCourseModal');
            ['courseName','coursePrice','courseImage','courseDesc'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });
            loadCourseManagement();
        } else {
            const err = await res.json();
            alert('Қате: ' + (err.error || 'Белгісіз'));
        }
    } catch (err) {
        console.error('Error adding course:', err);
    }
}
/**
 * 1. КУРСТЫ ТАҢДАУ (Баг түзетілді: енді courseId сақталады)
 */
// function selectCourse(courseId, courseName, courseImg, price) {
//     localStorage.setItem('selectedCourseId', courseId);       // Енді ID сақталады
//     localStorage.setItem('selectedCourseName', courseName);
//     localStorage.setItem('selectedCourseImg', courseImg);
//     localStorage.setItem('selectedPrice', price);
//     window.location.href = 'pricing.html';
// }

/**
 * 2. ТӨЛЕМ ЖӘНЕ КУРСҚА ТІРКЕУ (Баг түзетілді: төлемнен кейін автоматты түрде жазылу жүреді)
 */
async function processMonthlyPayment() {
    const token = localStorage.getItem('token');
    if (!token) { alert("Логинге кіріңіз!"); return; }

    const amount   = parseInt(localStorage.getItem('planPrice') || localStorage.getItem('selectedPrice') || '15000');
    const courseId = localStorage.getItem('selectedCourseId');

    if (!courseId) {
        alert("❌ Курс таңдалмаған! Қайтып курсты таңдаңыз.");
        window.location.href = 'courses.html';
        return;
    }

    try {
        // 1. Сначала оплата
        const payRes = await fetch('http://localhost:5001/api/payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ amount, month_name: getNextMonth() })
        });
        if (!payRes.ok) { alert("❌ Төлем сәтсіз болды"); return; }

        // 2. Потом enroll — и ЖДЁМ результат
        const enrollRes = await fetch('http://localhost:5001/api/enroll', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ course_id: parseInt(courseId) })
        });

        if (!enrollRes.ok) {
            const err = await enrollRes.json();
            // Если уже записан — это не ошибка
            if (!err.error?.includes('Already enrolled')) {
                console.warn("Enroll қатесі:", err);
            }
        }

        alert(`✅ ${amount} ₸ төлем қабылданды!`);
        localStorage.removeItem('selectedCourseId'); // очищаем
        window.location.href = 'dashboard.html';

    } catch (err) {
        console.error("Қате:", err);
        alert("Серверге қосыла алмады!");
    }
}

async function deleteCourse(courseId) {
    if (!confirm('Курсты өшіру сенімдісіз бе?')) return;
    const token = localStorage.getItem('token');

    try {
        const res = await fetch(`http://localhost:5001/api/courses/${courseId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            alert('✅ Курс өшірілді!');
            loadCourseManagement();
        }
    } catch (err) {
        console.error('Error deleting course:', err);
    }
}

function editCourse(id, name, price, imageUrl, description) {
    const form = document.getElementById('editCourseForm');
    if (!form) return;

    document.getElementById('editCourseId').value    = id;
    document.getElementById('editCourseName').value  = name;
    document.getElementById('editCoursePrice').value = price;
    document.getElementById('editCourseImage').value = imageUrl;
    document.getElementById('editCourseDesc').value  = description;

    form.style.display = 'block';
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeEditCourseForm() {
    const form = document.getElementById('editCourseForm');
    if (form) form.style.display = 'none';
}

async function saveEditedCourse() {
    const token = localStorage.getItem('token');
    const id          = document.getElementById('editCourseId').value;
    const name        = document.getElementById('editCourseName').value.trim();
    const price       = parseInt(document.getElementById('editCoursePrice').value);
    const image_url   = document.getElementById('editCourseImage').value.trim();
    const description = document.getElementById('editCourseDesc').value.trim();

    if (!name || !price) { alert('Барлық өрістерді толтырыңыз!'); return; }

    try {
        const res = await fetch(`http://localhost:5001/api/courses/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ name, price, image_url, description })
        });
        if (res.ok) {
            alert('✅ Курс жаңартылды!');
            closeEditCourseForm();
            loadCourseManagement();
        } else {
            const err = await res.json();
            alert('Қате: ' + (err.error || 'Белгісіз'));
        }
    } catch (err) {
        console.error('Error updating course:', err);
        alert('Серверге қосылу мүмкін болмады!');
    }
}

// ─────────────────────────────────────────────────────────────
//  ADMIN: USER ROLE CHANGE
// ─────────────────────────────────────────────────────────────
async function changeUserRole(userId, email) {
    const newRole = prompt(`${email} — жаңа рөлі (admin / teacher / student):`, 'student');
    if (!newRole) return;

    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`http://localhost:5001/api/users/${userId}/role`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ role: newRole })
        });
        if (res.ok) {
            alert('✅ Рөлі өзгертілді!');
            loadAdminStats();
        }
    } catch (err) {
        console.error('Error changing role:', err);
    }
}

// ─────────────────────────────────────────────────────────────
//  CALENDAR
// ─────────────────────────────────────────────────────────────
let currentMonth = new Date().getMonth();
let currentYear  = new Date().getFullYear();

function renderCalendar() {
    const monthDisplay = document.getElementById('monthDisplay');
    const daysGrid     = document.getElementById('calendarDays');
    if (!daysGrid || !monthDisplay) return;

    daysGrid.innerHTML = '';

    const months = ["Қаңтар","Ақпан","Наурыз","Сәуір","Мамыр","Маусым",
                    "Шілде","Тамыз","Қыркүйек","Қазан","Қараша","Желтоқсан"];
    monthDisplay.innerText = `${months[currentMonth]} ${currentYear}`;

    const firstDay    = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const startingDay = firstDay === 0 ? 6 : firstDay - 1;

    for (let i = 0; i < startingDay; i++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.classList.add('day', 'empty');
        daysGrid.appendChild(emptyDiv);
    }

    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = document.createElement('div');
        dayDiv.classList.add('day');
        dayDiv.innerText = day;
        if (day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()) {
            dayDiv.classList.add('today');
        }
        daysGrid.appendChild(dayDiv);
    }
}

function prevMonth() {
    currentMonth--;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    renderCalendar();
}

function nextMonth() {
    currentMonth++;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    renderCalendar();
}

function changeLesson(title) {
    const el = document.getElementById('lesson-name');
    if (el) el.innerText = title;
}