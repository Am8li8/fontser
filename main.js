import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, onValue, runTransaction } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyDimIFq47GG61jeP6_QT6pOvXznup-W_vo",
    authDomain: "fontser-a3ca2.firebaseapp.com",
    databaseURL: "https://fontser-a3ca2-default-rtdb.firebaseio.com",
    projectId: "fontser-a3ca2",
    storageBucket: "fontser-a3ca2.firebasestorage.app",
    messagingSenderId: "977971868992",
    appId: "1:977971868992:web:5e5993958d7f3f1f9a76a5"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// --- وظيفة مساعدة لتوحيد النصوص العربية (Normalization) ---
function normalizeArabic(text) {
    return text
        .replace(/[أإآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/[ىي]/g, 'ي')
        .replace(/[\u064B-\u0652]/g, '') // حذف التشكيل
        .toLowerCase()
        .trim();
}

// --- وظيفة حساب التقارب بين الكلمات (Fuzzy Match) ---
function isFuzzyMatch(term, target) {
    if (target.includes(term)) return true; // لو النص يحتوي الكلمة فعلاً
    
    // خوارزمية بسيطة: لو طول الكلمة كبير والفرق حرف واحد فقط
    if (term.length > 2) {
        let distance = 0;
        let i = 0, j = 0;
        while (i < term.length && j < target.length) {
            if (term[i] !== target[j]) {
                distance++;
                if (term.length < target.length) j++; // احتمال حرف ناقص
                else if (term.length > target.length) i++; // احتمال حرف زائد
                else { i++; j++; }
            } else { i++; j++; }
        }
        distance += (term.length - i) + (target.length - j);
        return distance <= 1; // السماح بخطأ في حرف واحد فقط
    }
    return false;
}

// --- 1. وظائف فتح وقفل البحث ---
window.toggleSearch = function() {
    const overlay = document.getElementById('searchOverlay');
    const input = document.getElementById('searchInput');
    
    if (overlay.style.display === 'flex') {
        overlay.style.display = 'none';
        input.value = '';
        window.filterFonts(); 
    } else {
        overlay.style.display = 'flex';
        setTimeout(() => input.focus(), 100);
    }
};

// --- 2. التحكم عن طريق الكيبورد ---
document.addEventListener('keydown', (e) => {
    const overlay = document.getElementById('searchOverlay');
    if (overlay && overlay.style.display === 'flex') {
        if (e.key === 'Escape') window.toggleSearch();
        else if (e.key === 'Enter') overlay.style.display = 'none';
    }
});

// --- 3. وظيفة البحث المتقدم (Fuzzy Search) ---
window.filterFonts = function() {
    const rawTerm = document.getElementById('searchInput').value;
    const term = normalizeArabic(rawTerm);
    const cards = document.querySelectorAll('.font-card-wrapper');
    const container = document.querySelector('.fonts-grid-container');
    let hasResults = false;
    let count = 0;

    let noResultsMsg = document.getElementById('noResults');
    if (!noResultsMsg) {
        noResultsMsg = document.createElement('div');
        noResultsMsg.id = 'noResults';
        noResultsMsg.innerHTML = `<i class="fa-solid fa-face-frown" style="font-size: 3rem; color: #444;"></i> <p style="margin-top:15px;">عفواً، لا يوجد خط بهذا الاسم!</p>`;
        noResultsMsg.style.cssText = "display:none; color:#777; text-align:center; grid-column:1/-1; padding:50px; font-size:1.2rem; direction:rtl;";
        container.appendChild(noResultsMsg);
    }

    cards.forEach(card => {
        const title = normalizeArabic(card.querySelector('.font-title').innerText);
        const fontData = normalizeArabic(card.getAttribute('data-font'));
        
        // استخدام fuzzy match هنا
        if (isFuzzyMatch(term, title) || isFuzzyMatch(term, fontData)) {
            card.style.display = 'flex';
            hasResults = true;
            count++;
        } else {
            card.style.display = 'none';
        }
    });

    const countDisplay = document.getElementById('searchResultsCount');
    if (countDisplay) {
        countDisplay.innerText = term !== "" ? `تم إيجاد ${count} خط` : "";
    }

    noResultsMsg.style.display = (hasResults || term === "") ? 'none' : 'block';
};

// --- 4. باقي وظائف الموقع ---
function reverseCardsOrder() {
    const container = document.querySelector('.fonts-grid-container');
    if (!container) return;
    const cards = Array.from(container.querySelectorAll('.font-card-wrapper'));
    cards.reverse();
    cards.forEach(card => container.appendChild(card));
}

window.rateFont = function(fontId, ratingValue) {
    const ratingRef = ref(db, `fonts/${fontId}/rating`);
    runTransaction(ratingRef, (current) => {
        if (!current) return { totalPoints: ratingValue, count: 1, average: ratingValue };
        const newTotal = (current.totalPoints || 0) + ratingValue;
        const newCount = (current.count || 0) + 1;
        return { totalPoints: newTotal, count: newCount, average: Math.round((newTotal/newCount)*10)/10 };
    });
};

function renderStars(fontId, averageRating) {
    const container = document.querySelector(`.rating-stars[data-id="${fontId}"]`);
    if (!container) return;
    container.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('i');
        star.className = i <= Math.round(averageRating) ? 'fa-solid fa-star active' : 'fa-regular fa-star';
        star.onclick = () => window.rateFont(fontId, i);
        container.appendChild(star);
    }
}

