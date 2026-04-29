// ==========================================================================
// MODULE KHẨU TRANG V6.3 - LIVE CART & RAM CACHE LIST
// ==========================================================================

const SCRIPT_URL_KHAU_TRANG = "https://script.google.com/macros/s/AKfycbzYXPNw_cGZmvQZR9UNAs6XYEjPi6eBvG0fkeugNYfLN8p7utTXBiIovt6zqYHVoTAbTw/exec"; 
let currentRowForQty = null;

// --- BIẾN RAM CACHE CHO BẢNG DANH SÁCH ---
let isListVisible = false;
let isDataLoaded = false;

// ==========================================
// 1. CÁC HÀM XỬ LÝ SỐ LƯỢNG (QTY PICKER)
// ==========================================
window.toggleQtyPicker = function(e, el) {
    const dropdown = document.getElementById('ktDropdown');
    if (!dropdown) return;
    if (e.target.classList.contains('inline-qty-input')) return;
    
    if (dropdown.style.display === 'flex' && currentRowForQty === el) {
        window.closeQtyPicker();
        return;
    }
    
    currentRowForQty = el;
    const rect = el.getBoundingClientRect();
    dropdown.style.top = (rect.bottom + window.scrollY + 4) + 'px';
    dropdown.style.left = rect.left + 'px';
    dropdown.style.width = rect.width + 'px';
    dropdown.style.display = 'flex';
    dropdown.classList.remove('closing');
    dropdown.classList.add('opening');
};

window.closeQtyPicker = function() {
    const dropdown = document.getElementById('ktDropdown');
    if(dropdown && dropdown.style.display !== 'none') {
        dropdown.classList.remove('opening');
        dropdown.classList.add('closing');
        setTimeout(() => { dropdown.style.display = 'none'; }, 120);
    }
};

window.selectQty = function(val) {
    if (!currentRowForQty) return;
    const trigger = currentRowForQty;
    const span = trigger.querySelector('.current-qty');
    const icon = trigger.querySelector('.dropdown-icon');
    const input = trigger.querySelector('.inline-qty-input');
    const real = trigger.querySelector('.real-qty');
    
    if (val === 'OTHER') {
        span.style.display = 'none';
        icon.style.display = 'none';
        input.style.display = 'block';
        input.value = '';
        real.value = '';
        input.focus();
    } else {
        span.style.display = 'block';
        icon.style.display = 'block';
        input.style.display = 'none';
        span.innerText = val;
        real.value = val;
    }
    window.closeQtyPicker();
    window.updateLiveSheet();
};

// ==========================================
// 2. HÀM CẬP NHẬT GIỎ HÀNG (LIVE SHEET)
// ==========================================
window.updateLiveSheet = function() {
    const bs = document.getElementById('smartBottomSheet');
    const msgContainer = document.getElementById('smartBSMsg');
    const btnSubmit = document.getElementById('smartBtnSubmit');
    if (!bs || !msgContainer) return;

    const rows = document.querySelectorAll('.mask-row');
    let validCount = 0;
    let totalQty = 0;
    let stList = [];
    let isKho = false;
    let allValid = true;

    rows.forEach(row => {
        const msgName = row.querySelector('.msg-name');
        const realQty = row.querySelector('.real-qty').value;
        const soThe = row.querySelector('.soTheInput').value.trim();

        if (soThe === "520520") isKho = true;

        if (soThe !== "" && msgName.classList.contains('name-success')) {
            if (!realQty || parseInt(realQty) <= 0) {
                allValid = false;
            } else {
                validCount++;
                totalQty += parseInt(realQty);
                stList.push(soThe);
            }
        } else if (soThe !== "") {
            allValid = false;
        }
    });

    if (validCount > 0) {
        bs.classList.add('active');
        document.getElementById('bsBackdrop').classList.add('active');
        
        let textColor = isKho ? "#137333" : "#2C3E50";
        let iconHtml = isKho ? "📦" : `<span class="material-symbols-outlined" style="font-size:18px; color:var(--accent); vertical-align:middle;">badge</span>`;
        
        let htmlContent = `
            <div class="kt-summary-text-center">
                <div class="kt-summary-st" style="color: ${textColor};">
                    ${iconHtml} ${stList.join(', ')}
                </div>
                <div>${isKho ? 'Nhập kho tổng' : (validCount === 1 ? 'Nhận' : 'Nhận tổng')} <span class="kt-summary-qty">${totalQty}</span> khẩu trang</div>
            </div>
        `;
        msgContainer.innerHTML = htmlContent;
        
        if (allValid && rows.length === validCount) {
            btnSubmit.disabled = false;
        } else {
            btnSubmit.disabled = true;
        }
    } else {
        bs.classList.remove('active');
        document.getElementById('bsBackdrop').classList.remove('active');
        btnSubmit.disabled = true;
    }
};

