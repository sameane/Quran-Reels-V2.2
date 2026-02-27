# آلية عمل Deep Transcode (إعادة الترميز العميق)

هذا المقطع البرمجي يوضح كيفية تنفيذ عملية **Deep Transcode** باستخدام مكتبة `fluent-ffmpeg` في بيئة Node.js. تُستخدم هذه العملية لضمان توافق الفيديو مع جميع المتصفحات والأجهزة، وحل مشاكل معدل الإطارات المتغير (VFR).

### المقطع البرمجي (Snippet)

```typescript
import ffmpeg from "fluent-ffmpeg";

/**
 * تنفيذ عملية Deep Transcode لإصلاح مشاكل VFR وضمان FastStart
 * @param inputPath مسار ملف الفيديو المرفوع
 * @param outputPath مسار حفظ الملف المعالج
 */
function performDeepTranscode(inputPath: string, outputPath: string) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      // 1. استخدام ترميز H.264 القياسي
      .videoCodec("libx264")
      
      // 2. ضبط تنسيق البكسل لضمان التوافق (YUV 4:2:0)
      // 3. إضافة خاصية FastStart لنقل Moov Atom إلى بداية الملف
      .outputOptions([
        "-pix_fmt yuv420p",
        "-movflags +faststart"
      ])
      
      .on("start", (commandLine) => {
        console.log("بدء المعالجة العميقة: " + commandLine);
      })
      .on("progress", (progress) => {
        console.log(`نسبة الإنجاز: ${progress.percent}%`);
      })
      .on("error", (err) => {
        console.error("خطأ في المعالجة:", err);
        reject(err);
      })
      .on("end", () => {
        console.log("تمت المعالجة بنجاح!");
        resolve(outputPath);
      })
      .save(outputPath);
  });
}
```

### شرح الخيارات المستخدمة:
- **`libx264`**: المحول البرمجي الأكثر شيوعاً وتوافقاً لترميز الفيديو.
- **`-pix_fmt yuv420p`**: يضمن أن الفيديو سيعمل على مشغلات الفيديو القديمة والمتصفحات التي لا تدعم التنسيقات المتقدمة (مثل 10-bit).
- **`-movflags +faststart`**: يقوم بنقل بيانات التعريف (Metadata/Moov Atom) إلى بداية الملف، مما يسمح للفيديو بالبدء في التشغيل فوراً عند البث عبر الإنترنت دون الحاجة لتحميل الملف بالكامل.
