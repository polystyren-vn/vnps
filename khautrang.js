// ==========================================================================
// MODULE KHẨU TRANG V6.2 - LIVE CART (UI TINH GỌN, ỔN ĐỊNH TUYỆT ĐỐI)
// ==========================================================================

const SCRIPT_URL_KHAU_TRANG = "https://script.google.com/macros/s/AKfycbzYXPNw_cGZmvQZR9UNAs6XYEjPi6eBvG0fkeugNYfLN8p7utTXBiIovt6zqYHVoTAbTw/exec";
let currentRowForQty = null;

// ==========================================
// 1. CÁC HÀM TOÀN CỤC (GLOBAL FUNCTIONS)
// ==========================================
window.toggleQtyPicker = function(e, el) {
    const dropdown = document.getElementById('ktDropdown');
    if (!dropdown) return;
    
    // (Đã xóa lệnh chặn click ô Khác) -> Chạm vào ô Input vẫn mở lại Dropdown bình thường
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
        input.focus();
        window.closeQtyPicker();

        input.onblur = function() {
            if(!this.value || parseInt(this.value) <= 0) {
                this.style.display = 'none';
                span.style.display = 'inline';
                icon.style.display = 'inline';
                span.innerText = 'SL';
                real.value = '';
            }
            window.checkValidity();
        };
        input.oninput = function() {
            real.value = this.value;
            window.checkValidity();
        };
    } else {
        input.style.display = 'none';
        span.style.display = 'inline';
        icon.style.display = 'inline';
        span.innerText = val;
        real.value = val;
        window.closeQtyPicker();
        window.checkValidity();
    }
};

// ==========================================
// 2. HÀM CẬP NHẬT GIỎ HÀNG (LIVE SHEET - 2 DÒNG CĂN GIỮA)
// ==========================================
window.updateLiveSheet = function() {
    const bs = document.getElementById('smartBottomSheet');
    const msgContainer = document.getElementById('smartBSMsg');
    if (!bs || !msgContainer) return;

    const records = [];
    let isImport = false;
    let hasAtLeastOneCompleteRow = false; 

    const rows = document.querySelectorAll('.mask-row');
    rows.forEach((row) => {
        const st = row.querySelector('.soTheInput');
        const realQty = row.querySelector('.real-qty');
        
        if (st && st.value.trim() !== "") {
            const qtyVal = realQty ? realQty.value : "";
            
            if (st.dataset.valid === "true") {
                if (st.value === "520520") {
                    isImport = true;
                    hasAtLeastOneCompleteRow = true;
                } else {
                    records.push({ soThe: st.value.trim(), sl: qtyVal ? parseInt(qtyVal) : 0 });
                    if (qtyVal !== "" && parseInt(qtyVal) > 0) hasAtLeastOneCompleteRow = true;
                }
            }
        }
    });

    // Bật/tắt Sheet
    if (hasAtLeastOneCompleteRow) {
        bs.classList.add('active');
        document.body.style.paddingBottom = "180px"; 
    } else {
        bs.classList.remove('active');
        document.body.style.paddingBottom = "0px";
        return; 
    }

    // VẼ NỘI DUNG 2 DÒNG
    let html = '';
    if (isImport) {
        html = `
            <div class="kt-summary-text-center">
                <div class="kt-summary-st" style="color: var(--accent);">
                    <span class="material-symbols-outlined">inventory_2</span> MÃ KHO
                </div>
                <div>Nhận <span class="kt-summary-qty">KHO</span> khẩu trang.</div>
            </div>
        `;
    } else {
        const stList = records.map(r => r.soThe).join(', ');
        const totalQty = records.reduce((sum, r) => sum + r.sl, 0);
        
        const textNhan = records.length === 1 
            ? `Nhận <span class="kt-summary-qty">${totalQty}</span> khẩu trang.` 
            : `Nhận tổng <span class="kt-summary-qty">${totalQty}</span> khẩu trang.`;

        html = `
            <div class="kt-summary-text-center">
                <div class="kt-summary-st">
                    <span class="material-symbols-outlined" style="color: #5F6368;">badge</span>
                    ${stList}
                </div>
                <div>${textNhan}</div>
            </div>
        `;
    }
    msgContainer.innerHTML = html;
};

// ==========================================
// 3. KIỂM TRA TÍNH HỢP LỆ TOÀN FORM
// ==========================================
window.checkValidity = function() {
    const rows = document.querySelectorAll('.mask-row');
    if(rows.length === 0) return;

    let isValid = true;
    let hasAtLeastOneValid = false;

    rows.forEach(row => {
        const st = row.querySelector('.soTheInput');
        const realQty = row.querySelector('.real-qty');
        if (st && st.value.trim() !== "") {
            const qtyVal = realQty ? realQty.value : "";
            if (st.value === "520520") {
                hasAtLeastOneValid = true;
            } else if (st.dataset.valid !== "true" || qtyVal === "" || parseInt(qtyVal) <= 0) {
                isValid = false; 
            } else {
                hasAtLeastOneValid = true;
            }
        }
    });

    const firstRow = document.querySelector('.mask-row');
    const firstSt = firstRow ? firstRow.querySelector('.soTheInput') : null;
    const firstValid = firstSt && (firstSt.dataset.valid === "true" || firstSt.value === "520520");

    const btn = document.getElementById('smartBtnSubmit');
    if(btn) btn.disabled = !(hasAtLeastOneValid && isValid && firstValid);

    window.updateLiveSheet();
};