window.resetForm = () => {
    const container = document.getElementById('maskInputsContainer');
    if(container) {
        container.querySelectorAll('.mask-row:not(:first-child)').forEach(el => el.remove());
        const firstRow = container.querySelector('.mask-row');
        if(firstRow) {
            firstRow.querySelector('.soTheInput').value = '';
            const msgName = firstRow.querySelector('.msg-name');
            msgName.innerHTML = '';
            msgName.classList.remove('name-success', 'name-error');
            
            firstRow.querySelector('.current-qty').style.display = 'block';
            firstRow.querySelector('.current-qty').innerText = 'SL';
            firstRow.querySelector('.dropdown-icon').style.display = 'block';
            firstRow.querySelector('.inline-qty-input').style.display = 'none';
            firstRow.querySelector('.inline-qty-input').value = '';
            firstRow.querySelector('.real-qty').value = '';
        }
    }
    window.updateLiveSheet();
};

// ==========================================
// 3. LOGIC RAM CACHE VÀ NÚT ẨN HIỆN BẢNG
// ==========================================
window.toggleHistoryList = async function() {
    const wrapper = document.getElementById('listWrapper');
    const icon = document.getElementById('listToggleIcon');

    isListVisible = !isListVisible;

    if (isListVisible) {
        wrapper.style.display = 'block';
        icon.innerText = 'unfold_less'; // Mũi tên thu lên
        
        // Nếu chưa có data trong RAM thì mới gọi Server
        if (!isDataLoaded) {
            await loadHistory();
        }
    } else {
        wrapper.style.display = 'none';
        icon.innerText = 'unfold_more'; // Mũi tên xổ xuống
    }
};

