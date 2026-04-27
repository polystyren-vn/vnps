const SCRIPT_URL_TANG_CA = "https://script.google.com/macros/s/AKfycbzYXPNw_cGZmvQZR9UNAs6XYEjPi6eBvG0fkeugNYfLN8p7utTXBiIovt6zqYHVoTAbTw/exec";

let isListVisible = false, isEditing = false;
// Cờ RAM Cache (Nâng cấp V2.6)
let isDataLoaded = false; 
let currentTongCongValue = "0.00"; 

// Giữ nguyên hàm cũ phục vụ tương thích ngược nếu cần
window.clearSoThe = () => {
    const i = document.querySelector('.soTheInput');
    if(i) { i.value = ''; i.dispatchEvent(new Event('input', { bubbles: true })); }
};

// --- NÂNG CẤP V4.0: HÀM THÊM NHÂN VIÊN MỚI VÀO FORM ---
window.addEmpRow = function() {
    const container = document.getElementById('employeeInputsContainer');
    if(!container) return;
    const row = document.createElement('div');
    row.className = 'form-group employee-row';
    row.style.cssText = 'display: flex; gap: 8px; margin-bottom: 16px;';
    
    row.innerHTML = `
        <div class="employee-box" style="flex: 1;" onclick="this.querySelector('input').focus()">
            <span class="material-symbols-outlined" style="color: #5f6368; font-size: 22px; margin-right: 4px;">badge</span>
            <input type="number" inputmode="numeric" pattern="[0-9]*" class="soTheInput" placeholder="SỐ THẺ" required autocomplete="off">
            <div class="msg-name"></div>
        </div>
        <button type="button" class="btn-remove-emp" style="width: 48px; background: var(--error); color: white; flex-shrink: 0; padding: 0; border-radius: 24px; border: none; cursor: pointer;">
            <span class="material-symbols-outlined">remove</span>
        </button>
    `;
    container.appendChild(row);
    
    // Gắn sự kiện xóa cho nút dấu trừ (-)
    row.querySelector('.btn-remove-emp').addEventListener('click', function() {
        row.remove();
        if(typeof window.checkFormValidity === 'function') window.checkFormValidity();
    });
};

window.startEdit = function(dataStr) {
    const data = JSON.parse(decodeURIComponent(dataStr));
    isEditing = true;
    document.getElementById('editMaPhieu').value = data.maPhieu;
    
    if (data.ngay && data.ngay.includes('/')) {
        const [d, m, y] = data.ngay.split('/');
        document.getElementById('ngayTangCa').value = `${y}-${m}-${d}`;
    }
    
    // NÂNG CẤP BULK: Ẩn nút + và dọn dẹp các dòng thừa khi bật chế độ Sửa
    const btnAdd = document.getElementById('btnAddEmp');
    if (btnAdd) btnAdd.style.display = 'none';
    document.querySelectorAll('.employee-row:not(:first-child)').forEach(el => el.remove());
    
    // Bơm dữ liệu vào ô input duy nhất còn lại
    const firstInput = document.querySelector('.soTheInput');
    if (firstInput) {
        firstInput.value = data.soThe;
    }

    document.getElementById('tuGio').value = data.tuGio ? data.tuGio.toString().substring(0, 5) : "";
    document.getElementById('denGio').value = data.denGio ? data.denGio.toString().substring(0, 5) : "";
    
    // Logic hoán đổi Lý do
    const lyDoSelect = document.getElementById('lyDoSelect');
    const lyDoCustom = document.getElementById('lyDoCustom');
    const selectPart = document.getElementById('reason-select-part');
    const customPart = document.getElementById('reason-custom-part');
    const options = Array.from(lyDoSelect.options).map(opt => opt.value);
    
    if(options.includes(data.lyDo)) {
        lyDoSelect.value = data.lyDo;
        selectPart.style.display = 'flex';
        customPart.style.display = 'none';
    } else {
        lyDoSelect.value = "OTHER";
        selectPart.style.display = 'none';
        customPart.style.display = 'flex';
        lyDoCustom.value = data.lyDo;
    }
    
    document.getElementById('loaitangca').value = data.loai;
    document.getElementById('btnText').innerText = "CẬP NHẬT DỮ LIỆU";
    document.getElementById('btnSubmit').style.background = "#e67e22";
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Kích hoạt event để tính toán & đổi màu
    if (firstInput) firstInput.dispatchEvent(new Event('input', { bubbles: true }));
    document.getElementById('tuGio').dispatchEvent(new Event('change', { bubbles: true }));
};

