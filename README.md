# ماذا يحدث داخل هاتفك عندما تفتح تطبيقًا؟

فيديو 30 ثانية، 1920×1080، 30fps، بستايل pen plotter. مبني بـ Remotion.

## الملفات (كلها في جذر المستودع)
package.json · tsconfig.json · remotion.config.ts · index.ts · Root.tsx · InsidePhone.tsx · README.md

## التصدير من الهاتف عبر GitHub Codespaces
1. أنشئ مستودعًا جديدًا على GitHub (فعّل "Desktop site" في متصفح الهاتف إن لزم).
2. Add file ← Upload files، واختر كل الملفات أعلاه دفعة واحدة، ثم Commit.
3. Code ← Codespaces ← Create codespace on main، وانتظر فتح المحرر.
4. في الطرفية (Terminal):

```bash
sudo apt-get update && sudo apt-get install -y libnss3 libdbus-1-3 libatk1.0-0 libgbm-dev libasound2 libxrandr2 libxkbcommon-dev libxfixes3 libxcomposite1 libxdamage1 libatk-bridge2.0-0 libpango-1.0-0 libcairo2 libcups2
npm install
npm run render
```

5. بعد انتهاء التصدير سيظهر `out/inside-phone.mp4` في مستكشف الملفات. اضغط عليه مطولًا (أو انقر يمينًا) واختر Download.

## أوامر أخرى
- `npm run studio` — معاينة تفاعلية (تفتح عبر Ports في Codespaces).
- `npm run still` — صورة ثابتة من منتصف الفيديو للتأكد سريعًا من الستايل.

## تعديل الستايل
الألوان في أعلى `InsidePhone.tsx`: INK و RED و PAPER و GRID.
