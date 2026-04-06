document.addEventListener('DOMContentLoaded', () => {
    const courseName = localStorage.getItem('selectedCourseName') || "Курс таңдалмады";
    const planName = localStorage.getItem('selectedPlanName') || "Тариф таңдалмады";
    const price = parseInt(localStorage.getItem('selectedPrice')) || 0;
    const img = localStorage.getItem('selectedCourseImg') || "";

    const renderPrice = document.getElementById('renderPrice');
    const renderCourseName = document.getElementById('renderCourseName');
    const renderPlanName = document.getElementById('renderPlanName');
    const basePriceLabel = document.getElementById('basePriceLabel');
    const finalPriceLabel = document.getElementById('finalPriceLabel');
    const renderImg = document.getElementById('renderImg');

    if (renderPrice) renderPrice.innerText = price.toLocaleString() + " ₸";
    if (renderCourseName) renderCourseName.innerText = courseName;
    if (renderPlanName) renderPlanName.innerText = planName;
    if (basePriceLabel) basePriceLabel.innerText = price.toLocaleString() + " ₸";
    if (finalPriceLabel) finalPriceLabel.innerText = (price - 2000).toLocaleString() + " ₸";
    
    if (renderImg && img) {
        renderImg.src = img;
    }

    const cardInput = document.getElementById('cardNum');
    if (cardInput) {
        cardInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^\d]/g, '').replace(/(.{4})/g, '$1 ').trim();
        });
    }

    const paymentForm = document.getElementById('paymentForm');
    if (paymentForm) {
        paymentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const token = localStorage.getItem('token');
            if (!token) {
                alert("Логинге кіріңіз!");
                return;
            }

            try {
                // ✅ СЕРВЕР API-НА ЖІБЕРУ:
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
                    const data = await response.json();
                    console.log("✅ Төлем қабылданды:", data);
                    
                    alert('✅ Төлем сәтті қабылданды!');
                    
                    // Локальда да сақтау (қосымша)
                    const myCourses = JSON.parse(localStorage.getItem('myCourses') || "[]");
                    myCourses.push({
                        name: courseName,
                        plan: planName,
                        date: new Date().toLocaleDateString('kk-KZ'),
                        amount: price
                    });
                    localStorage.setItem('myCourses', JSON.stringify(myCourses));

                    // 2 секундтан кейін қайту
                    setTimeout(() => {
                        window.location.href = "dashboard.html";
                    }, 2000);
                } else {
                    const error = await response.json();
                    alert("❌ Төлем сәтсіз: " + (error.error || "Қателі болды"));
                }
            } catch (err) {
                console.error("Төлем қатесі:", err);
                alert("❌ Сервер қатесі: " + err.message);
            }
        });
    }
});