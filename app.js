// app.js
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            console.log("Логин деректері:", { email, password });

            try {
                const response = await fetch('https://online-academy-zw35.onrender.com/api/login', {
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
                console.error("Қате:", err);
                alert("Серверге қосылу мүмкін болмады!");
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
                const response = await fetch('https://online-academy-zw35.onrender.com/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                if (response.ok) {
                    alert("Тіркелу с��тті өтті!");
                    window.location.href = 'login.html';
                } else {
                    const data = await response.json();
                    alert(data.error || "Қате орын алды");
                }
            } catch (err) {
                console.error("Қате:", err);
                alert("Серверге қосылу мүмкін болмады!");
            }
        });
    }

    if (window.location.pathname.includes('dashboard.html')) {
        checkAuth();
        initDashboard();
    }
});

function selectCourse(courseName, courseImg, price = 0) {
    console.log("Курс таңдалды:", { courseName, courseImg, price });
    
    localStorage.setItem('selectedCourseName', courseName);
    localStorage.setItem('selectedCourseImg', courseImg);
    localStorage.setItem('selectedPrice', price || 0);
    
    window.location.href = 'pricing.html';
}

function selectPlan(planName, planPrice) {
    console.log("Тариф таңдалды:", { planName, planPrice });
    
    localStorage.setItem('selectedPlanName', planName);
    localStorage.setItem('selectedPrice', planPrice);
    
    window.location.href = 'checkout.html';
}

function redirectByRole(role) {
    switch(role) {
        case 'admin':
            window.location.href = 'dashboard.html?role=admin';
            break;
        case 'teacher':
            window.location.href = 'dashboard.html?role=teacher';
            break;
        case 'student':
        default:
            window.location.href = 'dashboard.html?role=student';
    }
}

function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
    }
}

function logout() {
    localStorage.clear();
    window.location.href = 'index.html';
}

function getRoleLabel(role) {
    switch(role) {
        case 'admin': return '🔐 Администратор';
        case 'teacher': return '👨‍🏫 Мұғалім';
        case 'student': return '👨‍🎓 Студент';
        default: return role;
    }
}

function initDashboard() {
    const role = localStorage.getItem('role') || 'student';
    
    document.querySelectorAll('.role-panel').forEach(p => p.style.display = 'none');

    const panel = document.getElementById(`${role}-panel`);
    if (panel) {
        panel.style.display = 'block';
    }

    const nameDisplay = document.getElementById('userNameDisplay');
    const badge = document.getElementById('userRoleBadge');
    const studentName = localStorage.getItem('studentName') || 'Студент';
    
    if (nameDisplay) nameDisplay.innerText = studentName;
    if (badge) {
        badge.innerText = getRoleLabel(role);
        badge.className = `role-badge role-${role}`;
    }

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

async function displayEnrolledCourses() {
    const token = localStorage.getItem('token');
    const coursesGrid = document.getElementById('my-courses-grid');
    
    if (!coursesGrid) return;

    if (!token) {
        coursesGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; background: #1a1a1a; border-radius: 12px;">
                <p style="color: #999;">Логинге кіріңіз</p>
            </div>
        `;
        return;
    }

    try {
        const response = await fetch('https://online-academy-zw35.onrender.com/api/my-courses', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Қате');

        const courses = await response.json();

        if (!courses || courses.length === 0) {
            coursesGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px; background: #1a1a1a; border-radius: 12px;">
                    <i class="fas fa-book-open" style="font-size: 3rem; color: #888; margin-bottom: 15px;"></i>
                    <p style="color: #999;">Курс таңдалмады</p>
                    <a href="courses.html" style="margin-top: 15px; display: inline-block; padding: 12px 24px; background: #e2f113; color: black; text-decoration: none; border-radius: 8px; font-weight: bold;">Курстарды көру</a>
                </div>
            `;
            return;
        }

        coursesGrid.innerHTML = courses.map(course => `
            <div style="background: #1a1a1a; border-radius: 12px; padding: 20px; border: 1px solid #333;">
                <img src="${course.image_url || 'https://via.placeholder.com/350x200'}" alt="${course.name}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 15px;">
                <h3 style="margin: 15px 0; color: #fff;">${course.name}</h3>
                <p style="color: #888; margin: 10px 0;">${course.description || ''}</p>
                <div style="color: #e2f113; font-weight: bold; margin: 10px 0;">${course.price || 0} ₸</div>
                <button onclick="goToCourse('${course.name}')" style="width: 100%; padding: 12px; background: #e2f113; color: black; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">Ашу</button>
            </div>
        `).join('');
    } catch (err) {
        console.error("Қате:", err);
        coursesGrid.innerHTML = `<p style="color: #ff6b6b;">Қате орын алды</p>`;
    }
}

