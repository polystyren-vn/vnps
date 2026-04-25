const SCRIPT_URL_DOI_CA = "https://script.google.com/macros/s/AKfycbzYXPNw_cGZmvQZR9UNAs6XYEjPi6eBvG0fkeugNYfLN8p7utTXBiIovt6zqYHVoTAbTw/exec";

// Khai báo biến toàn cục
let currentViTri = "", currentNhomLich = ""; 
let isId1Ok = false, isId2Ok = true;
let isSubmitting = false; 

// Dữ liệu RAM
let rawTableData = []; 
let currentMonthStr = "";
let selectedActions = {}; // Format: { "2026-04-15": { newShift: "A" }, ... }

// Hằng số tính toán
const VN_DAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const VN_HOLIDAYS = ["01/01", "30/04", "01/05", "02/09", "10/03"]; // Định dạng dd/mm

window.clearField = (id) => {
    const i = document.getElementById(id);
    if(i) { i.value = ''; i.dispatchEvent(new Event('input')); }
};

document.addEventListener("DOMContentLoaded", async () => {
    if(typeof window.loadEmployeesData === 'function') await window.loadEmployeesData();
    
    // Gắn sự kiện Validation Real-time
    document.getElementById('id1').addEventListener('input', handleValidation);
    document.getElementById('id2').addEventListener('input', handleValidation);
    
    // Gắn sự kiện nút Bottom Sheet
    document.getElementById('btnCancelSheet').addEventListener('click', () => {
        selectedActions = {}; 
        refreshTableSelection();
        updateBottomSheet();
    });
    
    document.getElementById('btnSubmitSheet').addEventListener('click', function(e) {
        e.preventDefault();
        submitData();
    });

    // TRÌ HOÃN TẢI LỊCH 1 GIÂY (Lazy Fetch) để không làm đơ trang chủ
    setTimeout(() => { fetchAndRenderMonthlyTable(); }, 1000);
});

/* ==========================================
   1. LOGIC XÁC THỰC 4 LỚP
========================================== */
function handleValidation() {
    const val1 = document.getElementById('id1').value.trim();
    const val2 = document.getElementById('id2').value.trim();
    const msg1 = document.getElementById('msg-id1');
    const msg2 = document.getElementById('msg-id2');

    msg1.classList.remove('name-success', 'name-error');
    msg2.classList.remove('name-success', 'name-error');
    
    const emp1 = window.employeeData ? window.employeeData.find(e => e.soThe === val1) : null;

    // --- NV 1 ---
    if (val1 === "") {
        msg1.innerHTML = ""; isId1Ok = false; currentViTri = ""; currentNhomLich = "";
    } else if (emp1) {
        currentViTri = emp1.viTri ? emp1.viTri.trim() : "";
        currentNhomLich = emp1.nhomLich ? emp1.nhomLich.trim() : "";
        msg1.innerHTML = `${emp1.hoTen}`; msg1.classList.add('name-success'); isId1Ok = true;
    } else {
        msg1.innerHTML = 'Số thẻ sai'; msg1.classList.add('name-error'); isId1Ok = false; currentNhomLich = "";
    }

    // --- NV 2 ---
    let targetTeam2 = "";
    if (val2 === "") {
        msg2.innerHTML = ""; isId2Ok = true;
    } else {
        const emp2 = window.employeeData ? window.employeeData.find(e => e.soThe === val2) : null;
        if (!emp2) {
            msg2.innerHTML = 'Số thẻ sai'; msg2.classList.add('name-error'); isId2Ok = false;
        } else {
            const viTri2 = emp2.viTri ? emp2.viTri.trim() : "";
            targetTeam2 = emp2.nhomLich ? emp2.nhomLich.trim() : "";

            if (isId1Ok && currentViTri !== viTri2) { msg2.innerHTML = `Khác VT (${viTri2})`; msg2.classList.add('name-error'); isId2Ok = false; } 
            else if (val1 === val2) { msg2.innerHTML = 'Trùng NV1'; msg2.classList.add('name-error'); isId2Ok = false; }
            else if (isId1Ok && currentNhomLich === targetTeam2) { msg2.innerHTML = `Cùng tổ ${targetTeam2}`; msg2.classList.add('name-error'); isId2Ok = false; }
            else { msg2.innerHTML = `${emp2.hoTen}`; msg2.classList.add('name-success'); isId2Ok = true; }
        }
    }

    // NẾU XÁC THỰC XONG -> LỌC BẢNG LỊCH THÔNG MINH
    applySmartFilter(currentNhomLich, targetTeam2);
}

