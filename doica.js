const SCRIPT_URL_DOI_CA = "https://script.google.com/macros/s/AKfycbzYXPNw_cGZmvQZR9UNAs6XYEjPi6eBvG0fkeugNYfLN8p7utTXBiIovt6zqYHVoTAbTw/exec";

let rawTableData = []; 
let selectedActions = {}; 
let isSubmitting = false; 
const VN_DAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const VN_HOLIDAYS = ["01/01", "30/04", "01/05", "02/09", "10/03"]; 

let currentViTri = ""; 
let isId1Ok = false, isId2Ok = true;

document.addEventListener("DOMContentLoaded", async () => {
    if(typeof window.loadEmployeesData === 'function') await window.loadEmployeesData();
    
    document.getElementById('id1').addEventListener('input', validateAndFilter);
    document.getElementById('id2').addEventListener('input', validateAndFilter);
    
    document.getElementById('smartBtnCancel').onclick = () => { 
        selectedActions = {}; 
        refreshUI(); 
    };
    document.getElementById('smartBtnSubmit').onclick = (e) => { 
        e.preventDefault(); 
        submitData(); 
    };

    setTimeout(fetchLichCaNgam, 1000);
});

/* ==========================================
   1. SMART FILTER (HIỂN THỊ CẢ LỊCH GỐC & NV)
========================================== */
function validateAndFilter() {
    const val1 = document.getElementById('id1').value.trim();
    const val2 = document.getElementById('id2').value.trim();
    const msg1 = document.getElementById('msg-id1');
    const msg2 = document.getElementById('msg-id2');

    msg1.classList.remove('name-success', 'name-error');
    msg2.classList.remove('name-success', 'name-error');
    
    const emp1 = window.employeeData ? window.employeeData.find(e => e.soThe === val1) : null;
    let team1 = "";
    let team2 = "";

    if (val1 === "") {
        msg1.innerHTML = ""; isId1Ok = false; currentViTri = "";
    } else if (emp1) {
        currentViTri = emp1.viTri ? emp1.viTri.trim() : "";
        team1 = emp1.nhomLich ? emp1.nhomLich.trim() : "";
        msg1.innerHTML = `${emp1.hoTen}`; msg1.classList.add('name-success'); isId1Ok = true;
    } else {
        msg1.innerHTML = 'Số thẻ sai'; msg1.classList.add('name-error'); isId1Ok = false;
    }

    if (val2 === "") {
        msg2.innerHTML = ""; isId2Ok = true;
    } else {
        const emp2 = window.employeeData ? window.employeeData.find(e => e.soThe === val2) : null;
        if (!emp2) {
            msg2.innerHTML = 'Số thẻ sai'; msg2.classList.add('name-error'); isId2Ok = false;
        } else {
            const viTri2 = emp2.viTri ? emp2.viTri.trim() : "";
            team2 = emp2.nhomLich ? emp2.nhomLich.trim() : "";
            if (isId1Ok && currentViTri !== viTri2) { msg2.innerHTML = `Khác VT (${viTri2})`; msg2.classList.add('name-error'); isId2Ok = false; } 
            else if (val1 === val2) { msg2.innerHTML = 'Trùng NV1'; msg2.classList.add('name-error'); isId2Ok = false; }
            else if (isId1Ok && team1 === team2) { msg2.innerHTML = `Cùng tổ ${team2}`; msg2.classList.add('name-error'); isId2Ok = false; }
            else { msg2.innerHTML = `${emp2.hoTen}`; msg2.classList.add('name-success'); isId2Ok = true; }
        }
    }

    const container = document.getElementById('smartMatrixContainer');
    if (!isId1Ok || team1 === "") { 
        container.style.display = 'none'; 
        selectedActions = {}; refreshUI(); return; 
    }
    
    container.style.display = 'block';

    document.querySelectorAll('#smartTable tr').forEach((tr, idx) => {
        if (idx === 0) { tr.style.display = 'table-row'; return; }
        
        const trTeam = tr.getAttribute('data-team');
        const trId = tr.getAttribute('data-id');
        
        const isVisible = (trTeam === team1 || (isId2Ok && team2 !== "" && trTeam === team2));
        tr.style.display = isVisible ? 'table-row' : 'none';
        
        if (isVisible && (trId === val1 || (isId2Ok && trId === val2 && val2 !== ""))) {
            tr.classList.add('smart-highlight-row');
        } else {
            tr.classList.remove('smart-highlight-row');
        }
    });
    refreshUI();
}

