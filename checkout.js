document.addEventListener('DOMContentLoaded', () => {
    console.log('💳 checkout.js загружен');
    
    // Получите данные из localStorage
    const courseName = localStorage.getItem('selectedCourseName') || "Курс таңдалмады";
    const planName = localStorage.getItem('selectedPlan') || "Тариф таңдалмады";
    const planPrice = localStorage.getItem('planPrice');
    const selectedPrice = localStorage.getItem('selectedPrice');
    const price = parseInt(planPrice || selectedPrice || '0') || 0;
    const img = localStorage.getItem('selectedCourseImg') || "";

    console.log('💳 Checkout деректері:', { courseName, planName, price, planPrice, selectedPrice });

    // Элементтерді табыңыз
    const renderPrice = document.getElementById('renderPrice');
    const renderCourseName = document.getElementById('renderCourseName');
    const renderPlanName = document.getElementById('renderPlanName');
    const basePriceLabel = document.getElementById('basePriceLabel');
    const finalPriceLabel = document.getElementById('finalPriceLabel');
    const renderImg = document.getElementById('renderImg');
    const paymentForm = document.getElementById('paymentForm');
    const cardInput = document.getElementById('cardNum');

    console.log('✅ HTML элементтері табылды:', {
        form: !!paymentForm,
        price: !!renderPrice,
        courseName: !!renderCourseName
    });

    // Деректерді көрсетіңіз
    if (renderPrice) renderPrice.innerText = price.toLocaleString() + " ₸";
    if (renderCourseName) renderCourseName.innerText = courseName;
    if (renderPlanName) renderPlanName.innerText = planName;
    if (basePriceLabel) basePriceLabel.innerText = price.toLocaleString() + " ₸";
    
    const finalPrice = Math.max(price - 2000, 0);
    if (finalPriceLabel) finalPriceLabel.innerText = finalPrice.toLocaleString() + " ₸";
    
    if (renderImg && img) {
        renderImg.src = img;
        console.log('✅ Сурет құрылды:', img);
    }

    // Карта форматирование
    if (cardInput) {
        cardInput.addEventListener('input', (e) => {
            e.target.value = e.target.value
                .replace(/[^\d]/g, '')
                .replace(/(.{4})/g, '$1 ')
                .trim();
        });
    }

    // ✅ ФОРМА ЖІБЕРУ
    if (paymentForm) {
        console.log('✅ paymentForm табылды, listener қосымын');
        
        paymentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('🔄 Форма жіберілмек...');
            
            const token = localStorage.getItem('token');
            console.log('🔐 Token табылды?', !!token);
            
            if (!token) {
                alert("Логинге кіріңіз!");
                window.location.href = 'login.html';
                return;
            }

            // Жүргіліп жатқан болса ғана жіберіңіз
            if (!courseName || courseName === "Курс таңдалмады") {
                alert("❌ Курс деректері жоқ!");
                window.location.href = 'courses.html';
                return;
            }

            try {
                console.log('📤 Төлем API-ға жіберілмек:', { 
                    amount: price, 
                    month_name: planName,
                    courseName 
                });

                const response = await fetch('http://localhost:5001/api/payment', {
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

                console.log('📊 Сервер жауабы:', response.status);

                if (response.ok) {
                    const data = await response.json();
                    console.log("✅ Төлем сәтті:", data);
                    
                    // 🔥 ВЫЗОВИ enrollToCourse ЗДЕСЬ
                    const courseId = localStorage.getItem('selectedCourseId');
                    if (courseId) {
                        await enrollToCourse(courseId);
                    }
                    
                    alert('✅ Төлем сәтті қабылданды!\n\n' + 
                        `Курс: ${courseName}\n` +
                        `Тариф: ${planName}\n` +
                        `Сумма: ${price} ₸`);
                    
                    // 2 секундтан кейін қайту
                    setTimeout(() => {
                        window.location.href = "dashboard.html?role=student";
                    }, 2000);
                } else {
                    const error = await response.json();
                    console.error('❌ Сервер қатесі:', error);
                    alert("❌ Төлем сәтсіз:\n" + (error.error || "Қателі болды"));
                }
            } catch (err) {
                console.error("❌ Төлем қатесі:", err);
                alert("❌ Сервер қатесі:\n" + err.message);
            }
        });
    } else {
        console.error('❌ paymentForm табылмады! HTML-де id="paymentForm" бар ма?');
    }
});

// Добавь в конец checkout.js перед </script>

async function enrollToCourse(courseId) {
    const token = localStorage.getItem('token');
    if (!token) { 
        console.error('❌ Token отсутствует');
        return false; 
    }
    if (!courseId) { 
        console.error('❌ courseId отсутствует!'); 
        return false; 
    }

    try {
        console.log('📤 Попытка регистрации на курс:', courseId);
        const response = await fetch('http://localhost:5001/api/enroll', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ course_id: parseInt(courseId) })
        });

        if (response.ok) {
            console.log('✅ Регистрация на курс успешна!');
            return true;
        } else {
            const err = await response.json();
            if (err.error === 'Already enrolled') {
                console.log('ℹ️ Уже зарегистрирова�� на этот курс');
                return true;
            }
            console.error('❌ Ошибка регистрации:', err.error);
            return false;
        }
    } catch (err) {
        console.error('❌ Ошибка при регистрации:', err);
        return false;
    }
}