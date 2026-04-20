const SCRIPT_URL_DOI_CA = "https://script.google.com/macros/s/AKfycbzYXPNw_cGZmvQZR9UNAs6XYEjPi6eBvG0fkeugNYfLN8p7utTXBiIovt6zqYHVoTAbTw/exec"; 
let currentViTri = ""; let isId1Ok = false, isId2Ok = true; window.shiftDict = {}; 

window.clearField = (id) => { const i = document.getElementById(id); i.value = ''; i.dispatchEvent(new Event('input')); };

document.addEventListener("DOMContentLoaded", async () => {
    await window.loadEmployeesData(); 
    document.getElementById('id1').addEventListener('input', validateLocal);
    document.getElementById('id2').addEventListener('input', validateLocal);
    document.getElementById('startDate').addEventListener('change', updateGridState);
    renderEmptyGrid(); renderMonthlyTable(); 
});

function validateLocal() {
    const val1 = document.getElementById('id1').value.trim(), val2 = document.getElementById('id2').value.trim();
    const msg1 = document.getElementById('msg-id1'), msg2 = document.getElementById('msg-id2');

    if (val1 === "") { msg1.innerHTML = ""; isId1Ok = false; document.getElementById('id1').classList.remove('is-valid', 'is-invalid'); } 
    else {
        const emp1 = window.employeeData.find(e => e.soThe === val1);
        if (emp1) { currentViTri = emp1.viTri; msg1.innerHTML = `<span class="success-text">✅ ${emp1.hoTen} (${emp1.viTri})</span>`; document.getElementById('id1').className = 'is-valid'; isId1Ok = true; }
        else { msg1.innerHTML = '<span class="error-text">❌ Không tồn tại</span>'; document.getElementById('id1').className = 'is-invalid'; isId1Ok = false; }
    }

    if (val2 === "") { msg2.innerHTML = ""; isId2Ok = true; document.getElementById('id2').classList.remove('is-valid', 'is-invalid'); } 
    else {
        const emp1 = window.employeeData.find(e => e.soThe === val1);
        const emp2 = window.employeeData.find(e => e.soThe === val2);
        if (val2 === val1) { msg2.innerHTML = '<span class="error-text">❌ Trùng NV1</span>'; document.getElementById('id2').className = 'is-invalid'; isId2Ok = false; } 
        else if (isId1Ok && emp1.viTri !== emp2.viTri) { msg2.innerHTML = `<span class="error-text">❌ Khác vị trí (${emp2.viTri})</span>`; document.getElementById('id2').className = 'is-invalid'; isId2Ok = false; } 
        else if (emp2) { msg2.innerHTML = `<span class="success-text">✅ ${emp2.hoTen} (${emp2.viTri})</span>`; document.getElementById('id2').className = 'is-valid'; isId2Ok = true; }
        else { msg2.innerHTML = '<span class="error-text">❌ Không tồn tại</span>'; document.getElementById('id2').className = 'is-invalid'; isId2Ok = false; }
    }
    updateGridState();
}

function renderEmptyGrid() {
    const tbody = document.getElementById('grid-body'); let html = '';
    for(let i=0; i<7; i++) html += `<div class="day-row"><div class="col-date empty-cell">-</div><div class="col-nv1 empty-cell">-</div><div class="col-nv2 empty-cell">-</div></div>`;
    tbody.innerHTML = html;
}

function updateGridState() {
    const startD = document.getElementById('startDate').value, id1 = document.getElementById('id1').value.trim(), id2 = document.getElementById('id2').value.trim(), tbody = document.getElementById('grid-body');
    document.getElementById('gh-nv1').innerText = (isId1Ok && id1) ? id1 : "NV1";
    document.getElementById('gh-nv2').innerText = (isId2Ok && id2) ? id2 : (isId1Ok && id1 ? "CA MỚI" : "NV2");
    
    if (!startD) { renderEmptyGrid(); updateSaveButtonState(); return; }

    let html = '';
    for (let i = 0; i < 7; i++) {
        let d = new Date(startD); d.setDate(d.getDate() + i);
        let dStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        let s1Html = isId1Ok ? `<span class="badge">${(window.shiftDict[id1] && window.shiftDict[id1][dStr]) || "N/A"}</span>` : `<div class="empty-cell">-</div>`;
        
        let s2Html = `<div class="empty-cell">-</div>`;
        if (isId1Ok && id2 !== "") {
            s2Html = `<span class="badge">${(window.shiftDict[id2] && window.shiftDict[id2][dStr]) || "N/A"}</span>`;
        } else if (isId1Ok) {
            let optN = '<option value="N">N</option>';
            let opt = (currentViTri.includes("DB") || currentViTri.includes("DongBao")) ? `<option value="B">B</option><option value="C">C</option><option value="D">D</option>${optN}` : `<option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>${optN}`;
            s2Html = `<select class="new-shift" onclick="event.stopPropagation()" onchange="handleDropdownChange(this)"><option value="">-</option>${opt}</select>`;
        }
        html += `<div class="day-row ${d.getDay()===0?'sunday':''}" data-date="${dStr}"><div class="col-date">${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}</div><div class="col-nv1">${s1Html}</div><div class="col-nv2">${s2Html}</div></div>`;
    }
    tbody.innerHTML = html;
    
    if (isId1Ok && isId2Ok && id2 !== "") {
        document.querySelectorAll('.day-row').forEach(r => { r.onclick = function() { this.classList.toggle('row-selected'); updateSaveButtonState(); }; r.style.cursor = "pointer"; });
    }
    
    document.getElementById('btnSaveText').innerText = (id2 !== "") ? "XÁC NHẬN ĐỔI CA" : "XÁC NHẬN CẬP NHẬT";
    updateSaveButtonState();
}

