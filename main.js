document.addEventListener("DOMContentLoaded", () => {
        // البحث عن كل الكروت
        const cards = document.querySelectorAll('.font-card-wrapper');

        cards.forEach(card => {
            const fontName = card.getAttribute('data-font');
            const preview = card.querySelector('.preview-target');
            const input = card.querySelector('.userInput');

            if (fontName) {
                // تطبيق الخط بشكل ديناميكي
                preview.style.fontFamily = `"${fontName}", sans-serif`;
                input.style.fontFamily = `"${fontName}", sans-serif`;
            }

            // تحديث المعاينة عند الكتابة
            input.addEventListener('input', (e) => {
                const text = e.target.value.trim();
                preview.textContent = text.length > 0 ? text : "أبجد هوز حطي كلمن";
            });
        });
    });