/* ==========================================
   2. RENDER BẢNG (ĐỒNG BỘ LÕI BACKEND)
========================================== */
async function fetchLichCaNgam() {
    try {
        const r = await fetch(SCRIPT_URL_DOI_CA, { method: 'POST', body: JSON.stringify({ action: "getMonthlyReport" }) });
        const res = await r.json();
        if (res.status === "success" && res.data) {
            rawTableData = res.data.tableData;
            renderSmartTable();
            validateAndFilter(); 
        }
    } catch(e) { console.error("Lỗi nạp RAM:", e); }
}

function renderSmartTable() {
    let html = "";
    let activeTeam = ""; 

    rawTableData.forEach((row, rIdx) => {
        const formatFlag = row[row.length - 1]; // Cờ GROUP, QL, T
        let empId = "";
        let trTeam = "";
        let isGroupRow = (formatFlag === 'GROUP');
        
        if (rIdx > 0) {
            // Nhờ Backend đã gọt sẵn chuỗi Lịch Gốc thành T1, QL1..., Frontend chỉ việc hứng
            if (isGroupRow && row[0]) {
                activeTeam = row[0].toString().trim();
                trTeam = activeTeam;
            } 
            else if (row[0]) {
                empId = row[0].toString().trim(); // Lấy số thẻ do Backend đã mapName sẵn
                // BULLETPROOF: Tra JSON
                const emp = window.employeeData ? window.employeeData.find(e => e.soThe === empId) : null;
                if (emp && emp.nhomLich) {
                    trTeam = emp.nhomLich.trim();
                    activeTeam = trTeam; 
                } else {
                    trTeam = activeTeam;
                }
            }
        }
        
        let trCls = isGroupRow ? "row-goc" : "";
        html += `<tr data-team="${trTeam}" data-id="${empId}" class="${trCls}" style="display: none;">`;
        
        for (let cIdx = 0; cIdx < row.length - 1; cIdx++) {
            let cell = row[cIdx] || "";
            let cls = rIdx === 0 ? "smart-sticky-header" : "";
            if (cIdx === 0) cls += " smart-sticky-col";
            if (rIdx === 0 && cIdx === 0) { cls += " smart-sticky-corner"; cell = "ST"; }
            
            let dateAttr = "";
            if (rIdx === 0 && cIdx > 0) {
                dateAttr = `data-date="${cell}"`;
                cls += " smart-clickable"; 
                if (cell) {
                    let p = cell.toString().split('/');
                    if(p.length >= 3) {
                        let d = new Date(p[2], p[1]-1, p[0]);
                        if (d.getDay() === 0 || VN_HOLIDAYS.includes(`${p[0]}/${p[1]}`)) cls += " smart-holiday";
                        cell = `<div class="smart-header-day">${VN_DAYS[d.getDay()]}</div><div class="smart-header-date">${p[0]}/${p[1]}</div>`;
                    }
                }
            } 
            else if (rIdx > 0 && cIdx > 0) {
                dateAttr = `data-date="${rawTableData[0][cIdx]}"`;
                cls += " smart-clickable";
                if (formatFlag === 'T' && cell !== "") cls += " smart-cell-changed";
                if (['QL', 'DB', 'HC'].includes(formatFlag)) cls += " normal-weight";
            } 
            else if (rIdx > 0 && cIdx === 0) {
                if (isGroupRow) {
                    cls += " smart-team-label";
                    // Trả lại diện mạo Gốc đẹp đẽ:
                    cell = `<div style="text-align: center; font-weight: 800;">L.GỐC ${activeTeam}</div>`;
                } else {
                    // Hiển thị Họ Tên từ JSON thay vì chỉ hiện Mã
                    const eObj = window.employeeData ? window.employeeData.find(e => e.soThe === empId) : null;
                    const hTen = eObj ? eObj.hoTen : cell;
                    cell = `<div class="smart-name-truncate" title="${hTen}">${hTen}</div>`;
                }
            }
            
            let tag = (rIdx === 0) ? "th" : "td";
            html += `<${tag} class="${cls.trim()}" ${dateAttr}>${cell}</${tag}>`;
        }
        html += "</tr>";
    });
    
    document.getElementById('smartTable').innerHTML = html;
    attachClicks();
}

/* ==========================================
   3. TƯƠNG TÁC CHẠM & UI REFRESH
========================================== */
let tempTargetDate = "";

