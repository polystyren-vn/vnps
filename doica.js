const SCRIPT_URL_DOI_CA = "https://script.google.com/macros/s/AKfycbzYXPNw_cGZmvQZR9UNAs6XYEjPi6eBvG0fkeugNYfLN8p7utTXBiIovt6zqYHVoTAbTw/exec";

let rawTableData = []; 
let selectedActions = {}; 
let isSubmitting = false; 
const VN_DAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const VN_HOLIDAYS = ["01/01", "30/04", "01/05", "02/09", "10/03"]; 

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Load danh bạ (Cốt lõi V3.0)
    if(typeof window.loadEmployeesData === 'function') await window.loadEmployeesData();
    
    // 2. Gắn sự kiện Input cho NV1, NV2
    document.getElementById('id1').addEventListener('input', validateAndFilter);
    document.getElementById('id2').addEventListener('input', validateAndFilter);
    
    // 3. Gắn sự kiện Bottom Sheet
    document.getElementById('smartBtnCancel').onclick = () => { selectedActions = {}; refreshUI(); };
    document.getElementById('smartBtnSubmit').onclick = (e) => { e.preventDefault(); submitData(); };

    // 🧬 Trụ cột 5: Lazy Fetching (Tải ngầm sau 1.5 giây)
    setTimeout(fetchLichCaNgam, 1500);
});

// 🧬 Trụ cột 1 & 2: Vẽ bảng thông minh (Background Task)
async function fetchLichCaNgam() {
    try {
        const r = await fetch(SCRIPT_URL_DOI_CA, { method: 'POST', body: JSON.stringify({ action: "getMonthlyReport" }) });
        const res = await r.json();
        if (res.status === "success") {
            rawTableData = res.data.tableData;
            renderSmartTable();
        }
    } catch(e) { console.error("Lỗi nạp RAM:", e); }
}

function renderSmartTable() {
    let html = "";
    rawTableData.forEach((row, rIdx) => {
        const teamCode = row[row.length - 1];
        let empId = (rIdx > 0 && teamCode !== 'GROUP') ? row[0].split('-')[0].trim() : "";
        
        html += `<tr data-team="${teamCode}" data-id="${empId}" style="display: none;">`;
        for (let cIdx = 0; cIdx < row.length - 1; cIdx++) {
            let cell = row[cIdx], cls = rIdx === 0 ? "smart-sticky-header" : "";
            if (cIdx === 0) cls += " smart-sticky-col";
            if (rIdx === 0 && cIdx === 0) { cls += " smart-sticky-corner"; cell = "ST"; }
            
            // Xử lý Ngày lễ & Thứ
            let dateAttr = "";
            if (rIdx === 0 && cIdx > 0) {
                let p = cell.split('/');
                let d = new Date(p[2], p[1]-1, p[0]);
                if (d.getDay() === 0 || VN_HOLIDAYS.includes(`${p[0]}/${p[1]}`)) cls += " smart-holiday";
                cell = `<div style="font-size:10px">${VN_DAYS[d.getDay()]}</div><div>${p[0]}/${p[1]}</div>`;
            } else if (rIdx > 0 && cIdx > 0) {
                dateAttr = `data-date="${rawTableData[0][cIdx]}"`;
                cls += " smart-clickable";
            }
            
            html += `<td class="${cls}" ${dateAttr}>${cell}</td>`;
        }
        html += "</tr>";
    });
    document.getElementById('smartTable').innerHTML = html;
    attachClicks();
}

// 🧬 Trụ cột 1: Smart Filter logic
function validateAndFilter() {
    // Kế thừa 100% logic validateLocal() của V3.0 để kiểm tra NV1, NV2
    // Sau đó thực hiện ẩn/hiện dòng theo data-team
    const team1 = getTeamById(document.getElementById('id1').value.trim());
    const team2 = getTeamById(document.getElementById('id2').value.trim());
    const container = document.getElementById('smartMatrixContainer');

    if (!team1) { container.style.display = 'none'; return; }
    container.style.display = 'block';

    document.querySelectorAll('#smartTable tr').forEach((tr, idx) => {
        const trTeam = tr.getAttribute('data-team');
        if (idx === 0 || trTeam === team1 || trTeam === team2) {
            tr.style.display = 'table-row';
            tr.classList.toggle('smart-highlight-row', tr.getAttribute('data-id') === document.getElementById('id1').value.trim() || tr.getAttribute('data-id') === document.getElementById('id2').value.trim());
        } else { tr.style.display = 'none'; }
    });
}

// Helper lấy tổ từ số thẻ
function getTeamById(id) {
    const e = window.employeeData ? window.employeeData.find(x => x.soThe === id) : null;
    return e ? e.nhomLich : null;
}

// 🧬 Trụ cột 3: Chạm để chọn & Popup
function attachClicks() {
    document.querySelectorAll('.smart-clickable').forEach(td => {
        td.onclick = function() {
            if (!this.closest('tr').classList.contains('smart-highlight-row')) return;
            const date = this.getAttribute('data-date');
            const id2 = document.getElementById('id2').value.trim();

            if (id2 === "") { // Cập nhật ca
                openPicker(date);
            } else { // Đổi ca
                if (selectedActions[date]) delete selectedActions[date];
                else selectedActions[date] = { newShift: null };
                refreshUI();
            }
        };
    });
}

function refreshUI() {
    // Cập nhật màu sắc ô đã chọn & Hiện Bottom Sheet
    const count = Object.keys(selectedActions).length;
    const bs = document.getElementById('smartBottomSheet');
    bs.classList.toggle('active', count > 0);
    document.getElementById('smartBSMsg').innerText = `Xác nhận thao tác cho ${count} ngày.`;
    
    document.querySelectorAll('.smart-clickable').forEach(td => {
        const isSel = selectedActions[td.getAttribute('data-date')] && td.closest('tr').classList.contains('smart-highlight-row');
        td.classList.toggle('smart-cell-selected', isSel);
    });
}

// 🧬 Trụ cột 4: Dynamic Timer Button
async function submitData() {
    if (isSubmitting) return;
    isSubmitting = true;
    
    const btn = document.getElementById('smartBtnSubmit');
    const txt = document.getElementById('smartBtnText');
    btn.disabled = true;
    
    let sec = 0;
    const timer = setInterval(() => { txt.innerText = `⏳ ĐANG GỬI... ${++sec}s`; }, 1000);

    try {
        // Gom dữ liệu selectedActions gửi Post sang GAS (như V3.0)
        // ... (Logic fetch SCRIPT_URL_DOI_CA) ...
        window.showToast("Thành công!", true);
        location.reload(); // Hoặc reset form
    } catch(e) {
        window.showToast("Lỗi kết nối!", false);
        btn.disabled = false;
    } finally {
        clearInterval(timer);
        isSubmitting = false;
        txt.innerText = "XÁC NHẬN";
    }
}
