// ==========================================================================
// MODULE TĂNG CA V4.5 - JAVASCRIPT (REWRITTEN & CLEAN CODE)
// ==========================================================================

const SCRIPT_URL_TANG_CA = "https://script.google.com/macros/s/AKfycbzYXPNw_cGZmvQZR9UNAs6XYEjPi6eBvG0fkeugNYfLN8p7utTXBiIovt6zqYHVoTAbTw/exec";

// Cờ trạng thái toàn cục
let isListVisible = false;
let isEditing = false;
let isSubmitting = false;
let currentTongCongValue = "0.00";

// ==========================================================================
// PHẦN 1: KHỞI TẠO & LẮNG NGHE SỰ KIỆN TOÀN CỤC (EVENT DELEGATION)
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    
    // 1.1 Tải danh bạ (Nếu có từ core.js)
    if (typeof window.loadEmployeesData === 'function') {
        window.loadEmployeesData().catch(e => console.error("Lỗi tải Data:", e));
    }

    // 1.2 Gán ngày hôm nay làm mặc định
    const dateInput = document.getElementById('ngayTangCa');
    if (dateInput && !dateInput.value) {
        dateInput.valueAsDate = new Date();
    }

    // 1.3 Thiết lập các bộ lắng nghe sự kiện
    setupDelegatedEvents();
    setupDropdowns();
    setupFormSubmission();
    setupOtherActions();

    // 1.4 Chạy kiểm tra validate ban đầu
    calculateTotalTime();
});

// ==========================================================================
// PHẦN 2: XỬ LÝ SỰ KIỆN DOM ĐỘNG (THÊM, XÓA DÒNG, GÕ SỐ THẺ)
// ==========================================================================
function setupDelegatedEvents() {
    const container = document.getElementById('employeeInputsContainer');
    
    // 2.1 Xử lý Click (Ủy quyền trên toàn Document)
    document.addEventListener('click', (e) => {
        // A. Click vào employee-box -> Focus input
        const box = e.target.closest('.employee-box');
        if (box && !e.target.classList.contains('soTheInput')) {
            const input = box.querySelector('.soTheInput');
            if (input) input.focus();
        }

        // B. Click nút Thêm dòng (+)
        if (e.target.closest('#btnAddEmp')) {
            if (container) {
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
                checkFormValidity();
            }
        }

        // C. Click nút Xóa dòng (-)
        const removeBtn = e.target.closest('.btn-remove-emp');
        if (removeBtn) {
            removeBtn.closest('.employee-row').remove();
            checkFormValidity();
        }
    });

    // 2.2 Xử lý Gõ số thẻ (Tra cứu Tên)
    if (container) {
        container.addEventListener('input', (e) => {
            if (e.target.classList.contains('soTheInput')) {
                const input = e.target;
                const val = input.value.trim();
                const row = input.closest('.employee-row');
                const msgBox = row ? row.querySelector('.msg-name') : null;
                
                if (!msgBox) return;
                msgBox.classList.remove('name-success', 'name-error');

                if (!val) {
                    msgBox.innerHTML = "";
                    input.dataset.hoten = "";
                    input.dataset.valid = "false";
                } else {
                    let emp = null;
                    if (window.employeeData && Array.isArray(window.employeeData)) {
                        emp = window.employeeData.find(v => String(v.soThe) === val);
                    }
                    if (emp) {
                        msgBox.innerHTML = emp.hoTen;
                        msgBox.classList.add('name-success');
                        input.dataset.hoten = emp.hoTen;
                        input.dataset.valid = "true";
                    } else {
                        msgBox.innerHTML = "Không tìm thấy";
                        msgBox.classList.add('name-error');
                        input.dataset.valid = "false";
                        input.dataset.hoten = "";
                    }
                }
                checkFormValidity();
            }
        });
    }

    // 2.3 Xử lý thay đổi Giờ
    const tuGio = document.getElementById('tuGio');
    const denGio = document.getElementById('denGio');
    if (tuGio) {
        tuGio.addEventListener('input', calculateTotalTime);
        tuGio.addEventListener('change', calculateTotalTime);
    }
    if (denGio) {
        denGio.addEventListener('input', calculateTotalTime);
        denGio.addEventListener('change', calculateTotalTime);
    }
}

