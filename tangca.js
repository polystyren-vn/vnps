// ==========================================================================
// MODULE TĂNG CA V4.5 - JAVASCRIPT (CẬP NHẬT 30.04.2026)
// ==========================================================================

const SCRIPT_URL_TANG_CA = "https://script.google.com/macros/s/AKfycbzYXPNw_cGZmvQZR9UNAs6XYEjPi6eBvG0fkeugNYfLN8p7utTXBiIovt6zqYHVoTAbTw/exec";

// Khai báo cờ toàn cục chống click đúp
let isSubmitting = false;
let isListVisible = false;

// ==========================================================================
// 1. CHUẨN BỊ KHI DOM TẢI XONG
// ==========================================================================
document.addEventListener("DOMContentLoaded", async () => {
    // 1.1 Tải danh bạ RAM Cache (Nếu có hàm toàn cục trong core.js)
    if (typeof window.loadEmployeesData === 'function') {
        window.loadEmployeesData().catch(e => console.error("Lỗi tải Data:", e));
    }

    // 1.2 Gắn mặc định ngày hôm nay cho ô Input Date
    const dateInput = document.getElementById('ngayTangCa');
    if (dateInput && !dateInput.value) {
        dateInput.valueAsDate = new Date();
    }

    // 1.3 KHỞI TẠO CÁC SỰ KIỆN LẮNG NGHE CHO NÚT & FORM
    initEventDelegation();
    initDropdowns();
    initActionButtons();
    calculateTime(); // Tính nháp giờ ban đầu
});

// ==========================================================================
// 2. EVENT DELEGATION (BẮT SỰ KIỆN DOM ĐỘNG - KHÔNG DÙNG ONCLICK)
// ==========================================================================
function initEventDelegation() {
    const container = document.getElementById('employeeInputsContainer');
    const btnAdd = document.getElementById('btnAddEmp');

    // 2.1 Nút Thêm Dòng (Dấu +)
    if (btnAdd && container) {
        btnAdd.addEventListener('click', () => {
            const row = document.createElement('div');
            row.className = 'employee-row';
            row.innerHTML = `
                <div class="employee-box">
                    <span class="material-symbols-outlined">badge</span>
                    <input type="number" inputmode="numeric" pattern="[0-9]*" class="soTheInput" placeholder="Số Thẻ" required autocomplete="off">
                    <div class="msg-name"></div>
                </div>
                <button type="button" class="btn-remove-emp">
                    <span class="material-symbols-outlined">remove</span>
                </button>
            `;
            container.appendChild(row);
        });
    }

    // 2.2 Click vào Box -> Focus vào Input & Bấm Xóa Dòng
    document.addEventListener('click', (e) => {
        // Xử lý Focus Box
        const box = e.target.closest('.employee-box');
        if (box) {
            const input = box.querySelector('input');
            if (input) input.focus();
        }

        // Xử lý nút Xóa Dòng (Dấu -)
        const removeBtn = e.target.closest('.btn-remove-emp');
        if (removeBtn) {
            removeBtn.closest('.employee-row').remove();
        }
    });

    // 2.3 Lắng nghe sự kiện gõ Số Thẻ -> Tìm tên qua RAM Cache
    if (container) {
        container.addEventListener('input', (e) => {
            if (e.target.classList.contains('soTheInput')) {
                const val = e.target.value.trim();
                const parentBox = e.target.closest('.employee-box');
                const msgBox = parentBox ? parentBox.querySelector('.msg-name') : null;
                if (!msgBox) return;

                msgBox.classList.remove('name-success', 'name-error');

                if (!val) {
                    msgBox.innerHTML = "";
                    e.target.dataset.hoten = "";
                    e.target.dataset.valid = "false";
                    return;
                }

                let emp = null;
                if (window.employeeData && Array.isArray(window.employeeData)) {
                    emp = window.employeeData.find(v => String(v.soThe) === val);
                }

                if (emp) {
                    msgBox.innerHTML = emp.hoTen;
                    msgBox.classList.add('name-success');
                    e.target.dataset.hoten = emp.hoTen; // Gắn data ngầm
                    e.target.dataset.valid = "true";
                } else {
                    msgBox.innerHTML = "Không tìm thấy";
                    msgBox.classList.add('name-error');
                    e.target.dataset.valid = "false";
                    e.target.dataset.hoten = "";
                }
            }
        });
    }

    // 2.4 Tính toán thời gian thực khi chỉnh Từ giờ / Đến giờ
    const tuGio = document.getElementById('tuGio');
    const denGio = document.getElementById('denGio');
    if (tuGio) tuGio.addEventListener('input', calculateTime);
    if (denGio) denGio.addEventListener('input', calculateTime);
}

