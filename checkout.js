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
        paymentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Төлем сәтті қабылданды!');
            
            const myCourses = JSON.parse(localStorage.getItem('myCourses') || "[]");
            myCourses.push({
                name: courseName,
                plan: planName,
                date: new Date().toLocaleDateString()
            });
            localStorage.setItem('myCourses', JSON.stringify(myCourses));

            window.location.href = "dashboard.html";
        });
    }
});