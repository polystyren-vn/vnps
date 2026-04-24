const SCRIPT_URL_TANG_CA = "https://script.google.com/macros/s/AKfycbzYXPNw_cGZmvQZR9UNAs6XYEjPi6eBvG0fkeugNYfLN8p7utTXBiIovt6zqYHVoTAbTw/exec";

let isListVisible = false, isEditing = false;
let isDataLoaded = false; // V2.6: Cờ đánh dấu dữ liệu đã lưu trên RAM
let currentTongCongValue = "0.00"; 

window.clearSoThe = () => {
    const i = document.getElementById('soThe');
    if(i) {
        i.value = '';
        i.dispatchEvent(new Event('input'));
    }
};

window.startEdit = function(dataStr) {
    const data = JSON.parse(decodeURIComponent(dataStr));
    isEditing = true;
    
    const editMaPhieu = document.getElementById('editMaPhieu');
    if(editMaPhieu) editMaPhieu.value = data.maPhieu;
    
    if (data.ngay && data.ngay.includes('/')) {
        const [d, m, y] = data.ngay.split('/');
        const ngayTangCa = document.getElementById('ngayTangCa');
        if(ngayTangCa) ngayTangCa.value = `${y}-${m}-${d}`;
    }
    
    const soThe = document.getElementById('soThe');
    if(soThe) soThe.value = data.soThe;
    
    const tuGio = document.getElementById('tuGio');
    if(tuGio) tuGio.value = data.tuGio ? data.tuGio.toString().substring(0, 5) : "";
    
    const denGio = document.getElementById('denGio');
    if(denGio) denGio.value = data.denGio ? data.denGio.toString().substring(0, 5) : "";
    
    const lyDoSelect = document.getElementById('lyDoSelect');
    const lyDoCustom = document.getElementById('lyDoCustom');
    const selectPart = document.getElementById('reason-select-part');
    const customPart = document.getElementById('reason-custom-part');
    
    if(lyDoSelect) {
        const options = Array.from(lyDoSelect.options).map(opt => opt.value);
        if(options.includes(data.lyDo)) {
            lyDoSelect.value = data.lyDo;
            if(selectPart) selectPart.style.display = 'flex';
            if(customPart) customPart.style.display = 'none';
        } else {
            lyDoSelect.value = "OTHER";
            if(selectPart) selectPart.style.display = 'none';
            if(customPart) customPart.style.display = 'flex';
            if(lyDoCustom) lyDoCustom.value = data.lyDo;
        }
    }
    
    const loaiTangCa = document.getElementById('loaitangca');
    if(loaiTangCa) loaiTangCa.value = data.loai;
    
    const btnText = document.getElementById('btnText');
    if(btnText) btnText.innerText = "CẬP NHẬT DỮ LIỆU";
    
    const btnSubmit = document.getElementById('btnSubmit');
    if(btnSubmit) btnSubmit.style.background = "#e67e22";
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    if(soThe) soThe.dispatchEvent(new Event('input', { bubbles: true }));
    if(tuGio) tuGio.dispatchEvent(new Event('change', { bubbles: true }));
};

window.cancelEdit = function() {
    isEditing = false;
    const tangCaForm = document.getElementById('tangCaForm');
    if(tangCaForm) tangCaForm.reset();
    
    const editMaPhieu = document.getElementById('editMaPhieu');
    if(editMaPhieu) editMaPhieu.value = "";
    
    const btnText = document.getElementById('btnText');
    if(btnText) btnText.innerText = "GỬI DỮ LIỆU";
    
    const btnSubmit = document.getElementById('btnSubmit');
    if(btnSubmit) {
        btnSubmit.style.background = "";
        btnSubmit.disabled = true;
    }
    
    const msgSoThe = document.getElementById('msg-soThe');
    if(msgSoThe) {
        msgSoThe.innerHTML = "";
        msgSoThe.classList.remove('name-success', 'name-error');
    }
    
    const msgTongCong = document.getElementById('msg-tongCong');
    if(msgTongCong) msgTongCong.innerText = "TC: 0.00 (h)";
    
    const selectPart = document.getElementById('reason-select-part');
    const customPart = document.getElementById('reason-custom-part');
    if(selectPart) selectPart.style.display = 'flex';
    if(customPart) customPart.style.display = 'none';
};

