// ==========================================================================
// VNPS SUPER APP - MODULE ĐỔI CA V4.8 (MASTER RELEASE)
// Tích hợp: Smart Matrix, Đồng hồ cát lật, Skeleton Loading & Lọc thông minh
// ==========================================================================

const SCRIPT_URL_DOI_CA = "https://script.google.com/macros/s/AKfycbzYXPNw_cGZmvQZR9UNAs6XYEjPi6eBvG0fkeugNYfLN8p7utTXBiIovt6zqYHVoTAbTw/exec";

let rawTableData = []; 
let selectedActions = {}; 
let isSubmitting = false; 
let currentMonthStr = ""; 
let isCompactMode = true; 
let dateToScroll = null; 
let activeDropdownDate = null; 
let isDropdownAnimating = false; 

let originalShiftsCache = {}; 

const VN_DAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const VN_HOLIDAYS = ["01/01", "30/04", "01/05", "02/09", "10/03", "23/11"]; 

let currentViTri = ""; 
let isId1Ok = false, isId2Ok = true;

function closeDropdownMenu(callback) {
    const dropdown = document.getElementById('smartDropdownMenu');
    if (dropdown && dropdown.style.display === 'flex' && !dropdown.classList.contains('closing')) {
        dropdown.classList.remove('opening');
        dropdown.classList.add('closing');
        isDropdownAnimating = true;
        setTimeout(() => {
            dropdown.style.display = 'none';
            dropdown.classList.remove('closing');
            activeDropdownDate = null;
            isDropdownAnimating = false;
            if (callback) callback(); 
        }, 120); 
    } else {
        if (callback) callback();
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    
    // --- HỆ THỐNG XÓA TRẮNG FORM TRIỆT ĐỂ CHỐNG CACHE ---
    const forceResetForm = () => {
        const form = document.getElementById('doiCaForm');
        const i1 = document.getElementById('id1');
        const i2 = document.getElementById('id2');
        if(form) form.reset();
        if(i1) i1.value = "";
        if(i2) i2.value = "";
        validateAndFilter();
    };

    // Chạy dọn dẹp ngay khi load DOM
    forceResetForm();
    // Chạy dọn dẹp dự phòng chống Autofill trễ của Chrome/Safari
    setTimeout(forceResetForm, 100);

    // Chặn tính năng khôi phục bộ đệm (BfCache) khi mở lại tab hoặc bấm Back
    window.addEventListener('pageshow', function(event) {
        if (event.persisted || (window.performance && window.performance.navigation.type === 2)) {
            forceResetForm();
        }
    });
    // ---------------------------------------------------

    if(typeof window.loadEmployeesData === 'function') await window.loadEmployeesData();
    
    document.getElementById('id1').addEventListener('input', validateAndFilter);
    document.getElementById('id2').addEventListener('input', validateAndFilter);
    
    // NÚT HỦY: Reset sạch sẽ toàn bộ form như yêu cầu
    document.getElementById('smartBtnCancel').onclick = () => { 
        selectedActions = {}; 
        const form = document.getElementById('doiCaForm');
        const i1 = document.getElementById('id1');
        const i2 = document.getElementById('id2');
        if(form) form.reset();
        if(i1) i1.value = "";
        if(i2) i2.value = "";
        validateAndFilter(); // Hàm này sẽ tự động dọn sạch bảng và tắt Bottom Sheet
    };
    
    document.getElementById('smartBtnSubmit').onclick = (e) => { 
        e.preventDefault(); 
        submitData(); 
    };

    let dropdown = document.getElementById('smartDropdownMenu');
    if (!dropdown) {
        dropdown = document.createElement('div');
        dropdown.id = 'smartDropdownMenu';
        dropdown.className = 'smart-dropdown-menu';
        document.body.appendChild(dropdown);
    }
    
    document.addEventListener('click', function(e) {
        closeDropdownMenu();
    });

    // Gọi tải dữ liệu lịch tháng ngầm
    setTimeout(fetchLichCaNgam, 1000);
});

window.clearInput = function(event, inputId) {
    event.stopPropagation();
    closeDropdownMenu(); 
    const inputEl = document.getElementById(inputId);
    inputEl.value = ""; 
    validateAndFilter(); 
    inputEl.focus(); 
}

