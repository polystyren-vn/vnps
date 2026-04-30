// ==========================================================================
// MODULE TĂNG CA V4.5 - JAVASCRIPT (ĐÃ FIX LỖI HTML SẠCH)
// ==========================================================================

const SCRIPT_URL_TANG_CA = "https://script.google.com/macros/s/AKfycbzYXPNw_cGZmvQZR9UNAs6XYEjPi6eBvG0fkeugNYfLN8p7utTXBiIovt6zqYHVoTAbTw/exec";
let isListVisible = false, isEditing = false, isDataLoaded = false, currentTongCongValue = "0.00";

// ==========================================
// 1. CÁC HÀM TIỆN ÍCH TOÀN CỤC
// ==========================================

window.setCustomDropdownValue = function(hiddenId, rawVal) {
    const hiddenInput = document.getElementById(hiddenId);
    if(!hiddenInput) return;
    const dropdown = hiddenInput.closest('.custom-dropdown');
    const textDisplay = dropdown.querySelector('.dropdown-text');
    const customInput = dropdown.querySelector('.inline-custom-input');
    const displayBox = dropdown.querySelector('.dropdown-display');
    const items = dropdown.querySelectorAll('.options-list li');

    items.forEach(li => li.classList.remove('selected'));
    const val = rawVal ? String(rawVal).trim() : '';

    if (!val) {
        hiddenInput.value = '';
        textDisplay.textContent = hiddenId === 'lyDoSelect' ? 'LÝ DO TĂNG CA' : 'LOẠI TĂNG CA';
        textDisplay.style.display = 'block';
        if(customInput) { customInput.style.display = 'none'; customInput.value = ''; }
        displayBox.classList.add('placeholder-active');
        return;
    }

    let isStandard = false, matchedText = '';
    items.forEach(li => {
        if (li.getAttribute('data-value') === val) {
            li.classList.add('selected');
            isStandard = true;
            matchedText = li.textContent;
        }
    });

    if (isStandard && val !== 'OTHER') {
        hiddenInput.value = val;
        textDisplay.textContent = matchedText;
        textDisplay.style.display = 'block';
        if(customInput) { customInput.style.display = 'none'; customInput.value = ''; }
        displayBox.classList.remove('placeholder-active');
    } else {
        hiddenInput.value = val;
        textDisplay.style.display = 'none';
        if(customInput) {
            customInput.style.display = 'block';
            customInput.value = val;
        }
        displayBox.classList.remove('placeholder-active');
        const otherLi = Array.from(items).find(li => li.getAttribute('data-value') === 'OTHER');
        if(otherLi) otherLi.classList.add('selected');
    }
    window.checkFormValidity();
};

window.calculateTotalTime = function() {
    const t1 = document.getElementById('tuGio').value;
    const t2 = document.getElementById('denGio').value;
    const msg = document.getElementById('msg-tongCong');
    
    if (t1 && t2) {
        const start = t1.split(':');
        const end = t2.split(':');
        let dStart = new Date(0, 0, 0, start[0], start[1], 0);
        let dEnd = new Date(0, 0, 0, end[0], end[1], 0);

        if (dEnd < dStart) dEnd.setDate(dEnd.getDate() + 1);

        let diff = dEnd - dStart;
        let hours = (diff / 1000 / 60 / 60).toFixed(2);
        currentTongCongValue = hours;
        
        if (msg) {
            msg.innerText = hours + " Giờ";
            msg.style.color = "var(--accent)";
            msg.style.borderColor = "var(--accent)";
        }
    } else {
        currentTongCongValue = "0.00";
        if (msg) {
            msg.innerText = "0.00 Giờ";
            msg.style.color = "";
            msg.style.borderColor = "";
        }
    }
    window.checkFormValidity();
};

window.checkFormValidity = function() {
    const tuGio = document.getElementById('tuGio')?.value;
    const denGio = document.getElementById('denGio')?.value;
    const lyDo = document.getElementById('lyDoSelect')?.value;
    const loai = document.getElementById('loaiSelect')?.value;
    const btnSubmit = document.getElementById('btnSubmit');
    if (!btnSubmit) return;

    let hasValidEmp = false;
    document.querySelectorAll('.employee-row').forEach(row => {
        const inp = row.querySelector('.soTheInput');
        if (inp && inp.dataset.valid === "true") hasValidEmp = true;
    });

    if (tuGio && denGio && lyDo && loai && hasValidEmp && currentTongCongValue !== "0.00") {
        btnSubmit.disabled = false;
    } else {
        btnSubmit.disabled = true;
    }
};