// ==========================================================================
// 3. LOGIC CUSTOM DROPDOWN (UI THÔNG MINH 3 LỚP)
// ==========================================================================
function initDropdowns() {
    const dropdowns = document.querySelectorAll('.custom-dropdown');
    
    dropdowns.forEach(dropdown => {
        const display = dropdown.querySelector('.dropdown-display');
        const hiddenInput = dropdown.querySelector('input[type="hidden"]');
        const customInput = dropdown.querySelector('.inline-custom-input');
        const items = dropdown.querySelectorAll('.options-list li');
        const textDisplay = dropdown.querySelector('.dropdown-text');

        // Bấm để mở Dropdown
        display.addEventListener('click', (e) => {
            if (e.target === customInput) return; // Không tắt nếu đang gõ ô Khác
            e.stopPropagation();

            // Đóng các dropdown khác nếu đang mở
            document.querySelectorAll('.custom-dropdown.open').forEach(d => { 
                if (d !== dropdown) d.classList.remove('open'); 
            });
            dropdown.classList.toggle('open');
        });

        // Bấm để chọn Item
        items.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation(); 
                const value = item.getAttribute('data-value');
                
                if (value === 'OTHER') {
                    textDisplay.style.display = 'none';
                    if (customInput) {
                        customInput.style.display = 'block';
                        customInput.focus();
                    }
                    hiddenInput.value = ''; // Chờ gõ tay
                } else {
                    textDisplay.style.display = 'block';
                    textDisplay.textContent = value;
                    if (customInput) customInput.style.display = 'none';
                    hiddenInput.value = value;
                    display.classList.remove('placeholder-active');
                }
                dropdown.classList.remove('open');
            });
        });

        // Nếu người dùng gõ tay vào ô "Khác..."
        if (customInput) {
            customInput.addEventListener('input', (e) => {
                hiddenInput.value = e.target.value.trim();
                if (e.target.value.trim() !== '') {
                    display.classList.remove('placeholder-active');
                } else {
                    display.classList.add('placeholder-active');
                }
            });
        }
    });

    // Click ra ngoài để đóng mọi dropdown
    document.addEventListener('click', () => {
        document.querySelectorAll('.custom-dropdown.open').forEach(d => {
            d.classList.remove('open');
        });
    });
}

