// ==========================================================================
// MODULE KHẨU TRANG V5.0 - ĐỒNG BỘ CẤU TRÚC 100% VỚI TANGCA.JS
// ==========================================================================

const SCRIPT_URL_KHAU_TRANG = "https://script.google.com/macros/s/AKfycbzYXPNw_cGZmvQZR9UNAs6XYEjPi6eBvG0fkeugNYfLN8p7utTXBiIovt6zqYHVoTAbTw/exec";
let currentRowForQty = null;

// --- 1. CÁC HÀM TOÀN CỤC (GLOBAL FUNCTIONS - Giống tangca.js) ---
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
    const span = currentRowForQty.querySelector('.current-qty');
    const icon = currentRowForQty.querySelector('.dropdown-icon');
    const input = currentRowForQty.querySelector('.inline-qty-input');
    const real = currentRowForQty.querySelector('.real-qty');

    if (val === 'OTHER') {
        span.style.display = 'none'; icon.style.display = 'none';
        input.style.display = 'block'; input.value = ''; input.focus();
        window.closeQtyPicker();
        input.onblur = function() {
            if(!this.value || parseInt(this.value) <= 0) {
                this.style.display = 'none'; span.style.display = 'inline'; icon.style.display = 'inline';
                span.innerText = 'SL'; real.value = '';
            }
            if(typeof window.checkFormValidity === 'function') window.checkFormValidity();
        };
        input.oninput = function() {
            real.value = this.value;
            if(typeof window.checkFormValidity === 'function') window.checkFormValidity();
        };
    } else {
        input.style.display = 'none'; span.style.display = 'inline'; icon.style.display = 'inline';
        span.innerText = val; real.value = val;
        window.closeQtyPicker();
        if(typeof window.checkFormValidity === 'function') window.checkFormValidity();
    }
};

window.addMaskRow = function() {
    const container = document.getElementById('maskInputsContainer');
    if(!container) return;
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
        if(typeof window.checkFormValidity === 'function') window.checkFormValidity();
    });
};

window.checkFormValidity = function() {
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

window.resetForm = function() {
    const container = document.getElementById('maskInputsContainer');
    if(container) container.querySelectorAll('.mask-row:not(:first-child)').forEach(el => el.remove());

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
        if(msg) { msg.innerHTML = ""; msg.classList.remove('name-success', 'name-error'); msg.style.color = ""; }
        if(span) { span.style.display = "inline"; span.innerText = "SL"; }
        if(icon) { icon.style.display = "inline"; }
        if(inp) { inp.style.display = "none"; inp.value = ""; }
        if(real) { real.value = ""; }

        const btn = document.getElementById('btnSubmit');
        if(btn) btn.disabled = true;
    }
};

