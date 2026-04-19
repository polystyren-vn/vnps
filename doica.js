
const SCRIPT_URL_DOI_CA = "https://script.google.com/macros/s/AKfycbzYXPNw_cGZmvQZR9UNAs6XYEjPi6eBvG0fkeugNYfLN8p7utTXBiIovt6zqYHVoTAbTw/exec"; 
 
let currentViTri = "";
let isId1Ok = false, isId2Ok = true;
let scheduleTimeout; 
window.shiftDict = {}; // Cache lưu dữ liệu lịch 1 lần tải duy nhất

window.clearField = (id) => { const i = document.getElementById(id); i.value = ''; i.dispatchEvent(new Event('input')); };

document.addEventListener("DOMContentLoaded", async () => {
    await window.loadEmployeesData(); 
    document.getElementById('id1').addEventListener('input', validateLocal);
    document.getElementById('id2').addEventListener('input', validateLocal);
    document.getElementById('startDate').addEventListener('change', checkInputs);
    
    // Tải bảng tháng và kẹp luôn dữ liệu 7 ngày về
    renderMonthlyTable(); 
});

function validateLocal() {
    const val1 = document.getElementById('id1').value.trim();
    const val2 = document.getElementById('id2').value.trim();
    const msg1 = document.getElementById('msg-id1'); const msg2 = document.getElementById('msg-id2');

    if (val1 === "") { 
        msg1.innerHTML = ""; isId1Ok = false; document.getElementById('id1').classList.remove('is-valid', 'is-invalid');
    } else if (window.employeeData.find(e => e.soThe === val1)) {
        const emp1 = window.employeeData.find(e => e.soThe === val1);
        currentViTri = emp1.viTri; // Lưu Vị Trí để load loại Ca (A,B,C hay B,C,D)
        msg1.innerHTML = `<span class="success-text">✅ ${emp1.hoTen} (${emp1.viTri})</span>`;
        document.getElementById('id1').className = 'is-valid'; isId1Ok = true;
    } else {
        msg1.innerHTML = '<span class="error-text">❌ Số thẻ không tồn tại</span>';
        document.getElementById('id1').className = 'is-invalid'; isId1Ok = false;
    }

    if (val2 === "") { 
        msg2.innerHTML = ""; isId2Ok = true; document.getElementById('id2').classList.remove('is-valid', 'is-invalid');
    } else if (window.employeeData.find(e => e.soThe === val2)) {
        const emp1 = window.employeeData.find(e => e.soThe === val1);
        const emp2 = window.employeeData.find(e => e.soThe === val2);
        
        if (val2 === val1) {
            msg2.innerHTML = '<span class="error-text">❌ Trùng số thẻ NV1</span>';
            document.getElementById('id2').className = 'is-invalid'; isId2Ok = false;
        } else if (isId1Ok && emp1.viTri !== emp2.viTri) { 
            msg2.innerHTML = `<span class="error-text">❌ Khác vị trí (${emp2.viTri})</span>`;
            document.getElementById('id2').className = 'is-invalid'; isId2Ok = false;
        } else {
            msg2.innerHTML = `<span class="success-text">✅ ${emp2.hoTen} (${emp2.viTri})</span>`;
            document.getElementById('id2').className = 'is-valid'; isId2Ok = true;
        }
    } else {
        msg2.innerHTML = '<span class="error-text">❌ Số thẻ không tồn tại</span>';
        document.getElementById('id2').className = 'is-invalid'; isId2Ok = false;
    }
    checkInputs();
}

// 7. TỰ ĐỘNG TẢI LỊCH (AUTO-LOAD BẰNG CACHE) NẾU ĐỦ ĐIỀU KIỆN
function checkInputs() {
    const startD = document.getElementById('startDate').value;
    const canView = isId1Ok && isId2Ok && startD !== "";
    
    if (canView) {
        clearTimeout(scheduleTimeout);
        scheduleTimeout = setTimeout(() => { loadScheduleOffline(); }, 300); // Đợi gõ xong 0.3s tải
    } else {
        document.getElementById('grid7').style.display = 'none';
        document.getElementById('btnSave').style.display = 'none';
    }
}

// LẤY DỮ LIỆU TỪ RAM (0 GIÂY), KHÔNG GỌI API API getShiftData NỮA
function loadScheduleOffline() {
    document.getElementById('loadingSchedule').style.display = 'block';
    document.getElementById('grid7').style.display = 'none';
    document.getElementById('btnSave').style.display = 'none';
    
    const id1 = document.getElementById('id1').value.trim();
    const id2 = document.getElementById('id2').value.trim();
    const startD = document.getElementById('startDate').value;

    const shifts = [];
    for (let i = 0; i < 7; i++) {
        let d = new Date(startD);
        d.setDate(d.getDate() + i);
        // Tạo chuỗi yyyy-MM-dd theo Local Time máy người dùng
        let y = d.getFullYear(); let m = String(d.getMonth() + 1).padStart(2, '0'); let day = String(d.getDate()).padStart(2, '0');
        let dString = `${y}-${m}-${day}`;
        let isSun = d.getDay() === 0;

        let s1 = (window.shiftDict[id1] && window.shiftDict[id1][dString]) ? window.shiftDict[id1][dString] : "N/A";
        let s2 = id2 ? ((window.shiftDict[id2] && window.shiftDict[id2][dString]) ? window.shiftDict[id2][dString] : "N/A") : null;

        shifts.push({ date: dString, s1: s1, s2: s2, isSun: isSun });
    }

    setTimeout(() => {
        document.getElementById('loadingSchedule').style.display = 'none';
        showGrid(shifts, id2);
    }, 100);
}