/* ==========================================
   2. SMART FILTER & RENDER BẢNG (RAM)
========================================== */
async function fetchAndRenderMonthlyTable() {
    try {
        const r = await fetch(SCRIPT_URL_DOI_CA, { method: 'POST', body: JSON.stringify({ action: "getMonthlyReport" }) });
        const res = await r.json();
        if (res.status === "success" && res.data) {
            rawTableData = res.data.tableData;
            currentMonthStr = res.data.monthYear; 
            buildHTMLTable(); // Tạo DOM nhưng đang ẩn
        }
    } catch(e) { console.error("Lỗi tải lịch ngầm:", e); }
}

function buildHTMLTable() {
    let html = "";
    rawTableData.forEach((row, rIdx) => {
        const nhom = row[row.length - 1]; // Lấy mã tổ (VD: T1, DB1...)
        
        // Tách Số thẻ từ Cột 0 (Định dạng mẫu: "39 - Dương Văn Ngọc")
        let empId = "";
        if (rIdx > 0 && nhom !== 'GROUP' && row[0]) {
            empId = row[0].toString().split('-')[0].trim();
        }

        // Xử lý class cho thẻ <tr>
        let trClass = [];
        if (nhom === 'GROUP') trClass.push("row-goc"); // Dòng lịch gốc
        
        html += `<tr data-team="${nhom}" data-id="${empId}" class="${trClass.join(" ")}" style="display: none;">`;
        
        for (let cIdx = 0; cIdx < row.length - 1; cIdx++) {
            let cell = row[cIdx];
            let tdClass = [];
            
            // 1. CẤP QUYỀN STICKY ĐỘC LẬP
            if (rIdx === 0) tdClass.push("sticky-header");
            if (cIdx === 0) tdClass.push("sticky-col");

            // 2. XỬ LÝ HÀNG TIÊU ĐỀ (HEADER)
            if (rIdx === 0) {
                tdClass.push("header-cell");
                if (cIdx === 0) {
                    cell = "ST"; // Ô góc trên cùng bên trái
                } else if (cell) {
                    let parts = cell.toString().split('/'); // format dd/mm/yyyy
                    if(parts.length >= 3) {
                        let dObj = new Date(parts[2], parts[1]-1, parts[0]);
                        let dayName = VN_DAYS[dObj.getDay()];
                        let shortDate = `${parts[0]}/${parts[1]}`;
                        
                        // Check đỏ ngày nghỉ
                        if (dObj.getDay() === 0 || VN_HOLIDAYS.includes(shortDate)) {
                            tdClass.push("holiday");
                        }
                        cell = `<div class="header-day">${dayName}</div><div class="header-date">${shortDate}</div>`;
                    }
                }
            } 
            // 3. XỬ LÝ CÁC DÒNG DỮ LIỆU
            else {
                if (cIdx === 0) {
                    // Cột Tên / Số thẻ
                    if (nhom === 'GROUP') tdClass.push("team-label");
                } else {
                    // Ô dữ liệu tương tác
                    tdClass.push("clickable-cell");
                    if (nhom === 'T' && cell !== "") tdClass.push("cell-changed");
                    if (nhom === 'QL') tdClass.push("normal-weight");
                }
            }
            
            let finalClass = tdClass.join(" ");
            let dateVal = (rIdx > 0 && cIdx > 0 && rawTableData[0][cIdx]) ? rawTableData[0][cIdx] : "";
            let dataAttr = dateVal ? `data-date="${dateVal}"` : "";
            let tag = (rIdx === 0) ? "th" : "td"; // Thẻ th cho header, td cho data

            html += `<${tag} class="${finalClass}" ${dataAttr}>${cell}</${tag}>`;
        }
        html += "</tr>";
    });
    
    document.getElementById('monthlyTable').innerHTML = html;
    attachCellClickEvents();
}

