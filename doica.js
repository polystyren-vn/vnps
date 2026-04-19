
const SCRIPT_URL_DOI_CA = "https://script.google.com/macros/s/AKfycbzYXPNw_cGZmvQZR9UNAs6XYEjPi6eBvG0fkeugNYfLN8p7utTXBiIovt6zqYHVoTAbTw/exec"; 
let currentViTri = "";
let isId1Ok = false, isId2Ok = true;

window.clearField = (id) => { const i = document.getElementById(id); i.value = ''; i.dispatchEvent(new Event('input')); };

document.addEventListener("DOMContentLoaded", async () => {
    await window.loadEmployeesData(); 
    document.getElementById('id1').addEventListener('input', validateLocal);
    document.getElementById('id2').addEventListener('input', validateLocal);
    document.getElementById('startDate').addEventListener('change', checkInputs);
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
        } else if (isId1Ok && emp1.viTri !== emp2.viTri) { // CHẶN KHÁC VỊ TRÍ (ví dụ: PSDB chặn PSPU1)
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

function checkInputs() {
    const startD = document.getElementById('startDate').value;
    const btnView = document.getElementById('btnView');
    const canView = isId1Ok && isId2Ok && startD !== "";
    btnView.disabled = !canView; btnView.style.opacity = canView ? "1" : "0.6";
}

window.loadSchedule = async function() {
    const btn = document.getElementById('btnView'), sp = document.getElementById('spinner-view'), txt = document.getElementById('text-view');
    btn.disabled = true; txt.style.display = 'none'; sp.style.display = 'block';
    
    const payload = { action: "getShiftData", id1: document.getElementById('id1').value, id2: document.getElementById('id2').value, startD: document.getElementById('startDate').value };

    try {
        const r = await fetch(SCRIPT_URL_DOI_CA, { method: 'POST', body: JSON.stringify(payload) });
        const res = await r.json();
        if (res.status === "success") {
            currentViTri = res.data.viTri; showGrid(res.data.shifts, payload.id2);
        } else { window.showToast(res.message, false); }
    } catch (e) { window.showToast("Lỗi mạng!", false); }
    finally { btn.disabled = false; txt.style.display = 'block'; sp.style.display = 'none'; }
};

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
        if (res.status === "success") { window.showToast("Cập nhật thành công!", true); setTimeout(() => { loadSchedule(); renderMonthlyTable(); }, 1000); } 
        else { window.showToast(res.message, false); btn.disabled = false;}
    } catch (e) { window.showToast("Lỗi mạng!", false); btn.disabled = false;}
    finally { txt.style.display = 'block'; sp.style.display = 'none'; }
};

async function renderMonthlyTable() {
    try {
        const r = await fetch(SCRIPT_URL_DOI_CA, { method: 'POST', body: JSON.stringify({ action: "getMonthlyReport" }) });
        const res = await r.json();
        if (res.status === "success" && res.data) {
            document.getElementById('monthlyTitle').innerHTML = "LỊCH THÁNG " + res.data.monthYear;
            let html = "";
            res.data.tableData.forEach((row, rIdx) => {
                const isHeader = rIdx === 0;
                const isTeamRow = row[0] && (row[0].toString().startsWith("T") || row[0].toString().startsWith("QL") || row[0].toString().startsWith("PS") || row[0].toString().startsWith("HC"));
                html += `<tr class="${isTeamRow && !isHeader ? 'row-goc' : ''}">`;
                for (let cIdx = 0; cIdx < row.length - 1; cIdx++) {
                    let cell = row[cIdx]; let className = isHeader ? "sticky-header" : (cIdx === 0 ? "sticky-col" : "");
                    if (!isHeader && !isTeamRow && cIdx > 0 && cell !== "") { className += " cell-changed"; }
                    html += `<td class="${className}">${cell}</td>`;
                }
                html += "</tr>";
            });
            document.getElementById('monthlyTable').innerHTML = html;
        }
    } catch(e) {}
}