function showGrid(data, hasId2) {
    const c = document.getElementById('grid7'); const id1 = document.getElementById('id1').value;
    c.style.display = 'block'; c.innerHTML = `<div class="grid-header"><div>NGÀY</div><div>${id1}</div><div>${hasId2 ? hasId2 : 'CA MỚI'}</div></div>`;
    
    data.forEach(day => {
        let ds = day.date.split('-').reverse().slice(0, 2).join('/');
        let r = document.createElement('div');
        r.className = `day-row ${day.isSun ? 'sunday' : ''}`; r.setAttribute('data-date', day.date);
        if (hasId2) { r.onclick = function() { this.classList.toggle('row-selected'); updateSaveButtonState(); }; r.style.cursor = "pointer"; }
        
        let optN = '<option value="N">N</option>';
        let opt = (currentViTri.includes("DB") || currentViTri.includes("DongBao")) 
            ? `<option value="B">B</option><option value="C">C</option><option value="D">D</option>${optN}` 
            : `<option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>${optN}`;
            
        r.innerHTML = `<div class="col-date">${ds}</div><div class="col-nv1"><span class="badge">${day.s1}</span></div><div class="col-nv2">${hasId2 ? `<span class="badge">${day.s2}</span>` : `<select class="new-shift" onclick="event.stopPropagation()" onchange="handleDropdownChange(this)"><option value="">-</option>${opt}</select>`}</div>`;
        c.appendChild(r);
    });
    
    document.getElementById('btnSaveText').innerText = hasId2 ? "XÁC NHẬN ĐỔI CA" : "XÁC NHẬN CẬP NHẬT";
    document.getElementById('btnSave').style.display = 'flex'; updateSaveButtonState();
}

window.handleDropdownChange = function(select) {
    const row = select.closest('.day-row');
    if (select.value !== "") row.classList.add('row-selected'); else row.classList.remove('row-selected');
    updateSaveButtonState();
};

function updateSaveButtonState() {
    const btnSave = document.getElementById('btnSave'), id2 = document.getElementById('id2').value.trim(), selectedRows = document.querySelectorAll('.day-row.row-selected');
    if (selectedRows.length === 0) { btnSave.disabled = true; btnSave.style.opacity = "0.5"; return; }
    let allValid = true;
    if (!id2) { selectedRows.forEach(row => { const select = row.querySelector('.new-shift'); if (!select || !select.value) allValid = false; }); }
    btnSave.disabled = !allValid; btnSave.style.opacity = allValid ? "1" : "0.5";
}

window.submitData = async function() {
    const btn = document.getElementById('btnSave'), sp = document.getElementById('spinner-save'), txt = document.getElementById('btnSaveText');
    btn.disabled = true; txt.style.display = 'none'; sp.style.display = 'block';
    
    const selectedRows = document.querySelectorAll('.day-row.row-selected'); const selectedDays = [];
    selectedRows.forEach(row => { selectedDays.push({ date: row.getAttribute('data-date'), newShift: row.querySelector('.new-shift')?.value || null }); });

    const payload = { action: "updateShifts", id1: document.getElementById('id1').value, id2: document.getElementById('id2').value, selectedDays: selectedDays };

    try {
        const r = await fetch(SCRIPT_URL_DOI_CA, { method: 'POST', body: JSON.stringify(payload) });
        const res = await r.json();
        if (res.status === "success") { 
            window.showToast("Cập nhật thành công!", true); 
            setTimeout(() => { renderMonthlyTable(); checkInputs(); }, 1000); 
        } 
        else { window.showToast(res.message, false); btn.disabled = false;}
    } catch (e) { window.showToast("Lỗi mạng!", false); btn.disabled = false;}
    finally { txt.style.display = 'block'; sp.style.display = 'none'; }
};

// RENDER BẢNG 1 LẦN VÀ LƯU DICTIONARY
async function renderMonthlyTable() {
    try {
        const r = await fetch(SCRIPT_URL_DOI_CA, { method: 'POST', body: JSON.stringify({ action: "getMonthlyReport" }) });
        const res = await r.json();
        if (res.status === "success" && res.data) {
            // Lưu Cache
            window.shiftDict = res.data.shiftDict || {};
            
            // Render HTML
            document.getElementById('monthlyTitle').innerHTML = "LỊCH THÁNG " + res.data.monthYear;
            let html = "";
            res.data.tableData.forEach((row, rIdx) => {
                const isHeader = rIdx === 0;
                const nhomLichFlag = row[row.length - 1]; // Lấy cờ (GROUP, QL, hoặc T)
                const isTeamRow = nhomLichFlag === "GROUP"; 
                const isQuanLy = nhomLichFlag === "QL"; 
                
                html += `<tr class="${isTeamRow ? 'row-goc' : ''}">`;
                for (let cIdx = 0; cIdx < row.length - 1; cIdx++) { // Ẩn cột cờ cuối cùng đi
                    let cell = row[cIdx]; 
                    let className = isHeader ? "sticky-header" : (cIdx === 0 ? "sticky-col" : "");
                    
                    if (isTeamRow && cIdx === 0) className += " team-label"; 
                    
                    // Highlights xanh lá chỉ cho lính và khi có thay đổi
                    if (!isHeader && !isTeamRow && !isQuanLy && cIdx > 0 && cell !== "") { 
                        className += " cell-changed"; 
                    }
                    html += `<td class="${className}">${cell}</td>`;
                }
                html += "</tr>";
            });
            document.getElementById('monthlyTable').innerHTML = html;
        }
    } catch(e) {}
}
