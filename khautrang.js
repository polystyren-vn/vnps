// ==========================================================================
// MODULE KHẨU TRANG V4.5 - BULLETPROOF (CHỐNG TREO UI & HIỂN THỊ LỖI TUYỆT ĐỐI)
// ==========================================================================

const SCRIPT_URL_KHAU_TRANG = "https://script.google.com/macros/s/AKfycbzYXPNw_cGZmvQZR9UNAs6XYEjPi6eBvG0fkeugNYfLN8p7utTXBiIovt6zqYHVoTAbTw/exec";
let currentRowForQty = null;

// ==========================================
// 1. CÁC HÀM TOÀN CỤC (GLOBAL FUNCTIONS)
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

    const btn = document.getElementById('btnSubmit');
    if(btn) btn.disabled = !(hasAtLeastOneValid && isValid && firstValid);
};

window.resetForm = () => {
    const container = document.getElementById('maskInputsContainer');
    if(container) {
        container.querySelectorAll('.mask-row:not(:first-child)').forEach(el => el.remove());
    }

    const form = document.getElementById('khauTrangForm');
    if(form) form.reset();

    const f = document.querySelector('.mask-row');
    if (f) {
        const st = f.querySelector('.soTheInput');
        const msg = f.querySelector('.msg-name');
        const span = f.querySelector('.current-qty');
        const icon = f.querySelector('.dropdown-icon');
        const inp = f.querySelector('.inline-qty-input');
        const real = f.querySelector('.real-qty');

        if(st) { st.dataset.valid = "false"; st.dataset.hoten = ""; }
        if(msg) { msg.innerHTML = ""; msg.className = "msg-name"; msg.style.color = ""; }
        if(span) { span.style.display = "inline"; span.innerText = "SL"; }
        if(icon) { icon.style.display = "inline"; }
        if(inp) { inp.style.display = "none"; inp.value = ""; }
        if(real) { real.value = ""; }

        const btn = document.getElementById('btnSubmit');
        if(btn) btn.disabled = true;
    }
};

// ==========================================
// 2. KHỞI TẠO VÀ GẮN SỰ KIỆN (CHẠY NGAY LẬP TỨC)
// ==========================================
function initKhauTrangApp() {
    // 1. Tải data nhân sự âm thầm
    if (typeof window.loadEmployeesData === 'function') {
        window.loadEmployeesData().catch(e => console.error("Lỗi tải Data:", e));
    }

    const container = document.getElementById('maskInputsContainer');
    const btnAdd = document.getElementById('btnAddMaskRow');
    const form = document.getElementById('khauTrangForm');

    // 2. Đóng dropdown khi click ra ngoài
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.qty-picker-trigger') && !e.target.closest('#ktDropdown')) {
            window.closeQtyPicker();
        }
    });

    // 3. Nút Thêm Dòng
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
        });
    }

    // 4. Tra cứu Số thẻ (Siêu an toàn cấu trúc DOM)
    if (container) {
        container.addEventListener('input', (e) => {
            if (e.target.classList.contains('soTheInput')) {
                const val = e.target.value.trim();
                
                // Mò tìm đúng thẻ .msg-name dù HTML có bị lệch
                const parentBox = e.target.closest('.employee-box');
                const msgBox = parentBox ? parentBox.querySelector('.msg-name') : null;

                if (!msgBox) return; // Nếu mất thẻ thì thoát

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
                        // Ép kiểu string để tránh lỗi dữ liệu json
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

    // 5. Gửi dữ liệu (Bọc Alert bắt bệnh lỗi mạng)
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btnSubmit');
            const txt = document.getElementById('btnText');
            const sp = document.getElementById('spinner');

            if(btn) btn.disabled = true;
            if(txt) txt.style.display = 'none';
            if(sp) sp.style.display = 'block';

            const records = [];
            let isImport = false;
            let leaderName = "";
            let firstIdx = -1;

            const allRows = document.querySelectorAll('.mask-row');
            allRows.forEach((row, i) => {
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

            if(records.length === 0) {
                if(btn) btn.disabled = false;
                if(txt) txt.style.display = 'block';
                if(sp) sp.style.display = 'none';
                return;
            }

            try {
                let dId = "WEB";
                if (typeof window.getDeviceId === 'function') {
                    try { dId = window.getDeviceId(); } catch(e) {}
                }

                const payload = { action: "submitKhauTrang", records: records, deviceId: dId };

                const r = await fetch(SCRIPT_URL_KHAU_TRANG, {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });

                const rawText = await r.text();
                let res;

                try {
                    res = JSON.parse(rawText);
                } catch(errParse) {
                    // NẾU LỖI SERVER, NÓ SẼ HIỆN CÁI BẢNG NÀY LÊN MẶT BẠN
                    alert("LỖI GOOGLE SERVER TRẢ VỀ:\\n" + rawText.substring(0, 200));
                    if(typeof window.showToast === 'function') window.showToast("Lỗi Server (Xem Alert)", false);
                    return;
                }

                if (res.status === "success") {
                    if(typeof window.showToast === 'function') window.showToast("Cập nhật thành công!", true);
                    window.resetForm();
                    loadHistory();
                } else if (res.status === "error") {
                    alert("LỖI MÃ GOOGLE SCRIPT:\\n" + res.message);
                    if(typeof window.showToast === 'function') window.showToast("Lỗi Code Backend!", false);
                } else {
                    alert("LỖI KHÔNG XÁC ĐỊNH:\\n" + rawText);
                }

            } catch (err) {
                alert("LỖI KẾT NỐI (RỚT MẠNG THẬT):\\n" + err.message);
                if(typeof window.showToast === 'function') window.showToast("Lỗi mạng cục bộ!", false);
            } finally {
                if(btn) btn.disabled = false;
                if(txt) txt.style.display = 'block';
                if(sp) sp.style.display = 'none';
            }
        });
    }

    // 6. Tải lịch sử an toàn
    loadHistory();
}

async function loadHistory() {
    try {
        const r = await fetch(SCRIPT_URL_KHAU_TRANG, {
            method: 'POST',
            body: JSON.stringify({ action: "getKhauTrangData" })
        });
        const rawText = await r.text();
        let res;
        try { res = JSON.parse(rawText); } catch(e) { return; }

        if (res.status === "success" && res.data) {
            const tb = document.getElementById('tableBody');
            if(tb) {
                tb.innerHTML = '';
                res.data.forEach(row => {
                    const p = row.ngayGio ? row.ngayGio.split(' ') : ["", ""];
                    const tr = document.createElement('tr');
                    tr.innerHTML = `<td>${p[1] || ""}<br>${p[0] || ""}</td><td>${row.soThe}</td><td><b>${row.hoTen}</b></td><td><span class="status-tag" style="background:#e8f0fe;color:#1967d2;">${row.sl}</span></td>`;
                    tb.appendChild(tr);
                });
            }
        }
    } catch(e) { console.error("Lỗi tải lịch sử:", e); }
}

// KHỞI ĐỘNG NGAY LẬP TỨC
initKhauTrangApp();
