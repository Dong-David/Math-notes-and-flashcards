// Biến toàn cục
let allCards = [];
let topicsByLevel = { B2: [], C1: [], C2: [] };
let filteredCards = [];
let current = 0;

// DOM Elements
const flashcard = document.getElementById("flashcard");
const front = document.getElementById("card-front");
const back = document.getElementById("card-back");
const counter = document.getElementById("counter");

const levelInput = document.getElementById("level-input");
const topicInput = document.getElementById("topic-input");
const newTopicInput = document.getElementById("new-topic");

const levelFilter = document.getElementById("level-filter");
const topicFilter = document.getElementById("topic-filter");

// Khởi tạo và lưu trữ
function saveToStorage() {
    localStorage.setItem("flashcards", JSON.stringify(allCards));
    localStorage.setItem("topicsByLevel", JSON.stringify(topicsByLevel));
}

function loadFromStorage() {
    const cards = localStorage.getItem("flashcards");
    const topics = localStorage.getItem("topicsByLevel");
    if (cards) allCards = JSON.parse(cards);
    if (topics) topicsByLevel = JSON.parse(topics);
    updateTopicOptions();
    updateTopicFilter();
    applyFilters();
    updateCard();
}

// Cập nhật giao diện
function updateCard() {
    if (filteredCards.length === 0) {
        front.textContent = "Không có thẻ nào.";
        back.textContent = "Hãy thêm flashcard!";
        counter.textContent = "";
        return;
    }
    flashcard.classList.remove("flipped");
    front.textContent = filteredCards[current].front;
    back.textContent = filteredCards[current].back;
    counter.textContent = `Thẻ ${current + 1} / ${filteredCards.length}`;

    updateFavoriteIndicator(); 
    updateStats();  
}

function applyFilters() {
    const level = levelFilter.value;
    const topic = topicFilter.value;
    filteredCards = allCards.filter(card =>
        (!level || card.level === level) &&
        (!topic || card.topic === topic)
    );
    current = 0;
    updateCard();
}

function updateTopicOptions() {
    const level = levelInput.value;
    topicInput.innerHTML = '<option value="">Chọn chủ đề</option>';
    (topicsByLevel[level] || []).forEach(t =>
        topicInput.innerHTML += `<option value="${t}">${t}</option>`
    );
}

function updateTopicFilter() {
    const level = levelFilter.value;
    topicFilter.innerHTML = '<option value="">Chủ đề (Tất cả)</option>';
    (topicsByLevel[level] || []).forEach(t =>
        topicFilter.innerHTML += `<option value="${t}">${t}</option>`
    );
    applyFilters();
}

// Thao tác thẻ
function flipCard() {
    flashcard.classList.toggle("flipped");
}

function nextCard() {
    if (filteredCards.length) {
        current = (current + 1) % filteredCards.length;
        updateCard();
    }
}

function prevCard() {
    if (filteredCards.length) {
        current = (current - 1 + filteredCards.length) % filteredCards.length;
        updateCard();
    }
}

// Thêm thẻ
function addCardCore(frontVal, backVal, level, topic) {
    const fullFront = "Từ: " + frontVal;
    const fullBack = "Nghĩa: " + backVal;

    const exists = allCards.find(c =>
        c.front === fullFront && c.back === fullBack &&
        c.level === level && c.topic === topic
    );
    if (exists) {
        alert("⚠️ Thẻ này đã tồn tại!");
        return false;
    }

    allCards.push({ front: fullFront, back: fullBack, level, topic });
    return true;
}

function addCard() {
    const frontVal = document.getElementById("front-input").value.trim();
    const backVal = document.getElementById("back-input").value.trim();
    const level = levelInput.value;
    const newTopic = newTopicInput.value.trim();
    let topic = newTopic || topicInput.value;

    if (!frontVal || !backVal || !level || !topic)
        return alert("Hãy nhập đủ thông tin!");

    if (!topicsByLevel[level].includes(topic)) {
        topicsByLevel[level].push(topic);
    }

    if (addCardCore(frontVal, backVal, level, topic)) {
        saveToStorage();
        updateTopicOptions();
        applyFilters();
        current = filteredCards.length - 1;
        updateCard();
    }
}

// Xoá thẻ
function deleteCard() {
    if (!filteredCards.length) return;
    if (!confirm("Bạn có chắc chắn muốn xoá thẻ này không?")) return;

    const card = filteredCards[current];
    allCards = allCards.filter(c =>
        !(c.front === card.front && c.back === card.back &&
            c.level === card.level && c.topic === card.topic)
    );
    saveToStorage();
    applyFilters();
    current = Math.max(0, current - 1);
    updateCard();
}

// Thêm hàng loạt
function addBulkCards() {
    const text = document.getElementById("bulk-input").value.trim();
    const level = levelInput.value;
    const newTopic = newTopicInput.value.trim();
    let topic = newTopic || topicInput.value;

    if (!level || !topic) return alert("Hãy chọn trình độ và chủ đề!");

    if (!topicsByLevel[level].includes(topic)) {
        topicsByLevel[level].push(topic);
    }

    const lines = text.split('\n');
    let added = 0;

    for (let line of lines) {
        if (!line.includes(':')) continue;
        const [frontRaw, backRaw] = line.split(':');
        const front = frontRaw.trim();
        const back = backRaw.trim();
        if (front && back && addCardCore(front, back, level, topic)) added++;
    }

    if (added > 0) {
        saveToStorage();
        updateTopicOptions();
        applyFilters();
        current = filteredCards.length - 1;
        updateCard();
        document.getElementById("bulk-input").value = "";
        alert(`✅ Đã thêm ${added} thẻ.`);
    } else {
        alert("Không thêm được thẻ nào. Có thể do trùng hoặc sai định dạng.");
    }
}