async function loadHistory() {
    const loading = document.getElementById('tableLoading');
    const container = document.getElementById('tableContainer');
    const tb = document.getElementById('tableBody');

    loading.style.display = 'block';
    container.style.display = 'none';

    try {
        const r = await fetch(SCRIPT_URL_KHAU_TRANG, { 
            method: 'POST', 
            body: JSON.stringify({ action: "getKhauTrangData" }) 
        });
        const rawText = await r.text();
        let res;
        try { res = JSON.parse(rawText); } catch(e) { return; }

        if (res.status === "success" && res.data) {
            tb.innerHTML = '';
            res.data.forEach(row => {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td>${row.ngayGio}</td>
                                <td>${row.soThe}</td>
                                <td style="font-weight: 500;">${row.hoTen}</td>
                                <td style="color: var(--accent); font-weight: bold;">${row.soLuong}</td>`;
                tb.appendChild(tr);
            });
            isDataLoaded = true; // Đánh dấu RAM đã có dữ liệu
        }
    } catch(e) {
        console.error("Lỗi tải lịch sử Khẩu trang:", e);
    } finally {
        loading.style.display = 'none';
        if (isDataLoaded) container.style.display = 'block';
    }
}

// ==========================================
// 4. KHỞI TẠO VÀ GẮN SỰ KIỆN API
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
    
    document.getElementById('smartBtnCancel').addEventListener('click', () => {
        window.resetForm();
    });

    document.getElementById('maskInputsContainer').addEventListener('click', (e) => {
        if (e.target.closest('.btn-pill-plus')) {
            const container = document.getElementById('maskInputsContainer');
            const row = document.createElement('div');
            row.className = 'mask-row';
            row.innerHTML = `
                <div class="employee-box" style="flex: 1;" onclick="this.querySelector('input').focus()">
                    <span class="material-symbols-outlined">badge</span>
                    <input type="number" inputmode="numeric" class="soTheInput" placeholder="Số Thẻ" autocomplete="off">
                    <div class="msg-name"></div>
                </div>
                <div class="qty-picker-trigger" onclick="toggleQtyPicker(event, this)">
                    <span class="current-qty">SL</span>
                    <span class="material-symbols-outlined dropdown-icon" style="font-size:18px;">arrow_drop_down</span>
                    <input type="number" inputmode="numeric" class="inline-qty-input" style="display:none;" placeholder="...">
                    <input type="hidden" class="real-qty" value="">
                </div>
                <button type="button" class="btn-pill-plus btn-remove-row" style="background:var(--error);"><span class="material-symbols-outlined">remove</span></button>
            `;
            container.appendChild(row);
            window.updateLiveSheet();
        }

        if (e.target.closest('.btn-remove-row')) {
            e.target.closest('.mask-row').remove();
            window.updateLiveSheet();
        }
    });

    document.getElementById('maskInputsContainer').addEventListener('input', (e) => {
        if (e.target.classList.contains('soTheInput')) {
            const input = e.target;
            const val = input.value.trim();
            const msgBox = input.closest('.employee-box').querySelector('.msg-name');
            
            msgBox.classList.remove('name-success', 'name-error');
            if (val === "") {
                msgBox.innerHTML = "";
            } else if (val === "520520") {
                msgBox.innerHTML = "📦 NHẬN KHO";
                msgBox.classList.add('name-success');
                
                const container = document.getElementById('maskInputsContainer');
                const allRows = container.querySelectorAll('.mask-row');
                const isLastRow = (input.closest('.mask-row') === allRows[allRows.length - 1]);
                
                if (isLastRow) {
                    const plusBtn = container.querySelector('.btn-pill-plus:not(.btn-remove-row)');
                    if(plusBtn) plusBtn.click();
                    setTimeout(() => {
                        const newRows = container.querySelectorAll('.mask-row');
                        const lastInput = newRows[newRows.length - 1].querySelector('.soTheInput');
                        if (lastInput) lastInput.focus();
                    }, 50);
                }
            } else {
                const emp = window.employeeData ? window.employeeData.find(v => v.soThe === val) : null;
                if (emp) {
                    msgBox.innerHTML = `${emp.hoTen} - ${emp.boPhan}`;
                    msgBox.classList.add('name-success');
                } else {
                    msgBox.innerHTML = "Không tồn tại";
                    msgBox.classList.add('name-error');
                }
            }
            window.updateLiveSheet();
        }

        if (e.target.classList.contains('inline-qty-input')) {
            const input = e.target;
            const real = input.closest('.qty-picker-trigger').querySelector('.real-qty');
            const val = input.value.trim();
            real.value = val;
            window.updateLiveSheet();
        }
    });

    document.getElementById('smartBtnSubmit').addEventListener('click', async () => {
        const btn = document.getElementById('smartBtnSubmit');
        const txt = document.getElementById('bsBtnText');
        const sp = document.getElementById('bsSpinner');
        
        btn.disabled = true;
        txt.style.display = 'none';
        sp.style.display = 'block';

        const rows = document.querySelectorAll('.mask-row');
        let records = [];
        let nguoiNhanThay = "";
        let isKho = false;

        const firstRowName = rows.querySelector('.msg-name').innerText;
        const firstRowId = rows.querySelector('.soTheInput').value.trim();
        
        if (firstRowId === "520520") {
            isKho = true;
        } else {
            nguoiNhanThay = firstRowName.split(' - ');
        }

        rows.forEach(row => {
            const soThe = row.querySelector('.soTheInput').value.trim();
            const realQty = row.querySelector('.real-qty').value;
            const msgBox = row.querySelector('.msg-name');
            
            if (soThe !== "" && soThe !== "520520" && msgBox.classList.contains('name-success')) {
                const hoTen = msgBox.innerText.split(' - ');
                let nguoiNhanDich = isKho ? "" : (soThe === firstRowId ? hoTen : nguoiNhanThay);
                let ghiChuDich = isKho ? "Nhận khẩu trang" : "";
                
                records.push({
                    soThe: soThe,
                    hoTen: hoTen,
                    soLuong: realQty,
                    nguoiNhan: nguoiNhanDich,
                    ghiChu: ghiChuDich
                });
            }
        });

        const payload = {
            action: "submitKhauTrang",
            records: records,
            deviceId: (typeof window.getDeviceId === 'function') ? window.getDeviceId() : "WEB"
        };

        try {
            const r = await fetch(SCRIPT_URL_KHAU_TRANG, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            const rawText = await r.text();
            let res;
            try { res = JSON.parse(rawText); } catch(e) { throw new Error(rawText); }

            if (res.status === "success") {
                document.getElementById('smartBottomSheet').classList.remove('active');
                document.getElementById('bsBackdrop').classList.remove('active');
                window.resetForm();
                
                if (typeof window.showToast === 'function') window.showToast("Cấp phát thành công!", true);
                
                // --- XÓA CACHE VÀ LÀM MỚI BẢNG NẾU ĐANG MỞ ---
                isDataLoaded = false;
                if (isListVisible) {
                    loadHistory();
                }

            } else {
                alert("LỖI TỪ SERVER:\n" + res.message);
            }
        } catch (err) {
            alert("LỖI HỆ THỐNG HOẶC MẠNG:\n" + err.toString());
        } finally {
            txt.style.display = 'block';
            sp.style.display = 'none';
        }
    });
});

// Hàm khởi tạo độc lập, không ép tải bảng lịch sử
function initKhauTrangApp() {
    if (typeof window.loadEmployeesData === 'function') {
        window.loadEmployeesData().catch(e => console.error("Lỗi tải Data:", e));
    }
}
initKhauTrangApp();