// ==========================================================================
// PHẦN 3: XỬ LÝ DROPDOWN TÙY CHỈNH
// ==========================================================================
function setupDropdowns() {
    const dropdowns = document.querySelectorAll('.custom-dropdown');
    
    dropdowns.forEach(dropdown => {
        const display = dropdown.querySelector('.dropdown-display');
        const hiddenInput = dropdown.querySelector('input[type="hidden"]');
        const customInput = dropdown.querySelector('.inline-custom-input');
        const items = dropdown.querySelectorAll('.options-list li');

        // Bật/Tắt Dropdown
        display.addEventListener('click', (e) => {
            if (e.target === customInput) return; // Đang gõ chữ thì không tắt
            e.stopPropagation();
            
            // Tắt các menu khác
            document.querySelectorAll('.custom-dropdown.open').forEach(d => { 
                if (d !== dropdown) d.classList.remove('open'); 
            });
            dropdown.classList.toggle('open');
        });

        // Chọn Item
        items.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation(); 
                const value = item.getAttribute('data-value');
                setCustomDropdownValue(hiddenInput.id, value);
                dropdown.classList.remove('open');
                if (value === 'OTHER' && customInput) customInput.focus();
            });
        });

        // Nhập tay (OTHER)
        if (customInput) {
            customInput.addEventListener('input', (e) => {
                hiddenInput.value = e.target.value.trim();
                checkFormValidity();
            });
        }
    });

    // Click ngoài -> đóng menu
    document.addEventListener('click', () => {
        document.querySelectorAll('.custom-dropdown.open').forEach(d => d.classList.remove('open'));
    });
}

function setCustomDropdownValue(hiddenId, rawVal) {
    const hiddenInput = document.getElementById(hiddenId);
    if (!hiddenInput) return;
    
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
        if (customInput) { customInput.style.display = 'none'; customInput.value = ''; }
        displayBox.classList.add('placeholder-active');
        return;
    }

    let isStandard = false;
    let matchedText = '';
    
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
        if (customInput) { customInput.style.display = 'none'; customInput.value = ''; }
        displayBox.classList.remove('placeholder-active');
    } else {
        hiddenInput.value = val;
        textDisplay.style.display = 'none';
        if (customInput) {
            customInput.style.display = 'block';
            customInput.value = val;
        }
        displayBox.classList.remove('placeholder-active');
        const otherLi = Array.from(items).find(li => li.getAttribute('data-value') === 'OTHER');
        if (otherLi) otherLi.classList.add('selected');
    }
    checkFormValidity();
}