window.cancelEdit = function() {
    isEditing = false;
    document.getElementById('tangCaForm').reset();
    document.getElementById('editMaPhieu').value = "";
    document.getElementById('btnText').innerText = "GỬI DỮ LIỆU";
    document.getElementById('btnSubmit').style.background = "";
    
    // NÂNG CẤP BULK: Mở khóa nút +, dọn dòng thừa
    const btnAdd = document.getElementById('btnAddEmp');
    if (btnAdd) btnAdd.style.display = 'block';
    document.querySelectorAll('.employee-row:not(:first-child)').forEach(el => el.remove());
    
    // Reset màu sắc và text ô số thẻ đầu tiên
    const msgSoThe = document.querySelector('.msg-name');
    if (msgSoThe) {
        msgSoThe.innerHTML = "";
        msgSoThe.classList.remove('name-success', 'name-error');
    }
    const firstInput = document.querySelector('.soTheInput');
    if (firstInput) firstInput.dataset.valid = "false";
    
    document.getElementById('msg-tongCong').innerText = "TC: 0.00 (h)";
    
    document.getElementById('reason-select-part').style.display = 'flex';
    document.getElementById('reason-custom-part').style.display = 'none';
    
    document.getElementById('btnSubmit').disabled = true;
};

document.addEventListener("DOMContentLoaded", async () => {
    if(typeof window.loadEmployeesData === 'function') await window.loadEmployeesData();
    
    // Bắt sự kiện nút Thêm Nhân viên
    const btnAdd = document.getElementById('btnAddEmp');
    if(btnAdd) btnAdd.addEventListener('click', window.addEmpRow);

    // Dùng Event Delegation bắt sự kiện input cho TOÀN BỘ các ô số thẻ
    const container = document.getElementById('employeeInputsContainer');
    if (container) {
        container.addEventListener('input', (e) => {
            if (!e.target.classList.contains('soTheInput')) return;
            
            const val = e.target.value.trim();
            const msgBox = e.target.nextElementSibling; // Thẻ div.msg-name
            const emp = window.employeeData ? window.employeeData.find(v => v.soThe === val) : null;
            
            if (msgBox) msgBox.classList.remove('name-success', 'name-error');

            if (emp) {
                if (msgBox) {
                    msgBox.innerHTML = `${emp.hoTen} - ${emp.boPhan}`;
                    msgBox.classList.add('name-success'); // Xanh lá
                }
                // Nén data thẳng vào thẻ input
                e.target.dataset.hoten = emp.hoTen;
                e.target.dataset.bophan = emp.boPhan;
                e.target.dataset.idnv = emp.idNV;
                e.target.dataset.valid = "true";
            } else {
                if (msgBox) {
                    msgBox.innerHTML = val === "" ? "" : "Số thẻ không đúng";
                    if (val !== "") msgBox.classList.add('name-error'); // Đỏ
                }
                e.target.dataset.valid = "false";
            }
            if (typeof window.checkFormValidity === 'function') window.checkFormValidity();
        });
    }

    const tu = document.getElementById('tuGio');
    const den = document.getElementById('denGio');

    function calc() {
        if (tu.value && den.value) {
            let s = new Date(`1970-01-01T${tu.value}:00`);
            let e = new Date(`1970-01-01T${den.value}:00`);
            if (e < s) e.setDate(e.getDate() + 1);
            currentTongCongValue = ((e - s) / 3600000).toFixed(2);
            document.getElementById('msg-tongCong').innerText = `TC: ${currentTongCongValue} (h)`;
        } else {
            document.getElementById('msg-tongCong').innerText = "TC: 0.00 (h)";
            currentTongCongValue = "0.00";
        }
    }

    // 2. TÍNH NĂNG BƠM MẶC ĐỊNH :00 (Phục hồi chuẩn UX)
    function suggestDefaultTime(e) {
        if (!e.target.value) { 
            const currentHour = new Date().getHours().toString().padStart(2, '0');
            e.target.value = `${currentHour}:00`; 
            calc();
            window.checkFormValidity();
        }
    }

    tu.addEventListener('focus', suggestDefaultTime);
    den.addEventListener('focus', suggestDefaultTime);
    tu.addEventListener('change', () => { calc(); window.checkFormValidity(); });
    den.addEventListener('change', () => { calc(); window.checkFormValidity(); });

    // Logic Lý do (Vẫn giữ nguyên chuẩn)
    const lyDoSelect = document.getElementById('lyDoSelect');
    const lyDoCustom = document.getElementById('lyDoCustom');
    const selectPart = document.getElementById('reason-select-part');
    const customPart = document.getElementById('reason-custom-part');
    const btnBack = document.getElementById('btnBackToSelect');

    lyDoSelect.addEventListener('change', () => {
        if (lyDoSelect.value === 'OTHER') {
            selectPart.style.display = 'none';
            customPart.style.display = 'flex';
            lyDoCustom.focus();
        }
        window.checkFormValidity();
    });

    btnBack.addEventListener('click', () => {
        lyDoSelect.value = '';
        lyDoCustom.value = '';
        selectPart.style.display = 'flex';
        customPart.style.display = 'none';
        window.checkFormValidity();
    });

    // Định nghĩa lại hàm kiểm tra điều kiện lưu để dò quét mảng
    window.checkFormValidity = function() {
        const inputs = document.querySelectorAll('.soTheInput');
        let allEmpValid = true;
        let hasAtLeastOne = false;
        
        inputs.forEach(inp => {
            if (inp.value.trim() !== "") hasAtLeastOne = true;
            if (inp.dataset.valid !== "true") allEmpValid = false;
        });

        const ok = document.getElementById('ngayTangCa').value && hasAtLeastOne && allEmpValid &&
                   tu.value && den.value && document.getElementById('loaitangca').value;
        
        let hasLyDo = lyDoSelect.value === 'OTHER' ? lyDoCustom.value.trim() !== '' : lyDoSelect.value !== '';
        document.getElementById('btnSubmit').disabled = !(ok && hasLyDo);
    };

    document.getElementById('ngayTangCa').addEventListener('change', window.checkFormValidity);
    document.getElementById('loaitangca').addEventListener('change', window.checkFormValidity);
    lyDoCustom.addEventListener('input', window.checkFormValidity);

    document.getElementById('tangCaForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const b = document.getElementById('btnSubmit');
        const sp = document.getElementById('spinner');
        const bt = document.getElementById('btnText');
        b.disabled = true; bt.style.display = 'none'; sp.style.display = 'block';
        
        // ĐÓNG GÓI MẢNG NHÂN VIÊN ĐỂ GỬI ĐI
        const employeesArray = [];
        document.querySelectorAll('.soTheInput').forEach(inp => {
            if(inp.dataset.valid === "true") {
                employeesArray.push({
                    soThe: inp.value,
                    hoTen: inp.dataset.hoten,
                    boPhan: inp.dataset.bophan,
                    idNV: inp.dataset.idnv
                });
            }
        });

        const dParts = document.getElementById('ngayTangCa').value.split('-');
        const payload = {
            action: isEditing ? "update" : "submit",
            maPhieu: isEditing ? document.getElementById('editMaPhieu').value : "TC-" + Date.now(),
            
            // Đẩy mảng vào Payload
            employees: employeesArray,
            
            // Giữ lại 4 biến cục bộ dự phòng cho Backend nếu cần
            idNV: employeesArray.length > 0 ? employeesArray[0].idNV : "",
            soThe: employeesArray.length > 0 ? employeesArray[0].soThe : "",
            hoTen: employeesArray.length > 0 ? employeesArray[0].hoTen : "",
            boPhan: employeesArray.length > 0 ? employeesArray[0].boPhan : "",
            
            ngayTangCa: `${dParts[2]}/${dParts[1]}/${dParts[0]}`,
            tuGio: tu.value, denGio: den.value, tongCong: currentTongCongValue,
            lyDo: lyDoSelect.value === 'OTHER' ? lyDoCustom.value.trim() : lyDoSelect.value,
            loaitangca: document.getElementById('loaitangca').value,
            deviceId: (typeof window.getDeviceId === 'function') ? window.getDeviceId() : "UNKNOWN"
        };

        try {
            const r = await fetch(SCRIPT_URL_TANG_CA, { method: 'POST', body: JSON.stringify(payload) });
            const res = await r.json();
            if (res.status === "success") {
                window.showToast(isEditing ? "Cập nhật thành công!" : "Ghi thành công!", true);
                window.cancelEdit();
                
                // 3. TÍNH NĂNG AUTO-REFRESH CACHE (V2.6)
                isDataLoaded = false; 
                if(isListVisible) loadList();

            } else { window.showToast("Lỗi: " + res.message, false); b.disabled = false; }
        } catch (err) { window.showToast("Lỗi kết nối API!", false); b.disabled = false;
        } finally { bt.style.display = 'block'; sp.style.display = 'none'; }
    });

    async function loadList() {
        const b = document.getElementById('btnViewList');
        const sp = document.getElementById('spinnerList');
        const bt = document.getElementById('btnListText');
        b.disabled = true; bt.style.display = 'none'; sp.style.display = 'block';
        try {
            const r = await fetch(SCRIPT_URL_TANG_CA, { method: 'POST', body: JSON.stringify({ action: "getData" }) });
            const res = await r.json();
            if (res.status === "success") {
                const tb = document.getElementById('tableBody'); tb.innerHTML = '';
                // TUÂN THỦ DỮ LIỆU GỐC: KHÔNG DÙNG .reverse()
                res.data.forEach(row => {
                    const tr = document.createElement('tr');
                    let actionIcon = row.chk ? `🔒` : `<span style="cursor:pointer;" onclick="startEdit('${encodeURIComponent(JSON.stringify(row))}')">✏️</span>`;
                    tr.innerHTML = `<td>${row.ngay}</td><td>${row.soThe}</td><td style="text-align:left;">${row.hoTen}</td><td>${row.boPhan}</td><td>${row.tuGio}-${row.denGio}</td><td><span class="status-tag">${row.tong}h</span></td><td style="color:#1A73E8">${row.tongNam}h</td><td>${row.lyDo}</td><td>${row.loai}</td><td>${actionIcon}</td>`;
                    tb.appendChild(tr);
                });
                document.getElementById('dataSection').style.display = 'block'; 
                bt.innerText = "ẨN DANH SÁCH"; 
                isListVisible = true;
                
                // 4. LƯU CỜ RAM (V2.6)
                isDataLoaded = true;
            }
        } catch(e) { window.showToast("Lỗi tải danh sách!", false);
        } finally { b.disabled = false; bt.style.display = 'block'; sp.style.display = 'none'; }
    }

    document.getElementById('btnViewList').addEventListener('click', () => {
        // 5. XỬ LÝ ẨN/HIỆN QUA RAM CACHE (V2.6)
        if(isListVisible) { 
            document.getElementById('dataSection').style.display = 'none'; 
            document.getElementById('btnListText').innerText = "XEM DANH SÁCH THÁNG HIỆN TẠI"; 
            isListVisible = false;
        } else { 
            if (isDataLoaded) {
                document.getElementById('dataSection').style.display = 'block'; 
                document.getElementById('btnListText').innerText = "ẨN DANH SÁCH"; 
                isListVisible = true;
            } else {
                loadList(); 
            }
        }
    });
});
