const SCRIPT_URL_DOI_CA = "https://script.google.com/macros/s/AKfycbzYXPNw_cGZmvQZR9UNAs6XYEjPi6eBvG0fkeugNYfLN8p7utTXBiIovt6zqYHVoTAbTw/exec";

let currentViTri = "";
let currentNhomLich = ""; 
let isId1Ok = false, isId2Ok = true;
window.shiftDict = {};

// Biến lưu tên tháng để gán vào Nút bấm
let currentMonthStr = ""; 
let isMonthlyDataLoaded = false;

// Mảng chuyển đổi Thứ trong tuần
const VN_DAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

window.clearField = (id) => {
    const i = document.getElementById(id);
    if(i) { i.value = ''; i.dispatchEvent(new Event('input')); }
};

document.addEventListener("DOMContentLoaded", async () => {
    const btnText = document.getElementById('btnListText');
    if (btnText) btnText.innerText = "ĐANG TẢI LỊCH THÁNG...";

    if(typeof window.loadEmployeesData === 'function') await window.loadEmployeesData();
    document.getElementById('id1').addEventListener('input', validateLocal);
    document.getElementById('id2').addEventListener('input', validateLocal);
    document.getElementById('startDate').addEventListener('change', updateGridState);
    
    renderEmptyGrid();
    
    // Tải ngầm RAM
    renderMonthlyTable(); 
    
    // Set text mặc định cho nút ban đầu
    updateSaveButtonState();
});

// LOGIC XÁC THỰC VÀ HIỂN THỊ MÀU
function validateLocal() {
    const val1 = document.getElementById('id1').value.trim();
    const val2 = document.getElementById('id2').value.trim();
    const msg1 = document.getElementById('msg-id1');
    const msg2 = document.getElementById('msg-id2');

    msg1.classList.remove('name-success', 'name-error');
    msg2.classList.remove('name-success', 'name-error');

    const emp1 = window.employeeData ? window.employeeData.find(e => e.soThe === val1) : null;

    // --- 1. XỬ LÝ NV1 ---
    if (val1 === "") {
        msg1.innerHTML = ""; 
        isId1Ok = false;
        currentViTri = "";
        currentNhomLich = "";
    } else if (emp1) {
        currentViTri = emp1.viTri ? emp1.viTri.trim() : "";
        currentNhomLich = emp1.nhomLich ? emp1.nhomLich.trim() : "";
        msg1.innerHTML = `${emp1.hoTen} - ${currentViTri}`; 
        msg1.classList.add('name-success');
        isId1Ok = true;
    } else {
        currentViTri = "";
        currentNhomLich = "";
        msg1.innerHTML = 'Số thẻ không đúng';
        msg1.classList.add('name-error');
        isId1Ok = false;
    }

    // --- 2. XỬ LÝ NV2 ---
    if (val2 === "") {
        msg2.innerHTML = ""; 
        isId2Ok = true;
    } else {
        const emp2 = window.employeeData ? window.employeeData.find(e => e.soThe === val2) : null;

        if (!emp2) {
            msg2.innerHTML = 'Số thẻ không đúng';
            msg2.classList.add('name-error');
            isId2Ok = false;
        } 
        else {
            const viTri2 = emp2.viTri ? emp2.viTri.trim() : "";
            const nhomLich2 = emp2.nhomLich ? emp2.nhomLich.trim() : "";

            if (isId1Ok && currentViTri !== viTri2) {
                msg2.innerHTML = `Khác vị trí (${viTri2})`;
                msg2.classList.add('name-error');
                isId2Ok = false;
            } 
            else if (val1 === val2) {
                msg2.innerHTML = 'Trùng NV1';
                msg2.classList.add('name-error');
                isId2Ok = false;
            }
            else if (isId1Ok && currentNhomLich === nhomLich2) {
                msg2.innerHTML = `Chung nhóm ${nhomLich2}`;
                msg2.classList.add('name-error');
                isId2Ok = false;
            }
            else {
                msg2.innerHTML = `${emp2.hoTen} - ${viTri2}`;
                msg2.classList.add('name-success');
                isId2Ok = true;
            }
        }
    }
    updateGridState();
}

function renderEmptyGrid() {
    const tbody = document.getElementById('grid-body');
    let html = '';
    for(let i=0; i<7; i++) {
        html += `<div class="day-row"><div class="col-date empty-cell">-</div><div class="col-nv1 empty-cell">-</div><div class="col-nv2 empty-cell">-</div></div>`;
    }
    tbody.innerHTML = html;
}