// --- 2. KHỞI TẠO VÀ BẮT SỰ KIỆN BÊN TRONG DOMContentLoaded (Đồng bộ 100% tangca.js) ---
document.addEventListener("DOMContentLoaded", async () => {
    // Gọi hàm load data y hệt tangca.js
    if(typeof window.loadEmployeesData === 'function') await window.loadEmployeesData();

    const btnAdd = document.getElementById('btnAddMaskRow');
    if(btnAdd) btnAdd.addEventListener('click', window.addMaskRow);

    // Sự kiện tra cứu số thẻ (Dùng .nextElementSibling giống hệt tangca.js)
    const container = document.getElementById('maskInputsContainer');
    if (container) {
        container.addEventListener('input', (e) => {
            if (!e.target.classList.contains('soTheInput')) return;

            const val = e.target.value.trim();
            const msgBox = e.target.nextElementSibling;
            const emp = window.employeeData ? window.employeeData.find(v => v.soThe === val) : null;

            if (msgBox) msgBox.classList.remove('name-success', 'name-error');

            if (val === "520520") {
                if (msgBox) {
                    msgBox.innerHTML = `📦 <b>NHẬN KHO</b>`;
                    msgBox.style.color = "var(--accent)";
                }
                e.target.dataset.hoten = "[MÃ KHO]";
                e.target.dataset.valid = "true";

                const rows = document.querySelectorAll('.mask-row');
                if (rows.length === 1 && btnAdd) {
                    window.addMaskRow();
                    setTimeout(() => {
                        const inputs = document.querySelectorAll('.soTheInput');
                        if(inputs.length > 1) inputs[1].focus();
                    }, 100);
                }
            } else {
                if (msgBox) msgBox.style.color = "";
                if (emp) {
                    if (msgBox) {
                        msgBox.innerHTML = `${emp.hoTen} - ${emp.boPhan}`;
                        msgBox.classList.add('name-success');
                    }
                    e.target.dataset.hoten = emp.hoTen;
                    e.target.dataset.valid = "true";
                } else {
                    if (msgBox) {
                        msgBox.innerHTML = val === "" ? "" : "Không tìm thấy";
                        if (val !== "") msgBox.classList.add('name-error');
                    }
                    e.target.dataset.valid = "false";
                    e.target.dataset.hoten = "";
                }
            }
            if (typeof window.checkFormValidity === 'function') window.checkFormValidity();
        });
    }

    // Sự kiện Submit (Cấu trúc try/catch và fetch thuần túy giống tangca.js)
    document.getElementById('khauTrangForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const b = document.getElementById('btnSubmit');
        const sp = document.getElementById('spinner');
        const bt = document.getElementById('btnText');
        if(b) b.disabled = true;
        if(bt) bt.style.display = 'none';
        if(sp) sp.style.display = 'block';

        const records = [];
        let isImport = false;
        let leaderName = "";
        let firstIdx = -1;

        document.querySelectorAll('.mask-row').forEach((row, i) => {
            const st = row.querySelector('.soTheInput');
            if (st && st.dataset.valid === "true") {
                if (st.value === "520520") { isImport = true; return; }
                if (firstIdx === -1) { firstIdx = i; leaderName = st.dataset.hoten; }
                records.push({
                    soThe: st.value, hoTen: st.dataset.hoten,
                    soLuong: row.querySelector('.real-qty').value,
                    nguoiNhan: (i === firstIdx) ? st.dataset.hoten : leaderName,
                    ghiChu: isImport ? "Nhận khẩu trang" : ""
                });
            }
        });

        const payload = {
            action: "submitKhauTrang",
            records: records,
            deviceId: (typeof window.getDeviceId === 'function') ? window.getDeviceId() : "UNKNOWN"
        };

        try {
            // Lệnh fetch tiêu chuẩn y hệt Tăng ca
            const r = await fetch(SCRIPT_URL_KHAU_TRANG, { method: 'POST', body: JSON.stringify(payload) });
            const res = await r.json();
            
            if (res.status === "success") {
                if (typeof window.showToast === 'function') window.showToast("Cập nhật thành công!", true);
                window.resetForm();
                loadHistory();
            } else {
                if (typeof window.showToast === 'function') window.showToast("Lỗi: " + res.message, false);
                if(b) b.disabled = false;
            }
        } catch (err) {
            // Bắt lỗi rớt mạng hoặc Failed to fetch
            if (typeof window.showToast === 'function') window.showToast("Lỗi kết nối API!", false);
            console.error("Fetch error:", err);
            if(b) b.disabled = false;
        } finally {
            if(bt) bt.style.display = 'block';
            if(sp) sp.style.display = 'none';
        }
    });

    async function loadHistory() {
        try {
            const r = await fetch(SCRIPT_URL_KHAU_TRANG, { method: 'POST', body: JSON.stringify({ action: "getKhauTrangData" }) });
            const res = await r.json();
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
        } catch(e) {
            console.error("Lỗi tải lịch sử:", e);
        }
    }
    loadHistory();

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.qty-picker-trigger') && !e.target.closest('#ktDropdown')) window.closeQtyPicker();
    });
});
