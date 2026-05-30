const API_URL = 'http://127.0.0.1:20128/v1/chat/completions';
const API_KEY = 'nrk-603e2f6bb6ec7801176ebd5af397338aa3256cccb3133c5f999d7be47ba08d50';
const MODEL = 'kr/claude-sonnet-4.6';

const templates = {
  email: {
    label: 'Email công việc',
    subtypes: ['formal', 'informal', 'từ chối', 'xin phép'],
    prompt: (subtype, situation) => `Viết một email công việc bằng tiếng Việt, kiểu ${subtype}. Tình huống: ${situation}. Yêu cầu: có tiêu đề email, lời chào, nội dung rõ ràng, lịch sự, kết thúc phù hợp. Không dài dòng.`
  },
  shortVideo: {
    label: 'Kịch bản TikTok/Reels',
    subtypes: ['hook + nội dung + CTA'],
    prompt: (_subtype, situation) => `Viết kịch bản TikTok/Reels tiếng Việt cho tình huống/chủ đề: ${situation}. Cấu trúc bắt buộc: 1) Hook 3 giây đầu, 2) Nội dung chính dạng gạch đầu dòng theo cảnh, 3) CTA cuối video. Giọng tự nhiên, dễ quay.`
  },
  weeklyReport: {
    label: 'Báo cáo tuần cho sếp',
    subtypes: ['ngắn gọn chuyên nghiệp'],
    prompt: (_subtype, situation) => `Soạn báo cáo tuần gửi sếp bằng tiếng Việt dựa trên mô tả: ${situation}. Cấu trúc: Tóm tắt tuần, Kết quả đạt được, Việc đang làm, Khó khăn/rủi ro, Kế hoạch tuần tới, Đề xuất hỗ trợ nếu có.`
  },
  proposal: {
    label: 'Đề xuất / xin phê duyệt',
    subtypes: ['đề xuất', 'xin phê duyệt'],
    prompt: (subtype, situation) => `Soạn văn bản ${subtype} bằng tiếng Việt cho tình huống: ${situation}. Cấu trúc: Bối cảnh, Lý do, Phương án đề xuất, Lợi ích, Chi phí/thời gian nếu có, Mong muốn phê duyệt, Lời cảm ơn.`
  },
  customerMessage: {
    label: 'Tin nhắn khách hàng',
    subtypes: ['chăm sóc', 'xử lý khiếu nại'],
    prompt: (subtype, situation) => `Viết tin nhắn ${subtype} khách hàng bằng tiếng Việt. Tình huống: ${situation}. Yêu cầu: ngắn gọn, thân thiện, có đồng cảm, đưa hướng xử lý rõ, tránh đổ lỗi.`
  }
};

const templateEl = document.getElementById('template');
const subtypeEl = document.getElementById('subtype');
const situationEl = document.getElementById('situation');
const outputEl = document.getElementById('output');
const statusEl = document.getElementById('status');
const generateBtn = document.getElementById('generateBtn');
const copyBtn = document.getElementById('copyBtn');

function setStatus(message, type = '') {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`.trim();
}

function renderSubtypes() {
  const current = templates[templateEl.value];
  subtypeEl.innerHTML = current.subtypes.map(item => `<option value="${item}">${item}</option>`).join('');
}

templateEl.addEventListener('change', renderSubtypes);
renderSubtypes();

generateBtn.addEventListener('click', async () => {
  const template = templates[templateEl.value];
  const subtype = subtypeEl.value;
  const situation = situationEl.value.trim();

  if (!situation) {
    setStatus('Vui lòng nhập mô tả tình huống trước.', 'error');
    situationEl.focus();
    return;
  }

  generateBtn.disabled = true;
  copyBtn.disabled = true;
  outputEl.value = '';
  setStatus('Đang tạo văn bản...', '');

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: 'Bạn là VănAI, trợ lý viết lách cho dân văn phòng Việt Nam. Trả lời bằng tiếng Việt, rõ ràng, có thể dùng ngay.' },
          { role: 'user', content: template.prompt(subtype, situation) }
        ],
        temperature: 0.7,
        max_tokens: 1200
      })
    });

    if (!res.ok) throw new Error(`API lỗi ${res.status}`);
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error('API không trả về nội dung.');
    outputEl.value = text;
    copyBtn.disabled = false;
    setStatus('Đã tạo xong. Bạn có thể chỉnh sửa hoặc sao chép.', 'ok');
  } catch (err) {
    setStatus(`Không tạo được nội dung: ${err.message}. Nếu mở file trực tiếp bị CORS, hãy chạy qua local server.`, 'error');
  } finally {
    generateBtn.disabled = false;
  }
});

copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(outputEl.value);
    setStatus('Đã sao chép vào clipboard.', 'ok');
  } catch {
    outputEl.select();
    document.execCommand('copy');
    setStatus('Đã sao chép.', 'ok');
  }
});
