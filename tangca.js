const SCRIPT_URL_TANG_CA = "https://script.google.com/macros/s/AKfycbzYXPNw_cGZmvQZR9UNAs6XYEjPi6eBvG0fkeugNYfLN8p7utTXBiIovt6zqYHVoTAbTw/exec";

let isListVisible = false, isEditing = false;
let isDataLoaded = false; 
let currentTongCongValue = "0.00"; 

window.clearSoThe = () => {
    const i = document.querySelector('.soTheInput');
    if(i) { i.value = ''; i.dispatchEvent(new Event('input', { bubbles: true })); }
};

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
    
    row.querySelector('.btn-remove-emp').addEventListener('click', function() {
        row.remove();
        if(typeof window.checkFormValidity === 'function') window.checkFormValidity();
    });
};

// ==========================================================================
// TỐI ƯU V4.5: HÀM NẠP/ĐỌC DỮ LIỆU DROPDOWN SIÊU NHANH
// ==========================================================================
window.setCustomDropdownValue = function(hiddenId, rawVal) {
    const hiddenInput = document.getElementById(hiddenId);
    if(!hiddenInput) return;
    const dropdown = hiddenInput.closest('.custom-dropdown');
    const textDisplay = dropdown.querySelector('.dropdown-text');
    const items = dropdown.querySelectorAll('.options-list li');
    const customInput = dropdown.querySelector('.inline-custom-input');
    const displayBox = dropdown.querySelector('.dropdown-display');

    // Reset list
    items.forEach(li => li.classList.remove('selected'));

    const val = rawVal ? String(rawVal).trim() : '';

    // Trường hợp Form rỗng
    if (!val) {
        hiddenInput.value = '';
        textDisplay.textContent = hiddenId === 'lyDoSelect' ? 'LÝ DO TĂNG CA' : 'LOẠI TĂNG CA';
        textDisplay.style.display = '';
        displayBox.classList.add('placeholder-active');
        if(customInput) {
            customInput.style.display = 'none';
            customInput.value = '';
        }
        return;
    }

    // Quét tìm & Chuẩn hóa
    let isStandard = false;
    let matchedText = '';
    const valLower = val.toLowerCase();

    items.forEach(li => {
        const itemVal = li.getAttribute('data-value').trim();
        if (itemVal.toLowerCase() === valLower && itemVal !== 'OTHER') {
            isStandard = true;
            matchedText = li.textContent.trim(); 
            li.classList.add('selected');
        }
    });

    // Bơm dữ liệu
    if (isStandard) {
        hiddenInput.value = matchedText; // Gán đúng text chuẩn
        textDisplay.textContent = matchedText; 
        textDisplay.style.display = '';
        displayBox.classList.remove('placeholder-active');
        if(customInput) {
            customInput.style.display = 'none';
            customInput.value = '';
        }
    } else {
        // Gõ tay (OTHER)
        hiddenInput.value = 'OTHER';
        textDisplay.style.display = 'none';
        displayBox.classList.remove('placeholder-active');
        if(customInput) {
            customInput.style.display = 'block';
            customInput.value = (val.toUpperCase() === 'OTHER') ? '' : val; 
        }
        items.forEach(li => {
            if (li.getAttribute('data-value') === 'OTHER') li.classList.add('selected');
        });
    }
};

window.startEdit = function(dataStr) {
    const data = JSON.parse(decodeURIComponent(dataStr));
    isEditing = true;
    document.getElementById('editMaPhieu').value = data.maPhieu;
    
    if (data.ngay && data.ngay.includes('/')) {
        const [d, m, y] = data.ngay.split('/');
        document.getElementById('ngayTangCa').value = `${y}-${m}-${d}`;
    }
    
    const btnAdd = document.getElementById('btnAddEmp');
    if (btnAdd) btnAdd.style.display = 'none';
    document.querySelectorAll('.employee-row:not(:first-child)').forEach(el => el.remove());
    
    const firstInput = document.querySelector('.soTheInput');
    if (firstInput) firstInput.value = data.soThe;

    document.getElementById('tuGio').value = data.tuGio ? data.tuGio.toString().substring(0, 5) : "";
    document.getElementById('denGio').value = data.denGio ? data.denGio.toString().substring(0, 5) : "";
    
    // Nạp Dropdown
    window.setCustomDropdownValue('lyDoSelect', data.lyDo);
    window.setCustomDropdownValue('loaitangca', data.loai);
    
    document.getElementById('btnText').innerText = "CẬP NHẬT DỮ LIỆU";
    document.getElementById('btnSubmit').style.background = "#e67e22";

    // Hiện nút HỦY (Dựa theo ID gốc)
    const btnCancel = document.getElementById('btnCancel');
    if(btnCancel) btnCancel.style.display = 'block';

    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    if (firstInput) firstInput.dispatchEvent(new Event('input', { bubbles: true }));
    document.getElementById('tuGio').dispatchEvent(new Event('change', { bubbles: true }));
};

