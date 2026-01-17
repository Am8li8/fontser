document.addEventListener("DOMContentLoaded", () => {
    
    // --- 1. منطق معاينة الخطوط ---
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

    // --- 2. منطق التصويت ---
    const voteModal = document.getElementById('voteModal');
    const progressBar = document.getElementById('progressBar');
    const currentVotesEl = document.getElementById('currentVotes');
    const voteBtnTrigger = document.querySelector(".btn-vote-trigger");
    const fontId = "EliteFont_01"; 

    // جلب البيانات وتحديث العداد لايف
    db.ref('votes/' + fontId).on('value', (snapshot) => {
        const data = snapshot.val();
        const count = (data && data.count) ? data.count : 0;

        if (currentVotesEl) currentVotesEl.innerText = count;
        if (progressBar) {
            const percent = (Math.min(count, 50) / 50) * 100;
            progressBar.style.width = percent + '%';
        }

        // تحويل زر "صوّت الآن" لزر تحميل عند الوصول للهدف
        if (count >= 50 && voteBtnTrigger) {
            voteBtnTrigger.innerText = "تحميل الخط";
            voteBtnTrigger.style.background = "#27ae60";
            voteBtnTrigger.style.color = "#fff";
            voteBtnTrigger.onclick = (e) => {
                e.stopPropagation();
                window.location.href = "files/EliteFont.zip";
            };
        }
    });

    window.openVoteModal = function(name) {
        document.getElementById('modalFontName').innerText = name;
        voteModal.style.display = 'flex';
    };

    window.closeVoteModal = function() {
        voteModal.style.display = 'none';
    };

    window.confirmVote = function() {
        if (localStorage.getItem('voted_' + fontId)) {
            alert("لقد قمت بالتصويت مسبقاً!");
            closeVoteModal();
            return;
        }

        db.ref('votes/' + fontId + '/count').transaction((currentCount) => {
            return (currentCount || 0) + 1;
        }, (error, committed) => {
            if (committed) {
                localStorage.setItem('voted_' + fontId, 'true');
                alert("شكراً لك! تم احتساب صوتك.");
                closeVoteModal();
            } else {
                alert("خطأ في الاتصال بقاعدة البيانات.");
            }
        });
    };
});