function validateAndFilter() {
    selectedActions = {};

    const val1 = document.getElementById('id1').value.trim();
    const val2 = document.getElementById('id2').value.trim();
    const msg1 = document.getElementById('msg-id1');
    const msg2 = document.getElementById('msg-id2');

    const btnClear1 = document.getElementById('clear-id1');
    const btnClear2 = document.getElementById('clear-id2');
    if (btnClear1) btnClear1.style.display = val1 !== "" ? 'block' : 'none';
    if (btnClear2) btnClear2.style.display = val2 !== "" ? 'block' : 'none';

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

    // ==========================================
    // LOGIC ĐIỀU KHIỂN SKELETON LOADING THÔNG MINH
    // ==========================================
    const container = document.getElementById('smartMatrixContainer');
    const loadingBox = document.getElementById('smartLoadingState'); 
    const wasHidden = container.style.display === 'none' || container.style.display === '';

    // 1. Trạng thái chưa nhập hoặc sai ID -> Giấu bảng
    if (!isId1Ok || team1 === "") { 
        container.style.display = 'none'; 
        if (loadingBox) loadingBox.style.display = 'none';
        container.classList.remove('active-filter', 'compact-mode');
        refreshUI(); 
        return; 
    }

    // 2. Đã nhập đúng ID, nhưng Lịch ngầm chưa tải xong -> HIỆN SKELETON KÈM HEADER GIẢ
    if (rawTableData.length === 0) {
        container.style.display = 'block';
        container.classList.add('active-filter');
        if (loadingBox) loadingBox.style.display = 'none'; // Ép giấu UI loading cũ đi
        
        // Gọi hàm bơm khung xương toàn cục (7 cột, 4 dòng giả, THAM SỐ TRUE = CÓ TIÊU ĐỀ GIẢ)
        if (typeof window.showTableSkeleton === 'function') {
            window.doicaSkeletonCloser = window.showTableSkeleton('smartTable', 7, 4, true);
        }
        return; 
    }
    
    // 3. Đã có dữ liệu đầy đủ -> Dọn dẹp và vẽ bảng Lịch thật
    if (loadingBox) loadingBox.style.display = 'none';
    
    isCompactMode = true; 
    container.style.display = 'block';
    container.classList.add('active-filter', 'compact-mode'); 
    
    renderSmartTable(); 
    refreshUI();

    if (wasHidden) {
        setTimeout(() => { scrollToDate(getTodayYYYYMMDD()); }, 150);
    }
}

function getTodayYYYYMMDD() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function scrollToDate(targetDate) {
    const container = document.getElementById('smartMatrixContainer');
    const targetCell = document.querySelector(`th[data-date="${targetDate}"]`);
    if (targetCell && container) {
        const scrollLeftPos = targetCell.offsetLeft - 75; 
        container.scrollTo({ left: Math.max(0, scrollLeftPos), behavior: 'smooth' });
    }
}

window.toggleTeamView = function() {
    const container = document.getElementById('smartMatrixContainer');
    const icon = document.getElementById('iconToggleView');
    isCompactMode = !isCompactMode; 
    
    if (icon) { // Thêm dòng này để bảo vệ code không bị lỗi nếu không tìm thấy icon
        if (isCompactMode) {
            container.classList.add('compact-mode');
            // Cập nhật đường dẫn file SVG
            icon.src = 'icons/unfold_more.svg'; 
        } else {
            container.classList.remove('compact-mode');
            // Cập nhật đường dẫn file SVG
            icon.src = 'icons/unfold_less.svg'; 
        }
    }
    
    renderSmartTable(); 
    refreshUI(); 
    closeDropdownMenu();
}


async function fetchLichCaNgam() {
    try {
        const r = await fetch(SCRIPT_URL_DOI_CA, { method: 'POST', body: JSON.stringify({ action: "getMonthlyReport" }) });
        const res = await r.json();
        
        if (res.status === "success" && res.data) {
            rawTableData = res.data.tableData;
            currentMonthStr = res.data.monthYear; 
            
            // Xóa hiệu ứng mờ của tiêu đề giả ngay khi có dữ liệu (Chống lỗi lưu Cache ảnh hưởng API khác)
            if (window.doicaSkeletonCloser) {
                window.doicaSkeletonCloser();
                window.doicaSkeletonCloser = null;
            }

            originalShiftsCache = {};
            let activeTeamName = "";
            rawTableData.forEach((row, idx) => {
                if (idx > 0 && row[row.length-1] === 'GROUP') {
                    activeTeamName = row[0].toString().trim();
                    originalShiftsCache[activeTeamName] = row;
                }
            });

            // Nếu người dùng đã gõ xong số thẻ trong lúc chờ mạng, tự động vẽ luôn bảng
            validateAndFilter(); 

            setTimeout(() => {
                if (dateToScroll) {
                    scrollToDate(dateToScroll);
                    dateToScroll = null; 
                }
            }, 150);
        }
    } catch(e) { console.error("Lỗi nạp RAM:", e); }
}

