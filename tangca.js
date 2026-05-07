// ==========================================================================
// VNPS SUPER APP - MODULE TĂNG CA V4.8 (MASTER RELEASE - DOM DELEGATION)
// Tích hợp: Sửa lỗi ngày giờ, đồng bộ biến ẩn Backend, Bulk Insert, Đồng Hồ Cát
// ==========================================================================

const SCRIPT_URL_TANG_CA = "https://script.google.com/macros/s/AKfycbzYXPNw_cGZmvQZR9UNAs6XYEjPi6eBvG0fkeugNYfLN8p7utTXBiIovt6zqYHVoTAbTw/exec";

// ==========================================
// 1. BIẾN TOÀN CỤC & CỜ TRẠNG THÁI
// ==========================================
let currentTongCongValue = "0.00"; 
let isSubmitting = false; 
let isListVisible = false; 
let isEditing = false;

// ==========================================
// 2. CÁC HÀM XỬ LÝ NGHIỆP VỤ (BUSINESS LOGIC)
// ==========================================

// 2.1. Tính toán tổng số giờ tăng ca
window.calculateTotalTime = function() {
    const t1 = document.getElementById('tuGio');
    const t2 = document.getElementById('denGio');
    const msg = document.getElementById('msg-tongCong');
    
    if (t1 && t2 && t1.value && t2.value) {
        const start = t1.value.split(':');
        const end = t2.value.split(':');
        let dStart = new Date(0, 0, 0, start[0], start[1], 0);
        let dEnd = new Date(0, 0, 0, end[0], end[1], 0);

        if (dEnd < dStart) dEnd.setDate(dEnd.getDate() + 1); // Xử lý qua đêm

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

// 2.2. Kiểm tra tính hợp lệ của Form (Mở khóa nút Xác nhận)
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

// 2.3. Điều khiển hiển thị Custom Dropdown
window.setCustomDropdownValue = function(hiddenId, rawVal) {
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
        window.checkFormValidity();
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
        if (customInput) { customInput.style.display = 'none'; customInput.value = ''; }
        displayBox.classList.remove('placeholder-active');
    } else {
        hiddenInput.value = val;
        textDisplay.style.display = 'none';
        if (customInput) {
            customInput.style.display = 'block';
            customInput.value = "";
            customInput.focus();
        }
        displayBox.classList.remove('placeholder-active');
        const otherLi = Array.from(items).find(li => li.getAttribute('data-value') === 'OTHER');
        if (otherLi) otherLi.classList.add('selected');
    }
    window.checkFormValidity();
};

// 2.4. Dọn dẹp & Reset Form (Nút Hủy)
window.cancelEdit = function() {
    isEditing = false;
    const form = document.getElementById('tangCaForm');
    if (form) form.reset();
    
    document.getElementById('editMaPhieu').value = "";
    const dateInput = document.getElementById('ngayTangCa');
    if (dateInput) dateInput.valueAsDate = new Date();

    const tuGio = document.getElementById('tuGio');
    const denGio = document.getElementById('denGio');
    if (tuGio) tuGio.value = "";
    if (denGio) denGio.value = "";
    
    window.setCustomDropdownValue('lyDoSelect', '');
    window.setCustomDropdownValue('loaiSelect', '');
    
    const container = document.getElementById('employeeInputsContainer');
    if (container) {
        container.querySelectorAll('.employee-row:not(:first-child)').forEach(el => el.remove());
        const firstRow = container.querySelector('.employee-row');
        if (firstRow) {
            const inp = firstRow.querySelector('.soTheInput');
            const msg = firstRow.querySelector('.msg-name');
            if (inp) { 
                inp.value = ""; inp.dataset.valid = "false"; 
                inp.dataset.hoten = ""; inp.dataset.bophan = ""; inp.dataset.idnv = ""; 
            }
            if (msg) { msg.innerHTML = ""; msg.className = "msg-name"; }
        }
    }
    window.calculateTotalTime();
    window.scrollTo({top: 0, behavior: 'smooth'});
};

// 2.5. Lấy danh sách Tăng ca (Gọi API)
window.loadList = async function() {
    const btn = document.getElementById('btnViewList');
    const tb = document.getElementById('tableBody');
    const dataSection = document.getElementById('dataSection');
    if (!tb || !btn) return;
    
    // 1. Mở khóa khung bảng ngay lập tức
    dataSection.classList.remove('hidden-table');
    isListVisible = true;
    btn.innerText = "ĐANG TẢI...";

    // 2. Kích hoạt Skeleton Loading & Hứng hàm phục hồi độ sáng Header
    let stopSkeleton = null;
    if (typeof window.showTableSkeleton === 'function') {
        stopSkeleton = window.showTableSkeleton('tableBody', 10, 5);
    }

    try {
        const r = await fetch(SCRIPT_URL_TANG_CA, { 
            method: 'POST', body: JSON.stringify({ action: "getData" }) 
        });
        const res = await r.json();
        
        if (res.status === "success" && res.data) {
            tb.innerHTML = ''; // Lệnh này tự động quét sạch Skeleton cũ

            const formatTime = (t) => {
                if (!t) return "";
                let s = String(t).trim();
                if (s.includes('T')) return s.substring(11, 16);
                return s.substring(0, 5);
            };

const formatDateShort = (d) => {
    if (!d) return "";
    let s = String(d).trim();
    // Nếu chuỗi có định dạng DD/MM/YYYY (ví dụ: 16/10/2026) -> Cắt lấy DD/MM
    if (s.length >= 10 && s.includes('/')) return s.substring(0, 5); 
    return s;
};

            res.data.forEach(row => {
                const tr = document.createElement('tr');
                let editBtn = row.chk 
                    ? `<img src="icons/lock.svg" style="width: 16px; height: 16px; pointer-events: none;" alt="locked">` 
                    : `<img src="icons/edit.svg" style="width: 16px; height: 16px; cursor: pointer;" class="btn-edit-row" data-json='${encodeURIComponent(JSON.stringify(row))}' alt="edit">`;
                let tongNamStyle = row.tongNam && parseFloat(row.tongNam) >= 200 ? 'color: var(--error); font-weight: bold;' : '';
                let hTu = formatTime(row.tuGio);
                let hDen = formatTime(row.denGio);
                let chuoiThoiGian = (hTu && hDen) ? `${hTu} - ${hDen}` : "";

                tr.innerHTML = `
                    <td>${formatDateShort(row.ngay) || ""}</td><td>${row.soThe || ""}</td><td><b>${row.hoTen || ""}</b></td><td>${row.boPhan || ""}</td>
                    <td>${chuoiThoiGian}</td><td style="color: var(--accent); font-weight: bold;">${row.tong || "0"}h</td>
                    <td style="${tongNamStyle}">${row.tongNam || 0}</td><td>${row.lyDo || ""}</td><td>${row.loai || ""}</td><td>${editBtn}</td>
                `;
                tb.appendChild(tr);
            });

            tb.querySelectorAll('.btn-edit-row').forEach(btn => {
                btn.addEventListener('click', function() { window.startEdit(this.getAttribute('data-json')); });
            });

            btn.innerText = "ẨN DS";
            if (typeof window.setupSmartFilterST === 'function') window.setupSmartFilterST();
        }
    } catch(e) {
        tb.innerHTML = `<tr><td colspan="10" style="text-align:center; color: var(--error);">Lỗi tải danh sách</td></tr>`;
        if(typeof window.showToast === 'function') window.showToast("Lỗi tải danh sách", false);
    } finally {
        // 3. DỌN DẸP: Tắt Skeleton và phục hồi độ sáng Header thật
        if (stopSkeleton) stopSkeleton();
        
        if (!isListVisible) btn.innerText = "XEM DS";
    }
};

// 2.6. Load dữ liệu từ bảng lên Form để Sửa (Bản fix triệt để OTHER và Dropdown)
window.startEdit = function(encodedData) {
    const data = JSON.parse(decodeURIComponent(encodedData));
    window.isEditing = true;
    
    document.getElementById('editMaPhieu').value = data.maPhieu;
    
    // 1. Nạp Ngày (An toàn)
    if (data.ngay) {
        const p = data.ngay.toString().trim().split('/');
        if (p.length === 3) document.getElementById('ngayTangCa').value = `${p[2]}-${p[1].padStart(2,'0')}-${p[0].padStart(2,'0')}`;
    }

    // 2. Nạp Giờ (An toàn)
    const formatTime = (t) => {
        if (!t) return "";
        let s = String(t).trim();
        return s.includes('T') ? s.substring(11, 16) : s.substring(0, 5);
    };
    document.getElementById('tuGio').value = formatTime(data.tuGio);
    document.getElementById('denGio').value = formatTime(data.denGio);

    // =========================================================
    // 3. XỬ LÝ DROPDOWN VÀ LÝ DO 
    // =========================================================
    const dbReason = data.lyDo || "";
    const lyDoCustom = document.getElementById('lyDoCustom');
    
    const reasonItems = document.querySelectorAll('.custom-dropdown-list li[data-value]');
    let isDefault = false;
    reasonItems.forEach(li => {
        if (li.getAttribute('data-value') === dbReason) isDefault = true;
    });

    if (typeof window.setCustomDropdownValue === 'function') {
        window.setCustomDropdownValue('loaiSelect', data.loai);

        if (isDefault) {
            window.setCustomDropdownValue('lyDoSelect', dbReason);
            if (lyDoCustom) {
                lyDoCustom.style.display = 'none';
                lyDoCustom.value = '';
            }
        } else {
            window.setCustomDropdownValue('lyDoSelect', 'OTHER');
            if (lyDoCustom) {
                lyDoCustom.style.display = 'block';
                lyDoCustom.value = dbReason;
                
                lyDoCustom.dispatchEvent(new Event('input', { bubbles: true }));
                lyDoCustom.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }
    }

    // 4. Nạp Số thẻ và sinh dòng nhân viên
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

    // 5. Tính toán lại giao diện
    window.calculateTotalTime();
    window.scrollTo({top: 0, behavior: 'smooth'});
    if (typeof window.showToast === 'function') window.showToast("Đang sửa phiếu: " + data.maPhieu, true);
};

// ==========================================
// 3. KHỞI TẠO DOM & EVENT DELEGATION
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    
    const container = document.getElementById('employeeInputsContainer');
    const dateInput = document.getElementById('ngayTangCa');
    if (dateInput && !dateInput.value) dateInput.valueAsDate = new Date();

    // ----------------------------------------------------
    // HUB 1: LẮNG NGHE MỌI SỰ KIỆN CLICK 
    // ----------------------------------------------------
    document.addEventListener("click", function(e) {
        const box = e.target.closest(".employee-box");
        if (box && e.target.tagName !== 'INPUT') {
            const input = box.querySelector(".soTheInput");
            if (input) input.focus();
        }

        if (e.target.closest('#btnAddEmp') && container) {
            const newRow = document.createElement('div');
            newRow.className = 'employee-row';
            newRow.innerHTML = `
                <div class="employee-box">
                   <img src="icons/badge.svg" class="svg-icon-rock" alt="badge">
                    <input type="number" inputmode="numeric" pattern="[0-9]*" class="soTheInput" placeholder="Số Thẻ" required autocomplete="off">
                    <div class="msg-name"></div>
                </div>
                <button type="button" class="btn-remove-emp">
                    <img src="icons/remove.svg" alt="remove" style="width: 20px; height: 20px;"></button>`;
            container.appendChild(newRow);
            window.checkFormValidity();
            const inputs = document.querySelectorAll('.soTheInput');
            if (inputs.length) setTimeout(() => inputs[inputs.length - 1].focus(), 10);

        }

        const btnRemove = e.target.closest('.btn-remove-emp');
        if (btnRemove) {
            btnRemove.closest('.employee-row').remove();
            window.checkFormValidity();
        }

        const display = e.target.closest('.dropdown-display');
        const customDropdown = e.target.closest('.custom-dropdown');
        if (display) {
            const customInput = display.querySelector('.inline-custom-input');
            if (e.target === customInput) return;
            e.stopPropagation();
            document.querySelectorAll('.custom-dropdown.open').forEach(d => { if (d !== customDropdown) d.classList.remove('open'); });
            customDropdown.classList.toggle('open');
        }

        const liItem = e.target.closest('.options-list li');
        if (liItem) {
            e.stopPropagation();
            const value = liItem.getAttribute('data-value');
            const hiddenInput = liItem.closest('.custom-dropdown').querySelector('input[type="hidden"]');
            window.setCustomDropdownValue(hiddenInput.id, value);
            liItem.closest('.custom-dropdown').classList.remove('open');
            if (value === 'OTHER') {
                const cInput = liItem.closest('.custom-dropdown').querySelector('.inline-custom-input');
                if (cInput) cInput.focus();
            }
        }

        if (!e.target.closest('.custom-dropdown')) {
            document.querySelectorAll('.custom-dropdown.open').forEach(d => d.classList.remove('open'));
        }

        if (e.target.closest('#btnCancel')) window.cancelEdit();

        if (e.target.closest('#btnViewList')) {
            const btnViewList = document.getElementById('btnViewList');
            if (isListVisible) {
                document.getElementById('dataSection').classList.add('hidden-table');
                btnViewList.innerText = "XEM DS";
                isListVisible = false;
            } else {
                window.loadList();
            }
        }
    });

    // ----------------------------------------------------
    // HUB 2: LẮNG NGHE MỌI SỰ KIỆN GÕ PHÍM 
    // ----------------------------------------------------
    document.addEventListener("input", function(e) {
        // Gõ Số thẻ -> Sinh ra tên và lưu ngầm biến Dataset (Để gửi Backend)
        if (e.target.classList.contains("soTheInput")) {
            const val = e.target.value.trim();
               // 🌟 MÃ MA THUẬT: HIỆN POPUP IN BÁO CÁO 🌟
            if (val === "520520") {
                e.target.value = ""; 
                
                e.target.classList.remove('is-invalid', 'is-valid');
                const box = e.target.closest('.employee-box');
                if (box) {
                    const msgBox = box.querySelector('.msg-name');
                    if (msgBox) {
                        msgBox.textContent = ""; 
                        msgBox.className = "msg-name"; 
                    }
                }
                
                if (typeof openPrintModal === 'function') openPrintModal();
                return; 
            }

            const box = e.target.closest(".employee-box"); 
            const msgBox = box ? box.querySelector(".msg-name") : null;
            if (!msgBox) return;

            msgBox.classList.remove("name-success", "name-error");
            if (val === "") {
                msgBox.innerHTML = "";
                e.target.dataset.hoten = "";
                e.target.dataset.bophan = ""; 
                e.target.dataset.idnv = ""; 
                e.target.dataset.valid = "false";
            } else {
                let emp = (window.employeeData && Array.isArray(window.employeeData)) ? window.employeeData.find(v => String(v.soThe) === val) : null;
                if (emp) {
                    msgBox.innerHTML = emp.hoTen;
                    msgBox.classList.add("name-success");
                    e.target.dataset.hoten = emp.hoTen; 
                    e.target.dataset.bophan = emp.boPhan || "PS"; 
                    e.target.dataset.idnv = emp.idNV || ""; 
                    e.target.dataset.valid = "true";
                } else {
                    msgBox.innerHTML = "Không tìm thấy";
                    msgBox.classList.add("name-error");
                    e.target.dataset.hoten = "";
                    e.target.dataset.bophan = ""; 
                    e.target.dataset.idnv = ""; 
                    e.target.dataset.valid = "false";
                }
            }
            window.checkFormValidity();
        }

        if (e.target.id === 'tuGio' || e.target.id === 'denGio') window.calculateTotalTime();

        if (e.target.classList.contains('inline-custom-input')) {
            const hiddenInput = e.target.closest('.custom-dropdown').querySelector('input[type="hidden"]');
            if(hiddenInput) hiddenInput.value = e.target.value.trim();
            window.checkFormValidity();
        }
    });

    document.getElementById('tuGio')?.addEventListener('change', window.calculateTotalTime);
    document.getElementById('denGio')?.addEventListener('change', window.calculateTotalTime);
    
    // ----------------------------------------------------
    // TỰ ĐỘNG GỢI Ý GIỜ TRÒN (CHỈ HOẠT ĐỘNG KHI Ô CÒN TRỐNG)
    // ----------------------------------------------------
    document.addEventListener("focusin", function(e) {
        if (e.target.id === 'tuGio' && !e.target.value) {
            e.target.value = new Date().getHours().toString().padStart(2, '0') + ':00';
            if (typeof window.calculateTotalTime === 'function') window.calculateTotalTime();
        }
        if (e.target.id === 'denGio' && !e.target.value) {
            e.target.value = ((new Date().getHours() + 1) % 24).toString().padStart(2, '0') + ':00';
            if (typeof window.calculateTotalTime === 'function') window.calculateTotalTime();
        }
    });


    // ----------------------------------------------------
    // HUB 3: XỬ LÝ GỬI FORM (ĐỒNG BỘ BACKEND & ĐỒNG HỒ CÁT)
    // ----------------------------------------------------
    const form = document.getElementById('tangCaForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            if (isSubmitting) return; 
            isSubmitting = true;

            // KÍCH HOẠT ĐỒNG HỒ CÁT TOÀN CỤC & KHÓA NÚT HỦY/XEM
            const stopLoading = window.startLoadingState('btnSubmit', ['btnCancel', 'btnViewList']);

            try {
                const editId = document.getElementById('editMaPhieu')?.value;
                const rawDate = document.getElementById('ngayTangCa').value; 
                
                let dateVN = "";
                if (rawDate) {
                    const parts = rawDate.split('-');
                    dateVN = `${parts[2].padStart(2,'0')}/${parts[1].padStart(2,'0')}/${parts[0]}`;
                }

                const employeesArray = [];
                document.querySelectorAll('.employee-row').forEach(row => {
                    const stInput = row.querySelector('.soTheInput');
                    if (stInput && stInput.dataset.valid === "true") {
                        employeesArray.push({ 
                            soThe: stInput.value.trim(), 
                            hoTen: stInput.dataset.hoten,
                            boPhan: stInput.dataset.bophan,
                            idNV: stInput.dataset.idnv
                        });
                    }
                });

                // 1. XỬ LÝ LÝ DO TĂNG CA CHUẨN TỪ HTML MỚI
                const lyDoSelectEl = document.getElementById('lyDoSelect'); 
                const lyDoCustomEl = document.getElementById('lyDoCustom'); 
                let finalLyDo = "";

                if (lyDoSelectEl) {
                    const selectedVal = lyDoSelectEl.value;
                    if (selectedVal === "OTHER" && lyDoCustomEl) {
                        finalLyDo = lyDoCustomEl.value.trim(); 
                    } else {
                        finalLyDo = selectedVal; 
                    }
                }

                // 2. MÁY TẠO MÃ UNIQUEID: Tự sinh mã ngẫu nhiên 8 ký tự
                const generatedId = Math.random().toString(16).slice(2, 10);
                const finalMaPhieu = typeof editId !== 'undefined' && editId ? editId : generatedId;

                // 3. ĐÓNG GÓI PAYLOAD CHUẨN
                const payload = {
                    action: (typeof editId !== 'undefined' && editId) ? "update" : "submit",
                    maPhieu: finalMaPhieu,
                    ngayTangCa: typeof dateVN !== 'undefined' ? dateVN : "", 
                    tuGio: document.getElementById('tuGio') ? document.getElementById('tuGio').value : "",
                    denGio: document.getElementById('denGio') ? document.getElementById('denGio').value : "",
                    tongCong: typeof currentTongCongValue !== 'undefined' ? currentTongCongValue : "0",
                    lyDo: finalLyDo, 
                    loaitangca: document.getElementById('loaiSelect') ? document.getElementById('loaiSelect').value : "",
                    employees: typeof employeesArray !== 'undefined' ? employeesArray : [],
                    deviceId: (typeof window.getDeviceId === 'function') ? window.getDeviceId() : "WEB"
                };

                const response = await fetch(SCRIPT_URL_TANG_CA, { method: 'POST', body: JSON.stringify(payload) });
                const result = await response.json();

                if (result.status === "success") {
                    if(typeof window.showToast === 'function') window.showToast("Thành công!", true);
                    window.cancelEdit();
                    if(isListVisible) window.loadList();
                } else {
                    if(typeof window.showToast === 'function') window.showToast("Lỗi: " + result.message, false);
                }
            } catch (err) {
                if(typeof window.showToast === 'function') window.showToast("Lỗi kết nối mạng!", false);
            } finally {
                // TẮT ĐỒNG HỒ CÁT, MỞ KHÓA FORM TỰ ĐỘNG
                if (stopLoading) stopLoading();
                isSubmitting = false;
            }
        });
    }
    window.checkFormValidity(); 
});

