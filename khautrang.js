// ==========================================================================
// MODULE KHẨU TRANG V4.4 - NON-BLOCKING UI & SAFE ERROR HANDLING
// ==========================================================================

const SCRIPT_URL_KHAU_TRANG = "https://script.google.com/macros/s/AKfycbzYXPNw_cGZmvQZR9UNAs6XYEjPi6eBvG0fkeugNYfLN8p7utTXBiIovt6zqYHVoTAbTw/exec";
let currentRowForQty = null;

// --- 1. ĐỊNH NGHĨA HÀM GLOBAL NGAY LẬP TỨC (KHÔNG CHỜ ĐỢI) ---
window.toggleQtyPicker = function(e, el) {
    const dropdown = document.getElementById('ktDropdown');
    if (!dropdown) return;
    if (e.target.classList.contains('inline-qty-input')) return;
    if (dropdown.style.display === 'flex' && currentRowForQty === el) { window.closeQtyPicker(); return; }
    
    currentRowForQty = el; 
    const rect = el.getBoundingClientRect();
    dropdown.style.top = (rect.bottom + window.scrollY + 4) + 'px';
    dropdown.style.left = rect.left + 'px';
    dropdown.style.width = rect.width + 'px'; 
    dropdown.style.display = 'flex';
    dropdown.classList.remove('closing'); dropdown.classList.add('opening');
};

window.closeQtyPicker = function() {
    const dropdown = document.getElementById('ktDropdown');
    if(dropdown && dropdown.style.display !== 'none') {
        dropdown.classList.remove('opening'); dropdown.classList.add('closing');
        setTimeout(() => { dropdown.style.display = 'none'; }, 120);
    }
};

window.selectQty = function(val) {
    if (!currentRowForQty) return;
    const trigger = currentRowForQty;
    const span = trigger.querySelector('.current-qty'), icon = trigger.querySelector('.dropdown-icon'),
          input = trigger.querySelector('.inline-qty-input'), real = trigger.querySelector('.real-qty');

    if (val === 'OTHER') {
        span.style.display = 'none'; icon.style.display = 'none';
        input.style.display = 'block'; input.value = ''; input.focus();
        window.closeQtyPicker();
        input.onblur = function() {
            if(!this.value || parseInt(this.value) <= 0) {
                this.style.display = 'none'; span.style.display = 'inline'; icon.style.display = 'inline';
                span.innerText = 'SL'; real.value = '';
            }
            window.checkValidity();
        };
        input.oninput = function() { real.value = this.value; window.checkValidity(); };
    } else {
        input.style.display = 'none'; span.style.display = 'inline'; icon.style.display = 'inline';
        span.innerText = val; real.value = val;
        window.closeQtyPicker(); window.checkValidity();
    }
};

window.checkValidity = function() {
    const rows = document.querySelectorAll('.mask-row');
    if(rows.length === 0) return;
    let isValid = true, hasAtLeastOneValid = false;
    
    rows.forEach(row => {
        const st = row.querySelector('.soTheInput'), qty = row.querySelector('.real-qty').value;
        if (st && st.value.trim() !== "") {
            if (st.value === "520520") hasAtLeastOneValid = true;
            else if (st.dataset.valid !== "true" || !qty) isValid = false;
            else hasAtLeastOneValid = true;
        }
    });
    
    const firstValid = rows[0].querySelector('.soTheInput').dataset.valid === "true";
    const btn = document.getElementById('btnSubmit');
    if(btn) btn.disabled = !(hasAtLeastOneValid && isValid && firstValid);
};

window.resetForm = () => {
    const container = document.getElementById('maskInputsContainer');
    if(container) container.querySelectorAll('.mask-row:not(:first-child)').forEach(el => el.remove());
    
    const form = document.getElementById('khauTrangForm');
    if(form) form.reset();
    
    const f = document.querySelector('.mask-row');
    if (f) {
        const st = f.querySelector('.soTheInput'), msg = f.querySelector('.msg-name'), 
              span = f.querySelector('.current-qty'), icon = f.querySelector('.dropdown-icon'),
              inp = f.querySelector('.inline-qty-input'), real = f.querySelector('.real-qty');
        st.dataset.valid = "false"; msg.innerHTML = ""; span.style.display = "inline"; span.innerText = "SL";
        icon.style.display = "inline"; inp.style.display = "none"; real.value = "";
        document.getElementById('btnSubmit').disabled = true;
    }
};