window.openShareModal = function(fontId) {
    const modal = document.getElementById('shareModal');
    const input = document.getElementById('shareLinkInput');
    const siteUrl = `${window.location.origin}${window.location.pathname}?id=${fontId}`;
    input.value = siteUrl;
    document.getElementById('shareFB').href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(siteUrl)}`;
    document.getElementById('shareWA').href = `https://wa.me/?text=تحميل خط احترافي: ${encodeURIComponent(siteUrl)}`;
    modal.style.display = 'flex';
};

window.closeShareModal = () => document.getElementById('shareModal').style.display = 'none';

window.copyModalLink = function() {
    const input = document.getElementById('shareLinkInput');
    navigator.clipboard.writeText(input.value);
    document.getElementById('copyBtnText').innerText = "تم!";
    setTimeout(() => document.getElementById('copyBtnText').innerText = "نسخ", 2000);
};

window.incrementDownload = function(fontId) {
    const fontRef = ref(db, 'fonts/' + fontId + '/downloads');
    runTransaction(fontRef, (count) => (count || 0) + 1);
};

function listenToFirebase() {
    onValue(ref(db, 'fonts'), (snapshot) => {
        const data = snapshot.val();
        if (data) {
            for (let id in data) {
                const countEl = document.querySelector(`.download-count[data-id="${id}"] .count-val`);
                if (countEl) countEl.innerText = data[id].downloads || 0;
                if (data[id].rating) renderStars(id, data[id].rating.average);
                else renderStars(id, 0);
            }
        }
    });
}

// --- 5. تهيئة الصفحة ---
document.addEventListener("DOMContentLoaded", () => {
    reverseCardsOrder();

    const cards = document.querySelectorAll('.font-card-wrapper');
    cards.forEach(card => {
        const fontId = card.id;
        const fontName = card.getAttribute('data-font');
        const footer = card.querySelector('.card-footer');

        if (footer && !card.querySelector('.btn-share')) {
            const btn = document.createElement('button');
            btn.className = 'btn-share';
            btn.innerHTML = '<i class="fa-solid fa-share-nodes"></i>';
            btn.onclick = (e) => { e.preventDefault(); window.openShareModal(fontId); };
            footer.appendChild(btn);
        }

        const dlBtn = card.querySelector('.btn-download');
        if (dlBtn) dlBtn.onclick = () => window.incrementDownload(fontId);

        const input = card.querySelector('.userInput');
        const preview = card.querySelector('.preview-target');
        if (input && preview) {
            input.style.fontFamily = `"${fontName}"`;
            preview.style.fontFamily = `"${fontName}"`;
            input.oninput = (e) => preview.innerText = e.target.value || "أبجد هوز حطي كلمن";
        }
        renderStars(fontId, 0);
    });

    listenToFirebase();

    const targetId = new URLSearchParams(window.location.search).get('id');
    if (targetId) {
        setTimeout(() => {
            const el = document.getElementById(targetId);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 800);
    }
});