function goToCourse(courseName) {
    if (courseName.includes("Python")) {
        window.location.href = 'course-content.html';
    } else {
        alert(courseName + " курсы жақында қосылады!");
    }
}

function downloadMaterials(courseName) {
    alert(`${courseName} материалдарын жүктеуде...`);
}

async function loadPaymentHistory() {
    const token = localStorage.getItem('token');
    const tableBody = document.getElementById('paymentHistoryTable');
    
    if (!tableBody || !token) return;

    try {
        const response = await fetch('https://online-academy-zw35.onrender.com/api/payments', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Қате');

        const payments = await response.json();

        if (!payments || payments.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: #888;">Төлем тарихы жоқ</td></tr>`;
            return;
        }

        tableBody.innerHTML = payments.map(payment => `
            <tr>
                <td>${payment.month_name || 'Белгісіз'}</td>
                <td>${new Date(payment.payment_date).toLocaleDateString('kk-KZ')}</td>
                <td class="paid-status">✓ Төленген</td>
            </tr>
        `).join('');

        document.getElementById('paidMonthsCount').innerText = payments.length;
        const total = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
        document.getElementById('totalPaidDisplay').innerText = total.toLocaleString() + ' ₸';
    } catch (err) {
        console.error("Қате:", err);
    }
}

async function loadFreezeInfo() {
    const token = localStorage.getItem('token');
    
    if (!token) return;

    try {
        const response = await fetch('https://online-academy-zw35.onrender.com/api/freeze-info', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Қате');

        const freezeData = await response.json();
        document.getElementById('freezeDaysDisplay').innerText = freezeData.freeze_days || 30;
    } catch (err) {
        console.error("Қате:", err);
    }
}

async function useFreeze() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        alert("Логинге кіріңіз!");
        return;
    }

    try {
        const response = await fetch('https://online-academy-zw35.onrender.com/api/use-freeze', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });

        if (response.ok) {
            alert("Заморозка қолданылды!");
            loadFreezeInfo();
        } else {
            const data = await response.json();
            alert(data.error || "Қате орын алды");
        }
    } catch (err) {
        console.error("Қате:", err);
        alert("Сервер қатесі");
    }
}

async function processMonthlyPayment() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        alert("Логинге кіріңіз!");
        return;
    }

    const monthName = new Date().toLocaleString('kk-KZ', { month: 'long', year: 'numeric' });
    const amount = 42990; // Әдепкі сома

    try {
        const response = await fetch('https://online-academy-zw35.onrender.com/api/payment', {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ amount, month_name: monthName })
        });

        if (response.ok) {
            alert("✅ Төлем қабылданды!");
            loadPaymentHistory();
        } else {
            const data = await response.json();
            alert(data.error || "Төлем сәтсіз болды");
        }
    } catch (err) {
        console.error("Қате:", err);
        alert("Сервер қатесі");
    }
}