// --- 2. KHỞI TẠO GIAO DIỆN (CHẠY ĐỒNG BỘ) ---
document.addEventListener("DOMContentLoaded", () => {
    // 💥 QUAN TRỌNG: Tải dữ liệu ngầm, không dùng await để tránh treo UI
    if (typeof window.loadEmployeesData === 'function') {
        window.loadEmployeesData().catch(e => console.log("Tải data lỗi:", e));
    }

    const container = document.getElementById('maskInputsContainer');

    // Sự kiện thêm dòng
    const btnAdd = document.getElementById('btnAddMaskRow');
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
            row.querySelector('.btn-remove-row').addEventListener('click', () => { row.remove(); window.checkValidity(); });
        });
    }

    // Sự kiện tra cứu mã thẻ
    if (container) {
        container.addEventListener('input', (e) => {
            if (e.target.classList.contains('soTheInput')) {
                const val = e.target.value.trim(), msgBox = e.target.nextElementSibling;
                msgBox.classList.remove('name-success', 'name-error');
                
                if (val === "520520") {
                    msgBox.innerHTML = `📦 <b>NHẬN KHO</b>`; msgBox.style.color = "var(--accent)";
                    e.target.dataset.hoten = "[MÃ KHO]"; e.target.dataset.valid = "true";
                    if (document.querySelectorAll('.mask-row').length === 1 && btnAdd) {
                        btnAdd.click();
                        setTimeout(() => { 
                            const inputs = document.querySelectorAll('.soTheInput');
                            if(inputs.length > 1) inputs[1].focus(); 
                        }, 100);
                    }
                } else {
                    msgBox.style.color = "";
                    // Bọc lót an toàn nếu chưa tải xong data
                    const emp = (window.employeeData && Array.isArray(window.employeeData)) 
                                ? window.employeeData.find(v => v.soThe === val) 
                                : null;
                                
                    if (emp) {
                        msgBox.innerHTML = emp.hoTen; msgBox.classList.add('name-success');
                        e.target.dataset.hoten = emp.hoTen; e.target.dataset.valid = "true";
                    } else {
                        msgBox.innerHTML = val ? "Không tìm thấy" : ""; 
                        if(val) msgBox.classList.add('name-error');
                        e.target.dataset.valid = "false";
                    }
                }
                window.checkValidity();
            }
        });
    }

    // Sự kiện submit
    const form = document.getElementById('khauTrangForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btnSubmit'), txt = document.getElementById('btnText'), sp = document.getElementById('spinner');
            btn.disabled = true; txt.style.display = 'none'; sp.style.display = 'block';

            const records = []; let isImport = false, leaderName = "", firstIdx = -1;
            document.querySelectorAll('.mask-row').forEach((row, i) => {
                const st = row.querySelector('.soTheInput');
                if (st && st.dataset.valid === "true") {
                    if (st.value === "520520") { isImport = true; return; }
                    if (firstIdx === -1) { firstIdx = i; leaderName = st.dataset.hoten; }
                    records.push({
                        soThe: st.value, hoTen: st.dataset.hoten, soLuong: row.querySelector('.real-qty').value,
                        nguoiNhan: (i === firstIdx) ? st.dataset.hoten : leaderName,
                        ghiChu: isImport ? "Nhận khẩu trang" : ""
                    });
                }
            });

            if(records.length === 0) {
                btn.disabled = false; txt.style.display = 'block'; sp.style.display = 'none';
                return;
            }

            try {
                const dId = (typeof window.getDeviceId === 'function') ? window.getDeviceId() : "WEB";
                const payload = { action: "submitKhauTrang", records: records, deviceId: dId };

                const r = await fetch(SCRIPT_URL_KHAU_TRANG, { method: 'POST', body: JSON.stringify(payload) });
                const rawText = await r.text();
                let res;
                
                try { res = JSON.parse(rawText); } 
                catch(errParse) {
                    if(typeof window.showToast === 'function') window.showToast("Lỗi Server (Bấm F12 xem chi tiết)", false);
                    return;
                }

                if (res.status === "success") { 
                    if(typeof window.showToast === 'function') window.showToast("Cập nhật thành công!", true); 
                    window.resetForm(); 
                    loadHistory(); 
                } else if (res.status === "error") {
                    if(typeof window.showToast === 'function') window.showToast("LỖI SERVER: " + res.message, false);
                }
            } catch (err) { 
                if(typeof window.showToast === 'function') window.showToast("LỖI MẠNG: " + err.message, false); 
            } finally { 
                btn.disabled = false; txt.style.display = 'block'; sp.style.display = 'none'; 
            }
        });
    }

    // Tải lịch sử an toàn
    async function loadHistory() {
        try {
            const r = await fetch(SCRIPT_URL_KHAU_TRANG, { method: 'POST', body: JSON.stringify({ action: "getKhauTrangData" }) });
            const rawText = await r.text();
            let res;
            try { res = JSON.parse(rawText); } catch(e) { return; }

            if (res.status === "success") {
                const tb = document.getElementById('tableBody'); 
                if(tb) {
                    tb.innerHTML = '';
                    res.data.forEach(row => {
                        const p = row.ngayGio.split(' ');
                        const tr = document.createElement('tr');
                        tr.innerHTML = `<td>${p[1] || ""}<br>${p[0] || ""}</td><td>${row.soThe}</td><td><b>${row.hoTen}</b></td><td><span class="status-tag" style="background:#e8f0fe;color:#1967d2;">${row.sl}</span></td>`;
                        tb.appendChild(tr);
                    });
                }
            }
        } catch(e) { console.log("Lỗi tải lịch sử"); }
    }
    loadHistory();

    document.addEventListener('click', (e) => { 
        if (!e.target.closest('.qty-picker-trigger') && !e.target.closest('#ktDropdown')) window.closeQtyPicker(); 
    });
});
