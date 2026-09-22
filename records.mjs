const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

export default async function handler(request) {
  if (request.method === "OPTIONS") return new Response("", { status: 204, headers });
  if (request.method !== "POST") return Response.json({ error: "只接受 POST 請求" }, { status: 405, headers });
  try {
    const body = await request.json();
    if (body.action === "submit") {
      const record = {
        student_name: String(body.studentName || "").trim(),
        student_class: String(body.studentClass || "").trim(),
        seat_number: String(body.seatNumber || "").trim(),
        lesson: String(body.lesson || "").trim(),
        score: Number(body.score || 0),
        total: Number(body.total || 0),
        percentage: Number(body.percentage || 0),
        answers: Array.isArray(body.answers) ? body.answers : []
      };
      if (!record.student_name || !record.student_class || !/^\d+$/.test(record.seat_number) || !record.lesson || !record.total) {
        return Response.json({ error: "成績資料不完整" }, { status: 400, headers });
      }
      const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/quiz_records`, {
        method: "POST",
        headers: { apikey: process.env.SUPABASE_SECRET_KEY, Authorization: `Bearer ${process.env.SUPABASE_SECRET_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify(record)
      });
      if (!response.ok) return Response.json({ error: await response.text() }, { status: 500, headers });
      return Response.json({ success: true }, { headers });
    }
    if (body.action === "list") {
      if (body.password !== process.env.TEACHER_PASSWORD) return Response.json({ error: "老師密碼錯誤" }, { status: 401, headers });
      const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/quiz_records?select=*&order=created_at.desc`, { headers: { apikey: process.env.SUPABASE_SECRET_KEY, Authorization: `Bearer ${process.env.SUPABASE_SECRET_KEY}` } });
      if (!response.ok) return Response.json({ error: "無法取得成績紀錄" }, { status: 500, headers });
      return Response.json({ records: await response.json() }, { headers });
    }
    return Response.json({ error: "不支援的操作" }, { status: 400, headers });
  } catch {
    return Response.json({ error: "伺服器發生錯誤" }, { status: 500, headers });
  }
}

export const config = { path: "/api/records" };