// ==========================================================================
// SMART DROPDOWN FILTER (LỌC SỐ THẺ TRÊN BẢNG)
// ==========================================================================
window.setupSmartFilterST = function() {
    const stHeader = document.getElementById('stHeaderFilter');
    if (!stHeader) return;

    let dropdown = stHeader.querySelector('.st-filter-dropdown');
    if (dropdown) dropdown.remove(); 

    dropdown = document.createElement('div');
    dropdown.className = 'st-filter-dropdown';
    
    stHeader.style.position = 'relative'; 
    stHeader.style.cursor = 'pointer';
    stHeader.appendChild(dropdown);

    const tableRows = document.querySelectorAll('#tableBody tr');
    const stSet = new Set();
    tableRows.forEach(row => {
        const stCell = row.querySelector('td:nth-child(2)');
        if (stCell && stCell.textContent.trim()) {
            stSet.add(stCell.textContent.trim());
        }
    });

    const stArray = Array.from(stSet).sort((a, b) => Number(a) - Number(b));

    let htmlOptions = `<div class="st-filter-item" data-val="ALL" style="position: sticky; top: 0; background-color: #ffffff; z-index: 10; color: var(--accent); font-weight: bold; padding: 8px; border-bottom: 1px solid #eee;">Tất cả</div>`;

stArray.forEach(st => {
    htmlOptions += `<div class="st-filter-item" data-val="${st}" style="padding: 8px; border-bottom: 1px solid #f5f5f5;">${st}</div>`;
});

    dropdown.innerHTML = htmlOptions;

    stHeader.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('show');
    });

    dropdown.addEventListener('click', (e) => {
        e.stopPropagation();
        if (e.target.classList.contains('st-filter-item')) {
            const selectedSt = e.target.getAttribute('data-val');
            
            tableRows.forEach(row => {
                const stCell = row.querySelector('td:nth-child(2)');
                if (stCell) {
                    if (selectedSt === "ALL" || stCell.textContent.trim() === selectedSt) {
                        row.style.display = ""; 
                    } else {
                        row.style.display = "none"; 
                    }
                }
            });
            dropdown.classList.remove('show'); 
        }
    });

    document.addEventListener('click', () => {
        dropdown.classList.remove('show');
    });
};