document.addEventListener("DOMContentLoaded", async () => {
    if(typeof window.loadEmployeesData === 'function') await window.loadEmployeesData();
    
    const soTheInput = document.getElementById('soThe');
    const msgSoThe = document.getElementById('msg-soThe');

    if(soTheInput && msgSoThe) {
        soTheInput.addEventListener('input', () => {
            const val = soTheInput.value.trim();
            const emp = window.employeeData ? window.employeeData.find(v => v.soThe === val) : null;
            
            msgSoThe.classList.remove('name-success', 'name-error');

            if (emp) {
                msgSoThe.innerHTML = `${emp.hoTen} - ${emp.boPhan}`;
                msgSoThe.classList.add('name-success'); 
                
                document.getElementById('hoTenHidden').value = emp.hoTen;
                document.getElementById('boPhanHidden').value = emp.boPhan;
                document.getElementById('idNV').value = emp.idNV;
            } else {
                msgSoThe.innerHTML = val === "" ? "" : "Số thẻ không đúng";
                
                if (val !== "") {
                    msgSoThe.classList.add('name-error'); 
                }
                
                document.getElementById('hoTenHidden').value = "";
                document.getElementById('boPhanHidden').value = "";
                document.getElementById('idNV').value = "";
            }
            checkFormValidity();
        });
    }

    const tu = document.getElementById('tuGio');
    const den = document.getElementById('denGio');

    function calc() {
        if (tu && den && tu.value && den.value) {
            let s = new Date(`1970-01-01T${tu.value}:00`);
            let e = new Date(`1970-01-01T${den.value}:00`);
            if (e < s) e.setDate(e.getDate() + 1);
            currentTongCongValue = ((e - s) / 3600000).toFixed(2);
            const msgTongCong = document.getElementById('msg-tongCong');
            if(msgTongCong) msgTongCong.innerText = `TC: ${currentTongCongValue} (h)`;
        } else {
            const msgTongCong = document.getElementById('msg-tongCong');
            if(msgTongCong) msgTongCong.innerText = "TC: 0.00 (h)";
            currentTongCongValue = "0.00";
        }
    }

    function suggestDefaultTime(e) {
        if (!e.target.value) { 
            const currentHour = new Date().getHours().toString().padStart(2, '0');
            e.target.value = `${currentHour}:00`; 
            calc();
            checkFormValidity();
        }
    }

    if(tu) {
        tu.addEventListener('focus', suggestDefaultTime);
        tu.addEventListener('change', () => { calc(); checkFormValidity(); });
    }
    if(den) {
        den.addEventListener('focus', suggestDefaultTime);
        den.addEventListener('change', () => { calc(); checkFormValidity(); });
    }

    const lyDoSelect = document.getElementById('lyDoSelect');
    const lyDoCustom = document.getElementById('lyDoCustom');
    const selectPart = document.getElementById('reason-select-part');
    const customPart = document.getElementById('reason-custom-part');
    const btnBack = document.getElementById('btnBackToSelect');

    if(lyDoSelect && lyDoCustom && selectPart && customPart) {
        lyDoSelect.addEventListener('change', () => {
            if (lyDoSelect.value === 'OTHER') {
                selectPart.style.display = 'none';
                customPart.style.display = 'flex';
                lyDoCustom.focus();
            }
            checkFormValidity();
        });

        if(btnBack) {
            btnBack.addEventListener('click', () => {
                lyDoSelect.value = '';
                lyDoCustom.value = '';
                selectPart.style.display = 'flex';
                customPart.style.display = 'none';
                checkFormValidity();
            });
        }
    }

    function checkFormValidity() {
        const ngay = document.getElementById('ngayTangCa');
        const id = document.getElementById('idNV');
        const loai = document.getElementById('loaitangca');
        const btn = document.getElementById('btnSubmit');
        
        if(ngay && id && tu && den && loai && btn && lyDoSelect && lyDoCustom) {
            const ok = ngay.value && id.value && tu.value && den.value && loai.value;
            let hasLyDo = lyDoSelect.value === 'OTHER' ? lyDoCustom.value.trim() !== '' : lyDoSelect.value !== '';
            btn.disabled = !(ok && hasLyDo);
        }
    }

    const ngayTangCa = document.getElementById('ngayTangCa');
    if(ngayTangCa) ngayTangCa.addEventListener('change', checkFormValidity);
    
    const loaiTangCa = document.getElementById('loaitangca');
    if(loaiTangCa) loaiTangCa.addEventListener('change', checkFormValidity);
    
    if(lyDoCustom) lyDoCustom.addEventListener('input', checkFormValidity);

    const tangCaForm = document.getElementById('tangCaForm');
    if(tangCaForm) {
        tangCaForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const b = document.getElementById('btnSubmit');
            const sp = document.getElementById('spinner');
            const bt = document.getElementById('btnText');
            
            if(b) b.disabled = true; 
            if(bt) bt.style.display = 'none'; 
            if(sp) sp.style.display = 'block';
            
            const dParts = document.getElementById('ngayTangCa').value.split('-');
            const payload = {
                action: isEditing ? "update" : "submit",
                maPhieu: isEditing ? document.getElementById('editMaPhieu').value : "TC-" + Date.now(),
                idNV: document.getElementById('idNV').value,
                ngayTangCa: `${dParts[2]}/${dParts[1]}/${dParts[0]}`,
                soThe: soTheInput.value,
                hoTen: document.getElementById('hoTenHidden').value,
                boPhan: document.getElementById('boPhanHidden').value,
                tuGio: tu.value, denGio: den.value, tongCong: currentTongCongValue,
                lyDo: lyDoSelect.value === 'OTHER' ? lyDoCustom.value.trim() : lyDoSelect.value,
                loaitangca: document.getElementById('loaitangca').value,
                deviceId: (typeof window.getDeviceId === 'function') ? window.getDeviceId() : "UNKNOWN"
            };

            try {
                const r = await fetch(SCRIPT_URL_TANG_CA, { method: 'POST', body: JSON.stringify(payload) });
                const res = await r.json();
                if (res.status === "success") {
                    if(typeof window.showToast === 'function') window.showToast(isEditing ? "Cập nhật thành công!" : "Ghi thành công!", true);
                    if(typeof window.cancelEdit === 'function') window.cancelEdit();
                    
                    // V2.6: XÓA CỜ RAM KHI CÓ DỮ LIỆU MỚI ĐỂ ÉP SERVER TẢI LẠI BẢN MỚI
                    isDataLoaded = false; 
                    if(isListVisible) loadList();
                } else { 
                    if(typeof window.showToast === 'function') window.showToast("Lỗi: " + res.message, false); 
                    if(b) b.disabled = false; 
                }
            } catch (err) { 
                if(typeof window.showToast === 'function') window.showToast("Lỗi kết nối API!", false); 
                if(b) b.disabled = false;
            } finally { 
                if(bt) bt.style.display = 'block'; 
                if(sp) sp.style.display = 'none'; 
            }
        });
    }

    async function loadList() {
        const b = document.getElementById('btnViewList');
        const sp = document.getElementById('spinnerList');
        const bt = document.getElementById('btnListText');
        
        if(b) b.disabled = true; 
        if(bt) bt.style.display = 'none'; 
        if(sp) sp.style.display = 'block';
        
        try {
            const r = await fetch(SCRIPT_URL_TANG_CA, { method: 'POST', body: JSON.stringify({ action: "getData" }) });
            const res = await r.json();
            if (res.status === "success") {
                const tb = document.getElementById('tableBody'); 
                if(tb) tb.innerHTML = '';
                
                // V2.6: BỎ LỆNH .REVERSE() THEO YÊU CẦU
                res.data.forEach(row => {
                    const tr = document.createElement('tr');
                    let actionIcon = row.chk ? `🔒` : `<span style="cursor:pointer;" onclick="startEdit('${encodeURIComponent(JSON.stringify(row))}')">✏️</span>`;
                    // Giữ nguyên HTML như cấu trúc V2.5 gốc của bạn
                    tr.innerHTML = `<td>${row.ngay}</td><td>${row.soThe}</td><td style="text-align:left;">${row.hoTen}</td><td>${row.boPhan}</td><td>${row.tuGio}-${row.denGio}</td><td><span class="status-tag">${row.tong}h</span></td><td style="font-weight:bold; color:#1A73E8">${row.tongNam}h</td><td>${row.lyDo}</td><td>${row.loai}</td><td>${actionIcon}</td>`;
                    
                    if(tb) tb.appendChild(tr);
                });
                
                const dataSection = document.getElementById('dataSection');
                if(dataSection) dataSection.style.display = 'block';
                if(bt) bt.innerText = "ẨN DANH SÁCH";
                isListVisible = true;
                
                // V2.6: LƯU CỜ ĐÃ CÓ DATA TRÊN RAM
                isDataLoaded = true; 
            }
        } catch(e) { 
            console.error(e);
            if(typeof window.showToast === 'function') window.showToast("Lỗi tải danh sách (Network/Code)!", false);
        } finally { 
            if(b) b.disabled = false; 
            if(bt) bt.style.display = 'block'; 
            if(sp) sp.style.display = 'none'; 
        }
    }

    const btnViewList = document.getElementById('btnViewList');
    if(btnViewList) {
        btnViewList.addEventListener('click', () => {
            if(isListVisible) { 
                // ĐANG HIỆN -> CHỈ ẨN GIAO DIỆN KHỎI MÀN HÌNH (DỮ LIỆU VẪN TRÊN RAM)
                const dataSection = document.getElementById('dataSection');
                if(dataSection) dataSection.style.display = 'none';
                
                const btnListText = document.getElementById('btnListText');
                if(btnListText) btnListText.innerText = "XEM DANH SÁCH THÁNG HIỆN TẠI";
                isListVisible = false;
            } else { 
                // ĐANG ẨN -> KIỂM TRA RAM TRƯỚC
                if (isDataLoaded) {
                    // CÓ DỮ LIỆU TRÊN RAM -> HIỆN RA LUÔN 0 ĐỘ TRỄ
                    const dataSection = document.getElementById('dataSection');
                    if(dataSection) dataSection.style.display = 'block';
                    
                    const btnListText = document.getElementById('btnListText');
                    if(btnListText) btnListText.innerText = "ẨN DANH SÁCH";
                    isListVisible = true;
                } else {
                    // RAM TRỐNG -> GỌI BACKEND
                    loadList();
                }
            }
        });
    }
});