// Chuyển thẻ
function updateMoveTopics() {
    const level = document.getElementById("move-level").value;
    const topicSelect = document.getElementById("move-topic");
    topicSelect.innerHTML = '<option value="">Chọn chủ đề...</option>';
    (topicsByLevel[level] || []).forEach(t =>
        topicSelect.innerHTML += `<option value="${t}">${t}</option>`
    );
}

function moveCard() {
    const newLevel = document.getElementById("move-level").value;
    const newTopic = document.getElementById("move-topic").value;
    if (!filteredCards.length || !newLevel || !newTopic)
        return alert("Chọn đầy đủ trình độ và chủ đề!");

    const card = filteredCards[current];
    const i = allCards.findIndex(c =>
        c.front === card.front && c.back === card.back &&
        c.level === card.level && c.topic === card.topic
    );
    if (i !== -1) {
        allCards[i].level = newLevel;
        allCards[i].topic = newTopic;
        if (!topicsByLevel[newLevel].includes(newTopic)) {
            topicsByLevel[newLevel].push(newTopic);
        }
        saveToStorage();
        applyFilters();
        updateCard();
    }
}

// Phát âm từ
function speakCard() {
    if (!filteredCards.length) return;
    const text = filteredCards[current].front.replace("Từ: ", "").trim();
    const utterance = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(utterance);
}

// Xuất/Nhập JSON
function exportCards() {
    const dataStr = JSON.stringify(allCards, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "flashcards.json";
    a.click();
    URL.revokeObjectURL(url);
}

function importCards(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = JSON.parse(e.target.result);
            if (!Array.isArray(data)) throw new Error("Không đúng định dạng JSON!");

            let added = 0;
            for (let card of data) {
                if (!card.front || !card.back || !card.level || !card.topic) continue;
                const exists = allCards.find(c =>
                    c.front === card.front && c.back === card.back &&
                    c.level === card.level && c.topic === card.topic
                );
                if (!exists) {
                    allCards.push(card);
                    if (!topicsByLevel[card.level].includes(card.topic)) {
                        topicsByLevel[card.level].push(card.topic);
                    }
                    added++;
                }
            }

            alert(`Đã nhập ${added} thẻ mới.`);
            saveToStorage();
            applyFilters();
            updateCard();
            updateFavoriteIndicator();
            updateStats();
        } catch (err) {
            alert("❌ Không thể nhập file JSON!\n" + err.message);
        }
    };
    reader.readAsText(file);
}

// Sự kiện
levelFilter.addEventListener("change", updateTopicFilter);
topicFilter.addEventListener("change", applyFilters);
loadFromStorage();

// ⭐ Yêu thích
let favoriteSet = new Set(JSON.parse(localStorage.getItem("favorites") || "[]"));

function toggleFavorite() {
    if (!filteredCards.length) return;
    const card = filteredCards[current];
    const key = JSON.stringify(card);
    if (favoriteSet.has(key)) {
        favoriteSet.delete(key);
    } else {
        favoriteSet.add(key);
    }
    localStorage.setItem("favorites", JSON.stringify([...favoriteSet]));
    updateFavoriteIndicator();
    updateStats();
}

// Hiển thị ⭐ nếu là yêu thích
function updateFavoriteIndicator() {
    const indicator = document.getElementById("favorite-indicator");
    if (!indicator || !filteredCards.length) return;
    const card = filteredCards[current];
    const key = JSON.stringify(card);
    indicator.style.opacity = favoriteSet.has(key) ? "1" : "0.2";
}

// Tìm kiếm
function applySearchFilter() {
    const level = levelFilter.value;
    const topic = topicFilter.value;
    const keyword = document.getElementById("search-box").value.trim().toLowerCase();

    filteredCards = allCards.filter(card =>
        (!level || card.level === level) &&
        (!topic || card.topic === topic) &&
        (card.front.toLowerCase().includes(keyword) || card.back.toLowerCase().includes(keyword))
    );
    current = 0;
    updateCard();
    updateFavoriteIndicator();
    updateStats();
}

// Thống kê
function updateStats() {
    const stats = document.getElementById("stats");
    const favCount = favoriteSet.size;
    const topicSet = new Set(allCards.map(c => c.topic));
    const levelSet = new Set(allCards.map(c => c.level));
    stats.textContent = `🧠 Tổng: ${allCards.length} | 📘 Trình độ: ${levelSet.size} | 📂 Chủ đề: ${topicSet.size} | ⭐ Yêu thích: ${favCount}`;
    const favCounter = document.getElementById("favorite-counter");
    if (favCounter) favCounter.textContent = `⭐ Đã đánh dấu: ${favCount} thẻ`;
}

// 🌙 Chuyển dark mode
let darkMode = false;
function toggleDarkMode() {
    darkMode = !darkMode;
    document.body.classList.toggle("dark-mode", darkMode);
}
