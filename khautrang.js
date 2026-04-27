document.addEventListener("DOMContentLoaded", async () => {
    // 1. Tải danh bạ
    if(typeof window.loadEmployeesData === 'function') await window.loadEmployeesData();

    const container = document.getElementById('maskInputsContainer');

    // 2. HÀM THÊM DÒNG NHÂN VIÊN MỚI
    document.getElementById('btnAddMaskRow').addEventListener('click', () => {
        const row = document.createElement('div');
        row.className = 'form-group mask-row';
        row.style.cssText = 'display: flex; gap: 8px; align-items: flex-start; margin-bottom: 12px;';
        row.innerHTML = `
            <div class="employee-box" style="flex: 2;" onclick="this.querySelector('input').focus()">
                <span class="material-symbols-outlined">badge</span>
                <input type="number" inputmode="numeric" class="soTheInput" placeholder="SỐ THẺ" required autocomplete="off">
                <div class="msg-name"></div>
            </div>
            <div class="quantity-box" style="flex: 1;">
                <select class="slSelect" style="width: 100%; height: 50px; border-radius: 8px; border: 1px solid #ccc; outline: none; padding: 0 10px; font-weight: bold; color: var(--primary); font-size: 16px;">
                    <option value="50" selected>50</option>
                    <option value="40">40</option>
                    <option value="30">30</option>
                    <option value="20">20</option>
                    <option value="10">10</option>
                    <option value="OTHER">Khác</option>
                </select>
                <input type="number" class="slCustom" placeholder="SL..." style="display: none; width: 100%; height: 50px; border-radius: 8px; border: 1px solid var(--accent); outline: none; padding: 0 10px; font-weight: bold; text-align: center; font-size: 16px;">
            </div>
            <button type="button" class="btn-remove-row" style="width: 50px; height: 50px; flex-shrink: 0; border-radius: 8px; background: var(--error); color: white; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                <span class="material-symbols-outlined">remove</span>
            </button>
        `;
        container.appendChild(row);
        
        // Sự kiện xóa dòng
        row.querySelector('.btn-remove-row').addEventListener('click', function() {
            row.remove();
            checkValidity();
        });
    });

    // 3. DÙNG EVENT DELEGATION BẮT SỰ KIỆN CHO TOÀN BỘ CONTAINER
    container.addEventListener('input', (e) => {
        // A. Xử lý tra cứu Số Thẻ
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
                msgBox.innerHTML = val === "" ? "" : "Số thẻ không đúng";
                if (val !== "") msgBox.classList.add('name-error');
                e.target.dataset.valid = "false";
            }
            checkValidity();
        }
        
        // B. Kiểm tra nhập tay Số lượng Khác
        if (e.target.classList.contains('slCustom')) checkValidity();
    });

    // Bắt sự kiện đổi Select (Khác -> Hiện ô nhập tay)
    container.addEventListener('change', (e) => {
        if (e.target.classList.contains('slSelect')) {
            const val = e.target.value;
            const inputCustom = e.target.nextElementSibling;
            if (val === 'OTHER') {
                e.target.style.display = 'none';
                inputCustom.style.display = 'block';
                inputCustom.focus();
            }
            checkValidity();
        }
    });

    // 4. KIỂM TRA MỞ KHÓA NÚT XÁC NHẬN
    function checkValidity() {
        const rows = document.querySelectorAll('.mask-row');
        let isValid = true;
        let hasAtLeastOne = false;

        rows.forEach(row => {
            const soThe = row.querySelector('.soTheInput');
            if (soThe.value.trim() !== "") hasAtLeastOne = true;
            if (soThe.dataset.valid !== "true") isValid = false;

            // Kiểm tra ô nhập tay nếu chọn OTHER
            const slSelect = row.querySelector('.slSelect');
            const slCustom = row.querySelector('.slCustom');
            if (slSelect.value === 'OTHER' && slCustom.value.trim() === "") isValid = false;
        });

        document.getElementById('btnSubmit').disabled = !(hasAtLeastOne && isValid);
    }

    // 5. GỬI DỮ LIỆU LÊN SERVER (GÓI THÀNH MẢNG)
    document.getElementById('khauTrangForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const b = document.getElementById('btnSubmit'), sp = document.getElementById('spinner'), bt = document.getElementById('btnText');
        b.disabled = true; bt.style.display = 'none'; sp.style.display = 'block';

        const records = [];
        let nguoiNhanThay = ""; // Tên của người ở dòng đầu tiên

        document.querySelectorAll('.mask-row').forEach((row, index) => {
            const soTheInp = row.querySelector('.soTheInput');
            if (soTheInp.dataset.valid === "true") {
                if (index === 0) nguoiNhanThay = soTheInp.dataset.hoten; // Bắt người đầu tiên làm chủ
                
                const slSel = row.querySelector('.slSelect');
                const slCus = row.querySelector('.slCustom');
                const soLuong = slSel.value === 'OTHER' ? slCus.value : slSel.value;

                records.push({
                    soThe: soTheInp.value,
                    hoTen: soTheInp.dataset.hoten,
                    soLuong: soLuong,
                    // Từ người thứ 2 trở đi, đánh dấu là được nhận thay bởi người số 1
                    nhanThay: index === 0 ? "" : nguoiNhanThay 
                });
            }
        });

        const payload = {
            action: "submitKhauTrang",
            records: records,
            deviceId: typeof window.getDeviceId === 'function' ? window.getDeviceId() : "WEB"
        };

        try {
            // VẪN DÙNG CHUNG LINK API ĐỂ TIẾT KIỆM TÀI NGUYÊN APP
            const r = await fetch(SCRIPT_URL_TANG_CA, { method: 'POST', body: JSON.stringify(payload) });
            const res = await r.json();
            if (res.status === "success") {
                window.showToast("Cấp phát thành công!", true);
                window.resetForm();
                loadHistory();
            }
        } catch (err) { window.showToast("Lỗi kết nối mạng!", false);
        } finally { b.disabled = false; bt.style.display = 'block'; sp.style.display = 'none'; }
    });

    // 6. LOAD LỊCH SỬ
    async function loadHistory() {
        try {
            const r = await fetch(SCRIPT_URL_TANG_CA, { method: 'POST', body: JSON.stringify({ action: "getKhauTrangData" }) });
            const res = await r.json();
            if (res.status === "success") {
                const tb = document.getElementById('tableBody'); tb.innerHTML = '';
                res.data.forEach(row => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `<td>${row.ngayGio}</td><td>${row.soThe}</td><td style="text-align:left;">${row.hoTen}</td><td><b>${row.sl}</b></td><td style="font-size:10px; color:var(--sub-text)">${row.nhanThay}</td>`;
                    tb.appendChild(tr);
                });
            }
        } catch(e) {}
    }
    loadHistory();

    // 7. RESET FORM
    window.resetForm = () => {
        document.querySelectorAll('.mask-row:not(:first-child)').forEach(el => el.remove()); // Xóa các dòng thừa
        document.getElementById('khauTrangForm').reset();
        
        // Reset lại giao diện ô select
        const firstSelect = document.querySelector('.slSelect');
        const firstCustom = document.querySelector('.slCustom');
        firstSelect.style.display = 'block';
        firstSelect.value = '50';
        firstCustom.style.display = 'none';
        
        const msg = document.querySelector('.msg-name');
        msg.innerHTML = ""; msg.classList.remove('name-success', 'name-error');
        document.querySelector('.soTheInput').dataset.valid = "false";
        document.getElementById('btnSubmit').disabled = true;
    };
});