function applySmartFilter(team1, team2) {
    const tableContainer = document.getElementById('smartTableContainer');
    const rows = document.querySelectorAll('#monthlyTable tr');
    
    // Nếu chưa có NV1, giấu bảng
    if (!isId1Ok || team1 === "") {
        tableContainer.style.display = 'none';
        selectedActions = {}; // Xóa lựa chọn cũ
        updateBottomSheet();
        return;
    }
    
    tableContainer.style.display = 'block';
    
    const id1Val = document.getElementById('id1').value.trim();
    const id2Val = document.getElementById('id2').value.trim();

    rows.forEach((row, idx) => {
        if (idx === 0) { row.style.display = 'table-row'; return; } // Luôn hiện Header
        
        const rowTeam = row.getAttribute('data-team');
        const rowId = row.getAttribute('data-id');
        
        // Hiện nếu thuộc Tổ 1 hoặc Tổ 2 (nếu NV2 hợp lệ)
        if (rowTeam === team1 || (isId2Ok && team2 !== "" && rowTeam === team2)) {
            row.style.display = 'table-row';
            
            // Tô nền xanh (highlight) cho đúng dòng của nhân viên đang gõ
            if (rowId === id1Val || (isId2Ok && rowId === id2Val && id2Val !== "")) {
                row.classList.add('highlight-row');
            } else {
                row.classList.remove('highlight-row');
            }
        } else {
            row.style.display = 'none';
        }
    });
}

/* ==========================================
   3. TƯƠNG TÁC CHẠM LÊN LƯỚI & BOTTOM SHEET
========================================== */
let tempTargetDate = ""; 

function attachCellClickEvents() {
    const cells = document.querySelectorAll('.clickable-cell');
    cells.forEach(cell => {
        cell.onclick = function() {
            const tr = this.closest('tr');
            if (!tr.classList.contains('highlight-row')) return; // Chỉ cho click vào dòng của NV
            
            const dateStr = this.getAttribute('data-date');
            if (!dateStr) return;
            
            const id2Val = document.getElementById('id2').value.trim();
            const isUpdateOnly = (id2Val === "");
            
            if (isUpdateOnly) {
                // TRƯỜNG HỢP CẬP NHẬT -> HIỆN POPUP CHỌN CA
                tempTargetDate = dateStr;
                document.getElementById('pickerDateLabel').innerText = "Ngày: " + dateStr;
                renderShiftPickerOptions();
                document.getElementById('shiftPickerOverlay').style.display = 'flex';
            } else {
                // TRƯỜNG HỢP ĐỔI CA -> TỰ ĐỘNG CHỌN (TOGGLE)
                if (selectedActions[dateStr]) {
                    delete selectedActions[dateStr]; // Bỏ chọn
                } else {
                    selectedActions[dateStr] = { newShift: null }; // Thêm chọn
                }
                refreshTableSelection();
                updateBottomSheet();
            }
        };
    });
}

// RENDER POPUP CHỌN CA A,B,C,D...
function renderShiftPickerOptions() {
    const optsDiv = document.getElementById('shiftOptions');
    // Kiểm tra DB hay Phản ứng dựa vào ViTri
    const isDB = (currentViTri.includes("DB") || currentViTri.includes("DongBao"));
    const shifts = isDB ? ["B", "C", "D", "N"] : ["A", "B", "C", "D", "N"];
    
    let html = "";
    shifts.forEach(s => {
        html += `<button type="button" class="shift-btn" onclick="selectNewShift('${s}')">${s}</button>`;
    });
    optsDiv.innerHTML = html;
}

window.closeShiftPicker = function() {
    document.getElementById('shiftPickerOverlay').style.display = 'none';
}

window.selectNewShift = function(shiftVal) {
    if (tempTargetDate) {
        selectedActions[tempTargetDate] = { newShift: shiftVal };
    }
    closeShiftPicker();
    refreshTableSelection();
    updateBottomSheet();
}

