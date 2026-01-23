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

// --- وظيفة مساعدة لتوحيد النصوص العربية ---
function normalizeArabic(text) {
    if (!text) return "";
    return text
        .replace(/[أإآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/[ىي]/g, 'ي')
        .replace(/[\u064B-\u0652]/g, '')
        .toLowerCase()
        .trim();
}

// --- وظيفة حساب التقارب (Fuzzy Match) ---
function isFuzzyMatch(term, target) {
    if (target.includes(term)) return true;
    if (term.length > 2) {
        let distance = 0, i = 0, j = 0;
        while (i < term.length && j < target.length) {
            if (term[i] !== target[j]) {
                distance++;
                if (term.length < target.length) j++;
                else if (term.length > target.length) i++;
                else { i++; j++; }
            } else { i++; j++; }
        }
        distance += (term.length - i) + (target.length - j);
        return distance <= 1;
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
        // تنظيف الـ URL عند إغلاق البحث
        window.history.replaceState(null, '', window.location.pathname);
        window.filterFonts(); 
    } else {
        overlay.style.display = 'flex';
        setTimeout(() => input.focus(), 100);
    }
};

// --- 2. التحكم بالكيبورد ---
document.addEventListener('keydown', (e) => {
    const overlay = document.getElementById('searchOverlay');
    if (overlay && overlay.style.display === 'flex') {
        if (e.key === 'Escape') window.toggleSearch();
        else if (e.key === 'Enter') overlay.style.display = 'none';
    }
});

// --- 3. وظيفة البحث وتحديث الـ URL ---
window.filterFonts = function() {
    const rawTerm = document.getElementById('searchInput').value;
    const term = normalizeArabic(rawTerm);
    const cards = document.querySelectorAll('.font-card-wrapper');
    const container = document.querySelector('.fonts-grid-container');
    let hasResults = false;
    let count = 0;
    let firstMatchId = null;

    cards.forEach(card => {
        const title = normalizeArabic(card.querySelector('.font-title').innerText);
        const fontData = normalizeArabic(card.getAttribute('data-font'));
        
        if (isFuzzyMatch(term, title) || isFuzzyMatch(term, fontData)) {
            card.style.display = 'flex';
            hasResults = true;
            count++;
            if (!firstMatchId) firstMatchId = card.id;
        } else {
            card.style.display = 'none';
        }
    });

    // تحديث الـ URL برمجياً أثناء البحث
    if (term !== "" && firstMatchId) {
        window.history.replaceState(null, '', `?id=${firstMatchId}`);
    } else if (term === "") {
        window.history.replaceState(null, '', window.location.pathname);
    }

    const countDisplay = document.getElementById('searchResultsCount');
    if (countDisplay) countDisplay.innerText = term !== "" ? `تم إيجاد ${count} خط` : "";

    let noRes = document.getElementById('noResults');
    if (noRes) noRes.style.display = (hasResults || term === "") ? 'none' : 'block';
};

// --- 4. وظائف التفاعل والمشاركة ---
function reverseCardsOrder() {
    const container = document.querySelector('.fonts-grid-container');
    if (!container) return;
    const cards = Array.from(container.querySelectorAll('.font-card-wrapper'));
    cards.reverse().forEach(card => container.appendChild(card));
}

window.rateFont = function(fontId, ratingValue) {
    runTransaction(ref(db, `fonts/${fontId}/rating`), (current) => {
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
    const siteUrl = `${window.location.origin}${window.location.pathname}?id=${fontId}`;
    document.getElementById('shareLinkInput').value = siteUrl;
    document.getElementById('shareFB').href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(siteUrl)}`;
    document.getElementById('shareWA').href = `https://wa.me/?text=تحميل خط احترافي: ${encodeURIComponent(siteUrl)}`;
    document.getElementById('shareModal').style.display = 'flex';
};

window.closeShareModal = () => document.getElementById('shareModal').style.display = 'none';

window.copyModalLink = function() {
    const input = document.getElementById('shareLinkInput');
    navigator.clipboard.writeText(input.value);
    const btnText = document.getElementById('copyBtnText');
    btnText.innerText = "تم!";
    setTimeout(() => btnText.innerText = "نسخ", 2000);
};

window.incrementDownload = (id) => runTransaction(ref(db, `fonts/${id}/downloads`), c => (c || 0) + 1);

function listenToFirebase() {
    onValue(ref(db, 'fonts'), (snapshot) => {
        const data = snapshot.val();
        if (data) {
            Object.keys(data).forEach(id => {
                const countEl = document.querySelector(`.download-count[data-id="${id}"] .count-val`);
                if (countEl) countEl.innerText = data[id].downloads || 0;
                renderStars(id, data[id].rating?.average || 0);
            });
        }
    });
}

// --- 5. تهيئة الصفحة والـ Highlight ---
document.addEventListener("DOMContentLoaded", () => {
    reverseCardsOrder();

    const cards = document.querySelectorAll('.font-card-wrapper');
    cards.forEach(card => {
        const fontId = card.id;
        const fontName = card.getAttribute('data-font');
        
        // زر المشاركة
        const footer = card.querySelector('.card-footer');
        if (footer && !card.querySelector('.btn-share')) {
            const btn = document.createElement('button');
            btn.className = 'btn-share';
            btn.innerHTML = '<i class="fa-solid fa-share-nodes"></i>';
            btn.onclick = (e) => { e.preventDefault(); window.openShareModal(fontId); };
            footer.appendChild(btn);
        }

        // زر التحميل
        const dlBtn = card.querySelector('.btn-download');
        if (dlBtn) dlBtn.onclick = () => window.incrementDownload(fontId);

        // تجربة الخط
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

    // تفعيل الهايلايت والتحرك للخط المطلوب من الرابط
    const targetId = new URLSearchParams(window.location.search).get('id');
    if (targetId) {
        setTimeout(() => {
            const el = document.getElementById(targetId);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.classList.add('highlight-card');
                // إزالة التحديد بعد 2 ثواني ليبقى التصميم نظيفاً
                setTimeout(() => el.classList.remove('highlight-card'), 2000);
            }
        }, 1000); 
    }
});