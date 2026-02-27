# آلية جلب فيديوهات الخلفية (Video Fetching Logic)

يحتوي هذا الملف على مقتطف كود (Snippet) يوضح كيفية تنفيذ آلية الجلب المتسلسل (Waterfall) لفيديوهات الخلفية من مصادر متعددة لضمان استقرار التطبيق.

## الكود المصدري (Node.js/Express)

```typescript
import express from "express";
import fs from "fs";
import path from "path";

const app = express();
const assetsPath = path.join(__dirname, "assets");

app.get("/api/videos", async (req, res) => {
  const { keyword, count = 3 } = req.query;
  
  // مفاتيح الوصول والمعرفات
  const PEXELS_API_KEY = 'YOUR_PEXELS_KEY';
  const PEXELS_COLLECTION_ID = 'ynfjbj8';
  const PIXABAY_API_KEY = 'YOUR_PIXABAY_KEY';

  // 1. وظيفة الجلب من Pexels (المجموعة المحددة)
  const fetchFromPexels = async () => {
    const url = `https://api.pexels.com/v1/collections/${PEXELS_COLLECTION_ID}?per_page=80`;
    const response = await fetch(url, {
      headers: { Authorization: PEXELS_API_KEY },
    });
    if (!response.ok) throw new Error('Pexels failed');
    const data = await response.json();
    const videos = (data.media || []).filter((item: any) => item.type === 'Video');
    return videos.sort(() => 0.5 - Math.random()).slice(0, Number(count));
  };

  // 2. وظيفة الجلب من Pixabay (بحث مخصص)
  const fetchFromPixabay = async () => {
    const query = 'quran background';
    const url = `https://pixabay.com/api/videos/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(query)}&per_page=20&orientation=vertical`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Pixabay failed');
    const data = await response.json();
    // تحويل البيانات لتتوافق مع هيكل التطبيق
    return (data.hits || []).map((hit: any) => ({
      id: hit.id,
      video_files: [{ link: hit.videos.medium.url }]
    }));
  };

  // 3. وظيفة الجلب من المجلد المحلي (Assets)
  const fetchFromLocalAssets = () => {
    const files = fs.readdirSync(assetsPath);
    const videoFiles = files.filter(f => f.endsWith('.mp4'));
    return videoFiles.sort(() => 0.5 - Math.random()).slice(0, Number(count)).map(file => ({
      id: `local-${file}`,
      video_files: [{ link: `/assets/${file}` }]
    }));
  };

  // التنفيذ المتسلسل (Waterfall)
  try {
    try {
      // المحاولة الأولى: Pexels
      const pexelsVideos = await fetchFromPexels();
      if (pexelsVideos.length > 0) return res.json(pexelsVideos);
      throw new Error('No Pexels videos');
    } catch (e) {
      console.warn('Trying Pixabay...');
      try {
        // المحاولة الثانية: Pixabay
        const pixabayVideos = await fetchFromPixabay();
        if (pixabayVideos.length > 0) return res.json(pixabayVideos);
        throw new Error('No Pixabay videos');
      } catch (e2) {
        // المحاولة الأخيرة: المجلد المحلي
        console.warn('Using local assets...');
        const localVideos = fetchFromLocalAssets();
        res.json(localVideos);
      }
    }
  } catch (error) {
    res.status(500).json({ error: 'All sources failed' });
  }
});
```

## شرح الآلية:
1.  **Pexels API**: هي المصدر الأساسي، حيث يتم استهداف مجموعة (Collection) محددة مسبقاً لضمان جودة المحتوى.
2.  **Pixabay API**: تعمل كخيار احتياطي أول في حال تجاوز حدود الطلبات (Rate Limit) أو تعطل خادم Pexels.
3.  **Local Assets**: هو الملاذ الأخير؛ حيث يتم فحص مجلد `assets` في الخادم واستخدام الفيديوهات المخزنة فيه يدوياً، مما يضمن عمل التطبيق حتى بدون اتصال بالإنترنت لمصادر الفيديوهات.