function refreshTableSelection() {
    const cells = document.querySelectorAll('.clickable-cell');
    cells.forEach(c => {
        c.classList.remove('cell-selected');
        const oldMark = c.querySelector('.cell-updated-mark');
        if(oldMark) oldMark.remove();
        
        if (c.getAttribute('data-original-val') !== null) {
            c.innerHTML = c.getAttribute('data-original-val');
            c.removeAttribute('data-original-val');
        }

        const dateStr = c.getAttribute('data-date');
        const tr = c.closest('tr');
        
        if (dateStr && selectedActions[dateStr] && tr.classList.contains('highlight-row')) {
            c.classList.add('cell-selected');
            
            const newShift = selectedActions[dateStr].newShift;
            if (newShift) {
                c.setAttribute('data-original-val', c.innerHTML);
                c.innerHTML = `${newShift} <div class="cell-updated-mark"></div>`;
            }
        }
    });
}

function updateBottomSheet() {
    const sheet = document.getElementById('bottomSheet');
    const msg = document.getElementById('bsMessage');
    const id1 = document.getElementById('id1').value.trim();
    const id2 = document.getElementById('id2').value.trim();
    
    const daysCount = Object.keys(selectedActions).length;
    
    if (daysCount === 0) {
        sheet.classList.remove('show');
        return;
    }
    
    sheet.classList.add('show');
    
    if (id2 === "") {
        msg.innerHTML = `Bạn đang cập nhật ca cho <b>${daysCount} ngày</b>.`;
    } else {
        msg.innerHTML = `Đổi ca giữa <b>${id1}</b> và <b>${id2}</b> cho <b>${daysCount} ngày</b>.`;
    }
}

/* ==========================================
   4. GỬI DỮ LIỆU & ĐẾM GIÂY (TIMER)
========================================== */
async function submitData() {
    if (isSubmitting) return;
    isSubmitting = true;

    const btn = document.getElementById('btnSubmitSheet');
    const txt = document.getElementById('btnTextSheet');
    const id1 = document.getElementById('id1').value.trim();
    const id2 = document.getElementById('id2').value.trim();
    
    btn.disabled = true;
    const isUpdateOnly = (id1 !== "" && id2 === "");
    const loadingStr = isUpdateOnly ? "ĐANG CẬP NHẬT" : "ĐANG ĐỔI CA";
    
    let seconds = 0;
    txt.innerHTML = `⏳ ${loadingStr}... ${seconds}s`;
    
    const timerInterval = setInterval(() => {
        seconds++;
        txt.innerHTML = `⏳ ${loadingStr}... ${seconds}s`;
    }, 1000);

    const selectedDaysArr = [];
    for (const [dateStr, data] of Object.entries(selectedActions)) {
        selectedDaysArr.push({
            date: dateStr,
            newShift: data.newShift
        });
    }

    const payload = {
        action: "updateShifts",
        id1: id1,
        id2: id2,
        selectedDays: selectedDaysArr,
        deviceId: (typeof window.getDeviceId === 'function') ? window.getDeviceId() : "UNKNOWN"
    };

    try {
        const r = await fetch(SCRIPT_URL_DOI_CA, { method: 'POST', body: JSON.stringify(payload) });
        const res = await r.json();
        if (res.status === "success") {
            if(typeof window.showToast === 'function') window.showToast("Thành công!", true);
            
            // Kéo bảng mới về cập nhật RAM
            fetchAndRenderMonthlyTable(); 
            
            setTimeout(() => {
                document.getElementById('id1').value = ""; document.getElementById('id2').value = "";
                isId1Ok = false; isId2Ok = true; currentViTri = ""; currentNhomLich = "";
                document.getElementById('msg-id1').innerHTML = ''; document.getElementById('msg-id2').innerHTML = '';
                document.getElementById('smartTableContainer').style.display = 'none';
                selectedActions = {};
                updateBottomSheet();
            }, 1000);
        } else {
            if(typeof window.showToast === 'function') window.showToast(res.message, false);
            btn.disabled = false;
        }
    } catch (e) {
        if(typeof window.showToast === 'function') window.showToast("Lỗi mạng!", false);
        btn.disabled = false;
    } finally {
        clearInterval(timerInterval);
        txt.innerText = "XÁC NHẬN";
        isSubmitting = false; 
    }
}