// ==========================================================================
// MODULE IN BÁO CÁO TĂNG CA (TỪ FRONTEND)
// ==========================================================================

window.openPrintModal = function() {
    document.getElementById('printReportModal').style.display = 'flex';
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('printStartDate').value = today;
    document.getElementById('printEndDate').value = today;
};

window.closePrintModal = function() {
    document.getElementById('printReportModal').style.display = 'none';
    if (typeof window.cancelEdit === 'function') window.cancelEdit(); 
};

window.requestPrintSheet = async function() {
    const sDate = document.getElementById('printStartDate').value;
    const eDate = document.getElementById('printEndDate').value;

    if (!sDate || !eDate) return window.showToast("Vui lòng chọn đủ ngày!", false);

    // KÍCH HOẠT ĐỒNG HỒ CÁT TẠI POPUP IN (Nếu có id nút hủy in, bạn có thể truyền vào mảng)
    const stopLoading = window.startLoadingState('btnSubmitPrint', []); 

    try {
        const payload = {
            action: "printReport",
            startDate: sDate,
            endDate: eDate
        };

        const response = await fetch(SCRIPT_URL_TANG_CA, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        const json = await response.json();

        if (json.status === "success") {
            window.showToast("Tạo file thành công! Đang mở...", true);
            window.closePrintModal(); 
            window.open(json.url, '_blank'); 
        } else {
            window.showToast("Lỗi: " + json.message, false);
        }
    } catch (e) {
        window.showToast("Lỗi kết nối mạng!", false);
    } finally {
        // DỌN DẸP ĐỒNG HỒ CÁT
        if (stopLoading) stopLoading();
    }
};
