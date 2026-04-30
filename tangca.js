// ==========================================================================
// MODULE TĂNG CA V4.5 - JAVASCRIPT (CLEAN CODE & EVENT DELEGATION REFACTOR)
// ==========================================================================

const SCRIPT_URL_TANG_CA = "https://script.google.com/macros/s/AKfycbzYXPNw_cGZmvQZR9UNAs6XYEjPi6eBvG0fkeugNYfLN8p7utTXBiIovt6zqYHVoTAbTw/exec";

// Cờ trạng thái toàn cục
let isListVisible = false;
let isEditing = false;
let isSubmitting = false;
let currentTongCongValue = "0.00";

// ==========================================================================
// PHẦN 1: INIT - KHỞI TẠO SỰ KIỆN KHI DOM TẢI XONG
// ==========================================================================
document.addEventListener("DOMContentLoaded", async () => {
    
    // 1. Tải danh bạ (Nếu có hàm toàn cục)
    if (typeof window.loadEmployeesData === 'function') {
        window.loadEmployeesData().catch(e => console.error("Lỗi tải Data:", e));
    }

    // 2. Thiết lập ngày mặc định
    const dateInput = document.getElementById('ngayTangCa');
    if (dateInput && !dateInput.value) {
        dateInput.valueAsDate = new Date();
    }

    // 3. Khởi tạo Event Delegation (Thay thế các inline event đã bị xóa)
    setupEventDelegation();

    // 4. Khởi tạo Custom Dropdowns
    setupCustomDropdowns();

    // 5. Khởi tạo Nút bấm tĩnh (Static Buttons)
    setupActionButtons();

    // 6. Tính toán giờ ban đầu
    calculateTotalTime();
});


// ==========================================================================
// PHẦN 2: EVENT DELEGATION (XỬ LÝ CÁC PHẦN TỬ ĐỘNG)
// ==========================================================================
function setupEventDelegation() {
    const container = document.getElementById('employeeInputsContainer');

    // Lắng nghe sự kiện click trên toàn bộ Document
    document.addEventListener('click', function(e) {
        
        // 2.1 CLICK VÀO BOX -> FOCUS INPUT
        const box = e.target.closest('.employee-box');
        if (box) {
            const input = box.querySelector('input');
            if (input) input.focus();
        }

        // 2.2 CLICK NÚT THÊM DÒNG (+)
        const btnAdd = e.target.closest('#btnAddEmp');
        if (btnAdd && container) {
            addEmployeeRow(container);
        }

        // 2.3 CLICK NÚT XÓA DÒNG (-)
        const btnRemove = e.target.closest('.btn-remove-emp');
        if (btnRemove) {
            btnRemove.closest('.employee-row').remove();
            checkFormValidity();
        }
    });

    // 2.4 LẮNG NGHE GÕ SỐ THẺ -> TÌM TÊN
    if (container) {
        container.addEventListener('input', function(e) {
            if (e.target.classList.contains('soTheInput')) {
                handleInputSoThe(e.target);
            }
        });
    }

    // 2.5 LẮNG NGHE THAY ĐỔI THỜI GIAN
    const tuGio = document.getElementById('tuGio');
    const denGio = document.getElementById('denGio');
    if (tuGio) tuGio.addEventListener('input', calculateTotalTime);
    if (denGio) denGio.addEventListener('input', calculateTotalTime);
    if (tuGio) tuGio.addEventListener('change', calculateTotalTime);
    if (denGio) denGio.addEventListener('change', calculateTotalTime);
}


// ==========================================================================
// PHẦN 3: LOGIC NGHIỆP VỤ (BUSINESS LOGIC)
// ==========================================================================

