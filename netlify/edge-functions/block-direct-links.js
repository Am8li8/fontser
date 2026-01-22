export default async (request, context) => {
  const referrer = request.headers.get("referer");
  const url = new URL(request.url);

  // إذا كان المستخدم يحاول الوصول لملفات داخل مجلد files
  if (url.pathname.startsWith("/files/")) {
    
    // التحقق: هل الطلب جاي من موقعك؟
    // استبدل fontser.netlify.app برابط موقعك
    if (!referrer || !referrer.includes("fontser.netlify.app")) {
      return new Response("ممنوع التحميل المباشر. يجب التحميل من داخل الموقع الرسمي.", {
        status: 403,
      });
    }
  }

  // إذا كان الطلب شرعي من موقعك، اتركه يمر بسلام
  return context.next();
};