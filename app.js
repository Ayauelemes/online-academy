document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            console.log("Логин берілетін деректер:", { email, password });

            try {
                // МЫСАЛЫ:
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
                console.error("Fetch қатесі:", err);
                alert("Серв��рмен байланыс жоқ!");
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

function selectCourse(courseName, courseImg, price) {
    console.log("Курс таңдалды:", { courseName, courseImg, price });
    
    localStorage.setItem('selectedCourseName', courseName);
    localStorage.setItem('selectedCourseImg', courseImg);
    localStorage.setItem('selectedPrice', price);
    
    console.log("LocalStorage-та сақталды:", {
        name: localStorage.getItem('selectedCourseName'),
        img: localStorage.getItem('selectedCourseImg'),
        price: localStorage.getItem('selectedPrice')
    });
    
    window.location.href = 'pricing.html';
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

function initDashboard() {
    const role = localStorage.getItem('role') || 'student';
    
    console.log("Dashboard инициализ., роль:", role);
    
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
    
    if (!coursesGrid) {
        console.error("❌ my-courses-grid элементі табылмады!");
        return;
    }

    if (!token) {
        coursesGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; background: #1a1a1a; border-radius: 12px;">
                <p style="color: #999; font-size: 1.1rem;">Логинге кіріңіз</p>
            </div>
        `;
        return;
    }

    try {
        const response = await fetch('https://online-academy-zw35.onrender.com/api/my-courses', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const courses = await response.json();

        if (!courses || courses.length === 0) {
            coursesGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px; background: #1a1a1a; border-radius: 12px;">
                    <i class="fas fa-book-open" style="font-size: 3rem; color: #888; margin-bottom: 15px;"></i>
                    <p style="color: #999; font-size: 1.1rem;">Әлі курс таңдалмады</p>
                    <a href="courses.html" style="margin-top: 15px; display: inline-block; padding: 12px 24px; background: #e2f113; color: black; text-decoration: none; border-radius: 8px; font-weight: bold; cursor: pointer;">Курстарды көру</a>
                </div>
            `;
            return;
        }

        coursesGrid.innerHTML = courses.map(course => `
            <div style="background: #1a1a1a; border-radius: 12px; padding: 20px; border: 1px solid #333; overflow: hidden;">
                <img src="${course.image_url || 'https://via.placeholder.com/350x200?text=' + encodeURIComponent(course.name)}" alt="${course.name}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 15px;" onerror="this.src='https://via.placeholder.com/350x200?text=${encodeURIComponent(course.name)}'">
                
                <h3 style="margin: 15px 0; font-size: 1.2rem; color: #fff;">${course.name}</h3>
                
                <div style="background: #0a0a0a; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
                        <div>
                            <p style="color: #888; font-size: 0.85rem; margin: 0;">Тариф</p>
                            <p style="color: #e2f113; font-weight: bold; margin: 5px 0 0 0;">${course.plan_name || 'Таңдалмады'}</p>
                        </div>
                        <div>
                            <p style="color: #888; font-size: 0.85rem; margin: 0;">Баға</p>
                            <p style="color: #e2f113; font-weight: bold; margin: 5px 0 0 0;">${course.plan_price || course.price || '0'} ₸/ай</p>
                        </div>
                    </div>
                    <div style="border-top: 1px solid #333; padding-top: 12px;">
                        <p style="color: #888; font-size: 0.85rem; margin: 0;">Статусы</p>
                        <p style="color: #2ecc71; font-weight: bold; margin: 5px 0 0 0;">✓ ${course.status || 'Активтік'}</p>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <button onclick="goToCourse('${course.name}')" style="width: 100%; padding: 12px; background: #e2f113; color: black; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.3s;">
                        Ашу
                    </button>
                    <button onclick="downloadMaterials('${course.name}')" style="width: 100%; padding: 12px; background: #333; color: #e2f113; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.3s;">
                        Материалдар
                    </button>
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error("Курстарды жүктеу қатесі:", err);
        coursesGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; background: #1a1a1a; border-radius: 12px;">
                <p style="color: #ff6b6b;">Қате: ${err.message}</p>
            </div>
        `;
    }
}

function goToCourse(courseName) {
    window.location.href = 'course-content.html?course=' + encodeURIComponent(courseName);
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

        if (!response.ok) throw new Error('API Error');

        const payments = await response.json();

        if (!payments || payments.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: #888;">Төлем тарихы жоқ</td></tr>`;
            return;
        }

        tableBody.innerHTML = payments.map(payment => `
            <tr>
                <td>${payment.month_name || 'Белгісіз'}</td>
                <td>${new Date(payment.payment_date).toLocaleDateString('kk-KZ')}</td>
                <td>${payment.amount} ₸</td>
            </tr>
        `).join('');

        const paidMonthsCount = document.getElementById('paidMonthsCount');
        const totalPaidDisplay = document.getElementById('totalPaidDisplay');
        
        if (paidMonthsCount) paidMonthsCount.innerText = payments.length;
        if (totalPaidDisplay) {
            const total = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
            totalPaidDisplay.innerText = total.toLocaleString() + " ₸";
        }
    } catch (err) {
        console.error("Төлем тарихы қатесі:", err);
        if (tableBody) tableBody.innerHTML = `<tr><td colspan="3" style="color: #ff6b6b;">Қате</td></tr>`;
    }
}

async function loadFreezeInfo() {
    const token = localStorage.getItem('token');
    const freezeDisplay = document.getElementById('freezeDaysDisplay');
    
    if (!freezeDisplay || !token) return;

    try {
        const response = await fetch('https://online-academy-zw35.onrender.com/api/freeze-info', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('API Error');

        const freeze = await response.json();
        freezeDisplay.innerText = freeze.freeze_days || 30;
    } catch (err) {
        console.error("Freeze ақпараты қатесі:", err);
        freezeDisplay.innerText = '30';
    }
}

async function loadTeacherDashboard() {
    const token = localStorage.getItem('token');
    const teacherStudentList = document.getElementById('teacher-student-list');
    
    if (!teacherStudentList || !token) return;

    try {
        const response = await fetch('https://online-academy-zw35.onrender.com/api/teacher/students', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('API Error');

        const students = await response.json();

        let html = `
            <table style="width: 100%; color: white; border-collapse: collapse;">
                <thead>
                    <tr style="background: #222; border-bottom: 2px solid #e2f113;">
                        <th style="padding: 12px; text-align: left;">ID</th>
                        <th style="padding: 12px; text-align: left;">Email</th>
                        <th style="padding: 12px; text-align: left;">Әрекет</th>
                    </tr>
                </thead>
                <tbody>
        `;

        students.forEach(student => {
            html += `
                <tr style="border-bottom: 1px solid #333;">
                    <td style="padding: 12px;">#${student.id}</td>
                    <td style="padding: 12px;">${student.email}</td>
                    <td style="padding: 12px;">
                        <button onclick="viewStudentWork(${student.id}, '${student.email}')" 
                                style="background: #e2f113; color: black; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: bold;">
                            Жұмысын көру
                        </button>
                    </td>
                </tr>
            `;
        });

        html += `</tbody></table>`;
        teacherStudentList.innerHTML = html;
    } catch (err) {
        console.error("Мұғалім деректері қатесі:", err);
        teacherStudentList.innerHTML = `<p style="color: #ff6b6b;">Студенттерді жүктеу сәтсіз</p>`;
    }
}

function viewStudentWork(studentId, email) {
    alert(`${email} студентінің жұмысын қарап жатыңыз...`);
}

async function loadAdminStats() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        // 1. Загрузка статистики
        const statsRes = await fetch('https://online-academy-zw35.onrender.com/api/admin/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const stats = await statsRes.json();
        
        document.getElementById('admin-user-count').innerText = stats.users || 0;
        document.getElementById('admin-total-money').innerText = (stats.revenue || 0).toLocaleString() + ' ₸';

        // 2. Загрузка списка студентов (ЗДЕСЬ БЫЛА ОШИБКА)
        const usersRes = await fetch('https://online-academy-zw35.onrender.com/api/students', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const users = await usersRes.json();
        
        const tbody = document.getElementById('admin-users-table');
        
        // Проверка: является ли 'users' массивом перед использованием .map()
        if (Array.isArray(users)) {
            tbody.innerHTML = users.map(u => `
                <tr>
                    <td>#${u.id}</td>
                    <td>${u.email}</td>
                    <td>${u.role === 'admin' ? '👨‍💼 АДМИН' : u.role === 'teacher' ? '👨‍🏫 МҰҒАЛІМ' : '👨‍🎓 СТУДЕНТ'}</td>
                    <td>
                        <button onclick="changeUserRole(${u.id}, '${u.email}')" style="background: #e2f113; color: #000; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">
                            Өзгерт
                        </button>
                    </td>
                </tr>
            `).join('');
        } else {
            console.error('Данные студентов не являются массивом:', users);
            tbody.innerHTML = '<tr><td colspan="4">Қате: деректерді алу мүмкін болмады</td></tr>';
        }

        // 3. Загрузка платежей
        const paymentsRes = await fetch('https://online-academy-zw35.onrender.com/api/admin/payments', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const payments = await paymentsRes.json();
        
        const paymentsTbody = document.getElementById('admin-payments-table');
        if (Array.isArray(payments)) {
            paymentsTbody.innerHTML = payments.map(p => `
                <tr>
                    <td>${p.email}</td>
                    <td>${p.amount} ₸</td>
                    <td>${p.month_name}</td>
                    <td>${new Date(p.payment_date).toLocaleDateString('kk-KZ')}</td>
                </tr>
            `).join('');
        }
        
        loadCourseManagement();
        
    } catch (err) {
        console.error('Admin stats error:', err);
    }
}

function getRoleLabel(role) {
    const labels = {
        'admin': '👨‍💼 АДМИН',
        'teacher': '👨‍🏫 МҰҒАЛІМ',
        'student': '👨‍🎓 СТУДЕНТ'
    };
    return labels[role] || 'ӘРЕКЕТШІ';
}

function checkAuth() {
    const user = localStorage.getItem('currentUser');
    if (!user) {
        window.location.href = 'login.html';
    }
}


function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}

async function selectPlan(planName, price) {
    const user = localStorage.getItem('currentUser');
    const token = localStorage.getItem('token');
    
    if (!user || !token) {
        alert("Әуелі логинге кіріңіз!");
        window.location.href = 'login.html';
        return;
    }
    
    const courseName = localStorage.getItem('selectedCourseName');
    
    if (!courseName) {
        alert("Курсты таңдаңыз!");
        return;
    }

    console.log("Тариф таңдалды:", {
        plan: planName,
        planPrice: price,
        course: courseName
    });
    
    localStorage.setItem('selectedPlan', planName);
    localStorage.setItem('planPrice', price);
    
    try {
        const response = await fetch('https://online-academy-zw35.onrender.com/api/payment', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                amount: price, 
                month_name: planName 
            })
        });

        if (response.ok) {
            alert(`✅ ${courseName}\n📋 Тариф: ${planName}\n💰 Баға: ${price} ₸`);
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } else {
            alert('Төлем сәтсіз');
        }
    } catch (err) {
        console.error("Төлем қатесі:", err);
        alert("Төлемді жіберу сәтсіз болды");
    }
}