async function loadTeacherDashboard() {
    const token = localStorage.getItem('token');
    
    if (!token) return;

    try {
        const response = await fetch('https://online-academy-zw35.onrender.com/api/teacher/homework', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Қате');

        const homeworks = await response.json();
        const listContainer = document.getElementById('teacher-student-list');
        
        if (!listContainer) return;

        if (!homeworks || homeworks.length === 0) {
            listContainer.innerHTML = '<p style="color: #888;">Тапсырма жоқ</p>';
            return;
        }

        listContainer.innerHTML = `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Студент</th>
                        <th>Тапсырма</th>
                        <th>Статусы</th>
                        <th>Әрекет</th>
                    </tr>
                </thead>
                <tbody>
                    ${homeworks.map(hw => `
                        <tr>
                            <td>${hw.student_email}</td>
                            <td><a href="${hw.homework_url}" target="_blank" style="color: #e2f113;">Ашу</a></td>
                            <td><span style="color: ${hw.status === 'approved' ? '#2ecc71' : hw.status === 'rejected' ? '#ff6b6b' : '#888'};">${hw.status}</span></td>
                            <td>
                                <button onclick="reviewHomework(${hw.id}, '${hw.student_email}', '${hw.homework_url}')" style="background: #e2f113; color: black; padding: 6px 12px; border: none; border-radius: 5px; cursor: pointer;">Тексеру</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (err) {
        console.error("Қа��е:", err);
    }
}

function reviewHomework(hwId, email, url) {
    document.getElementById('studentEmailDisplay').innerText = email;
    document.getElementById('taskUrlDisplay').href = url;
    document.getElementById('taskUrlDisplay').innerText = '📋 Студенттің жұмысын ашу →';
    document.getElementById('reviewModal').style.display = 'flex';
    
    window.currentHomeworkId = hwId;
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

async function approveTask() {
    const token = localStorage.getItem('token');
    const hwId = window.currentHomeworkId;
    
    if (!token || !hwId) return;

    try {
        const response = await fetch('https://online-academy-zw35.onrender.com/api/teacher/approve-homework', {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ homework_id: hwId, status: 'approved' })
        });

        if (response.ok) {
            alert("✅ Тапсырма қабылданды!");
            closeModal('reviewModal');
            loadTeacherDashboard();
        } else {
            alert("Қате орын алды");
        }
    } catch (err) {
        console.error("Қате:", err);
    }
}

async function loadAdminStats() {
    const token = localStorage.getItem('token');
    
    if (!token) return;

    try {
        const response = await fetch('https://online-academy-zw35.onrender.com/api/admin/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Қате');

        const stats = await response.json();
        document.getElementById('admin-user-count').innerText = stats.users || 0;
        document.getElementById('admin-total-money').innerText = (stats.revenue || 0).toLocaleString() + ' ₸';

        loadAdminUsers();
        loadAdminPayments();
    } catch (err) {
        console.error("Қате:", err);
    }
}

async function loadAdminUsers() {
    const token = localStorage.getItem('token');
    
    if (!token) return;

    try {
        const response = await fetch('https://online-academy-zw35.onrender.com/api/students', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Қате');

        const users = await response.json();
        const tableBody = document.getElementById('admin-users-table');
        
        if (!tableBody) return;

        tableBody.innerHTML = users.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>${user.email}</td>
                <td>${user.role}</td>
                <td>
                    <button onclick="changeUserRole(${user.id}, 'admin')" style="background: #e2f113; color: black; padding: 4px 8px; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">Өзгерту</button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error("Қате:", err);
    }
}

async function loadAdminPayments() {
    const token = localStorage.getItem('token');
    
    if (!token) return;

    try {
        const response = await fetch('https://online-academy-zw35.onrender.com/api/admin/payments', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Қате');

        const payments = await response.json();
        const tableBody = document.getElementById('admin-payments-table');
        
        if (!tableBody) return;

        tableBody.innerHTML = payments.map(p => `
            <tr>
                <td>${p.email}</td>
                <td>${p.amount.toLocaleString()} ₸</td>
                <td>${p.month_name}</td>
                <td>${new Date(p.payment_date).toLocaleDateString('kk-KZ')}</td>
            </tr>
        `).join('');
    } catch (err) {
        console.error("Қате:", err);
    }
}

function showAddCourseForm() {
    document.getElementById('addCourseModal').style.display = 'block';
}

async function addNewCourse() {
    const token = localStorage.getItem('token');
    const name = document.getElementById('courseName').value;
    const price = document.getElementById('coursePrice').value;
    const image_url = document.getElementById('courseImage').value;
    const description = document.getElementById('courseDesc').value;

    if (!name || !price) {
        alert("Барлық өрісті толтырыңыз!");
        return;
    }

    try {
        const response = await fetch('https://online-academy-zw35.onrender.com/api/courses', {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, price: parseInt(price), image_url, description })
        });

        if (response.ok) {
            alert("✅ Курс қосылды!");
            document.getElementById('courseName').value = '';
            document.getElementById('coursePrice').value = '';
            document.getElementById('courseImage').value = '';
            document.getElementById('courseDesc').value = '';
            closeModal('addCourseModal');
            loadAdminStats();
        } else {
            alert("Қате орын алды");
        }
    } catch (err) {
        console.error("Қате:", err);
    }
}

async function changeUserRole(userId, newRole) {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`https://online-academy-zw35.onrender.com/api/users/${userId}/role`, {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ role: newRole })
        });

        if (response.ok) {
            alert("✅ Рөлі өзгертілді!");
            loadAdminUsers();
        }
    } catch (err) {
        console.error("Қате:", err);
    }
}

function submitTask() {
    const taskLink = document.getElementById('taskLink').value;
    
    if (!taskLink) {
        alert("Сілтемені енгізіңіз!");
        return;
    }

    const token = localStorage.getItem('token');
    
    if (!token) {
        alert("Логинге кіріңіз!");
        return;
    }

    fetch('https://online-academy-zw35.onrender.com/api/submit-task', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ homework_url: taskLink })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            document.querySelector('.submission-form').style.display = 'none';
            document.getElementById('successMessage').style.display = 'flex';
            alert("✅ Тапсырма жіберілді!");
        } else {
            alert("❌ " + (data.error || "Қате"));
        }
    })
    .catch(err => {
        console.error("Қате:", err);
        alert("Сервер қатесі");
    });
}