window.cancelEdit = function() {
    isEditing = false;
    const form = document.getElementById('tangCaForm');
    if(form) form.reset();
    document.getElementById('editMaPhieu').value = "";
    
    const dateInput = document.getElementById('ngayTangCa');
    if (dateInput) dateInput.valueAsDate = new Date();
    
    window.setCustomDropdownValue('lyDoSelect', '');
    window.setCustomDropdownValue('loaiSelect', '');
    
    const container = document.getElementById('employeeInputsContainer');
    if(container) {
        container.querySelectorAll('.employee-row:not(:first-child)').forEach(el => el.remove());
        const firstRow = container.querySelector('.employee-row');
        if (firstRow) {
            const inp = firstRow.querySelector('.soTheInput');
            const msg = firstRow.querySelector('.msg-name');
            if(inp) { inp.value = ""; inp.dataset.valid = "false"; inp.dataset.hoten = ""; }
            if(msg) { msg.innerHTML = ""; msg.className = "msg-name"; }
        }
    }
    window.calculateTotalTime();
};

// ==========================================
// 2. KHỞI TẠO DOM & LẮNG NGHE SỰ KIỆN CHÍNH
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
    
    // Tải danh bạ
    if (typeof window.loadEmployeesData === 'function') {
        window.loadEmployeesData().catch(e => console.error("Lỗi:", e));
    }
    
    const dateInput = document.getElementById('ngayTangCa');
    if (dateInput) dateInput.valueAsDate = new Date();

    const container = document.getElementById('employeeInputsContainer');

    // ---------------------------------------------------------
    // A. XỬ LÝ CLICK TOÀN CỤC (Thay thế Onclick trong HTML)
    // ---------------------------------------------------------
    document.addEventListener('click', (e) => {
        // 1. Click Box -> Focus Input
        const box = e.target.closest('.employee-box');
        if (box && !e.target.classList.contains('soTheInput')) {
            const inp = box.querySelector('.soTheInput');
            if (inp) inp.focus();
        }

        // 2. Click Nút [+] Thêm Dòng
        if (e.target.closest('#btnAddEmp') && container) {
            const newRow = document.createElement('div');
            newRow.className = 'employee-row';
            newRow.innerHTML = `
                <div class="employee-box">
                    <span class="material-symbols-outlined">badge</span>
                    <input type="number" inputmode="numeric" pattern="[0-9]*" class="soTheInput" placeholder="Số Thẻ" required autocomplete="off">
                    <div class="msg-name"></div>
                </div>
                <button type="button" class="btn-remove-emp">
                    <span class="material-symbols-outlined">remove</span>
                </button>
            `;
            container.appendChild(newRow);
            window.checkFormValidity();
        }

        // 3. Click Nút [-] Xóa Dòng
        const removeBtn = e.target.closest('.btn-remove-emp');
        if (removeBtn) {
            removeBtn.closest('.employee-row').remove();
            window.checkFormValidity();
        }

        // 4. Click Nút HỦY
        if (e.target.closest('#btnCancel')) {
            window.cancelEdit();
        }
        
        // 5. Click Nút XEM DANH SÁCH
        if (e.target.closest('#btnViewList')) {
            const btnViewList = document.getElementById('btnViewList');
            if (isListVisible) {
                document.getElementById('dataSection').classList.add('hidden-table');
                btnViewList.innerText = "XEM DANH SÁCH THÁNG HIỆN TẠI";
                isListVisible = false;
            } else {
                window.loadList();
            }
        }
    });

    // ---------------------------------------------------------
    // B. XỬ LÝ GÕ SỐ THẺ (Input Event)
    // ---------------------------------------------------------
    if (container) {
        container.addEventListener('input', (e) => {
            if (e.target.classList.contains('soTheInput')) {
                const val = e.target.value.trim();
                const row = e.target.closest('.employee-row');
                const msgBox = row ? row.querySelector('.msg-name') : null;
                if (!msgBox) return;

                msgBox.classList.remove('name-success', 'name-error');

                if (!val) {
                    msgBox.innerHTML = "";
                    e.target.dataset.hoten = "";
                    e.target.dataset.valid = "false";
                } else {
                    let emp = null;
                    if (window.employeeData && Array.isArray(window.employeeData)) {
                        emp = window.employeeData.find(v => String(v.soThe) === val);
                    }
                    if (emp) {
                        msgBox.innerHTML = emp.hoTen;
                        msgBox.classList.add('name-success');
                        e.target.dataset.hoten = emp.hoTen;
                        e.target.dataset.valid = "true";
                    } else {
                        msgBox.innerHTML = "Không tìm thấy";
                        msgBox.classList.add('name-error');
                        e.target.dataset.valid = "false";
                        e.target.dataset.hoten = "";
                    }
                }
                window.checkFormValidity();
            }
        });
    }

    // ---------------------------------------------------------
    // C. XỬ LÝ THỜI GIAN (Time Event)
    // ---------------------------------------------------------
    const tuGio = document.getElementById('tuGio');
    const denGio = document.getElementById('denGio');
    if (tuGio) {
        tuGio.addEventListener('input', window.calculateTotalTime);
        tuGio.addEventListener('change', window.calculateTotalTime);
    }
    if (denGio) {
        denGio.addEventListener('input', window.calculateTotalTime);
        denGio.addEventListener('change', window.calculateTotalTime);
    }

    // ---------------------------------------------------------
    // D. XỬ LÝ SUBMIT FORM
    // ---------------------------------------------------------
    const form = document.getElementById('tangCaForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const b = document.getElementById('btnSubmit'), bt = document.getElementById('bsBtnText'), sp = document.getElementById('bsSpinner');
            if (b.disabled) return;
            b.disabled = true; if(bt) bt.style.display = 'none'; if(sp) sp.style.display = 'block';

            try {
                const editId = document.getElementById('editMaPhieu').value;
                const d = new Date(document.getElementById('ngayTangCa').value);
                const dateVN = ("0" + d.getDate()).slice(-2) + "/" + ("0" + (d.getMonth() + 1)).slice(-2) + "/" + d.getFullYear();
                
                const employeesArray = [];
                document.querySelectorAll('.employee-row').forEach(row => {
                    const stInput = row.querySelector('.soTheInput');
                    if (stInput && stInput.dataset.valid === "true") {
                        employeesArray.push({
                            soThe: stInput.value.trim(),
                            hoTen: stInput.dataset.hoten
                        });
                    }
                });

                let dId = "WEB";
                if (typeof window.getDeviceId === 'function') { try { dId = window.getDeviceId(); } catch(err) {} }

                const payload = {
                    action: editId ? "update" : "submit",
                    maPhieu: editId || null,
                    ngayTangCa: dateVN,
                    tuGio: document.getElementById('tuGio').value,
                    denGio: document.getElementById('denGio').value,
                    lyDo: document.getElementById('lyDoSelect').value,
                    loai: document.getElementById('loaiSelect').value,
                    employees: employeesArray,
                    deviceId: dId
                };

                const response = await fetch(SCRIPT_URL_TANG_CA, { method: 'POST', body: JSON.stringify(payload) });
                const result = await response.json();

                if (result.status === "success") {
                    if(typeof window.showToast === 'function') window.showToast("Thành công!", true);
                    window.cancelEdit();
                    if(isListVisible) window.loadList();
                } else {
                    if(typeof window.showToast === 'function') window.showToast("Lỗi!", false);
                    b.disabled = false;
                }
            } catch (err) {
                b.disabled = false;
            } finally {
                if(bt) bt.style.display = 'block'; if(sp) sp.style.display = 'none';
            }
        });
    }

    // ---------------------------------------------------------
    // E. XỬ LÝ CUSTOM DROPDOWN
    // ---------------------------------------------------------
    const dropdowns = document.querySelectorAll('.custom-dropdown');
    dropdowns.forEach(dropdown => {
        const display = dropdown.querySelector('.dropdown-display');
        const hiddenInput = dropdown.querySelector('input[type="hidden"]');
        const customInput = dropdown.querySelector('.inline-custom-input');
        
        display.addEventListener('click', (e) => {
            if (e.target === customInput) return; 
            e.stopPropagation();
            document.querySelectorAll('.custom-dropdown.open').forEach(d => { 
                if (d !== dropdown) d.classList.remove('open'); 
            });
            dropdown.classList.toggle('open');
        });
        
        dropdown.querySelectorAll('.options-list li').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation(); 
                const value = item.getAttribute('data-value');
                window.setCustomDropdownValue(hiddenInput.id, value);
                dropdown.classList.remove('open');
                if (value === 'OTHER' && customInput) customInput.focus();
            });
        });
        
        if (customInput) {
            customInput.addEventListener('input', (e) => {
                hiddenInput.value = e.target.value.trim();
                window.checkFormValidity();
            });
        }
    });

    document.addEventListener('click', () => {
        document.querySelectorAll('.custom-dropdown.open').forEach(d => d.classList.remove('open'));
    });

    // Khởi chạy check ban đầu
    window.checkFormValidity();
});