// Hàm đẻ thêm dòng nhập liệu
function addEmployeeRow(container) {
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

// Hàm xử lý logic khi gõ Số Thẻ
function handleInputSoThe(inputElement) {
    const val = inputElement.value.trim();
    const row = inputElement.closest('.employee-row');
    const msgBox = row.querySelector('.msg-name');
    if (!msgBox) return;

    msgBox.classList.remove('name-success', 'name-error');

    if (!val) {
        msgBox.innerHTML = "";
        inputElement.dataset.hoten = "";
        inputElement.dataset.valid = "false";
        checkFormValidity();
        return;
    }

    // Lấy tên từ RAM Cache
    let emp = null;
    if (window.employeeData && Array.isArray(window.employeeData)) {
        emp = window.employeeData.find(v => String(v.soThe) === val);
    }

    if (emp) {
        msgBox.innerHTML = emp.hoTen;
        msgBox.classList.add('name-success');
        inputElement.dataset.hoten = emp.hoTen;
        inputElement.dataset.valid = "true";
    } else {
        msgBox.innerHTML = "Không tìm thấy";
        msgBox.classList.add('name-error');
        inputElement.dataset.valid = "false";
        inputElement.dataset.hoten = "";
    }
    checkFormValidity();
}

// Hàm tính tổng giờ
function calculateTotalTime() {
    const t1 = document.getElementById('tuGio');
    const t2 = document.getElementById('denGio');
    const msg = document.getElementById('msg-tongCong');
    
    if (t1 && t2 && t1.value && t2.value) {
        const start = t1.value.split(':');
        const end = t2.value.split(':');
        let dStart = new Date(0, 0, 0, start[0], start[1], 0);
        let dEnd = new Date(0, 0, 0, end[0], end[1], 0);

        // Vượt quá nửa đêm (Ca đêm)
        if (dEnd < dStart) {
            dEnd.setDate(dEnd.getDate() + 1);
        }
        
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

// Hàm kiểm tra hợp lệ của cả Form (Mở/Khóa nút Gửi)
function checkFormValidity() {
    const tuGio = document.getElementById('tuGio')?.value;
    const denGio = document.getElementById('denGio')?.value;
    const lyDo = document.getElementById('lyDoSelect')?.value;
    const loai = document.getElementById('loaiSelect')?.value;
    const btnSubmit = document.getElementById('btnSubmit');
    if(!btnSubmit) return;

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


// ==========================================================================
// PHẦN 4: THIẾT LẬP CUSTOM DROPDOWN
// ==========================================================================
function setupCustomDropdowns() {
    const dropdowns = document.querySelectorAll('.custom-dropdown');
    
    dropdowns.forEach(dropdown => {
        const display = dropdown.querySelector('.dropdown-display');
        const hiddenInput = dropdown.querySelector('input[type="hidden"]');
        const customInput = dropdown.querySelector('.inline-custom-input');
        const items = dropdown.querySelectorAll('.options-list li');

        // Toggle mở/đóng menu
        display.addEventListener('click', (e) => {
            if (e.target === customInput) return; // Không đóng nếu click ô text
            e.stopPropagation();
            
            // Đóng các dropdown khác
            document.querySelectorAll('.custom-dropdown.open').forEach(d => { 
                if (d !== dropdown) d.classList.remove('open'); 
            });
            dropdown.classList.toggle('open');
        });

        // Bắt sự kiện chọn Item
        items.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation(); 
                const value = item.getAttribute('data-value');
                setCustomDropdownValue(hiddenInput.id, value);
                dropdown.classList.remove('open');
                if (value === 'OTHER' && customInput) customInput.focus();
            });
        });

        // Cập nhật giá trị khi gõ tay (OTHER)
        if (customInput) {
            customInput.addEventListener('input', (e) => {
                hiddenInput.value = e.target.value.trim();
                checkFormValidity();
            });
        }
    });

    // Click ra ngoài -> Đóng Dropdown
    document.addEventListener('click', () => {
        document.querySelectorAll('.custom-dropdown.open').forEach(d => d.classList.remove('open'));
    });
}

// Hàm dùng chung để set giá trị cho Dropdown
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
    checkFormValidity();
};


