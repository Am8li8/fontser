// 1. إعدادات Firebase الخاصة بمشروعك
const firebaseConfig = {
    apiKey: "AIzaSyDimIFq47GG61jeP6_QT6pOvXznup-W_vo",
    authDomain: "fontser-a3ca2.firebaseapp.com",
    databaseURL: "https://fontser-a3ca2-default-rtdb.firebaseio.com",
    projectId: "fontser-a3ca2",
    storageBucket: "fontser-a3ca2.firebasestorage.app",
    messagingSenderId: "977971868992",
    appId: "1:977971868992:web:5e5993958d7f3f1f9a76a5",
    measurementId: "G-QSBB7MEFF4"
};

// بدء تشغيل Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

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