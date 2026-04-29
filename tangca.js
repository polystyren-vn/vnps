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
    if (firstInput) {
        firstInput.value = data.soThe;
    }

    document.getElementById('tuGio').value = data.tuGio ? data.tuGio.toString().substring(0, 5) : "";
    document.getElementById('denGio').value = data.denGio ? data.denGio.toString().substring(0, 5) : "";
    
    const lyDoCustom = document.getElementById('lyDoCustom');
    const selectPart = document.getElementById('reason-select-part');
    const customPart = document.getElementById('reason-custom-part');
    
    const isStandardReason = window.updateDropdownUI('lyDoSelect', data.lyDo);
    
    if (isStandardReason) {
        selectPart.style.display = 'flex';
        customPart.style.display = 'none';
    } else {
        window.updateDropdownUI('lyDoSelect', 'OTHER');
        selectPart.style.display = 'none';
        customPart.style.display = 'flex';
        lyDoCustom.value = data.lyDo;
    }
    
    window.updateDropdownUI('loaitangca', data.loai);
    
    document.getElementById('btnText').innerText = "CẬP NHẬT DỮ LIỆU";
    document.getElementById('btnSubmit').style.background = "#e67e22";
    
    // NÂNG CẤP: Hiện nút HỦY
    const btnCancel = document.getElementById('btnCancelEdit');
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
    
    document.getElementById('reason-select-part').style.display = 'flex';
    document.getElementById('reason-custom-part').style.display = 'none';
    
    window.updateDropdownUI('lyDoSelect', ''); 
    window.updateDropdownUI('loaitangca', '');
    
    // Ẩn nút HỦY
    const btnCancel = document.getElementById('btnCancelEdit');
    if(btnCancel) btnCancel.style.display = 'none';

    document.getElementById('btnSubmit').disabled = true;
};

document.addEventListener("DOMContentLoaded", async () => {
    if(typeof window.loadEmployeesData === 'function') await window.loadEmployeesData();
    
    const btnAdd = document.getElementById('btnAddEmp');
    if(btnAdd) btnAdd.addEventListener('click', window.addEmpRow);

    // Gắn sự kiện cho nút Hủy Edit
    const btnCancel = document.getElementById('btnCancelEdit');
    if (btnCancel) btnCancel.addEventListener('click', window.cancelEdit);

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

    const btnBack = document.getElementById('btnBackToSelect');
    const lyDoCustom = document.getElementById('lyDoCustom');
    const selectPart = document.getElementById('reason-select-part');
    const customPart = document.getElementById('reason-custom-part');

    btnBack.addEventListener('click', () => {
        window.updateDropdownUI('lyDoSelect', ''); 
        lyDoCustom.value = '';
        selectPart.style.display = 'flex';
        customPart.style.display = 'none';
        window.checkFormValidity();
    });

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
        let hasLyDo = lyDoSelectVal === 'OTHER' ? lyDoCustom.value.trim() !== '' : lyDoSelectVal !== '';
        
        document.getElementById('btnSubmit').disabled = !(ok && hasLyDo);
    };

    document.getElementById('ngayTangCa').addEventListener('change', window.checkFormValidity);
    lyDoCustom.addEventListener('input', window.checkFormValidity);

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
            lyDo: lyDoSelectVal === 'OTHER' ? lyDoCustom.value.trim() : lyDoSelectVal,
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
});

// ==========================================================================
// HỆ THỐNG CUSTOM DROPDOWN TƯƠNG TÁC
// ==========================================================================
window.updateDropdownUI = function(inputId, val) {
    const hiddenInput = document.getElementById(inputId);
    if (!hiddenInput) return false;
    
    hiddenInput.value = val;
    
    const dropdown = hiddenInput.closest('.custom-dropdown');
    if (!dropdown) return false;
    
    const displayBox = dropdown.querySelector('.dropdown-display');
    const items = dropdown.querySelectorAll('.options-list li');
    const textDisplay = dropdown.querySelector('.dropdown-text');
    let found = false;
    
    items.forEach(item => {
        item.classList.remove('selected');
        if (val && item.getAttribute('data-value') === val) {
            item.classList.add('selected');
            textDisplay.innerText = item.innerText;
            displayBox.classList.remove('placeholder-active');
            found = true;
        }
    });
    
    if (!val || !found) {
        if (inputId === 'lyDoSelect') {
            textDisplay.innerText = "LÝ DO TĂNG CA";
            if (val === 'OTHER') textDisplay.innerText = "Khác..."; 
        }
        if (inputId === 'loaitangca') textDisplay.innerText = "LOẠI TĂNG CA";
        
        if (!val) {
            displayBox.classList.add('placeholder-active');
        } else {
            displayBox.classList.remove('placeholder-active');
        }
    }
    return found;
};

document.addEventListener("DOMContentLoaded", () => {
    const dropdowns = document.querySelectorAll('.custom-dropdown');
    
    dropdowns.forEach(dropdown => {
        const display = dropdown.querySelector('.dropdown-display');
        const items = dropdown.querySelectorAll('.options-list li');
        const hiddenInput = dropdown.querySelector('input[type="hidden"]');
        const textDisplay = dropdown.querySelector('.dropdown-text');

        display.addEventListener('click', (e) => {
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
                const text = item.innerText;
                
                hiddenInput.value = value;
                textDisplay.innerText = text;
                display.classList.remove('placeholder-active');
                
                items.forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');
                dropdown.classList.remove('open');
                
                if (hiddenInput.id === 'lyDoSelect') {
                    const selectPart = document.getElementById('reason-select-part');
                    const customPart = document.getElementById('reason-custom-part');
                    const lyDoCustom = document.getElementById('lyDoCustom');
                    
                    if (value === 'OTHER') {
                        selectPart.style.display = 'none';
                        customPart.style.display = 'flex';
                        lyDoCustom.focus();
                    }
                }
                
                if (typeof window.checkFormValidity === 'function') {
                    window.checkFormValidity();
                }
            });
        });
    });

    document.addEventListener('click', () => {
        document.querySelectorAll('.custom-dropdown.open').forEach(dropdown => {
            dropdown.classList.remove('open');
        });
    });
});
