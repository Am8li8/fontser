// 1. إعدادات Firebase الخاصة بمشروعك (fontser-a3ca2) - تم إضافة بياناتك الحقيقية
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
    
    // --- 1. منطق معاينة الخطوط (الذي أرسلته أنت) ---
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

    // --- 2. منطق نافذة التصويت والربط مع Firebase ---
    const voteModal = document.getElementById('voteModal');
    const progressBar = document.getElementById('progressBar');
    const currentVotesEl = document.getElementById('currentVotes');
    const voteBtn = document.querySelector(".btn-vote-trigger");
    const fontId = "EliteFont_01"; // المعرف الثابت في قاعدة البيانات

    // مراقبة العداد من Firebase وتحديث الزر تلقائياً
    db.ref('votes/' + fontId).on('value', (snapshot) => {
        const data = snapshot.val() || { count: 0 };
        const count = data.count;

        // تحديث النص وشريط التقدم في النافذة
        if (currentVotesEl) currentVotesEl.innerText = count;
        if (progressBar) {
            const percent = (Math.min(count, 50) / 50) * 100;
            progressBar.style.width = percent + '%';
        }

        // تحويل الزر لزر تحميل إذا وصل لـ 50 صوت
        if (count >= 50 && voteBtn) {
            voteBtn.innerText = "تحميل الخط الآن";
            voteBtn.style.cssText = "background: #27ae60 !important; color: #fff !important; border: none; font-weight: bold; cursor: pointer;";
            voteBtn.onclick = (e) => {
                e.stopPropagation(); // منع فتح النافذة مرة أخرى
                window.location.href = "files/EliteFont.zip"; // رابط التحميل
            };
        }
    });

    // وظيفة فتح النافذة
    window.openVoteModal = function(name, votes) {
        document.getElementById('modalFontName').innerText = name;
        // سيتم جلب الـ votes الحقيقية من Firebase تلقائياً عبر المستمع (on value)
        voteModal.style.display = 'flex';
    };

    // وظيفة إغلاق النافذة
    window.closeVoteModal = function() {
        voteModal.style.display = 'none';
        // لا نحتاج تصفير الشريط هنا لأن Firebase سيقوم بتحديثه عند الفتح القادم
    };

    // وظيفة تأكيد التصويت في Firebase (تمنع التكرار)
    window.confirmVote = function() {
        if (localStorage.getItem('voted_' + fontId)) {
            alert("يا مالك، لقد قمت بالتصويت مسبقاً لهذا الخط!");
            closeVoteModal();
            return;
        }

        // تحديث العداد بزيادة 1
        db.ref('votes/' + fontId + '/count').transaction((currentCount) => {
            return (currentCount || 0) + 1;
        }, (error, committed) => {
            if (committed) {
                localStorage.setItem('voted_' + fontId, 'true');
                alert("شكراً لك! تم احتساب صوتك.");
                closeVoteModal();
            } else {
                alert("حدث خطأ في الاتصال، تأكد من الـ Rules.");
            }
        });
    };
});