// ==========================================================================
// 4. NÚT HÀNH ĐỘNG (GỬI, HỦY, XEM LỊCH SỬ) & API FETCH
// ==========================================================================
function initActionButtons() {
    const btnCancel = document.getElementById('btnCancel');
    if (btnCancel) {
        btnCancel.addEventListener('click', resetForm);
    }

    const form = document.getElementById('tangCaForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault(); // Chặn hành vi F5 của form
            
            if (isSubmitting) return; // Chống bấm đúp (Bê tông)
            
            // Xử lý thu thập dữ liệu
            const ngayTangCa = document.getElementById('ngayTangCa').value;
            const tuGio = document.getElementById('tuGio').value;
            const denGio = document.getElementById('denGio').value;
            const lyDo = document.getElementById('lyDoSelect').value;
            const loai = document.getElementById('loaiSelect').value;
            const editId = document.getElementById('editMaPhieu').value;

            if (!lyDo || !loai) {
                if(typeof window.showToast === 'function') window.showToast("Vui lòng chọn Lý do và Loại Tăng ca", false);
                else alert("Vui lòng chọn Lý do và Loại Tăng ca");
                return;
            }

            const records = [];
            document.querySelectorAll('.employee-row').forEach(row => {
                const stInput = row.querySelector('.soTheInput');
                if (stInput && stInput.dataset.valid === "true") {
                    records.push({
                        soThe: stInput.value.trim(),
                        hoTen: stInput.dataset.hoten
                    });
                }
            });

            if (records.length === 0) {
                if(typeof window.showToast === 'function') window.showToast("Vui lòng nhập ít nhất 1 số thẻ hợp lệ", false);
                else alert("Vui lòng nhập ít nhất 1 số thẻ hợp lệ");
                return;
            }

            // Khóa Form, Hiển thị Timer
            isSubmitting = true;
            const btnSubmit = document.getElementById('btnSubmit');
            const bsBtnText = document.getElementById('bsBtnText');
            const bsSpinner = document.getElementById('bsSpinner');

            btnSubmit.disabled = true;
            if(bsBtnText) bsBtnText.style.display = 'none';
            if(bsSpinner) bsSpinner.style.display = 'block';

            // Định dạng ngày Việt Nam gửi Backend
            const d = new Date(ngayTangCa);
            const dateVN = ("0" + d.getDate()).slice(-2) + "/" + ("0" + (d.getMonth() + 1)).slice(-2) + "/" + d.getFullYear();

            const payload = {
                action: editId ? "update" : "submit",
                maPhieu: editId || null,
                records: records,
                ngayTangCa: dateVN,
                tuGio: tuGio,
                denGio: denGio,
                lyDo: lyDo,
                loai: loai
            };

            try {
                const response = await fetch(SCRIPT_URL_TANG_CA, {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                
                const result = await response.json();
                if (result.status === 'success') {
                    if(typeof window.showToast === 'function') window.showToast("Cập nhật thành công!", true);
                    resetForm();
                    if(isListVisible) loadList(); // Tải lại bảng nếu đang xem
                } else {
                    if(typeof window.showToast === 'function') window.showToast("Lỗi: " + result.message, false);
                }
            } catch (error) {
                if(typeof window.showToast === 'function') window.showToast("Lỗi kết nối", false);
            } finally {
                // Nhả khóa form
                isSubmitting = false;
                btnSubmit.disabled = false;
                if(bsBtnText) bsBtnText.style.display = 'block';
                if(bsSpinner) bsSpinner.style.display = 'none';
            }
        });
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

// ==========================================================================
// 5. CÁC HÀM TIỆN ÍCH HỖ TRỢ NGHIỆP VỤ
// ==========================================================================

// Hàm Reset Form & DOM sạch sẽ
function resetForm() {
    document.getElementById('tangCaForm').reset();
    document.getElementById('editMaPhieu').value = "";
    
    // Trả ngày về hôm nay
    const dateInput = document.getElementById('ngayTangCa');
    if (dateInput) dateInput.valueAsDate = new Date();

    // Reset Custom Dropdown
    document.querySelectorAll('.custom-dropdown').forEach(dropdown => {
        const textDisplay = dropdown.querySelector('.dropdown-text');
        const customInput = dropdown.querySelector('.inline-custom-input');
        const displayBox = dropdown.querySelector('.dropdown-display');
        const hiddenInput = dropdown.querySelector('input[type="hidden"]');
        
        if(hiddenInput) hiddenInput.value = '';
        if(textDisplay && hiddenInput) {
             textDisplay.textContent = hiddenInput.id === 'lyDoSelect' ? 'LÝ DO TĂNG CA' : 'LOẠI TĂNG CA';
             textDisplay.style.display = 'block';
        }
        if(customInput) { customInput.style.display = 'none'; customInput.value = ''; }
        if(displayBox) displayBox.classList.add('placeholder-active');
    });

    // Reset Label Tổng Giờ
    const msgTongCong = document.getElementById('msg-tongCong');
    if (msgTongCong) { msgTongCong.innerText = "0.00 Giờ"; msgTongCong.style.color = ""; }

    // Dọn dẹp Box Nhân viên, chừa lại 1 dòng trống
    const container = document.getElementById('employeeInputsContainer');
    if(container) {
        container.querySelectorAll('.employee-row:not(:first-child)').forEach(el => el.remove());
        const firstRow = container.querySelector('.employee-row');
        if(firstRow) {
            const st = firstRow.querySelector('.soTheInput');
            const msg = firstRow.querySelector('.msg-name');
            if(st) { st.value = ""; st.dataset.valid = "false"; st.dataset.hoten = ""; }
            if(msg) { msg.innerHTML = ""; msg.className = "msg-name"; }
        }
    }
}

// Hàm tính logic giờ tăng ca
function calculateTime() {
    const t1 = document.getElementById('tuGio');
    const t2 = document.getElementById('denGio');
    const msg = document.getElementById('msg-tongCong');
    if (!t1 || !t2 || !msg) return;

    if (t1.value && t2.value) {
        const start = t1.value.split(':');
        const end = t2.value.split(':');
        let dStart = new Date(0,0,0, start[0], start[1], 0);
        let dEnd = new Date(0,0,0, end[0], end[1], 0);

        // Vượt quá nửa đêm
        if (dEnd < dStart) dEnd.setDate(dEnd.getDate() + 1);

        let diff = dEnd - dStart;
        let hours = (diff / 1000 / 60 / 60).toFixed(2);
        msg.innerText = hours + " Giờ";
        msg.style.color = "var(--accent)";
    } else {
        msg.innerText = "0.00 Giờ";
        msg.style.color = "";
    }
}

// Hàm load bảng dữ liệu
async function loadList() {
    const btn = document.getElementById('btnViewList');
    btn.innerText = "ĐANG TẢI...";
    try {
        const response = await fetch(SCRIPT_URL_TANG_CA, {
            method: 'POST',
            body: JSON.stringify({ action: "getData" })
        });
        const res = await response.json();
        
        if (res.status === "success" && res.data) {
            const tb = document.getElementById('tableBody');
            tb.innerHTML = '';
            res.data.forEach(row => {
                const tr = document.createElement('tr');
                
                // Nút sửa đổ dữ liệu bằng JSON encode
                let editBtn = row.chk 
                    ? `<span style="font-size:16px;color:gray">🔒</span>` 
                    : `<span style="font-size:16px; cursor:pointer;" onclick="window.startEdit('${encodeURIComponent(JSON.stringify(row))}')">✏️</span>`;
                
                tr.innerHTML = `
                    <td>${row.ngayTangCa}</td>
                    <td>${row.soThe}</td>
                    <td><b>${row.hoTen}</b></td>
                    <td>${row.boPhan}</td>
                    <td>${row.tuGio} - ${row.denGio}</td>
                    <td style="color: var(--accent); font-weight: bold;">${row.soGio}</td>
                    <td style="${row.tongNam >= 200 ? 'color: var(--error); font-weight: bold;' : ''}">${row.tongNam || 0}</td>
                    <td>${row.lyDo}</td>
                    <td>${row.loai}</td>
                    <td>${editBtn}</td>
                `;
                tb.appendChild(tr);
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

// Hàm được gắn vào Global Object để nhận lệnh từ lưới (onclick)
window.startEdit = function(encodedData) {
    const data = JSON.parse(decodeURIComponent(encodedData));
    document.getElementById('editMaPhieu').value = data.maPhieu;
    
    // Gán ngày (cắt chuỗi DD/MM/YYYY thành YYYY-MM-DD)
    if(data.ngayTangCa) {
        const p = data.ngayTangCa.split('/');
        if(p.length === 3) document.getElementById('ngayTangCa').value = `${p[2]}-${p[1]}-${p[0]}`;
    }

    document.getElementById('tuGio').value = data.tuGio;
    document.getElementById('denGio').value = data.denGio;
    calculateTime();

    // Gán Dropdown Lý do bằng cơ chế giả lập click
    const lyDoItems = document.querySelectorAll('#dropdownLyDo .options-list li');
    let foundLyDo = false;
    lyDoItems.forEach(li => {
        if (li.dataset.value === data.lyDo) {
            li.click(); foundLyDo = true;
        }
    });
    // Xử lý nhánh "OTHER"
    if(!foundLyDo) {
        const otherBtn = document.querySelector('#dropdownLyDo .option-other');
        if(otherBtn) {
            otherBtn.click();
            const customInput = document.querySelector('#dropdownLyDo .inline-custom-input');
            if(customInput) { customInput.value = data.lyDo; customInput.dispatchEvent(new Event('input')); }
        }
    }

    // Gán Dropdown Loại
    const loaiItems = document.querySelectorAll('#dropdownLoai .options-list li');
    loaiItems.forEach(li => {
        if (li.dataset.value === data.loai) li.click();
    });

    // Reset lại ô nhân viên, chỉ chừa lại 1 dòng và điền số thẻ, kích hoạt móc API
    const container = document.getElementById('employeeInputsContainer');
    container.querySelectorAll('.employee-row:not(:first-child)').forEach(el => el.remove());
    
    const firstRow = container.querySelector('.employee-row');
    const input = firstRow.querySelector('.soTheInput');
    input.value = data.soThe;
    // Bắn event input để hệ thống tự tra tên từ RAM Cache
    input.dispatchEvent(new Event('input', { bubbles: true }));

    // Cuộn lên mượt mà
    window.scrollTo({top: 0, behavior: 'smooth'});
    if(typeof window.showToast === 'function') window.showToast("Đang sửa phiếu: " + data.maPhieu, true);
};
