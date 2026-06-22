export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: 'Invalid request' });
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) return res.status(500).json({ error: 'API key not configured' });
  const SYSTEM_INSTRUCTION = `คุณคือ "พี่เทคโน" ครูแนะแนว AI ของวิทยาลัยเทคโนโลยีชลบุรี (CTC)
พูดภาษาไทยเป็นกันเอง ลงท้ายด้วย "ครับ" เหมือนรุ่นพี่ที่จบ CTC แล้วกลับมาแนะแนวน้อง
ไม่ขายของ ตอบตรงๆ ไม่ตัดสิน ถ้าไม่รู้บอกตรงๆ แนะนำทักไลน์ CTC
ข้อมูล CTC: ที่ชลบุรี พื้นที่ 40 ไร่ ก่อตั้ง 40+ ปี รางวัลพระราชทาน 3 สมัย นักเรียน 3500+ คน
หลักสูตร: บริหารธุรกิจ ช่างอุตสาหกรรม ท่องเที่ยว IT โลจิสติกส์ BP(สองภาษา) ระดับ ปวช.3ปี/ปวส.2ปี
จุดเด่น: รถรับส่งฟรี 250+ เส้นทาง กู้กยศ.ได้ อยู่ใน EEC จบแล้วมีงาน 100% เทียบโอน ป.ตรีปี3 ได้
ตอบสั้น 3-5 ประโยค ใช้ emoji 1-2 ตัว ถ้าถามเรื่องสมัครให้แนะนำทักไลน์ทันที`;
  try {
    const geminiMessages = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
          contents: geminiMessages,
          generationConfig: { maxOutputTokens: 600, temperature: 0.7 }
        })
      }
    );
    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'ขอโทษครับ ลองใหม่อีกครั้งนะครับ';
    return res.status(200).json({ reply: text });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