async function useFreeze() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        alert('Логинге кіріңіз');
        return;
    }

    try {
        const response = await fetch('https://online-academy-zw35.onrender.com/api/use-freeze', {
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

function changeLesson(title) {
    document.getElementById('lesson-name').innerText = title;
    // Сабақ модульін жүктеу логикасы қосу керек
}

async function submitHomework() {
    const urlInput = document.getElementById('homeworkUrl');
    const homeworkUrl = urlInput ? urlInput.value : '';
    const token = localStorage.getItem('token');

    if (!homeworkUrl) {
        alert("Сілтемені енгізіңіз!");
        return;
    }

    try {
        const response = await fetch('https://online-academy-zw35.onrender.com/api/submit-homework', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ homework_url: homeworkUrl })
        });

        const data = await response.json();

        if (response.ok) {
            alert('✅ Тапсырма сәтті жіберілді!');
            if(urlInput) urlInput.value = ''; // Форманы тазалау
        } else {
            alert('Қате: ' + (data.error || 'Белгісіз қате'));
        }
    } catch (err) {
        console.error('Жіберу қатесі:', err);
        alert('Сервермен байланыс жоқ!');
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
        const calendarSection = document.getElementById('calendar-section');
        if (calendarSection) calendarSection.style.display = 'block';
        renderCalendar();
    }
}

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