function attachClicks() {
    document.querySelectorAll('.smart-clickable').forEach(el => {
        el.onclick = function() {
            const date = this.getAttribute('data-date');
            if (!date) return;
            if (this.tagName.toLowerCase() === 'td') {
                if (!this.closest('tr').classList.contains('smart-highlight-row')) return;
            }
            
            const id2 = document.getElementById('id2').value.trim();

            if (id2 === "") { 
                tempTargetDate = date;
                document.getElementById('smartPickerDate').innerText = "Ngày: " + date;
                const isDB = currentViTri.includes("DB") || currentViTri.includes("DongBao");
                const shifts = isDB ? ["B", "C", "D", "N"] : ["A", "B", "C", "D", "N"];
                let optsHtml = shifts.map(s => `<button type="button" class="smart-shift-btn" onclick="selectNewShift('${s}')">${s}</button>`).join("");
                document.getElementById('smartShiftOptions').innerHTML = optsHtml;
                document.getElementById('smartPickerOverlay').style.display = 'flex';
            } else { 
                if (selectedActions[date]) delete selectedActions[date];
                else selectedActions[date] = { newShift: null };
                refreshUI();
            }
        };
    });
}

window.closeSmartPicker = function() { document.getElementById('smartPickerOverlay').style.display = 'none'; }

window.selectNewShift = function(shiftVal) {
    if (tempTargetDate) selectedActions[tempTargetDate] = { newShift: shiftVal };
    closeSmartPicker();
    refreshUI();
}

function refreshUI() {
    const count = Object.keys(selectedActions).length;
    const bs = document.getElementById('smartBottomSheet');
    
    if (count > 0 && isId1Ok) {
        bs.classList.add('active');
        const id1 = document.getElementById('id1').value;
        const id2 = document.getElementById('id2').value;
        document.getElementById('smartBSMsg').innerHTML = (id2 === "") 
            ? `Cập nhật ca cho <b>${count} ngày</b>.` 
            : `Đổi ca giữa <b>${id1}</b> và <b>${id2}</b> cho <b>${count} ngày</b>.`;
    } else {
        bs.classList.remove('active');
    }
    
    document.querySelectorAll('.smart-clickable').forEach(el => {
        const dateStr = el.getAttribute('data-date');
        const isSel = !!selectedActions[dateStr];

        if (el.tagName.toLowerCase() === 'th') {
            el.classList.toggle('smart-header-selected', isSel);
            return;
        }

        el.classList.remove('smart-cell-selected');
        const oldMark = el.querySelector('.smart-mark-unsaved');
        if(oldMark) oldMark.remove();
        if (el.getAttribute('data-orig') !== null) {
            el.innerHTML = el.getAttribute('data-orig');
            el.removeAttribute('data-orig');
        }

        const tr = el.closest('tr');
        if (isSel && tr.classList.contains('smart-highlight-row')) {
            el.classList.add('smart-cell-selected');
            const ns = selectedActions[dateStr].newShift;
            if (ns) {
                el.setAttribute('data-orig', el.innerHTML);
                el.innerHTML = `${ns} <div class="smart-mark-unsaved"></div>`;
            }
        }
    });
}

/* ==========================================
   4. GỬI DỮ LIỆU
========================================== */
async function submitData() {
    if (isSubmitting) return;
    isSubmitting = true;
    
    const btn = document.getElementById('smartBtnSubmit');
    const txt = document.getElementById('smartBtnText');
    btn.disabled = true;
    
    let sec = 0;
    const timer = setInterval(() => { txt.innerText = `⏳ ĐANG GỬI... ${++sec}s`; }, 1000);

    const payload = {
        action: "updateShifts",
        id1: document.getElementById('id1').value.trim(),
        id2: document.getElementById('id2').value.trim(),
        selectedDays: Object.entries(selectedActions).map(([date, data]) => ({ date: date, newShift: data.newShift })),
        deviceId: (typeof window.getDeviceId === 'function') ? window.getDeviceId() : "UNKNOWN"
    };

    try {
        const r = await fetch(SCRIPT_URL_DOI_CA, { method: 'POST', body: JSON.stringify(payload) });
        const res = await r.json();
        if (res.status === "success") {
            if(typeof window.showToast === 'function') window.showToast("Thành công!", true);
            selectedActions = {};
            refreshUI();
            document.getElementById('doiCaForm').reset();
            document.getElementById('msg-id1').innerHTML = ""; document.getElementById('msg-id2').innerHTML = "";
            isId1Ok = false; isId2Ok = true; currentViTri = "";
            validateAndFilter();
            fetchLichCaNgam(); 
        } else {
            if(typeof window.showToast === 'function') window.showToast(res.message, false);
        }
    } catch(e) {
        if(typeof window.showToast === 'function') window.showToast("Lỗi mạng!", false);
    } finally {
        clearInterval(timer);
        isSubmitting = false;
        btn.disabled = false;
        txt.innerText = "XÁC NHẬN";
    }
}