function updateGridState() {
    const startD = document.getElementById('startDate').value;
    const id1 = document.getElementById('id1').value.trim();
    const id2 = document.getElementById('id2').value.trim();
    const tbody = document.getElementById('grid-body');

    document.getElementById('gh-nv1').innerText = (isId1Ok && id1) ? id1 : "NV1";
    document.getElementById('gh-nv2').innerText = (isId2Ok && id2 !== "") ? id2 : (isId1Ok && id2 === "" ? "CA MỚI" : "NV2");

    if (!startD) {
        renderEmptyGrid();
        updateSaveButtonState();
        return;
    }

    let html = '';
    for (let i = 0; i < 7; i++) {
        let d = new Date(startD);
        d.setDate(d.getDate() + i);
        let dStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        let displayDate = `${VN_DAYS[d.getDay()]}-${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;

        let s1Html = isId1Ok ? `<span class="badge">${(window.shiftDict[id1] && window.shiftDict[id1][dStr]) || "N/A"}</span>` : `<div class="empty-cell">-</div>`;
        let s2Html = `<div class="empty-cell">-</div>`;

        if (isId1Ok) {
            if (id2 === "") {
                let optN = '<option value="N">N</option>';
                let opt = (currentViTri.includes("DB") || currentViTri.includes("DongBao")) ? `<option value="B">B</option><option value="C">C</option><option value="D">D</option>${optN}` : `<option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>${optN}`;
                s2Html = `<select class="new-shift" onclick="event.stopPropagation()" onchange="handleDropdownChange(this)"><option value="">-</option>${opt}</select>`;
            } else if (isId2Ok) {
                s2Html = `<span class="badge">${(window.shiftDict[id2] && window.shiftDict[id2][dStr]) || "N/A"}</span>`;
            }
        }
        
        html += `<div class="day-row ${d.getDay()===0?'sunday':''}" data-date="${dStr}">
                    <div class="col-date" style="font-weight: bold;">${displayDate}</div>
                    <div class="col-nv1">${s1Html}</div>
                    <div class="col-nv2">${s2Html}</div>
                 </div>`;
    }
    tbody.innerHTML = html;

    if (isId1Ok && isId2Ok && (id2 !== "" || (id2 === "" && isId1Ok))) { 
        document.querySelectorAll('.day-row').forEach(r => {
            r.onclick = function() {
                this.classList.toggle('row-selected');
                updateSaveButtonState();
            };
            r.style.cursor = "pointer";
        });
    }
    
    updateSaveButtonState();
}

window.handleDropdownChange = function(select) {
    const row = select.closest('.day-row');
    if (select.value !== "") row.classList.add('row-selected');
    else row.classList.remove('row-selected');
    updateSaveButtonState();
};

function updateSaveButtonState() {
    const btnSubmit = document.getElementById('btnSubmit'); 
    const btnCancel = document.getElementById('btnCancel');
    const txt = document.getElementById('btnText');
    
    const startD = document.getElementById('startDate').value;
    const id1 = document.getElementById('id1').value.trim();
    const id2 = document.getElementById('id2').value.trim();

    // 1. XỬ LÝ TEXT TRÊN NÚT BẤM
    // Nếu có NV1 nhưng KHÔNG có NV2 -> Cập nhật. Còn rỗng hoặc có cả 2 -> Đổi ca.
    const isUpdateOnly = (id1 !== "" && id2 === "");
    txt.innerText = isUpdateOnly ? "XÁC NHẬN CẬP NHẬT" : "XÁC NHẬN ĐỔI CA";

    // 2. XỬ LÝ TRẠNG THÁI KHÓA/MỞ NÚT
    btnCancel.disabled = (startD === "" && id1 === "" && id2 === "");

    const selectedRows = document.querySelectorAll('.day-row.row-selected');
    if (!isId1Ok || startD === "" || selectedRows.length === 0 || (id2 !== "" && !isId2Ok)) {
        btnSubmit.disabled = true;
        return;
    }

    let allValid = true;
    if (id2 === "") {
        selectedRows.forEach(row => {
            const select = row.querySelector('.new-shift');
            if (!select || !select.value) allValid = false;
        });
    }
    btnSubmit.disabled = !allValid; 
}

window.resetForm = function() {
    document.getElementById('startDate').value = '';
    document.getElementById('id1').value = '';
    document.getElementById('id2').value = '';
    const msg1 = document.getElementById('msg-id1');
    const msg2 = document.getElementById('msg-id2');
    msg1.innerHTML = ''; msg2.innerHTML = '';
    msg1.classList.remove('name-success', 'name-error');
    msg2.classList.remove('name-success', 'name-error');
    isId1Ok = false; isId2Ok = true;
    updateGridState();
}

window.toggleMonthly = async function() {
    const view = document.getElementById('monthlyView');
    const btnText = document.getElementById('btnListText');
    const isHidden = view.style.display === 'none' || view.style.display === '';

    view.style.display = isHidden ? 'block' : 'none';
    
    if (isHidden) {
        btnText.innerText = currentMonthStr ? `ẨN LỊCH THÁNG ${currentMonthStr}` : 'ẨN LỊCH THÁNG';
    } else {
        btnText.innerText = currentMonthStr ? `XEM LỊCH THÁNG ${currentMonthStr}` : 'XEM LỊCH THÁNG HIỆN TẠI';
    }
}

// GỬI DỮ LIỆU & HIỆU ỨNG ĐẾM GIÂY (TIMER)
window.submitData = async function() {
    const btn = document.getElementById('btnSubmit');
    const sp = document.getElementById('spinner');
    const txt = document.getElementById('btnText');

    const id1 = document.getElementById('id1').value.trim();
    const id2 = document.getElementById('id2').value.trim();
    
    btn.disabled = true;
    
    // Tắt hẳn spinner CSS vòng tròn cũ
    if (sp) sp.style.display = 'none';
    txt.style.display = 'block';

    // Xác định nội dung trạng thái
    const isUpdateOnly = (id1 !== "" && id2 === "");
    const loadingStr = isUpdateOnly ? "ĐANG CẬP NHẬT..." : "ĐANG ĐỔI CA...";
    
    // Bơm hiệu ứng đếm giây vào text
    let seconds = 0;
    txt.innerHTML = `⏳ ${loadingStr} ${seconds}s`;
    
    const timerInterval = setInterval(() => {
        seconds++;
        txt.innerHTML = `⏳ ${loadingStr} ${seconds}s`;
    }, 1000);

    const selectedRows = document.querySelectorAll('.day-row.row-selected');
    const selectedDays = [];
    selectedRows.forEach(row => {
        selectedDays.push({
            date: row.getAttribute('data-date'),
            newShift: row.querySelector('.new-shift')?.value || null
        });
    });

    const payload = {
        action: "updateShifts",
        id1: id1,
        id2: id2,
        selectedDays: selectedDays,
        deviceId: (typeof window.getDeviceId === 'function') ? window.getDeviceId() : "UNKNOWN"
    };

    try {
        const r = await fetch(SCRIPT_URL_DOI_CA, { method: 'POST', body: JSON.stringify(payload) });
        const res = await r.json();
        if (res.status === "success") {
            if(typeof window.showToast === 'function') window.showToast("Cập nhật thành công!", true);
            isMonthlyDataLoaded = false; 
            
            setTimeout(() => {
                resetForm();
                document.getElementById('btnListText').innerText = "ĐANG LÀM MỚI LỊCH...";
                renderMonthlyTable(); 
            }, 1000);
        } else {
            if(typeof window.showToast === 'function') window.showToast(res.message, false);
            btn.disabled = false;
        }
    } catch (e) {
        if(typeof window.showToast === 'function') window.showToast("Lỗi mạng!", false);
        btn.disabled = false;
    } finally {
        // Dừng đếm giây
        clearInterval(timerInterval);
        // Trả lại text ban đầu dựa trên trạng thái form
        const curId1 = document.getElementById('id1').value.trim();
        const curId2 = document.getElementById('id2').value.trim();
        txt.innerText = (curId1 !== "" && curId2 === "") ? "XÁC NHẬN CẬP NHẬT" : "XÁC NHẬN ĐỔI CA";
    }
};

async function renderMonthlyTable() {
    const btnText = document.getElementById('btnListText');
    try {
        const r = await fetch(SCRIPT_URL_DOI_CA, { method: 'POST', body: JSON.stringify({ action: "getMonthlyReport" }) });
        const res = await r.json();
        if (res.status === "success" && res.data) {
            window.shiftDict = res.data.shiftDict || {};
            currentMonthStr = res.data.monthYear; 
            
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
            isMonthlyDataLoaded = true; 
            
            const view = document.getElementById('monthlyView');
            if (view.style.display === 'block') {
                btnText.innerText = `ẨN LỊCH THÁNG ${currentMonthStr}`;
            } else {
                btnText.innerText = `XEM LỊCH THÁNG ${currentMonthStr}`;
            }

            if(document.getElementById('startDate').value !== "") updateGridState();
        } else {
            btnText.innerText = "LỖI DỮ LIỆU TỪ MÁY CHỦ";
        }
    } catch(e) {
        btnText.innerText = "LỖI KẾT NỐI MÁY CHỦ";
    }
}