function renderSmartTable() {
    let html = "";
    let activeTeam = ""; 
    let cYear = new Date().getFullYear(), cMonth = new Date().getMonth() + 1;
    let displayMonth = "ST";

    if (currentMonthStr) {
        let mParts = currentMonthStr.split('/');
        if (mParts.length === 2) {
            displayMonth = String(mParts[0]).padStart(2, '0');
            cMonth = parseInt(mParts[0]); cYear = parseInt(mParts[1]);
        }
    }

    const val1 = document.getElementById('id1').value.trim();
    const val2 = document.getElementById('id2').value.trim();
    const emp1 = window.employeeData ? window.employeeData.find(e => e.soThe === val1) : null;
    const emp2 = window.employeeData ? window.employeeData.find(e => e.soThe === val2) : null;
    const team1 = emp1 ? emp1.nhomLich.trim() : "";
    const team2 = emp2 ? emp2.nhomLich.trim() : "";

    rawTableData.forEach((row, rIdx) => {
        const formatFlag = row[row.length - 1]; 
        let empId = "", trTeam = "";
        let isGroupRow = (formatFlag === 'GROUP');
        
        if (rIdx > 0) {
            if (isGroupRow) { activeTeam = row[0].toString().trim(); trTeam = activeTeam; } 
            else if (row[0]) {
                empId = row[0].toString().trim();
                const emp = window.employeeData ? window.employeeData.find(e => e.soThe === empId) : null;
                trTeam = (emp && emp.nhomLich) ? emp.nhomLich.trim() : activeTeam;
                activeTeam = trTeam;
            }
        }
        
        const isTargetNV = (empId === val1 || (val2 !== "" && empId === val2));
        const isTargetTeam = (trTeam === team1 || (val2 !== "" && trTeam === team2));

        let trCls = isGroupRow ? "row-goc" : "";
        if (isTargetNV) trCls += " smart-highlight-row";
        
        let trStyle = "display: none;";
        if (rIdx === 0) {
            trStyle = ""; 
        } else if (isCompactMode) {
            if (isTargetNV) trStyle = ""; 
        } else {
            if (isTargetTeam) trStyle = ""; 
        }
        
        html += `<tr data-team="${trTeam}" data-id="${empId}" class="${trCls}" style="${trStyle}">`;
        
        for (let cIdx = 0; cIdx < row.length - 1; cIdx++) {
            let cell = row[cIdx] || "";
            let cls = rIdx === 0 ? "smart-sticky-header" : "";
            if (cIdx === 0) cls += " smart-sticky-col";
            
            if (rIdx === 0 && cIdx === 0) { 
                cls += " smart-sticky-corner"; 
                cell = `
                    <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; box-sizing: border-box; padding: 0 4px;">
                        <div class="smart-toggle-btn" onclick="toggleTeamView()" style="margin:0; padding:0;" title="Mở rộng/Thu gọn Tổ">
                            <img src="icons/${isCompactMode ? 'unfold_more' : 'unfold_less'}.svg" id="iconToggleView" alt="Toggle" style="width: 24px; height: 24px; vertical-align: middle; pointer-events: none;">
                        </div>
                        <div style="display: flex; flex-direction: column; align-items: center; line-height: 1.1;">
                            <div style="font-size: 15px; font-weight: 900; color: var(--primary); border-bottom: 1.5px solid var(--primary); padding-bottom: 1px; margin-bottom: 2px; width: 100%; text-align: center;">${displayMonth}</div>
                            <div style="font-size: 11px; font-weight: bold; color: #5F6368;">${cYear}</div>
                        </div>
                    </div>
                `; 
            }
            
            let dateAttr = "";
            if (rIdx === 0 && cIdx > 0) {
                if (cell) {
                    let cellStr = cell.toString();
                    let dDay, dMonth;
                    if (cellStr.includes('-')) {
                        let p = cellStr.split('-');
                        dDay = parseInt(p[2]); dMonth = parseInt(p[1]); cYear = parseInt(p[0]); 
                    } else {
                        let p = cellStr.split('/');
                        dDay = parseInt(p[0]); dMonth = p.length >= 2 ? parseInt(p[1]) : cMonth;
                    }
                    
                    let dObj = new Date(cYear, dMonth - 1, dDay), dayName = VN_DAYS[dObj.getDay()];
                    let displayDay = String(dDay).padStart(2,'0');
                    let displayMonthStr = String(dMonth).padStart(2,'0');
                    let checkHolidayStr = `${displayDay}/${displayMonthStr}`;
                    let fullDateStr = `${cYear}-${displayMonthStr}-${displayDay}`;
                    
                    rawTableData[0][cIdx] = fullDateStr; 
                    dateAttr = `data-date="${fullDateStr}"`; 
                    cls += " smart-clickable"; 
                    
                    if (dObj.getDay() === 0 || VN_HOLIDAYS.includes(checkHolidayStr)) cls += " smart-holiday";
                    cell = `<div class="smart-header-cell-content"><span class="smart-header-day">${dayName}</span><span class="smart-header-date">${displayDay}</span></div>`;
                }
            } 
            else if (rIdx > 0 && cIdx > 0) {
                dateAttr = rawTableData[0][cIdx] ? `data-date="${rawTableData[0][cIdx]}"` : "";
                cls += " smart-clickable";
                
                if (isCompactMode && isTargetNV) {
                    if (cell === "") {
                        let baseRow = originalShiftsCache[trTeam];
                        cell = baseRow ? baseRow[cIdx] : "";
                        cls += " cell-merged-goc"; 
                    } else {
                        cls += " cell-merged-changed"; 
                    }
                }
            } 
            else if (rIdx > 0 && cIdx === 0) {
                if (isGroupRow) {
                    let displayTeam = activeTeam;
                    if (activeTeam === "T1" || activeTeam === "DB1") displayTeam = "CA 1";
                    else if (activeTeam === "T2" || activeTeam === "DB2") displayTeam = "CA 2";
                    else if (activeTeam === "T3" || activeTeam === "DB3") displayTeam = "CA 3";
                    else if (activeTeam === "T4") displayTeam = "CA 4";
                    cell = `<div style="text-align: center;">${displayTeam}</div>`;
                } else {
                    cell = `<div style="text-align: center; font-weight: 800;">${empId}</div>`;
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

function attachClicks() {
    document.querySelectorAll('.smart-clickable').forEach(el => {
        el.onclick = function(e) {
            let targetCell = this;
            if (this.tagName.toLowerCase() === 'th') {
                const colIndex = Array.from(this.parentNode.children).indexOf(this);
                const nvRow = document.querySelector('.smart-highlight-row');
                if (nvRow && nvRow.children[colIndex]) targetCell = nvRow.children[colIndex];
            }
            
            const date = targetCell.getAttribute('data-date'); 
            if (!date) return;
            
            if (this.tagName.toLowerCase() === 'td') {
                if (!this.closest('tr').classList.contains('smart-highlight-row')) return;
            }
            
            const id2 = document.getElementById('id2').value.trim();
            if (id2 === "") { 
                e.stopPropagation(); 
                if (isDropdownAnimating) return; 

                const dropdown = document.getElementById('smartDropdownMenu');
                const openMenu = () => {
                    tempTargetDate = date; activeDropdownDate = date;

                    const shifts = (currentViTri.includes("DB") || currentViTri.includes("DongBao")) ? ["B", "C", "D", "N"] : ["A", "B", "C", "D", "N"];
                    
                    // THÊM NÚT HỦY CHỌN VÀO DROPDOWN
                    let html = `<div class="smart-dropdown-item" onclick="selectNewShift(event, 'REMOVE')" style="color: var(--error, #D93025); font-weight: bold; border-bottom: 1px solid #f1f3f4; display: flex; align-items: center; justify-content: center; gap: 6px;">
                                    <img src="icons/close.svg" alt="close" style="width: 18px; height: 18px;">
                                </div>`;
                    
                    html += shifts.map(s => `<div class="smart-dropdown-item" onclick="selectNewShift(event, '${s}')">${s}</div>`).join("");
                    
                    dropdown.innerHTML = html;
                    dropdown.style.display = 'flex'; 
                    dropdown.classList.remove('closing'); 
                    dropdown.classList.add('opening');

                    let dropTarget = this;
                    if (this.tagName.toLowerCase() === 'th') {
                        const colIndex = Array.from(this.parentNode.children).indexOf(this);
                        const nvRow = document.querySelector('.smart-highlight-row');
                        if (nvRow && nvRow.children[colIndex]) {
                            dropTarget = nvRow.children[colIndex];
                        }
                    }
                    
                    const rect = dropTarget.getBoundingClientRect();
                    dropdown.style.top = (rect.bottom + 4) + 'px';
                    dropdown.style.left = (rect.left + (rect.width / 2) - 30) + 'px';
                };

                if (activeDropdownDate === date) closeDropdownMenu();
                else if (activeDropdownDate !== null) closeDropdownMenu(() => { openMenu(); });
                else openMenu();
            } else { 
                if (selectedActions[date]) delete selectedActions[date];
                else selectedActions[date] = { newShift: null };
                refreshUI();
            }
        };
    });
}

window.selectNewShift = function(e, shiftVal) {
    if (e) e.stopPropagation(); 
    if (tempTargetDate) {
        // XỬ LÝ LỆNH HỦY CHỌN CA
        if (shiftVal === 'REMOVE') {
            delete selectedActions[tempTargetDate];
        } else {
            selectedActions[tempTargetDate] = { newShift: shiftVal };
        }
    }
    refreshUI(); 
    closeDropdownMenu(); 
}

function refreshUI() {
    const count = Object.keys(selectedActions).length;
    const bs = document.getElementById('smartBottomSheet');
    
    if (count > 0 && isId1Ok) {
        bs.classList.add('active');
        
        const id1 = document.getElementById('id1').value.trim();
        const id2 = document.getElementById('id2').value.trim();
        const emp1 = window.employeeData ? window.employeeData.find(e => e.soThe === id1) : null;
        const emp2 = window.employeeData ? window.employeeData.find(e => e.soThe === id2) : null;
        const name1 = emp1 ? emp1.hoTen : id1;
        const name2 = emp2 ? emp2.hoTen : id2;

        let msgBox = document.getElementById('smartBSMsg');
        
        if (id2 === "") {
            msgBox.innerHTML = `
                <div style="font-size: 14px; color: #5F6368; margin-bottom: 8px;">Cập nhật ca <b>${count} ngày</b>:</div>
                <div style="display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 16px; font-weight: 800;">
                    <img src="icons/user1.svg" alt="" style="width: 18px; height: 18px; flex-shrink: 0;">
                    ${name1}
                </div>
            `;
        } else {
            msgBox.innerHTML = `
                <div style="font-size: 14px; color: #5F6368; margin-bottom: 10px;">Đổi ca <b>${count} ngày</b>:</div>
                <div style="display: flex; flex-direction: column; align-items: center; gap: 6px; font-size: 15px; font-weight: 800; color: var(--primary);">
                                    <div style="display: flex; align-items: center; gap: 8px;">
                    <img src="icons/user1.svg" alt="" style="width: 18px; height: 18px; flex-shrink: 0;">
                    ${name1}
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <img src="icons/user2.svg" alt="" style="width: 18px; height: 18px; flex-shrink: 0;">
                    ${name2}
                </div>
                </div>
            `;
        }
    } else { 
        bs.classList.remove('active'); 
    }
    
    document.querySelectorAll('.smart-clickable').forEach(el => {
        const dateStr = el.getAttribute('data-date');
        const isSel = !!selectedActions[dateStr];
        
        if (el.tagName.toLowerCase() === 'th') { el.classList.toggle('smart-header-selected', isSel); return; }
        
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

// ==========================================================================
// HÀM SUBMIT VỚI ĐỒNG HỒ CÁT TÍCH HỢP (V4.8)
// ==========================================================================
async function submitData() {
    if (isSubmitting) return;
    isSubmitting = true;

    // KÍCH HOẠT ĐỒNG HỒ CÁT TOÀN CỤC & KHÓA NÚT HỦY TRÊN BOTTOM SHEET
    const stopLoading = window.startLoadingState('smartBtnSubmit', ['smartBtnCancel']);

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
            const editedDates = Object.keys(selectedActions);
            if (editedDates.length > 0) dateToScroll = editedDates[0]; 
            
            selectedActions = {}; 
            refreshUI();
            fetchLichCaNgam(); // Bắn lệnh cập nhật ngầm lại Lịch từ Server
        } else { 
            if(typeof window.showToast === 'function') window.showToast(res.message, false); 
        }
    } catch(e) { 
        if(typeof window.showToast === 'function') window.showToast("Lỗi mạng hoặc hệ thống!", false); 
    } finally { 
        // BẮT BUỘC TẮT ĐỒNG HỒ CÁT & MỞ KHÓA KHI HOÀN TẤT
        if (stopLoading) stopLoading(); 
        isSubmitting = false; 
    }
}