// ==========================================================================
// PHẦN 4: LOGIC TÍNH TOÁN & VALIDATION
// ==========================================================================
function calculateTotalTime() {
    const t1 = document.getElementById('tuGio');
    const t2 = document.getElementById('denGio');
    const msg = document.getElementById('msg-tongCong');
    
    if (t1 && t2 && t1.value && t2.value) {
        const start = t1.value.split(':');
        const end = t2.value.split(':');
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
    checkFormValidity();
}

function checkFormValidity() {
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
}

function resetForm() {
    isEditing = false;
    const form = document.getElementById('tangCaForm');
    if (form) form.reset();
    
    const editId = document.getElementById('editMaPhieu');
    if (editId) editId.value = "";
    
    const dateInput = document.getElementById('ngayTangCa');
    if (dateInput) dateInput.valueAsDate = new Date();
    
    setCustomDropdownValue('lyDoSelect', '');
    setCustomDropdownValue('loaiSelect', '');
    
    const container = document.getElementById('employeeInputsContainer');
    if (container) {
        container.querySelectorAll('.employee-row:not(:first-child)').forEach(el => el.remove());
        const firstRow = container.querySelector('.employee-row');
        if (firstRow) {
            const inp = firstRow.querySelector('.soTheInput');
            const msg = firstRow.querySelector('.msg-name');
            if (inp) { inp.value = ""; inp.dataset.valid = "false"; inp.dataset.hoten = ""; }
            if (msg) { msg.innerHTML = ""; msg.className = "msg-name"; }
        }
    }
    calculateTotalTime();
}

// ==========================================================================
// PHẦN 5: API SUBMIT & TẢI DANH SÁCH BẢNG
// ==========================================================================
function setupOtherActions() {
    const btnCancel = document.getElementById('btnCancel');
    if (btnCancel) {
        btnCancel.addEventListener('click', resetForm);
    }

    const btnViewList = document.getElementById('btnViewList');
    if (btnViewList) {
        btnViewList.addEventListener('click', () => {
            if (isListVisible) {
                document.getElementById('dataSection').classList.add('hidden-table');
                btnViewList.innerText = "XEM DANH SÁCH THÁNG HIỆN TẠI";
                isListVisible = false;
            } else {
                loadList();
            }
        });
    }
}

function setupFormSubmission() {
    const form = document.getElementById('tangCaForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (isSubmitting) return; 
        
        const btnSubmit = document.getElementById('btnSubmit');
        const bsBtnText = document.getElementById('bsBtnText');
        const bsSpinner = document.getElementById('bsSpinner');

        if (btnSubmit.disabled) return;

        isSubmitting = true;
        btnSubmit.disabled = true;
        if (bsBtnText) bsBtnText.style.display = 'none';
        if (bsSpinner) bsSpinner.style.display = 'block';

        try {
            const editId = document.getElementById('editMaPhieu')?.value;
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
                if (typeof window.showToast === 'function') window.showToast("Thành công!", true);
                resetForm();
                if (isListVisible) loadList();
            } else {
                if (typeof window.showToast === 'function') window.showToast("Lỗi: " + result.message, false);
                btnSubmit.disabled = false;
            }
        } catch (err) {
            if (typeof window.showToast === 'function') window.showToast("Lỗi mạng!", false);
            btnSubmit.disabled = false;
        } finally {
            isSubmitting = false;
            if (bsBtnText) bsBtnText.style.display = 'block';
            if (bsSpinner) bsSpinner.style.display = 'none';
        }
    });
}

async function loadList() {
    const btn = document.getElementById('btnViewList');
    const tb = document.getElementById('tableBody');
    if (!tb || !btn) return;
    
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

            tb.querySelectorAll('.btn-edit-row').forEach(btn => {
                btn.addEventListener('click', function() {
                    const encodedData = this.getAttribute('data-json');
                    startEdit(encodedData);
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
}

function startEdit(encodedData) {
    const data = JSON.parse(decodeURIComponent(encodedData));
    isEditing = true;
    
    document.getElementById('editMaPhieu').value = data.maPhieu;
    
    if (data.ngayTangCa) {
        const p = data.ngayTangCa.split('/');
        if(p.length === 3) document.getElementById('ngayTangCa').value = `${p[2]}-${p[1]}-${p[0]}`;
    }

    document.getElementById('tuGio').value = data.tuGio;
    document.getElementById('denGio').value = data.denGio;

    setCustomDropdownValue('lyDoSelect', data.lyDo);
    setCustomDropdownValue('loaiSelect', data.loai);

    const container = document.getElementById('employeeInputsContainer');
    if (container) {
        container.querySelectorAll('.employee-row:not(:first-child)').forEach(el => el.remove());
        const firstRow = container.querySelector('.employee-row');
        if (firstRow) {
            const input = firstRow.querySelector('.soTheInput');
            if (input) {
                input.value = data.soThe;
                input.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }
    }

    calculateTotalTime();
    window.scrollTo({top: 0, behavior: 'smooth'});
    if (typeof window.showToast === 'function') window.showToast("Đang sửa phiếu: " + data.maPhieu, true);
}
