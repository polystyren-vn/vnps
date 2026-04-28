const SCRIPT_URL_KHAU_TRANG = "https://script.google.com/macros/s/AKfycbzYXPNw_cGZmvQZR9UNAs6XYEjPi6eBvG0fkeugNYfLN8p7utTXBiIovt6zqYHVoTAbTw/exec";
let currentRowForQty = null;

    // --- 4. GỬI DỮ LIỆU & LOGIC NGƯỜI NHẬN ---
    document.getElementById('khauTrangForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btnSubmit'), txt = document.getElementById('btnText'), sp = document.getElementById('spinner');
        btn.disabled = true; txt.style.display = 'none'; sp.style.display = 'block';

        const records = []; let isImport = false, leaderName = "", firstIdx = -1;
        document.querySelectorAll('.mask-row').forEach((row, i) => {
            const st = row.querySelector('.soTheInput');
            if (st.dataset.valid === "true") {
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
            // LƯỚI BẢO VỆ 1: Khắc phục lỗi getDeviceId
            const dId = (typeof window.getDeviceId === 'function') ? window.getDeviceId() : "WEB";
            const payload = { action: "submitKhauTrang", records: records, deviceId: dId };

            const r = await fetch(SCRIPT_URL_KHAU_TRANG, { 
                method: 'POST', 
                body: JSON.stringify(payload) 
            });
            
            // LƯỚI BẢO VỆ 2: Bắt lỗi sập Server Google
            const rawText = await r.text();
            let res;
            try {
                res = JSON.parse(rawText);
            } catch(errParse) {
                console.error("LỖI GỐC TỪ SERVER:\\n", rawText);
                window.showToast("Lỗi hệ thống Server! (Xem Console F12)", false);
                return;
            }

            if (res.status === "success") { 
                window.showToast("Cập nhật kho thành công!", true); 
                window.resetForm(); 
                loadHistory(); 
            } else if (res.status === "error") {
                window.showToast("LỖI CODE SERVER: " + res.message, false);
            }

        } catch (err) { 
            window.showToast("LỖI CỤC BỘ: " + err.message, false); 
        } finally { 
            btn.disabled = false; txt.style.display = 'block'; sp.style.display = 'none'; 
        }
    });

    // --- 1. DROPDOWN & INLINE EDIT ---
    window.toggleQtyPicker = function(e, el) {
        if (e.target.classList.contains('inline-qty-input')) return;
        if (dropdown.style.display === 'flex' && currentRowForQty === el) { closeQtyPicker(); return; }
        currentRowForQty = el; 
        const rect = el.getBoundingClientRect();
        dropdown.style.top = (rect.bottom + window.scrollY + 4) + 'px';
        dropdown.style.left = rect.left + 'px';
        dropdown.style.width = rect.width + 'px'; 
        dropdown.style.display = 'flex';
        dropdown.classList.remove('closing'); dropdown.classList.add('opening');
    };

    window.closeQtyPicker = function() {
        if(dropdown.style.display !== 'none') {
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
            closeQtyPicker();
            input.onblur = function() {
                if(!this.value || parseInt(this.value) <= 0) {
                    this.style.display = 'none'; span.style.display = 'inline'; icon.style.display = 'inline';
                    span.innerText = 'SL'; real.value = '';
                }
                checkValidity();
            };
            input.oninput = function() { real.value = this.value; checkValidity(); };
        } else {
            input.style.display = 'none'; span.style.display = 'inline'; icon.style.display = 'inline';
            span.innerText = val; real.value = val;
            closeQtyPicker(); checkValidity();
        }
    };

    // --- 2. THÊM DÒNG ---
    document.getElementById('btnAddMaskRow').addEventListener('click', () => {
        const row = document.createElement('div');
        row.className = 'mask-row';
        row.innerHTML = `
            <div class="employee-box" style="flex: 1;" onclick="this.querySelector('input').focus()">
                <span class="material-symbols-outlined">badge</span>
                <input type="number" inputmode="numeric" class="soTheInput" placeholder="ST" required autocomplete="off">
                <div class="msg-name"></div>
            </div>
            <div class="qty-picker-trigger" onclick="toggleQtyPicker(event, this)">
                <span class="current-qty">SL</span>
                <span class="material-symbols-outlined dropdown-icon" style="font-size:18px;">arrow_drop_down</span>
                <input type="number" inputmode="numeric" class="inline-qty-input" style="display:none;" placeholder="...">
                <input type="hidden" class="real-qty" value="">
            </div>
            <button type="button" class="btn-remove-row" style="width:28px;height:48px;border-radius:14px;background:var(--error);color:white;border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;">
                <span class="material-symbols-outlined">remove</span>
            </button>`;
        container.appendChild(row);
        row.querySelector('.btn-remove-row').addEventListener('click', () => { row.remove(); checkValidity(); });
    });

    // --- 3. TRA CỨU & MAGIC CODE 520520 ---
    container.addEventListener('input', (e) => {
        if (e.target.classList.contains('soTheInput')) {
            const val = e.target.value.trim(), msgBox = e.target.nextElementSibling;
            msgBox.classList.remove('name-success', 'name-error');
            if (val === "520520") {
                msgBox.innerHTML = `📦 <b>NHẬN KHO</b>`; msgBox.style.color = "var(--accent)";
                e.target.dataset.hoten = "[MÃ KHO]"; e.target.dataset.valid = "true";
                if (document.querySelectorAll('.mask-row').length === 1) {
                    document.getElementById('btnAddMaskRow').click();
                    setTimeout(() => { document.querySelectorAll('.soTheInput')[1].focus(); }, 100);
                }
            } else {
                msgBox.style.color = "";
                const emp = window.employeeData.find(v => v.soThe === val);
                if (emp) {
                    msgBox.innerHTML = emp.hoTen; msgBox.classList.add('name-success');
                    e.target.dataset.hoten = emp.hoTen; e.target.dataset.valid = "true";
                } else {
                    msgBox.innerHTML = val ? "Lỗi" : ""; if(val) msgBox.classList.add('name-error');
                    e.target.dataset.valid = "false";
                }
            }
            checkValidity();
        }
    });

    function checkValidity() {
        const rows = document.querySelectorAll('.mask-row');
        let isValid = true, hasAtLeastOneValid = false;
        rows.forEach(row => {
            const st = row.querySelector('.soTheInput'), qty = row.querySelector('.real-qty').value;
            if (st.value.trim() !== "") {
                if (st.value === "520520") hasAtLeastOneValid = true;
                else if (st.dataset.valid !== "true" || !qty) isValid = false;
                else hasAtLeastOneValid = true;
            }
        });
        document.getElementById('btnSubmit').disabled = !(hasAtLeastOneValid && isValid && rows[0].querySelector('.soTheInput').dataset.valid === "true");
    }

    try {
            const r = await fetch(SCRIPT_URL_KHAU_TRANG, { 
                method: 'POST', 
                body: JSON.stringify({action: "submitKhauTrang", records, deviceId: window.getDeviceId ? window.getDeviceId() : "WEB"}) 
            });
            
            // 🚨 BƯỚC ĐỌC LỖI THÔNG MINH: Đọc dưới dạng Text trước khi ép sang JSON
            const rawText = await r.text(); 
            let res;
            
            try {
                res = JSON.parse(rawText);
            } catch (parseError) {
                // Nếu Google trả về HTML (Lỗi CORS hoặc sập 500)
                console.error("LỖI GỐC TỪ SERVER GOOGLE:\n", rawText);
                window.showToast("Lỗi Server (Mở F12 để xem chi tiết)", false);
                return;
            }

            // Xử lý phản hồi JSON
            if (res.status === "success") { 
                window.showToast("Thành công!", true); 
                window.resetForm(); 
                loadHistory(); 
            } else if (res.status === "error") {
                // Hiện chính xác thông báo lỗi từ GAS
                window.showToast("LỖI CODE: " + res.message, false);
            }

        } catch (err) { 
            // Chỉ nhảy vào đây khi mất WiFi/4G thực sự
            window.showToast("Rớt mạng thực sự: " + err.message, false); 
        } finally { 
            btn.disabled = false; txt.style.display = 'block'; sp.style.display = 'none'; 
        }
    async function loadHistory() {
        try {
            const r = await fetch(SCRIPT_URL_KHAU_TRANG, { method: 'POST', body: JSON.stringify({ action: "getKhauTrangData" }) });
            const res = await r.json();
            if (res.status === "success") {
                const tb = document.getElementById('tableBody'); tb.innerHTML = '';
                res.data.forEach(row => {
                    const p = row.ngayGio.split(' ');
                    const tr = document.createElement('tr');
                    tr.innerHTML = `<td>${p[1]}<br>${p[0]}</td><td>${row.soThe}</td><td><b>${row.hoTen}</b></td><td><span class="status-tag" style="background:#e8f0fe;color:#1967d2;">${row.sl}</span></td>`;
                    tb.appendChild(tr);
                });
            }
        } catch(e) {}
    }
    loadHistory();

    window.resetForm = () => {
        container.querySelectorAll('.mask-row:not(:first-child)').forEach(el => el.remove());
        document.getElementById('khauTrangForm').reset();
        const f = document.querySelector('.mask-row');
        const st = f.querySelector('.soTheInput'), msg = f.querySelector('.msg-name'), 
              span = f.querySelector('.current-qty'), icon = f.querySelector('.dropdown-icon'),
              inp = f.querySelector('.inline-qty-input'), real = f.querySelector('.real-qty');
        st.dataset.valid = "false"; msg.innerHTML = ""; span.style.display = "inline"; span.innerText = "SL";
        icon.style.display = "inline"; inp.style.display = "none"; real.value = "";
        document.getElementById('btnSubmit').disabled = true;
    };
    document.addEventListener('click', (e) => { if (!e.target.closest('.qty-picker-trigger') && !e.target.closest('#ktDropdown')) closeQtyPicker(); });
});