window.handleDropdownChange = function(select) {
    const row = select.closest('.day-row');
    if (select.value !== "") row.classList.add('row-selected'); else row.classList.remove('row-selected');
    updateSaveButtonState();
};

function updateSaveButtonState() {
    const btnSave = document.getElementById('btnSave');
    const btnCancel = document.getElementById('btnCancel');
    const id1 = document.getElementById('id1').value.trim();
    const id2 = document.getElementById('id2').value.trim();
    const startD = document.getElementById('startDate').value;

    // Nút Hủy: Chỉ cần có thao tác gõ là sáng lên để cho phép xóa
    btnCancel.disabled = (startD === "" && id1 === "" && id2 === "");

    // Nút Xác Nhận: Khắt khe hơn, phải đủ điều kiện mới cho bấm
    const selectedRows = document.querySelectorAll('.day-row.row-selected');
    if (!isId1Ok || startD === "" || selectedRows.length === 0) {
        btnSave.disabled = true; return;
    }

    let allValid = true;
    if (!id2) { 
        selectedRows.forEach(row => { const select = row.querySelector('.new-shift'); if (!select || !select.value) allValid = false; }); 
    }
    btnSave.disabled = !allValid;
}

function resetForm() {
    document.getElementById('startDate').value = ''; document.getElementById('id1').value = ''; document.getElementById('id2').value = '';
    document.getElementById('msg-id1').innerHTML = ''; document.getElementById('msg-id2').innerHTML = '';
    document.getElementById('id1').classList.remove('is-valid', 'is-invalid'); document.getElementById('id2').classList.remove('is-valid', 'is-invalid');
    isId1Ok = false; isId2Ok = true;
    updateGridState();
}

function toggleMonthly() {
    const view = document.getElementById('monthlyView'), btn = document.getElementById('btnToggleMonthly');
    const isHidden = view.style.display === 'none';
    view.style.display = isHidden ? 'block' : 'none';
    btn.innerText = isHidden ? 'ẨN LỊCH THÁNG' : 'XEM LỊCH THÁNG';
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
            setTimeout(() => { resetForm(); renderMonthlyTable(); }, 1000); 
        } else { window.showToast(res.message, false); btn.disabled = false;}
    } catch (e) { window.showToast("Lỗi mạng!", false); btn.disabled = false;}
    finally { txt.style.display = 'block'; sp.style.display = 'none'; }
};

async function renderMonthlyTable() {
    try {
        const r = await fetch(SCRIPT_URL_DOI_CA, { method: 'POST', body: JSON.stringify({ action: "getMonthlyReport" }) });
        const res = await r.json();
        if (res.status === "success" && res.data) {
            window.shiftDict = res.data.shiftDict || {};
            document.getElementById('monthlyTitle').innerText = "LỊCH THÁNG " + res.data.monthYear;
            document.getElementById('monthlyTitle').style.color = "var(--primary)"; // Trả về màu xanh chuẩn nếu thành công
            
            let html = "";
            res.data.tableData.forEach((row, rIdx) => {
                const nhom = row[row.length - 1];
                html += `<tr class="${nhom==='GROUP'?'row-goc':''}">`;
                for (let cIdx = 0; cIdx < row.length - 1; cIdx++) {
                    let cell = row[cIdx], className = (rIdx===0) ? "sticky-header" : (cIdx===0 ? "sticky-col" : "");
                    if (nhom==='GROUP' && cIdx===0) className += " team-label";
                    if (nhom==='QL' && cIdx>0) className += " normal-weight"; 
                    if (nhom==='T' && cIdx>0 && cell!=="") className += " cell-changed";
                    html += `<td class="${className}">${cell}</td>`;
                }
                html += "</tr>";
            });
            document.getElementById('monthlyTable').innerHTML = html;
            if(document.getElementById('startDate').value !== "") updateGridState(); 
        } else {
            document.getElementById('monthlyTitle').innerText = "LỖI: " + (res.message || "Hãy tạo bảng Lịch Tháng");
        }
    } catch(e) {
        document.getElementById('monthlyTitle').innerText = "LỖI KẾT NỐI MÁY CHỦ";
    }
}
