// ==========================================================================
// MODULE KHẨU TRANG V4.0 - INLINE EDIT, BULK INSERT & MAGIC CODE 520520
// ==========================================================================

const SCRIPT_URL_KHAU_TRANG = "https://script.google.com/macros/s/AKfycbzYXPNw_cGZmvQZR9UNAs6XYEjPi6eBvG0fkeugNYfLN8p7utTXBiIovt6zqYHVoTAbTw/exec";
let currentRowForQty = null;

document.addEventListener("DOMContentLoaded", async () => {
    if (typeof window.loadEmployeesData === 'function') await window.loadEmployeesData();
    const container = document.getElementById('maskInputsContainer');
    const dropdown = document.getElementById('ktDropdown');

    // --- 1. LOGIC DROPDOWN ĐỘNG ---
    window.toggleQtyPicker = function(e, el) {
        if (e.target.classList.contains('inline-qty-input')) return;
        if (dropdown.style.display === 'flex' && currentRowForQty === el) {
            closeQtyPicker(); return;
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
        if(dropdown.style.display !== 'none') {
            dropdown.classList.remove('opening');
            dropdown.classList.add('closing');
            setTimeout(() => { dropdown.style.display = 'none'; }, 120);
        }
        currentRowForQty = null;
    };

    window.selectQty = function(val) {
        if (!currentRowForQty) return;
        const spanQty = currentRowForQty.querySelector('.current-qty');
        const icon = currentRowForQty.querySelector('.dropdown-icon');
        const inlineInput = currentRowForQty.querySelector('.inline-qty-input');
        const realQty = currentRowForQty.querySelector('.real-qty');

        if (val === 'OTHER') {
            spanQty.style.display = 'none'; icon.style.display = 'none';
            inlineInput.style.display = 'block'; inlineInput.value = ''; 
            inlineInput.focus();
            closeQtyPicker();
            
            inlineInput.onblur = function() {
                if(this.value.trim() !== "" && parseInt(this.value) > 0) {
                    realQty.value = this.value;
                } else {
                    this.style.display = 'none'; spanQty.style.display = 'inline'; icon.style.display = 'inline';
                    spanQty.innerText = 'SL'; realQty.value = '';
                }
                checkValidity();
            };
            inlineInput.oninput = function() { realQty.value = this.value; checkValidity(); };
        } else {
            inlineInput.style.display = 'none'; spanQty.style.display = 'inline'; icon.style.display = 'inline';
            spanQty.innerText = val; realQty.value = val;
            closeQtyPicker(); checkValidity();
        }
    };

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.qty-picker-trigger') && !e.target.closest('#ktDropdown')) closeQtyPicker();
    });

    // --- 2. LOGIC THÊM/XÓA DÒNG ---
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
                <span class="material-symbols-outlined dropdown-icon" style="font-size: 18px; margin-left: 2px;">arrow_drop_down</span>
                <input type="number" inputmode="numeric" class="inline-qty-input" style="display:none;" placeholder="Nhập...">
                <input type="hidden" class="real-qty" value="">
            </div>
            <button type="button" class="btn-remove-row" style="width: 28px; height: 48px; border-radius: 14px; background: var(--error); color: white; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink:0;">
                <span class="material-symbols-outlined">remove</span>
            </button>
        `;
        container.appendChild(row);
        row.querySelector('.btn-remove-row').addEventListener('click', function() {
            row.remove(); checkValidity();
        });
    });

    // --- 3. TRA CỨU SỐ THẺ & MAGIC CODE 520520 ---
    container.addEventListener('input', (e) => {
        if (e.target.classList.contains('soTheInput')) {
            const val = e.target.value.trim();
            const msgBox = e.target.nextElementSibling; 
            msgBox.classList.remove('name-success', 'name-error');

            // Tính năng Ngoại Lệ (Magic Code: 520520)
            if (val === "520520") {
                msgBox.innerHTML = `📦 <b>NHẬN KHẨU TRANG (KHO)</b>`;
                msgBox.style.color = "var(--accent)"; // Xanh dương
                e.target.dataset.hoten = "[MÃ KHO]";
                e.target.dataset.valid = "true";

                // Tự động nhảy thêm dòng nếu đang ở dòng đầu tiên
                const rows = document.querySelectorAll('.mask-row');
                if (rows.length === 1) {
                    document.getElementById('btnAddMaskRow').click();
                    setTimeout(() => {
                        const newRow = document.querySelectorAll('.mask-row')[1];
                        if(newRow) newRow.querySelector('input').focus();
                    }, 50);
                }
            } 
            // Luồng nhân viên bình thường
            else {
                msgBox.style.color = ""; // Trả về màu mặc định để CSS tự quản lý
                const emp = window.employeeData ? window.employeeData.find(v => v.soThe === val) : null;
                if (emp) {
                    msgBox.innerHTML = `${emp.hoTen} - ${emp.boPhan}`;
                    msgBox.classList.add('name-success');
                    e.target.dataset.hoten = emp.hoTen;
                    e.target.dataset.valid = "true";
                } else {
                    msgBox.innerHTML = val === "" ? "" : "Không tìm thấy!";
                    if (val !== "") msgBox.classList.add('name-error');
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
            const soThe = row.querySelector('.soTheInput');
            const qty = row.querySelector('.real-qty').value;
            if (soThe.value.trim() !== "") {
                // Mã kho 520520 không cần nhập số lượng
                if (soThe.value === "520520") {
                    hasAtLeastOneValid = true;
                } else if (soThe.dataset.valid !== "true" || qty === "" || parseInt(qty) <= 0) {
                    isValid = false; 
                } else {
                    hasAtLeastOneValid = true;
                }
            }
        });
        const firstRowValid = rows[0] && rows[0].querySelector('.soTheInput').dataset.valid === "true";
        document.getElementById('btnSubmit').disabled = !(hasAtLeastOneValid && isValid && firstRowValid);
    }

    // --- 4. GỬI DỮ LIỆU & LOGIC NGƯỜI NHẬN ---
    document.getElementById('khauTrangForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btnSubmit = document.getElementById('btnSubmit'), spinner = document.getElementById('spinner'), btnText = document.getElementById('btnText');
        btnSubmit.disabled = true; btnText.style.display = 'none'; spinner.style.display = 'block';

        const records = [];
        let isImportMode = false;
        let nguoiNhanThay = "";
        let firstValidIndex = -1;

        document.querySelectorAll('.mask-row').forEach((row, index) => {
            const soTheInp = row.querySelector('.soTheInput');
            if (soTheInp.dataset.valid === "true") {
                // Nếu là mã kho -> Kích hoạt chế độ Nhập kho và bỏ qua không đẩy dòng này vào mảng
                if (soTheInp.value === "520520") {
                    isImportMode = true;
                    return; 
                }

                // Xác định người đầu tiên (Thủ lĩnh dòng)
                if (firstValidIndex === -1) {
                    firstValidIndex = index;
                    nguoiNhanThay = soTheInp.dataset.hoten;
                }

                const soLuong = row.querySelector('.real-qty').value;
                const ghiChu = isImportMode ? "Nhận khẩu trang" : "";
                
                // Logic [Người Nhận]: Ô 1 nhận cho chính nó, Ô 2 trở đi lưu tên Ô 1
                let nguoiNhan = (index === firstValidIndex) ? soTheInp.dataset.hoten : nguoiNhanThay;

                records.push({
                    soThe: soTheInp.value, 
                    hoTen: soTheInp.dataset.hoten,
                    soLuong: soLuong,
                    nguoiNhan: nguoiNhan,
                    ghiChu: ghiChu
                });
            }
        });

        if(records.length === 0) return;

        try {
            const r = await fetch(SCRIPT_URL_KHAU_TRANG, { method: 'POST', body: JSON.stringify({action: "submitKhauTrang", records: records, deviceId: window.getDeviceId ? window.getDeviceId() : "WEB"}) });
            const res = await r.json();
            if (res.status === "success") { window.showToast("Cập nhật kho thành công!", true); window.resetForm(); loadHistory(); }
        } catch (err) { window.showToast("Lỗi mạng!", false); } 
        finally { btnSubmit.disabled = true; btnText.style.display = 'block'; spinner.style.display = 'none'; }
    });

    // --- 5. RENDER BẢNG NHẬT KÝ ---
    async function loadHistory() {
        try {
            const r = await fetch(SCRIPT_URL_KHAU_TRANG, { method: 'POST', body: JSON.stringify({ action: "getKhauTrangData" }) });
            const res = await r.json();
            if (res.status === "success") {
                const tb = document.getElementById('tableBody'); tb.innerHTML = '';
                res.data.forEach(row => {
                    const parts = row.ngayGio.split(' ');
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td style="font-size:10px;">${parts[1] || ""}<br>${parts[0] || ""}</td>
                        <td>${row.soThe}</td>
                        <td><b>${row.hoTen}</b></td>
                        <td><span class="status-tag" style="background:#e8f0fe; color:#1967d2;">${row.sl}</span></td>
                    `;
                    tb.appendChild(tr);
                });
            }
        } catch(e) {}
    }
    loadHistory();

    // --- 6. RESET FORM ---
    window.resetForm = () => {
        document.querySelectorAll('.mask-row:not(:first-child)').forEach(el => el.remove()); 
        document.getElementById('khauTrangForm').reset();
        const firstRow = document.querySelector('.mask-row');
        if (firstRow) {
            const firstSoThe = firstRow.querySelector('.soTheInput');
            firstSoThe.value = ""; firstSoThe.dataset.valid = "false";
            
            const firstMsg = firstRow.querySelector('.msg-name');
            firstMsg.innerHTML = ""; firstMsg.style.color = "";
            firstMsg.classList.remove('name-success', 'name-error');
            
            firstRow.querySelector('.current-qty').innerText = "SL";
            firstRow.querySelector('.current-qty').style.display = "inline";
            firstRow.querySelector('.dropdown-icon').style.display = "inline";
            firstRow.querySelector('.inline-qty-input').style.display = "none";
            firstRow.querySelector('.real-qty').value = "";
        }
        document.getElementById('btnSubmit').disabled = true;
    };
});