function renderCalendar() {
    const monthDisplay = document.getElementById('monthDisplay');
    const daysGrid = document.getElementById('calendarDays');
    
    if (!daysGrid || !monthDisplay) return;

    daysGrid.innerHTML = '';

    const months = ["Қаңтар", "Ақпан", "Наурыз", "Сәуір", "Мамыр", "Маусым", "Шілде", "Тамыз", "Қыркүйек", "Қазан", "Қараша", "Желтоқсан"];
    monthDisplay.innerText = `${months[currentMonth]} ${currentYear}`;

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    let startingDay = firstDay === 0 ? 6 : firstDay - 1;

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
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar();
}

function nextMonth() {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar();
}


document.addEventListener('DOMContentLoaded', () => {
    const role = localStorage.getItem('role');
    
    if (typeof openTab === 'undefined') {
        window.openTab = function(tabName) {
            document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            const tab = document.getElementById(tabName);
            if (tab) {
                tab.classList.add('active');
                event.currentTarget.classList.add('active');
            }
        }
    }
});


async function processMonthlyPayment() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        alert("Логинге кіріңіз!");
        return;
    }

    const selectedPrice = localStorage.getItem('planPrice') || 
                         localStorage.getItem('selectedPrice') || 
                         '15000';
    
    const amount = parseInt(selectedPrice);

    try {
        const response = await fetch('https://online-academy-zw35.onrender.com/api/payment', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                amount: amount, 
                month_name: getNextMonth()
            })
        });

        if (response.ok) {
            alert(`✅ ${amount} ₸ төлем қабылданды!`);
            loadPaymentHistory();
            updatePaymentUI();
        } else {
            alert("❌ Төлем сәтсіз болды");
        }
    } catch (err) {
        console.error("Төлем қатесі:", err);
        alert("Серверге қосыла алмады!");
    }
}

