هذا دليل تقني شامل بصيغة \*\*Markdown\*\* يشرح كيفية دمج مكتبة \*\*FFmpeg.wasm\*\* في مشروعك لحل مشكلة الـ Metadata وضمان توافق الفيديوهات مع منصات التواصل الاجتماعي.

\---

\# دليل دمج FFmpeg.wasm لإصلاح فيديوهات Quran Reels v2

هذا الدليل مخصص لحل مشكلة ظهور مدة الفيديو 00:00 عند الرفع على Instagram أو TikTok. سنقوم بتحويل الفيديو من صيغة التسجيل الأولية (WebM غالباً) إلى صيغة \*\*MP4\*\* مع معالجة الـ \*\*Metadata\*\* ونقلها لبداية الملف (Faststart).

\#\# 1\. المتطلبات الأساسية (Prerequisites)

تعتمد مكتبة \`FFmpeg.wasm\` على ميزة في المتصفح تسمى \`SharedArrayBuffer\`. لكي تعمل، يجب أن يرسل الخادم (Server) ترويسات (Headers) أمان خاصة:  
\- \`Cross-Origin-Embedder-Policy: require-corp\`  
\- \`Cross-Origin-Opener-Policy: same-origin\`

\> \*\*ملاحظة:\*\* إذا كنت تستخدم \*\*Vite\*\* للتطوير، يمكنك إضافة هذه الترويسات في ملف \`vite.config.ts\`.

\---

\#\# 2\. تثبيت المكتبات المطلوبة

قم بتثبيت الإصدار الأحدث من FFmpeg.wasm (الإصدار 0.12 فما فوق يستخدم نظام الـ Hooks والـ Promises بشكل أفضل):

\`\`\`bash  
npm install @ffmpeg/ffmpeg @ffmpeg/util  
\`\`\`

\---

\#\# 3\. إعداد وظيفة التحويل (Implementation)

سنقوم بإنشاء وظيفة (Function) تستقبل الـ \`Blob\` الناتج من \`MediaRecorder\` وتقوم بمعالجته.

\#\#\# أ. استيراد المكتبات  
\`\`\`javascript  
import { FFmpeg } from '@ffmpeg/ffmpeg';  
import { fetchFile, toBlobURL } from '@ffmpeg/util';  
import { useRef, useState } from 'react';  
\`\`\`

\#\#\# ب. كود المعالجة الرئيسي  
هذا الكود يوضع داخل المكون (Component) الخاص بإنتاج الفيديو:

\`\`\`javascript  
const ffmpegRef \= useRef(new FFmpeg());

const processVideo \= async (webmBlob) \=\> {  
    const ffmpeg \= ffmpegRef.current;

    // 1\. تحميل ملفات FFmpeg Core من الـ CDN (لمرة واحدة فقط)  
    if (\!ffmpeg.loaded) {  
        const baseURL \= 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';  
        await ffmpeg.load({  
            coreURL: await toBlobURL(\`${baseURL}/ffmpeg-core.js\`, 'text/javascript'),  
            wasmURL: await toBlobURL(\`${baseURL}/ffmpeg-core.wasm\`, 'application/wasm'),  
        });  
    }

    // 2\. كتابة ملف الـ WebM (المسجل) في ذاكرة FFmpeg الافتراضية  
    await ffmpeg.writeFile('input.webm', await fetchFile(webmBlob));

    // 3\. تنفيذ أمر التحويل وإصلاح الـ Metadata  
    // \-c copy: لنسخ المسارات بدون إعادة ترميز (سريع جداً)  
    // \-movflags \+faststart: لنقل الـ Metadata لبداية الملف (حل مشكلة 00:00)  
    await ffmpeg.exec(\[  
        '-i', 'input.webm',  
        '-c', 'copy',   
        '-movflags', '+faststart',   
        'output.mp4'  
    \]);

    // 4\. قراءة الملف النهائي وتحويله إلى Blob جاهز للتحميل  
    const data \= await ffmpeg.readFile('output.mp4');  
    const mp4Blob \= new Blob(\[data.buffer\], { type: 'video/mp4' });  
      
    return mp4Blob;  
};  
\`\`\`

\---

\#\# 4\. تحديث آلية التصدير (Export Logic)

في زر "التسجيل والتصدير"، بدلاً من تحميل الفيديو فور توقف التسجيل، أضف خطوة المعالجة:

\`\`\`javascript  
mediaRecorder.onstop \= async () \=\> {  
    const webmBlob \= new Blob(chunks, { type: 'video/webm' });  
      
    setLoadingMessage("جاري تهيئة الفيديو للمشاركة..."); // تحديث واجهة المستخدم  
      
    try {  
        const finalMp4 \= await processVideo(webmBlob);  
          
        // إنشاء رابط تحميل للفيديو المعدل  
        const url \= URL.createObjectURL(finalMp4);  
        const a \= document.createElement('a');  
        a.href \= url;  
        a.download \= \`QuranReel\_${Date.now()}.mp4\`;  
        a.click();  
          
        toast.success("الفيديو جاهز للنشر على Instagram\!");  
    } catch (error) {  
        console.error("FFmpeg Error:", error);  
        toast.error("حدث خطأ أثناء معالجة الفيديو");  
    }  
};  
\`\`\`

\---

\#\# 5\. لماذا هذا الحل هو الأفضل؟

1\.  \*\*Faststart Atom:\*\* أمر \`-movflags \+faststart\` يقوم بوضع معلومات "طول الفيديو" وتنسيقه في أول بايتات الملف. مواقع مثل Instagram تبدأ بقراءة أول جزء من الملف، فإذا لم تجد هذه المعلومات، تظن أن الفيديو فارغ.  
2\.  \*\*Container Conversion:\*\* التحويل من WebM (الذي لا تفضله بعض المنصات) إلى MP4 (المعيار العالمي) يضمن عمل الفيديو على جميع المشغلات.  
3\.  \*\*Speed:\*\* باستخدام خيار \`-c copy\` (Stream Copy)، لن يقوم المتصفح بإعادة معالجة الصور (Rendering)، بل سيقوم فقط بتغيير "الغلاف" الخارجي للفيديو وإصلاح المعلومات، مما يجعل العملية تستغرق ثانية واحدة فقط.

\---

\#\# 6\. تنبيهات هامة (Troubleshooting)

\*   \*\*حجم الملفات:\*\* ملفات FFmpeg Core حجمها حوالي 30MB، سيتم تحميلها مرة واحدة عند أول عملية تصدير. يفضل عرض "شريط تحميل" للمستخدم.  
\*   \*\*مشكلة الـ Headers:\*\* إذا كنت ترفع التطبيق على \*\*Vercel\*\* أو \*\*Netlify\*\*، يجب عليك إضافة ملف إعدادات (مثل \`vercel.json\`) للتأكد من إرسال ترويسات الـ \`SharedArrayBuffer\`:

\`\`\`json  
{  
  "headers": \[  
    {  
      "source": "/(.\*)",  
      "headers": \[  
        { "key": "Cross-Origin-Embedder-Policy", "value": "require-corp" },  
        { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" }  
      \]  
    }  
  \]  
}  
\`\`\`

باستخدام هذا المسار، سيتحول تطبيق \*\*Quran Reels v2\*\* من أداة تجريبية إلى تطبيق احترافي ينتج فيديوهات متوافقة تماماً مع معايير منصات التواصل الاجتماعي الكبرى.  
