const allCourses = [
    { title: "Python негіздері", level: "Бастапқы деңгей", rating: 4.8, time: "12 сағат", teacher: "Айбек Нұрланов", category: "programming", img: "images/python.jpg",link:"course-python.html" },
    { title: "Веб-дизайн (Figma)", level: "Бастапқы деңгей", rating: 4.9, time: "10 сағат", teacher: "Аружан Сейтхан", category: "design", img: "images/figma.jpg",link:"course-figma.html" },
    { title: "JavaScript негіздері", level: "Орта деңгей", rating: 4.8, time: "15 сағат", teacher: "Ермек Аскеров", category: "programming", img: "images/js.jpg",link:"course-js.html"},
    { title: "UI/UX дизайн", level: "Орта деңгей", rating: 4.9, time: "18 сағат", teacher: "Алима Керимова", category: "design", img: "images/ui.jpg",link:"course-ui.html" },
    { title: "HTML & CSS негіздері", level: "Бастапқы деңгей", rating: 4.8, time: "14 сағат", teacher: "Данияр Омаров", category: "programming", img: "images/html.jpg",link:"course-html.html"},
    { title: "Data Science кіріспе", level: "Орта деңгей", rating: 4.8, time: "20 сағат", teacher: "Асқар Ілиясов", category: "programming", img: "images/data.jpg",link:"course-data.html"},
    { title: "Kotlin (Android дамыту)", level: "Жоғары деңгей", rating: 4.9, time:"21 сағат", teacher: "Ержан Төлегенов", category: "programming", img: "images/kotlin.jpg",link:"course-kotlin.html"},
    { title: "Графикалық дизайн", level: "Орта деңгей", rating: 4.8, time: "17 сағат", teacher: "Мадина Ескерова", category: "design", img: "images/graphics.jpg",link:"course-graphics.html" },
    { title: "C++ негіздері", level: "Бастапқы деңгей", rating: 4.8, time: "16 сағат", teacher: "Айгерім Данияровна", category: "programming", img: "images/c+.jpg",link:"course-c+.html" },
    { title: "C# және .NET платформасы", level: "Орта деңгей", rating: 4.9, time: "18 сағат", teacher: "Олжас Аманбеков", category: "programming", img: "images/NET.jpg" ,link:"course-net.html"},
    { title: "Swift (iOS қосымша жасау)", level: "Орта деңгей", rating: 4.8, time: "20 сағат", teacher: "Динара Алиевна", category: "programming", img: "images/swift.jpg",link:"course-swift.html" }
];

const coursesGrid = document.getElementById('coursesGrid');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');

function renderCourses(filteredList) {
    coursesGrid.innerHTML = ""; 

    if (filteredList.length === 0) {
        coursesGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #888;">Кешіріңіз, ештеңе табылмады...</p>`;
        return;
    }

    filteredList.forEach(course => {
        const card = `
            <div class="course-card-full">
                <div class="card-img-box">
                    <img src="${course.img}" alt="${course.title}" onerror="this.src='https://via.placeholder.com/300x180?text=No+Image'">
                    <span class="level-badge">${course.level}</span>
                </div>
                <div class="card-info">
                    <h3>${course.title}</h3>
                    <p class="teacher">${course.teacher}</p>
                    <div class="card-meta">
                        <span>⭐ ${course.rating}</span>
                        <span>⏱ ${course.time}</span>
                    </div>
                    <button onclick="selectCourse(${course.id}, '${course.title}', '${course.img}', ${course.price})" style="width: 100%; padding: 12px; background: #e2f113; color: black; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">
                        💳 Төлем жасау
                    </button>
                </div>
            </div>
        `;
        coursesGrid.innerHTML += card;
    });
}

function updateFilters() {
    const searchText = searchInput.value.toLowerCase(); 
    const selectedCategory = categoryFilter.value;     

    const filtered = allCourses.filter(course => {
        const matchesSearch = course.title.toLowerCase().includes(searchText);
        const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    renderCourses(filtered);
}

searchInput.addEventListener('input', updateFilters); 
categoryFilter.addEventListener('change', updateFilters); 

renderCourses(allCourses);