// ==========================================================================
// PHẦN 5: API & GỬI DỮ LIỆU
// ==========================================================================
function setupActionButtons() {
    
    // Nút Hủy
    const btnCancel = document.getElementById('btnCancel');
    if (btnCancel) {
        btnCancel.addEventListener('click', cancelEdit);
    }

    // Xem danh sách
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

    // Submit Form
    const tangCaForm = document.getElementById('tangCaForm');
    if (tangCaForm) {
        tangCaForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (isSubmitting) return; // Chống bấm đúp
            
            const btnSubmit = document.getElementById('btnSubmit');
            const bsBtnText = document.getElementById('bsBtnText');
            const bsSpinner = document.getElementById('bsSpinner');

            isSubmitting = true;
            btnSubmit.disabled = true;
            if(bsBtnText) bsBtnText.style.display = 'none';
            if(bsSpinner) bsSpinner.style.display = 'block';

            try {
                // Thu thập Dữ liệu
                const ngayTangCa = document.getElementById('ngayTangCa').value;
                const tuGio = document.getElementById('tuGio').value;
                const denGio = document.getElementById('denGio').value;
                const lyDo = document.getElementById('lyDoSelect').value;
                const loai = document.getElementById('loaiSelect').value;
                const editId = document.getElementById('editMaPhieu').value;
                
                const d = new Date(ngayTangCa);
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
                    tuGio: tuGio,
                    denGio: denGio,
                    lyDo: lyDo,
                    loai: loai,
                    employees: employeesArray,
                    deviceId: dId
                };

                const response = await fetch(SCRIPT_URL_TANG_CA, { 
                    method: 'POST', 
                    body: JSON.stringify(payload) 
                });
                
                const result = await response.json();

                if (result.status === "success") {
                    if(typeof window.showToast === 'function') window.showToast("Thành công!", true);
                    cancelEdit(); // Reset form
                    if(isListVisible) loadList(); // Refresh bảng
                } else {
                    if(typeof window.showToast === 'function') window.showToast("Lỗi từ server!", false);
                }
            } catch (err) {
                if(typeof window.showToast === 'function') window.showToast("Lỗi mạng!", false);
            } finally {
                isSubmitting = false;
                btnSubmit.disabled = false;
                if(bsBtnText) bsBtnText.style.display = 'block';
                if(bsSpinner) bsSpinner.style.display = 'none';
            }
        });
    }
}

// ==========================================================================
// PHẦN 6: DỌN DẸP & LOAD BẢNG
// ==========================================================================
function cancelEdit() {
    isEditing = false;
    document.getElementById('tangCaForm').reset();
    document.getElementById('editMaPhieu').value = "";
    
    // Ngày về hôm nay
    document.getElementById('ngayTangCa').valueAsDate = new Date();
    
    // Clear Dropdown
    setCustomDropdownValue('lyDoSelect', '');
    setCustomDropdownValue('loaiSelect', '');
    
    // Xóa dòng dư thừa
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
    calculateTotalTime();
}

async function loadList() {
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
                
                // Móc sự kiện Edit bằng cách gắn Data JSON
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

            // Lắng nghe sự kiện Edit
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

// Logic đẩy dữ liệu ngược lên Form
function startEdit(encodedData) {
    const data = JSON.parse(decodeURIComponent(encodedData));
    isEditing = true;
    
    document.getElementById('editMaPhieu').value = data.maPhieu;
    
    if(data.ngayTangCa) {
        const p = data.ngayTangCa.split('/');
        if(p.length === 3) document.getElementById('ngayTangCa').value = `${p[2]}-${p[1]}-${p[0]}`;
    }

    document.getElementById('tuGio').value = data.tuGio;
    document.getElementById('denGio').value = data.denGio;

    setCustomDropdownValue('lyDoSelect', data.lyDo);
    setCustomDropdownValue('loaiSelect', data.loai);

    const container = document.getElementById('employeeInputsContainer');
    container.querySelectorAll('.employee-row:not(:first-child)').forEach(el => el.remove());
    
    const firstRow = container.querySelector('.employee-row');
    if (firstRow) {
        const input = firstRow.querySelector('.soTheInput');
        input.value = data.soThe;
        // Bắt hệ thống chạy hàm dò tên nhân viên
        handleInputSoThe(input); 
    }

    calculateTotalTime();
    window.scrollTo({top: 0, behavior: 'smooth'});
    if(typeof window.showToast === 'function') window.showToast("Đang sửa phiếu: " + data.maPhieu, true);
}
