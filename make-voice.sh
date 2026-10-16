#!/usr/bin/env bash
# يولّد التعليق الصوتي بصوت عربي عبر edge-tts (أداة غير رسمية تستخدم خدمة Microsoft Edge TTS).
# الاستخدام:  bash make-voice.sh
# أصوات عربية: ar-SA-HamedNeural (رجل) · ar-SA-ZariyahNeural (امرأة) · ar-EG-SalmaNeural · ar-EG-ShakirNeural
set -e
VOICE="ar-SA-HamedNeural"
RATE="+0%"   # إن كان الصوت أطول من المشهد جرّب -0% إلى +10%
mkdir -p public
pip install -q edge-tts

say() { edge-tts --voice "$VOICE" --rate="$RATE" --text "$2" --write-media "public/vo$1.mp3"; echo "vo$1.mp3"; }

say 1 "عندما تلمس أيقونة تطبيق، تبدأ سلسلة من الأحداث في أجزاء من الثانية."
say 2 "تُرسل الشاشة مكان اللمسة إلى نظام التشغيل، فيُنشئ عملية جديدة للتطبيق."
say 3 "ثم يُنسخ كود التطبيق من التخزين البطيء إلى الذاكرة السريعة."
say 4 "والمعالج ينفّذ التعليمات بمليارات الدورات في كل ثانية."
say 5 "وبطاقة الرسوميات ترسم الواجهة إطارًا بعد إطار."
say 6 "كل هذا يحدث في أقل من ثانية."
