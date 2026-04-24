const SCRIPT_URL_DOI_CA = "https://script.google.com/macros/s/AKfycbzYXPNw_cGZmvQZR9UNAs6XYEjPi6eBvG0fkeugNYfLN8p7utTXBiIovt6zqYHVoTAbTw/exec";

let currentViTri = "";
let currentNhomLich = ""; 
let isId1Ok = false, isId2Ok = true;
window.shiftDict = {};

// Cờ RAM Cache cho Lịch tháng
let isMonthlyDataLoaded = false;

// Mảng chuyển đổi Thứ trong tuần
const VN_DAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

window.clearField = (id) => {
    const i = document.getElementById(id);
    if(i) { i.value = ''; i.dispatchEvent(new Event('input')); }
};

document.addEventListener("DOMContentLoaded", async () => {
    if(typeof window.loadEmployeesData === 'function') await window.loadEmployeesData();
    document.getElementById('id1').addEventListener('input', validateLocal);
    document.getElementById('id2').addEventListener('input', validateLocal);
    document.getElementById('startDate').addEventListener('change', updateGridState);
    renderEmptyGrid();
});

// LOGIC XÁC THỰC VÀ HIỂN THỊ MÀU (Đã bỏ dấu | vì CSS tự lo)
function validateLocal() {
    const val1 = document.getElementById('id1').value.trim();
    const val2 = document.getElementById('id2').value.trim();
    const msg1 = document.getElementById('msg-id1');
    const msg2 = document.getElementById('msg-id2');

    msg1.classList.remove('name-success', 'name-error');
    msg2.classList.remove('name-success', 'name-error');

    const emp1 = window.employeeData ? window.employeeData.find(e => e.soThe === val1) : null;

    // ==========================================
    // 1. XỬ LÝ NV1
    // ==========================================
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

    // ==========================================
    // 2. XỬ LÝ NV2 (Luồng kiểm tra 4 lớp)
    // ==========================================
    if (val2 === "") {
        msg2.innerHTML = ""; 
        isId2Ok = true;
    } else {
        const emp2 = window.employeeData ? window.employeeData.find(e => e.soThe === val2) : null;

        // LỚP 1: Kiểm tra đúng số thẻ
        if (!emp2) {
            msg2.innerHTML = 'Số thẻ không đúng';
            msg2.classList.add('name-error');
            isId2Ok = false;
        } 
        else {
            const viTri2 = emp2.viTri ? emp2.viTri.trim() : "";
            const nhomLich2 = emp2.nhomLich ? emp2.nhomLich.trim() : "";

            // LỚP 2: Kiểm tra cùng vị trí (Chỉ so nếu NV1 đã OK)
            if (isId1Ok && currentViTri !== viTri2) {
                msg2.innerHTML = `Khác vị trí (${viTri2})`;
                msg2.classList.add('name-error');
                isId2Ok = false;
            } 
            // LỚP 3: Kiểm tra trùng ID (không được tự đổi cho chính mình)
            else if (val1 === val2) {
                msg2.innerHTML = 'Trùng NV1';
                msg2.classList.add('name-error');
                isId2Ok = false;
            }
            // LỚP 4: Kiểm tra cùng Nhóm lịch (T1-T1, T2-T2... không được đổi)
            else if (isId1Ok && currentNhomLich === nhomLich2) {
                msg2.innerHTML = `Chung nhóm ${nhomLich2}`;
                msg2.classList.add('name-error');
                isId2Ok = false;
            }
            // VƯỢT QUA TẤT CẢ -> HỢP LỆ
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
        
        // Định dạng T7-29/04
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

    // Cho phép bấm chọn dòng nếu NV1 OK và (NV2 OK hoặc Cập nhật ca 1 mình)
    if (isId1Ok && isId2Ok && (id2 !== "" || (id2 === "" && isId1Ok))) { 
        document.querySelectorAll('.day-row').forEach(r => {
            r.onclick = function() {
                this.classList.toggle('row-selected');
                updateSaveButtonState();
            };
            r.style.cursor = "pointer";
        });
    }
    
    // Đổi 'btnSaveText' thành 'btnText'
    document.getElementById('btnText').innerText = (isId2Ok && id2 !== "") ? "XÁC NHẬN ĐỔI CA" : "XÁC NHẬN CẬP NHẬT";
    updateSaveButtonState();
}

window.handleDropdownChange = function(select) {
    const row = select.closest('.day-row');
    if (select.value !== "") row.classList.add('row-selected');
    else row.classList.remove('row-selected');
    updateSaveButtonState();
};

function updateSaveButtonState() {
    // Đổi 'btnSave' thành 'btnSubmit'
    const btnSubmit = document.getElementById('btnSubmit'); 
    const btnCancel = document.getElementById('btnCancel');
    
    const startD = document.getElementById('startDate').value;
    const id1 = document.getElementById('id1').value.trim();
    const id2 = document.getElementById('id2').value.trim();

    btnCancel.disabled = (startD === "" && id1 === "" && id2 === "");

    const selectedRows = document.querySelectorAll('.day-row.row-selected');
    if (!isId1Ok || startD === "" || selectedRows.length === 0 || (id2 !== "" && !isId2Ok)) {
        btnSubmit.disabled = true; // Cập nhật biến
        return;
    }

    let allValid = true;
    if (id2 === "") {
        selectedRows.forEach(row => {
            const select = row.querySelector('.new-shift');
            if (!select || !select.value) allValid = false;
        });
    }
    btnSubmit.disabled = !allValid; // Cập nhật biến
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


// LOGIC RAM CACHE LỊCH THÁNG
window.toggleMonthly = async function() {
    const view = document.getElementById('monthlyView');
    const btnText = document.getElementById('btnMonthlyText');
    const spinner = document.getElementById('spinner-monthly');
    const isHidden = view.style.display === 'none';

    if (isHidden) {
        if (!isMonthlyDataLoaded) {
            btnText.style.display = 'none';
            spinner.style.display = 'block';
            await renderMonthlyTable();
            spinner.style.display = 'none';
            btnText.style.display = 'block';
        }
        view.style.display = 'block';
        btnText.innerText = 'ẨN LỊCH THÁNG';
    } else {
        view.style.display = 'none';
        btnText.innerText = 'XEM LỊCH THÁNG HIỆN TẠI';
    }
}

// GỬI DỮ LIỆU LÊN SERVER
window.submitData = async function() {
    const btn = document.getElementById('btnSave');
    const sp = document.getElementById('spinner-save');
    const txt = document.getElementById('btnSaveText');

    btn.disabled = true;
    txt.style.display = 'none';
    sp.style.display = 'block';

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
        id1: document.getElementById('id1').value.trim(),
        id2: document.getElementById('id2').value.trim(),
        selectedDays: selectedDays,
        deviceId: (typeof window.getDeviceId === 'function') ? window.getDeviceId() : "UNKNOWN"
    };

    try {
        const r = await fetch(SCRIPT_URL_DOI_CA, { method: 'POST', body: JSON.stringify(payload) });
        const res = await r.json();
        if (res.status === "success") {
            if(typeof window.showToast === 'function') window.showToast("Cập nhật thành công!", true);
            isMonthlyDataLoaded = false; // Xóa cache RAM để ép tải bản mới nhất khi xem lịch
            setTimeout(() => {
                resetForm();
                // Tự động làm mới bảng tháng nếu đang mở
                if(document.getElementById('monthlyView').style.display === 'block') {
                    toggleMonthly(); // Đóng
                    toggleMonthly(); // Mở lại (sẽ kích hoạt fetch API vì cờ = false)
                }
            }, 1000);
        } else {
            if(typeof window.showToast === 'function') window.showToast(res.message, false);
            btn.disabled = false;
        }
    } catch (e) {
        if(typeof window.showToast === 'function') window.showToast("Lỗi mạng!", false);
        btn.disabled = false;
    } finally {
        txt.style.display = 'block';
        sp.style.display = 'none';
    }
};

// TẢI & KẾT XUẤT LỊCH THÁNG
async function renderMonthlyTable() {
    try {
        const r = await fetch(SCRIPT_URL_DOI_CA, { method: 'POST', body: JSON.stringify({ action: "getMonthlyReport" }) });
        const res = await r.json();
        if (res.status === "success" && res.data) {
            window.shiftDict = res.data.shiftDict || {};
            document.getElementById('monthlyTitle').innerText = "LỊCH THÁNG " + res.data.monthYear;
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
            isMonthlyDataLoaded = true; // Lưu thành công vào RAM
            if(document.getElementById('startDate').value !== "") updateGridState();
        } else {
            document.getElementById('monthlyTitle').innerText = "LỖI: Hãy tạo bảng Lịch Tháng trên File";
        }
    } catch(e) {
        document.getElementById('monthlyTitle').innerText = "LỖI KẾT NỐI MÁY CHỦ";
    }
}