window.cancelEdit = function() {
    isEditing = false;
    document.getElementById('tangCaForm').reset();
    document.getElementById('editMaPhieu').value = "";
    document.getElementById('btnText').innerText = "GỬI DỮ LIỆU";
    document.getElementById('btnSubmit').style.background = "";
    
    const btnAdd = document.getElementById('btnAddEmp');
    if (btnAdd) btnAdd.style.display = 'block';
    document.querySelectorAll('.employee-row:not(:first-child)').forEach(el => el.remove());
    
    const msgSoThe = document.querySelector('.msg-name');
    if (msgSoThe) {
        msgSoThe.innerHTML = "";
        msgSoThe.classList.remove('name-success', 'name-error');
    }
    const firstInput = document.querySelector('.soTheInput');
    if (firstInput) firstInput.dataset.valid = "false";
    
    document.getElementById('msg-tongCong').innerText = "TC: 0.00 (h)";
    
    // Xóa Form Dropdown
    window.setCustomDropdownValue('lyDoSelect', ''); 
    window.setCustomDropdownValue('loaitangca', '');

  
    document.getElementById('btnSubmit').disabled = true;
};

document.addEventListener("DOMContentLoaded", async () => {
    if(typeof window.loadEmployeesData === 'function') await window.loadEmployeesData();
    
    const btnAdd = document.getElementById('btnAddEmp');
    if(btnAdd) btnAdd.addEventListener('click', window.addEmpRow);

    const container = document.getElementById('employeeInputsContainer');
    if (container) {
        container.addEventListener('input', (e) => {
            if (!e.target.classList.contains('soTheInput')) return;
            
            const val = e.target.value.trim();
            const msgBox = e.target.nextElementSibling; 
            const emp = window.employeeData ? window.employeeData.find(v => v.soThe === val) : null;
            
            if (msgBox) msgBox.classList.remove('name-success', 'name-error');

            if (emp) {
                if (msgBox) {
                    msgBox.innerHTML = `${emp.hoTen} - ${emp.boPhan}`;
                    msgBox.classList.add('name-success');
                }
                e.target.dataset.hoten = emp.hoTen;
                e.target.dataset.bophan = emp.boPhan;
                e.target.dataset.idnv = emp.idNV;
                e.target.dataset.valid = "true";
            } else {
                if (msgBox) {
                    msgBox.innerHTML = val === "" ? "" : "Số thẻ không đúng";
                    if (val !== "") msgBox.classList.add('name-error');
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

    // Lắng nghe gõ phím trên input OTHER để check valid form
    const lyDoCustom = document.getElementById('lyDoCustom');
    if (lyDoCustom) lyDoCustom.addEventListener('input', () => window.checkFormValidity());

    window.checkFormValidity = function() {
        const inputs = document.querySelectorAll('.soTheInput');
        let allEmpValid = true;
        let hasAtLeastOne = false;
        
        inputs.forEach(inp => {
            if (inp.value.trim() !== "") hasAtLeastOne = true;
            if (inp.dataset.valid !== "true") allEmpValid = false;
        });

        const loaiTangCaVal = document.getElementById('loaitangca').value;
        const ngay = document.getElementById('ngayTangCa').value;
        const ok = ngay && hasAtLeastOne && allEmpValid && tu.value && den.value && loaiTangCaVal !== '';
        
        const lyDoSelectVal = document.getElementById('lyDoSelect').value;
        const lyDoCustomVal = document.getElementById('lyDoCustom') ? document.getElementById('lyDoCustom').value.trim() : "";
        let hasLyDo = lyDoSelectVal === 'OTHER' ? lyDoCustomVal !== '' : lyDoSelectVal !== '';
        
        document.getElementById('btnSubmit').disabled = !(ok && hasLyDo);
    };

    document.getElementById('ngayTangCa').addEventListener('change', window.checkFormValidity);

    document.getElementById('tangCaForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const b = document.getElementById('btnSubmit');
        const sp = document.getElementById('spinner');
        const bt = document.getElementById('btnText');
        b.disabled = true; bt.style.display = 'none'; sp.style.display = 'block';
        
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
        const lyDoSelectVal = document.getElementById('lyDoSelect').value;
        const lyDoCustomVal = document.getElementById('lyDoCustom') ? document.getElementById('lyDoCustom').value.trim() : "";
        const finalLyDo = lyDoSelectVal === 'OTHER' ? lyDoCustomVal : lyDoSelectVal;
        
        const payload = {
            action: isEditing ? "update" : "submit",
            maPhieu: isEditing ? document.getElementById('editMaPhieu').value : "TC-" + Date.now(),
            employees: employeesArray,
            idNV: employeesArray.length > 0 ? employeesArray[0].idNV : "",
            soThe: employeesArray.length > 0 ? employeesArray[0].soThe : "",
            hoTen: employeesArray.length > 0 ? employeesArray[0].hoTen : "",
            boPhan: employeesArray.length > 0 ? employeesArray[0].boPhan : "",
            ngayTangCa: `${dParts[2]}/${dParts[1]}/${dParts[0]}`,
            tuGio: tu.value, denGio: den.value, tongCong: currentTongCongValue,
            lyDo: finalLyDo,
            loaitangca: document.getElementById('loaitangca').value,
            deviceId: (typeof window.getDeviceId === 'function') ? window.getDeviceId() : "UNKNOWN"
        };

        try {
            const r = await fetch(SCRIPT_URL_TANG_CA, { method: 'POST', body: JSON.stringify(payload) });
            const res = await r.json();
            if (res.status === "success") {
                window.showToast(isEditing ? "Cập nhật thành công!" : "Ghi thành công!", true);
                window.cancelEdit();
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
                res.data.forEach(row => {
                    const tr = document.createElement('tr');
                    let actionIcon = row.chk ? `🔒` : `<span style="cursor:pointer;" onclick="startEdit('${encodeURIComponent(JSON.stringify(row))}')">✏️</span>`;
                    
                    let tongNamSo = parseFloat(row.tongNam) || 0;
                    let colorTongNam = (tongNamSo > 200) ? "var(--error)" : "#1A73E8"; 
                    
                    tr.innerHTML = `<td>${row.ngay}</td><td>${row.soThe}</td><td style="text-align:left;">${row.hoTen}</td><td>${row.boPhan}</td><td>${row.tuGio}-${row.denGio}</td><td><span class="status-tag">${row.tong}h</span></td><td style="color:${colorTongNam}; font-weight:bold;">${row.tongNam}h</td><td>${row.lyDo}</td><td>${row.loai}</td><td>${actionIcon}</td>`;
                    tb.appendChild(tr);
                });

                document.getElementById('dataSection').style.display = 'block'; 
                bt.innerText = "ẨN DANH SÁCH"; 
                isListVisible = true;
                isDataLoaded = true;
            }
        } catch(e) { window.showToast("Lỗi tải danh sách!", false);
        } finally { b.disabled = false; bt.style.display = 'block'; sp.style.display = 'none'; }
    }

    document.getElementById('btnViewList').addEventListener('click', () => {
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

    // ----------------------------------------------------
    // KHỞI TẠO TƯƠNG TÁC CUSTOM DROPDOWN
    // ----------------------------------------------------
    const dropdowns = document.querySelectorAll('.custom-dropdown');
    
    dropdowns.forEach(dropdown => {
        const display = dropdown.querySelector('.dropdown-display');
        const items = dropdown.querySelectorAll('.options-list li');
        const hiddenInput = dropdown.querySelector('input[type="hidden"]');
        const customInput = dropdown.querySelector('.inline-custom-input');

        display.addEventListener('click', (e) => {
            if (e.target === customInput) return; // Cho phép gõ
            e.stopPropagation();
            document.querySelectorAll('.custom-dropdown.open').forEach(openDropdown => {
                if (openDropdown !== dropdown) openDropdown.classList.remove('open');
            });
            dropdown.classList.toggle('open');
        });

        items.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const value = item.getAttribute('data-value');
                window.setCustomDropdownValue(hiddenInput.id, value);
                dropdown.classList.remove('open');
                
                if (value === 'OTHER' && customInput) customInput.focus();
                if (typeof window.checkFormValidity === 'function') window.checkFormValidity();
            });
        });
    });

    document.addEventListener('click', () => {
        document.querySelectorAll('.custom-dropdown.open').forEach(dropdown => {
            dropdown.classList.remove('open');
        });
    });
});