// ==========================================
// 3. LOGIC TẢI BẢNG VÀ CHỈNH SỬA
// ==========================================
window.loadList = async function() {
    const btn = document.getElementById('btnViewList');
    const tb = document.getElementById('tableBody');
    if(!tb || !btn) return;
    
    btn.innerText = "ĐANG TẢI...";
    try {
        const r = await fetch(SCRIPT_URL_TANG_CA, { 
            method: 'POST', 
            body: JSON.stringify({ action: "getData" }) 
        });
        const res = await r.json();
        
        if (res.status === "success" && res.data) {
            tb.innerHTML = '';
            res.data.forEach(row => {
                const tr = document.createElement('tr');
                
                let editBtn = row.chk 
                    ? `<span style="font-size:16px;color:gray">🔒</span>` 
                    : `<span style="font-size:16px; cursor:pointer;" class="btn-edit-row" data-json='${encodeURIComponent(JSON.stringify(row))}'>✏️</span>`;
                
                let tongNamStyle = row.tongNam && parseFloat(row.tongNam) >= 200 ? 'color: var(--error); font-weight: bold;' : '';

                tr.innerHTML = `
                    <td>${row.ngayTangCa}</td>
                    <td>${row.soThe}</td>
                    <td><b>${row.hoTen}</b></td>
                    <td>${row.boPhan}</td>
                    <td>${row.tuGio} - ${row.denGio}</td>
                    <td style="color: var(--accent); font-weight: bold;">${row.soGio}</td>
                    <td style="${tongNamStyle}">${row.tongNam || 0}</td>
                    <td>${row.lyDo}</td>
                    <td>${row.loai}</td>
                    <td>${editBtn}</td>
                `;
                tb.appendChild(tr);
            });

            // Gắn sự kiện Edit bằng Delegation
            tb.querySelectorAll('.btn-edit-row').forEach(btn => {
                btn.addEventListener('click', function() {
                    const encodedData = this.getAttribute('data-json');
                    window.startEdit(encodedData);
                });
            });

            document.getElementById('dataSection').classList.remove('hidden-table');
            btn.innerText = "ẨN DANH SÁCH";
            isListVisible = true;
        }
    } catch(e) {
        if(typeof window.showToast === 'function') window.showToast("Lỗi tải danh sách", false);
    } finally {
        if (!isListVisible) btn.innerText = "XEM DANH SÁCH THÁNG HIỆN TẠI";
    }
};

window.startEdit = function(encodedData) {
    const data = JSON.parse(decodeURIComponent(encodedData));
    isEditing = true;
    
    document.getElementById('editMaPhieu').value = data.maPhieu;
    
    if(data.ngayTangCa) {
        const p = data.ngayTangCa.split('/');
        if(p.length === 3) document.getElementById('ngayTangCa').value = `${p[2]}-${p[1]}-${p[0]}`;
    }

    document.getElementById('tuGio').value = data.tuGio;
    document.getElementById('denGio').value = data.denGio;

    window.setCustomDropdownValue('lyDoSelect', data.lyDo);
    window.setCustomDropdownValue('loaiSelect', data.loai);

    const container = document.getElementById('employeeInputsContainer');
    if(container) {
        container.querySelectorAll('.employee-row:not(:first-child)').forEach(el => el.remove());
        const firstRow = container.querySelector('.employee-row');
        if (firstRow) {
            const input = firstRow.querySelector('.soTheInput');
            if(input) {
                input.value = data.soThe;
                input.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }
    }

    window.calculateTotalTime();
    window.scrollTo({top: 0, behavior: 'smooth'});
    if(typeof window.showToast === 'function') window.showToast("Đang sửa phiếu: " + data.maPhieu, true);
};