function getNextMonth() {
    const months = ["Қаңтар", "Ақпан", "Наурыз", "Сәуір", "Мамыр", "Маусым", 
                    "Шілде", "Тамыз", "Қыркүйек", "Қазан", "Қараша", "Желтоқсан"];
    const today = new Date();
    const nextIndex = (today.getMonth() + 1) % 12;
    return months[nextIndex];
}


function selectPlan(planName, price) {
    const token = localStorage.getItem('token');
    
    if (!token) {
        alert("Әуелі логинге кіріңіз!");
        window.location.href = 'login.html';
        return;
    }
    
    const courseName = localStorage.getItem('selectedCourseName');
    const courseImg = localStorage.getItem('selectedCourseImg');
    
    localStorage.setItem('selectedPlan', planName);
    localStorage.setItem('planPrice', price);  
    
    alert(`✅ ${courseName}\n📋 Тариф: ${planName}\n💰 Баға: ${price} ₸`);
    
    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 800);
}

async function loadAdminStats() {
    const token = localStorage.getItem('token');
    
    try {
        const statsRes = await fetch('https://online-academy-zw35.onrender.com/api/admin/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const stats = await statsRes.json();
        
        document.getElementById('admin-user-count').innerText = stats.users || 0;
        document.getElementById('admin-total-money').innerText = (stats.revenue || 0).toLocaleString() + ' ₸';

        const usersRes = await fetch('https://online-academy-zw35.onrender.com/api/students', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const users = await usersRes.json();
        
        const tbody = document.getElementById('admin-users-table');
        tbody.innerHTML = users.map(u => `
            <tr>
                <td>#${u.id}</td>
                <td>${u.email}</td>
                <td>${u.role === 'admin' ? '👨‍💼 АДМИН' : u.role === 'teacher' ? '👨‍🏫 МҰҒАЛІМ' : '👨‍🎓 СТУДЕНТ'}</td>
                <td>
                    <button onclick="changeUserRole(${u.id}, '${u.email}')" style="background: #e2f113; color: #000; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">
                        Өзгерт
                    </button>
                </td>
            </tr>
        `).join('');

        const paymentsRes = await fetch('https://online-academy-zw35.onrender.com/api/admin/payments', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const payments = await paymentsRes.json();
        
        const paymentsTbody = document.getElementById('admin-payments-table');
        paymentsTbody.innerHTML = payments.map(p => `
            <tr>
                <td>${p.email}</td>
                <td>${p.amount} ₸</td>
                <td>${p.month_name}</td>
                <td>${new Date(p.payment_date).toLocaleDateString('kk-KZ')}</td>
            </tr>
        `).join('');
        
        loadCourseManagement();
        
    } catch (err) {
        console.error('Admin stats error:', err);
    }
}

async function loadCourseManagement() {
    const token = localStorage.getItem('token');
    
    try {
        const res = await fetch('https://online-academy-zw35.onrender.com/api/courses', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const courses = await res.json();
        
        const list = document.getElementById('course-management-list');
        list.innerHTML = courses.map(c => `
            <div style="background: #1a1a1a; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 3px solid #e2f113;">
                <h4>${c.name}</h4>
                <p style="color: #888;">Баға: ${c.price} ₸</p>
                <div style="display: flex; gap: 10px;">
                    <button onclick="editCourse(${c.id})" style="background: #2196F3; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer;">✏️ Өңдеу</button>
                    <button onclick="deleteCourse(${c.id})" style="background: #f44336; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer;">🗑️ Өшіру</button>
                </div>
            </div>
        `).join('');
        
        document.getElementById('admin-courses-count').innerText = courses.length;
        
    } catch (err) {
        console.error('Course management error:', err);
    }
}

function showAddCourseForm() {
    document.getElementById('addCourseModal').style.display = 'flex';
}

async function addNewCourse() {
    const token = localStorage.getItem('token');
    const name = document.getElementById('courseName').value;
    const price = parseInt(document.getElementById('coursePrice').value);
    const image_url = document.getElementById('courseImage').value;
    const description = document.getElementById('courseDesc').value;
    
    if (!name || !price) {
        alert('Барлық өрістерді толтырыңыз!');
        return;
    }
    
    try {
        const res = await fetch('https://online-academy-zw35.onrender.com/api/courses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name, price, image_url, description })
        });
        
        if (res.ok) {
            alert('✅ Курс қосылды!');
            closeModal('addCourseModal');
            loadCourseManagement();
        }
    } catch (err) {
        console.error('Error adding course:', err);
    }
}

async function deleteCourse(courseId) {
    if (!confirm('Сіз сенімдісіз бе?')) return;
    
    const token = localStorage.getItem('token');
    
    try {
        const res = await fetch(`https://online-academy-zw35.onrender.com/api/courses/${courseId}`, {
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

async function changeUserRole(userId, email) {
    const newRole = prompt('Жаңа рөлі (admin/teacher/student):', 'student');
    if (!newRole) return;
    
    const token = localStorage.getItem('token');
    
    try {
        const res = await fetch(`https://online-academy-zw35.onrender.com/api/users/${userId}/role`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
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

async function loadTeacherDashboard() {
    const token = localStorage.getItem('token');
    const teacherStudentList = document.getElementById('teacher-student-list');
    
    if (!teacherStudentList || !token) return;

    try {
        const response = await fetch('https://online-academy-zw35.onrender.com/api/teacher/homework', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('API Error');

        const homeworks = await response.json();

        if (!homeworks || homeworks.length === 0) {
            teacherStudentList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #888;">
                    <p>📭 Әлі тапсырма жіберілмеген</p>
                </div>
            `;
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
                <tbody>
        `;

        homeworks.forEach(hw => {
            const email = hw.student_email || hw.email;
            const submittedDate = new Date(hw.submitted_at).toLocaleDateString('kk-KZ');
            
            html += `
                <tr style="border-bottom: 1px solid #333;">
                    <td style="padding: 12px;">${email}</td>
                    <td style="padding: 12px;">
                        <span style="color: #ffa500; font-weight: bold;">⏳ Тексеру ішінде</span>
                    </td>
                    <td style="padding: 12px;">${submittedDate}</td>
                    <td style="padding: 12px;">
                        <button 
                            onclick="openReviewModal('${email}', '${hw.homework_url}', ${hw.id})"
                            style="background: #e2f113; color: black; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold;">
                            📋 Тексеру
                        </button>
                    </td>
                </tr>
            `;
        });

        html += `</tbody></table>`;
        teacherStudentList.innerHTML = html;
    } catch (err) {
        console.error("Қате:", err);
        teacherStudentList.innerHTML = `<p style="color: #ff6b6b; text-align: center;">❌ Қате болды: ${err.message}</p>`;
    }
}

function openReviewModal(email, homeworkUrl, homeworkId) {
    const modal = document.getElementById('reviewModal');
    if (!modal) return;
    
    document.getElementById('studentEmailDisplay').textContent = email;
    
    const linkElement = document.getElementById('taskUrlDisplay');
    if (linkElement) {
        if (homeworkUrl && homeworkUrl !== 'undefined') {
            linkElement.href = homeworkUrl;
            linkElement.style.display = 'inline-block';
        } else {
            linkElement.style.display = 'none';
        }
        linkElement.target = "_blank";
    }
    
    modal.style.display = 'flex';
    modal.dataset.currentId = homeworkId;
}

async function approveTask() {
    const modal = document.getElementById('reviewModal');
    const homeworkId = modal.dataset.currentId;
    const token = localStorage.getItem('token');

    if (!homeworkId) {
        alert("Тапсырма ID табылмады!");
        return;
    }

    try {
        const response = await fetch('https://online-academy-zw35.onrender.com/api/teacher/approve-homework', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                homework_id: parseInt(homeworkId), 
                status: 'approved' 
            })
        });

        if (response.ok) {
            alert('✅ Тапсырма қабылданды!');
            closeModal('reviewModal');
            loadTeacherDashboard(); 
        } else {
            const error = await response.json();
            alert("Қате: " + error.error);
        }
    } catch (err) {
        console.error('Қате:', err);
        alert('Сервер қатесі: ' + err.message);
    }
}


function closeModal(modalId = 'reviewModal') {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}