window.resetForm = () => {
    const container = document.getElementById('maskInputsContainer');
    if(container) { container.querySelectorAll('.mask-row:not(:first-child)').forEach(el => el.remove()); }

    const form = document.getElementById('khauTrangForm');
    if(form) form.reset();

    const f = document.querySelector('.mask-row');
    if (f) {
        const st = f.querySelector('.soTheInput'), msg = f.querySelector('.msg-name'), 
              span = f.querySelector('.current-qty'), icon = f.querySelector('.dropdown-icon'),
              inp = f.querySelector('.inline-qty-input'), real = f.querySelector('.real-qty');

        if(st) { st.dataset.valid = "false"; st.dataset.hoten = ""; }
        if(msg) { msg.innerHTML = ""; msg.className = "msg-name"; msg.style.color = ""; }
        if(span) { span.style.display = "inline"; span.innerText = "SL"; }
        if(icon) { icon.style.display = "inline"; }
        if(inp) { inp.style.display = "none"; inp.value = ""; }
        if(real) { real.value = ""; }
    }
    
    const bs = document.getElementById('smartBottomSheet');
    if(bs) bs.classList.remove('active');
    document.body.style.paddingBottom = "0px";
};

// ==========================================
// 4. KHỞI TẠO VÀ GẮN SỰ KIỆN API (CÓ DOMContentLoaded BẢO VỆ)
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
    
    // 4.1 Khởi tạo tải danh bạ
    if (typeof window.loadEmployeesData === 'function') {
        window.loadEmployeesData().catch(e => console.error("Lỗi tải Data:", e));
    }

    // 4.2 LOGIC XỬ LÝ NHẬP LIỆU
    const container = document.getElementById('maskInputsContainer');
    const btnAdd = document.getElementById('btnAddMaskRow');

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.qty-picker-trigger') && !e.target.closest('#ktDropdown')) window.closeQtyPicker();
    });

    if (btnAdd && container) {
        btnAdd.addEventListener('click', () => {
            const row = document.createElement('div');
            row.className = 'mask-row';
            row.innerHTML = `
                <div class="employee-box" style="flex: 1;" onclick="this.querySelector('input').focus()">
                    <span class="material-symbols-outlined">badge</span>
                    <input type="number" inputmode="numeric" class="soTheInput" placeholder="ST" required autocomplete="off">
                    <div class="msg-name"></div>
                </div>
                <div class="qty-picker-trigger" onclick="window.toggleQtyPicker(event, this)">
                    <span class="current-qty">SL</span>
                    <span class="material-symbols-outlined dropdown-icon" style="font-size:18px;">arrow_drop_down</span>
                    <input type="number" inputmode="numeric" class="inline-qty-input" style="display:none;" placeholder="...">
                    <input type="hidden" class="real-qty" value="">
                </div>
                <button type="button" class="btn-remove-row" style="width:28px;height:48px;border-radius:14px;background:var(--error);color:white;border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;">
                    <span class="material-symbols-outlined">remove</span>
                </button>`;
            container.appendChild(row);
            row.querySelector('.btn-remove-row').addEventListener('click', () => {
                row.remove();
                window.checkValidity();
            });
            window.checkValidity();
        });
    }

    if (container) {
        container.addEventListener('input', (e) => {
            if (e.target.classList.contains('soTheInput')) {
                const val = e.target.value.trim();
                const parentBox = e.target.closest('.employee-box');
                const msgBox = parentBox ? parentBox.querySelector('.msg-name') : null;
                if (!msgBox) return;

                msgBox.classList.remove('name-success', 'name-error');

                if (val === "520520") {
                    msgBox.innerHTML = `📦 <b>NHẬN KHO</b>`;
                    msgBox.style.color = "var(--accent)";
                    e.target.dataset.hoten = "[MÃ KHO]";
                    e.target.dataset.valid = "true";

                    const rows = document.querySelectorAll('.mask-row');
                    if (rows.length === 1 && btnAdd) {
                        btnAdd.click();
                        setTimeout(() => {
                            const inputs = document.querySelectorAll('.soTheInput');
                            if(inputs.length > 1) inputs[1].focus();
                        }, 100);
                    }
                } else {
                    msgBox.style.color = "";
                    let emp = null;
                    if (window.employeeData && Array.isArray(window.employeeData)) {
                        emp = window.employeeData.find(v => String(v.soThe) === val);
                    }

                    if (emp) {
                        msgBox.innerHTML = emp.hoTen;
                        msgBox.classList.add('name-success');
                        e.target.dataset.hoten = emp.hoTen;
                        e.target.dataset.valid = "true";
                    } else {
                        msgBox.innerHTML = val ? "Không tìm thấy" : "";
                        if (val) msgBox.classList.add('name-error');
                        e.target.dataset.valid = "false";
                        e.target.dataset.hoten = "";
                    }
                }
                window.checkValidity();
            }
        });
    }

    // 4.3 SỰ KIỆN NÚT HỦY VÀ XÁC NHẬN
    document.getElementById('smartBtnCancel')?.addEventListener('click', window.resetForm);

    const smartBtnSubmit = document.getElementById('smartBtnSubmit');
    if (smartBtnSubmit) {
        smartBtnSubmit.addEventListener('click', async (e) => {
            const btn = document.getElementById('smartBtnSubmit');
            const txt = document.getElementById('bsBtnText');
            const sp = document.getElementById('bsSpinner');

            btn.disabled = true; txt.style.display = 'none'; sp.style.display = 'block';

            const records = [];
            let isImport = false;
            let leaderName = "";
            let firstIdx = -1;

            document.querySelectorAll('.mask-row').forEach((row, i) => {
                const st = row.querySelector('.soTheInput');
                const qty = row.querySelector('.real-qty');
                if (st && st.dataset.valid === "true") {
                    if (st.value === "520520") {
                        isImport = true;
                        return;
                    }
                    if (firstIdx === -1) {
                        firstIdx = i;
                        leaderName = st.dataset.hoten;
                    }
                    records.push({
                        soThe: st.value,
                        hoTen: st.dataset.hoten,
                        soLuong: qty ? qty.value : 0,
                        nguoiNhan: (i === firstIdx) ? st.dataset.hoten : leaderName,
                        ghiChu: isImport ? "Nhận khẩu trang" : ""
                    });
                }
            });

            try {
                let dId = "WEB";
                if (typeof window.getDeviceId === 'function') { try { dId = window.getDeviceId(); } catch(e) {} }

                const payload = { action: "submitKhauTrang", records: records, deviceId: dId };

                const r = await fetch(SCRIPT_URL_KHAU_TRANG, { method: 'POST', body: JSON.stringify(payload) });
                const rawText = await r.text();
                let res;

                try { res = JSON.parse(rawText); } catch(errParse) {
                    alert("LỖI GOOGLE SERVER TRẢ VỀ:\n" + rawText.substring(0, 200));
                    return;
                }

                if (res.status === "success") {
                    if(typeof window.showToast === 'function') window.showToast("Cấp phát thành công!", true);
                    window.resetForm();
                    loadHistory();
                } else { alert("LỖI MÃ GOOGLE SCRIPT:\n" + res.message); }

            } catch (err) {
                alert("LỖI KẾT NỐI (RỚT MẠNG):\n" + err.message);
            } finally {
                btn.disabled = false; txt.style.display = 'block'; sp.style.display = 'none';
            }
        });
    }

    // 4.4 LOGIC ẨN HIỆN BẢNG TÍCH HỢP VÀO ICON Ô NHẬP LIỆU
    const toggleListBtn = document.getElementById('toggleListBtn');
    const dataTable = document.getElementById('ktTable');

    if (toggleListBtn && dataTable) {
        toggleListBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation(); // Cực kỳ quan trọng để chặn focus nhầm
            dataTable.classList.toggle('hidden-table');
        });
    }

    // 4.5 TẢI LỊCH SỬ LẦN ĐẦU KHI MỞ TRANG
    loadHistory();

}); // KẾT THÚC KHỐI DOMContentLoaded CHUẨN TẠI ĐÂY

