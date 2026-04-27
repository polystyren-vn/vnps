// ==========================================================================
// MODULE KHẨU TRANG V4.0 - LOGIC (INLINE DROPDOWN & FIXED TABLE)
// ==========================================================================

const SCRIPT_URL_KHAU_TRANG = "https://script.google.com/macros/s/AKfycbzYXPNw_cGZmvQZR9UNAs6XYEjPi6eBvG0fkeugNYfLN8p7utTXBiIovt6zqYHVoTAbTw/exec";
let currentRowForQty = null;

document.addEventListener("DOMContentLoaded", async () => {
    if (typeof window.loadEmployeesData === 'function') await window.loadEmployeesData();
    const container = document.getElementById('maskInputsContainer');
    const dropdown = document.getElementById('ktDropdown');

    // --- 1. LOGIC DROPDOWN ĐỘNG (NẰM NGAY DƯỚI MÉP Ô) ---
    window.openQtyPicker = function(el) {
        currentRowForQty = el; 
        const rect = el.getBoundingClientRect(); // Lấy tọa độ tuyệt đối của ô
        
        // Đặt Dropdown ngay dưới mép ô (cộng thêm scroll nếu có cuộn trang)
        dropdown.style.top = (rect.bottom + window.scrollY + 4) + 'px';
        dropdown.style.left = rect.left + 'px';
        dropdown.style.width = rect.width + 'px'; // Bằng đúng độ rộng ô chọn

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
        if (val === 'OTHER') {
            const custom = prompt("Nhập số lượng khác:");
            if (custom && !isNaN(custom) && parseInt(custom) > 0) val = parseInt(custom);
            else { closeQtyPicker(); return; }
        }
        if (currentRowForQty) {
            currentRowForQty.querySelector('.current-qty').innerText = val;
            currentRowForQty.querySelector('.real-qty').value = val;
        }
        closeQtyPicker();
        checkValidity();
    };

    // Đóng dropdown khi click ra ngoài
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.qty-picker-trigger') && !e.target.closest('#ktDropdown')) {
            closeQtyPicker();
        }
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
            <div class="qty-picker-trigger" onclick="openQtyPicker(this)">
                <span class="current-qty">50</span>
                <span class="material-symbols-outlined" style="font-size: 18px; margin-left: 2px;">arrow_drop_down</span>
                <input type="hidden" class="real-qty" value="50">
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

    // --- 3. TRA CỨU SỐ THẺ ---
    container.addEventListener('input', (e) => {
        if (e.target.classList.contains('soTheInput')) {
            const val = e.target.value.trim();
            const msgBox = e.target.nextElementSibling; 
            const emp = window.employeeData ? window.employeeData.find(v => v.soThe === val) : null;
            
            msgBox.classList.remove('name-success', 'name-error');
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
            checkValidity();
        }
    });

    function checkValidity() {
        const rows = document.querySelectorAll('.mask-row');
        let isValid = true, hasAtLeastOneValid = false;
        rows.forEach(row => {
            const soThe = row.querySelector('.soTheInput');
            if (soThe.value.trim() !== "") {
                if (soThe.dataset.valid !== "true") isValid = false; 
                else hasAtLeastOneValid = true;
            }
        });
        const firstRowValid = rows[0] && rows[0].querySelector('.soTheInput').dataset.valid === "true";
        document.getElementById('btnSubmit').disabled = !(hasAtLeastOneValid && isValid && firstRowValid);
    }

    // --- 4. GỬI DỮ LIỆU & LẤY NHẬT KÝ ---
    document.getElementById('khauTrangForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btnSubmit = document.getElementById('btnSubmit'), spinner = document.getElementById('spinner'), btnText = document.getElementById('btnText');
        btnSubmit.disabled = true; btnText.style.display = 'none'; spinner.style.display = 'block';

        const records = [];
        let nguoiNhanThay = "";
        document.querySelectorAll('.mask-row').forEach((row, index) => {
            const soTheInp = row.querySelector('.soTheInput');
            if (soTheInp.dataset.valid === "true") {
                if (index === 0) nguoiNhanThay = soTheInp.dataset.hoten;
                records.push({
                    soThe: soTheInp.value, hoTen: soTheInp.dataset.hoten,
                    soLuong: row.querySelector('.real-qty').value,
                    nhanThay: index === 0 ? "" : nguoiNhanThay 
                });
            }
        });

        if(records.length === 0) return;
        try {
            const r = await fetch(SCRIPT_URL_KHAU_TRANG, { method: 'POST', body: JSON.stringify({action: "submitKhauTrang", records: records, deviceId: window.getDeviceId ? window.getDeviceId() : "WEB"}) });
            const res = await r.json();
            if (res.status === "success") { window.showToast("Cấp phát thành công!", true); window.resetForm(); loadHistory(); }
        } catch (err) { window.showToast("Lỗi mạng!", false); } 
        finally { btnSubmit.disabled = true; btnText.style.display = 'block'; spinner.style.display = 'none'; }
    });

    async function loadHistory() {
        try {
            const r = await fetch(SCRIPT_URL_KHAU_TRANG, { method: 'POST', body: JSON.stringify({ action: "getKhauTrangData" }) });
            const res = await r.json();
            if (res.status === "success") {
                const tb = document.getElementById('tableBody'); tb.innerHTML = '';
                res.data.forEach(row => {
                    const parts = row.ngayGio.split(' ');
                    // Chỉ vẽ 4 cột theo yêu cầu tỷ lệ
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

    // --- 5. RESET FORM ---
    window.resetForm = () => {
        document.querySelectorAll('.mask-row:not(:first-child)').forEach(el => el.remove()); 
        document.getElementById('khauTrangForm').reset();
        const firstRow = document.querySelector('.mask-row');
        if (firstRow) {
            const firstSoThe = firstRow.querySelector('.soTheInput');
            firstSoThe.value = ""; firstSoThe.dataset.valid = "false";
            const firstMsg = firstRow.querySelector('.msg-name');
            firstMsg.innerHTML = ""; // Empty string
            firstMsg.classList.remove('name-success', 'name-error');
            firstRow.querySelector('.current-qty').innerText = "50";
            firstRow.querySelector('.real-qty').value = "50";
        }
        document.getElementById('btnSubmit').disabled = true;
    };
});
