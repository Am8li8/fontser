// --- 1. الدوال العامة للبحث (Global Functions) ---

// دالة تنظيف النص العربي لتوحيد البحث (أ، إ، آ -> ا)
function normalizeArabic(text) {
    if (!text) return "";
    return text.replace(/[أإآ]/g, 'ا')
               .replace(/ة/g, 'ه')
               .replace(/ى/g, 'ي')
               .trim()
               .toLowerCase();
}

// خوارزمية البحث المرن (Fuzzy Search)
function isFuzzyMatch(searchTerm, targetText) {
    searchTerm = normalizeArabic(searchTerm);
    targetText = normalizeArabic(targetText);
    
    let searchIndex = 0;
    let targetIndex = 0;

    while (searchIndex < searchTerm.length && targetIndex < targetText.length) {
        if (searchTerm[searchIndex] === targetText[targetIndex]) {
            searchIndex++;
        }
        targetIndex++;
    }
    return searchIndex === searchTerm.length;
}

// فتح وإغلاق نافذة البحث
window.toggleSearch = function() {
    const overlay = document.getElementById('searchOverlay');
    const input = document.getElementById('searchInput');
    
    if (!overlay) return;

    if (overlay.style.display === 'flex') {
        overlay.style.display = 'none';
        document.body.style.overflow = 'auto';
    } else {
        overlay.style.display = 'flex';
        // لا نمسح القيمة هنا لكي يظهر ما في الرابط إذا وجد
        setTimeout(() => input.focus(), 50); 
        document.body.style.overflow = 'hidden';
        filterFonts();
    }
};

// فلترة الخطوط وتحديث الرابط (URL)
window.filterFonts = function() {
    const input = document.getElementById('searchInput');
    const searchTerm = input.value;
    const fontCards = document.querySelectorAll('.font-card-wrapper');
    let foundCount = 0;

    // --- تحديث الرابط في المتصفح ---
    const url = new URL(window.location);
    if (searchTerm) {
        url.searchParams.set('q', searchTerm);
    } else {
        url.searchParams.delete('q');
    }
    window.history.replaceState({}, '', url);

    // --- منطق الفلترة ---
    fontCards.forEach(card => {
        const fontTitle = card.querySelector('.font-title').innerText;
        
        if (searchTerm === "") {
            card.style.display = 'flex';
        } else if (isFuzzyMatch(searchTerm, fontTitle)) {
            card.style.display = 'flex';
            foundCount++;
        } else {
            card.style.display = 'none';
        }
    });

    const countEl = document.getElementById('searchResultsCount');
    if (countEl) {
        countEl.innerText = searchTerm === "" ? "" : `تم العثور على ${foundCount} نتيجة`;
    }
};

// --- 2. منطق التشغيل الأساسي عند تحميل الصفحة ---

document.addEventListener("DOMContentLoaded", () => {
    
    // أ. منطق معاينة الخطوط
    const cards = document.querySelectorAll('.font-card-wrapper');
    cards.forEach(card => {
        const fontName = card.getAttribute('data-font');
        const preview = card.querySelector('.preview-target');
        const input = card.querySelector('.userInput');

        if (fontName && preview && input) {
            preview.style.fontFamily = `"${fontName}", sans-serif`;
            input.style.fontFamily = `"${fontName}", sans-serif`;

            input.addEventListener('input', (e) => {
                const text = e.target.value.trim();
                preview.textContent = text.length > 0 ? text : "أبجد هوز حطي كلمن";
            });
        }
    });

    // ب. فحص الرابط عند فتح الصفحة (Check URL for Search Query)
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');
    if (query) {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = query; // وضع الكلمة في الإدخال
            toggleSearch(); // فتح نافذة البحث تلقائياً
        }
    }

    // ج. اختصارات لوحة المفاتيح
    document.addEventListener('keydown', (e) => {
        const overlay = document.getElementById('searchOverlay');
        if (overlay && overlay.style.display === 'flex') {
            if (e.key === "Enter" || e.key === "Escape") {
                toggleSearch();
            }
        }
    });

    
});