// ==========================================
// 5. HÀM TẢI LỊCH SỬ (NẰM ĐỘC LẬP BÊN NGOÀI)
// ==========================================
async function loadHistory() {
    const loading = document.getElementById('tableLoading');
    const container = document.getElementById('tableContainer');
    const tb = document.getElementById('tableBody');

    if(loading) loading.style.display = 'block';
    if(container) container.style.display = 'none';

    try {
        const r = await fetch(SCRIPT_URL_KHAU_TRANG, { method: 'POST', body: JSON.stringify({ action: "getKhauTrangData" }) });
        const rawText = await r.text();
        let res;
        try { res = JSON.parse(rawText); } catch(e) { return; }

        if (res.status === "success" && res.data) {
            if(tb) {
                tb.innerHTML = '';
                res.data.forEach(row => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `<td>${row.ngayGio}</td><td>${row.soThe}</td><td><b>${row.hoTen}</b></td><td style="color: var(--accent); font-weight: bold; font-size: 15px;">${row.sl}</td>`;
                    tb.appendChild(tr);
                });
            }
            if(loading) loading.style.display = 'none';
            if(container) container.style.display = 'block';
        }
    } catch(e) {
        if(loading) loading.innerText = "Lỗi kết nối tải dữ liệu.";
    }
}
