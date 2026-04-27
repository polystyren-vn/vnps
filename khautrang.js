// ==========================================================================
// MODULE KHẨU TRANG V3.0 - LOGIC ĐIỀU KHIỂN (BULK INSERT & MODAL PICKER)
// ==========================================================================

// BẠN HÃY DÁN LINK DEPLOY APPS SCRIPT CỦA DỰ ÁN VÀO ĐÂY NHÉ:
const SCRIPT_URL_KHAU_TRANG = "https://script.google.com/macros/s/AKfycbzYXPNw_cGZmvQZR9UNAs6XYEjPi6eBvG0fkeugNYfLN8p7utTXBiIovt6zqYHVoTAbTw/exec";

let currentRowForQty = null;

document.addEventListener("DOMContentLoaded", async () => {
    // 1. TẢI DANH BẠ NHÂN VIÊN TỪ RAM (Thông qua hàm của core.js)
    if (typeof window.loadEmployeesData === 'function') {
        await window.loadEmployeesData();
    }

    const container = document.getElementById('maskInputsContainer');

    // ==========================================
    // KHỐI 1: XỬ LÝ MODAL CHỌN SỐ LƯỢNG (PICKER)
    // ==========================================
    window.openQtyPicker = function(el) {
        currentRowForQty = el; // Lưu lại dòng đang bấm để sau đó cập nhật đúng ô
        document.getElementById('qtyPickerModal').style.display = 'block';
    };

    window.closeQtyPicker = function() {
        document.getElementById('qtyPickerModal').style.display = 'none';
        currentRowForQty = null;
    };

    window.selectQty = function(val) {
        if (val === 'OTHER') {
            const custom = prompt("Nhập số lượng khác:");
            if (custom && !isNaN(custom) && parseInt(custom) > 0) {
                val = parseInt(custom);
            } else {
                return; // Nếu nhập sai hoặc bấm Hủy thì đóng lại không làm gì cả
            }
        }
        
        if (currentRowForQty) {
            // Cập nhật số hiển thị và value ẩn
            currentRowForQty.querySelector('.current-qty').innerText = val;
            currentRowForQty.querySelector('.real-qty').value = val;
        }
        window.closeQtyPicker();
        checkValidity();
    };

    // Đóng Modal khi bấm ra ngoài vùng xám
    document.getElementById('qtyPickerModal').addEventListener('click', (e) => {
        if(e.target.id === 'qtyPickerModal') window.closeQtyPicker();
    });


    // ==========================================
    // KHỐI 2: THÊM VÀ XÓA DÒNG NHÂN VIÊN (BULK)
    // ==========================================
    document.getElementById('btnAddMaskRow').addEventListener('click', () => {
        const row = document.createElement('div');
        row.className = 'mask-row';
        // Khối HTML dòng mới (Dùng nút dấu trừ đỏ để xóa)
        row.innerHTML = `
            <div class="employee-box-compact">
                <span class="material-symbols-outlined icon-sm">badge</span>
                <input type="number" inputmode="numeric" class="soTheInput compact" placeholder="ST" required autocomplete="off">
                <div class="divider"></div>
                <div class="msg-name-compact">Đợi nhập thẻ...</div>
            </div>
            
            <div class="qty-picker-trigger" onclick="openQtyPicker(this)">
                <span class="current-qty">50</span>
                <input type="hidden" class="real-qty" value="50">
            </div>

            <button type="button" class="btn-remove-row" style="width: 24px; height: 48px; border-radius: 12px; background: var(--error); color: white; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                <span class="material-symbols-outlined">remove</span>
            </button>
        `;
        container.appendChild(row);

        // Gắn sự kiện xóa cho nút vừa tạo
        row.querySelector('.btn-remove-row').addEventListener('click', function() {
            row.remove();
            checkValidity();
        });
    });


    // ==========================================
    // KHỐI 3: TRA CỨU SỐ THẺ TỰ ĐỘNG
    // ==========================================
    container.addEventListener('input', (e) => {
        if (e.target.classList.contains('soTheInput')) {
            const val = e.target.value.trim();
            const msgBox = e.target.nextElementSibling.nextElementSibling; // div.divider -> div.msg-name-compact
            const emp = window.employeeData ? window.employeeData.find(v => v.soThe === val) : null;
            
            if (emp) {
                msgBox.innerHTML = `${emp.hoTen} - ${emp.boPhan}`;
                msgBox.style.color = "var(--success)";
                e.target.dataset.hoten = emp.hoTen;
                e.target.dataset.valid = "true";
            } else {
                msgBox.innerHTML = val === "" ? "Đợi nhập thẻ..." : "Không tìm thấy!";
                msgBox.style.color = val === "" ? "var(--sub-text)" : "var(--error)";
                e.target.dataset.valid = "false";
            }
            checkValidity();
        }
    });

    // Hàm kiểm tra hợp lệ để mở nút XÁC NHẬN
    function checkValidity() {
        const rows = document.querySelectorAll('.mask-row');
        let isValid = true;
        let hasAtLeastOneValid = false;

        rows.forEach(row => {
            const soThe = row.querySelector('.soTheInput');
            // Nếu có nhập số thẻ nhưng thẻ không tồn tại -> Block nút gửi
            if (soThe.value.trim() !== "") {
                if (soThe.dataset.valid !== "true") {
                    isValid = false; 
                } else {
                    hasAtLeastOneValid = true;
                }
            }
        });

        // Bắt buộc dòng đầu tiên (Người đứng ra nhận thay) phải là người hợp lệ
        const firstRowValid = rows[0].querySelector('.soTheInput').dataset.valid === "true";

        document.getElementById('btnSubmit').disabled = !(hasAtLeastOneValid && isValid && firstRowValid);
    }


    // ==========================================
    // KHỐI 4: GỬI DỮ LIỆU & LẤY NHẬT KÝ
    // ==========================================
    document.getElementById('khauTrangForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btnSubmit = document.getElementById('btnSubmit');
        const spinner = document.getElementById('spinner');
        const btnText = document.getElementById('btnText');
        
        btnSubmit.disabled = true; 
        btnText.style.display = 'none'; 
        spinner.style.display = 'block';

        const records = [];
        let nguoiNhanThay = ""; // Lấy tên người dòng 1 làm chuẩn

        document.querySelectorAll('.mask-row').forEach((row, index) => {
            const soTheInp = row.querySelector('.soTheInput');
            // Chỉ đóng gói những dòng có thẻ hợp lệ
            if (soTheInp.dataset.valid === "true") {
                if (index === 0) nguoiNhanThay = soTheInp.dataset.hoten;
                
                const soLuong = row.querySelector('.real-qty').value;

                records.push({
                    soThe: soTheInp.value,
                    hoTen: soTheInp.dataset.hoten,
                    soLuong: soLuong,
                    nhanThay: index === 0 ? "" : nguoiNhanThay 
                });
            }
        });

        if(records.length === 0) return;

        const payload = {
            action: "submitKhauTrang",
            records: records,
            deviceId: typeof window.getDeviceId === 'function' ? window.getDeviceId() : "WEB"
        };

        try {
            const r = await fetch(SCRIPT_URL_KHAU_TRANG, { 
                method: 'POST', 
                body: JSON.stringify(payload) 
            });
            const res = await r.json();
            
            if (res.status === "success") {
                if(typeof window.showToast === 'function') window.showToast("Cấp phát thành công!", true);
                window.resetForm();
                loadHistory();
            }
        } catch (err) { 
            if(typeof window.showToast === 'function') window.showToast("Lỗi mạng hoặc server!", false);
            console.error("Fetch Error:", err);
        } finally { 
            btnSubmit.disabled = true; 
            btnText.style.display = 'block'; 
            spinner.style.display = 'none'; 
        }
    });

    async function loadHistory() {
        try {
            const r = await fetch(SCRIPT_URL_KHAU_TRANG, { 
                method: 'POST', 
                body: JSON.stringify({ action: "getKhauTrangData" }) 
            });
            const res = await r.json();
            
            if (res.status === "success") {
                const tb = document.getElementById('tableBody'); 
                tb.innerHTML = '';
                
                res.data.forEach(row => {
                    const parts = row.ngayGio.split(' ');
                    const datePart = parts[0] || "";
                    const timePart = parts[1] || "";

                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td style="font-size:10px;">${timePart}<br>${datePart}</td>
                        <td>${row.soThe}</td>
                        <td style="text-align:left; font-size:11px;"><b>${row.hoTen}</b></td>
                        <td><span class="status-tag" style="background:#e8f0fe; color:#1967d2;">${row.sl}</span></td>
                        <td style="font-size:10px; color:var(--sub-text)">${row.nhanThay || '-'}</td>
                    `;
                    tb.appendChild(tr);
                });
            }
        } catch(e) {
            console.error("Lỗi tải lịch sử:", e);
        }
    }

    // Tự động kéo lịch sử 10 dòng gần nhất khi vừa tải trang
    loadHistory();

    // ==========================================
    // KHỐI 5: RESET GIAO DIỆN VỀ BAN ĐẦU
    // ==========================================
    window.resetForm = () => {
        // 1. Xóa các dòng thêm bằng nút (+), chỉ giữ dòng đầu tiên
        document.querySelectorAll('.mask-row:not(:first-child)').forEach(el => el.remove()); 
        
        // 2. Clear giá trị form
        document.getElementById('khauTrangForm').reset();
        
        // 3. Trả dòng đầu tiên về trạng thái nguyên thủy
        const firstRow = document.querySelector('.mask-row');
        if (firstRow) {
            const firstSoThe = firstRow.querySelector('.soTheInput');
            firstSoThe.value = "";
            firstSoThe.dataset.valid = "false";
            
            const firstMsg = firstRow.querySelector('.msg-name-compact');
            firstMsg.innerHTML = "Đợi nhập thẻ...";
            firstMsg.style.color = "var(--sub-text)";
            
            firstRow.querySelector('.current-qty').innerText = "50";
            firstRow.querySelector('.real-qty').value = "50";
        }

        // 4. Khóa nút xác nhận
        document.getElementById('btnSubmit').disabled = true;
    };
});
