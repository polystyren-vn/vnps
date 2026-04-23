const SCRIPT_URL_TANG_CA = "https://script.google.com/macros/s/AKfycbzYXPNw_cGZmvQZR9UNAs6XYEjPi6eBvG0fkeugNYfLN8p7utTXBiIovt6zqYHVoTAbTw/exec";

let isListVisible = false, isEditing = false;
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
    
    const selectLyDo = document.getElementById('lyDoSelect');
    const lyDoCustom = document.getElementById('lyDoCustom');
    if(selectLyDo) {
        const options = Array.from(selectLyDo.options).map(opt => opt.value);
        if(options.includes(data.lyDo)) {
            selectLyDo.value = data.lyDo;
            if(lyDoCustom) lyDoCustom.style.display = 'none';
        } else {
            selectLyDo.value = "OTHER";
            if(lyDoCustom) {
                lyDoCustom.style.display = 'block';
                lyDoCustom.value = data.lyDo;
            }
        }
    }
    
    const loai = document.getElementById('loaitangca');
    if(loai) loai.value = data.loai;
    
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
    const form = document.getElementById('tangCaForm');
    if(form) form.reset();
    
    const editMaPhieu = document.getElementById('editMaPhieu');
    if(editMaPhieu) editMaPhieu.value = "";
    
    const btnText = document.getElementById('btnText');
    if(btnText) btnText.innerText = "GỬI DỮ LIỆU";
    
    const btnSubmit = document.getElementById('btnSubmit');
    if(btnSubmit) {
        btnSubmit.style.background = "";
        btnSubmit.disabled = true;
    }
    
    const lyDoCustom = document.getElementById('lyDoCustom');
    if(lyDoCustom) lyDoCustom.style.display = 'none';
    
    const msgSoThe = document.getElementById('msg-soThe');
    if(msgSoThe) msgSoThe.innerHTML = "";
    
    const soThe = document.getElementById('soThe');
    if(soThe) soThe.classList.remove('is-valid', 'is-invalid');
    
    const msgTC = document.getElementById('msg-tongCong');
    if(msgTC) msgTC.innerHTML = "";
    currentTongCongValue = "0.00";
};

document.addEventListener("DOMContentLoaded", async () => {
    if(typeof window.loadEmployeesData === 'function') {
        await window.loadEmployeesData();
    }
    
    const soTheInput = document.getElementById('soThe');
    const msgSoThe = document.getElementById('msg-soThe');

    if(soTheInput) {
        soTheInput.addEventListener('input', () => {
            const val = soTheInput.value.trim();
            const emp = window.employeeData ? window.employeeData.find(v => v.soThe === val) : null;
            
            if (msgSoThe) {
                if (val === "") {
                    soTheInput.classList.remove('is-valid', 'is-invalid');
                    msgSoThe.innerHTML = "";
                } else if (emp) {
                    soTheInput.classList.remove('is-invalid');
                    soTheInput.classList.add('is-valid');
                    msgSoThe.innerHTML = `<span class="success-text" style="color:#137333; font-weight:bold;">✅ ${emp.hoTen} - ${emp.boPhan}</span>`;
                } else {
                    soTheInput.classList.remove('is-valid');
                    soTheInput.classList.add('is-invalid');
                    msgSoThe.innerHTML = `<span class="error-text" style="color:#D93025; font-weight:bold;">❌ Số thẻ không tồn tại</span>`;
                }
            }
            checkFormValidity();
        });
    }

    const tu = document.getElementById('tuGio');
    const den = document.getElementById('denGio');

    function setRoundHour(e) {
        if (!e.target.value) {
            const d = new Date();
            e.target.value = `${String(d.getHours()).padStart(2, '0')}:00`;
            calc();
            checkFormValidity();
        }
    }

    if(tu) tu.addEventListener('click', setRoundHour);
    if(den) den.addEventListener('click', setRoundHour);

    // Tính toán và Tự động sinh giao diện hiển thị giờ
    function calc() {
        let msgTC = document.getElementById('msg-tongCong');
        
        // Tự động tạo thẻ thông báo nếu bạn lỡ xóa hoặc khai báo sai trong HTML
        if (!msgTC) {
            msgTC = document.createElement('div');
            msgTC.id = 'msg-tongCong';
            msgTC.style.marginTop = '0px';
            msgTC.style.marginBottom = '15px';
            if (den) {
                const parent = den.closest('.time-group') || den.parentNode;
                if(parent && parent.parentNode) {
                    parent.parentNode.insertBefore(msgTC, parent.nextSibling);
                }
            }
        }

        if (tu && den && tu.value && den.value) {
            let s = new Date(`1970-01-01T${tu.value}:00`);
            let e = new Date(`1970-01-01T${den.value}:00`);
            if (e < s) e.setDate(e.getDate() + 1);
            
            currentTongCongValue = ((e - s) / 3600000).toFixed(2);
            if(msgTC) msgTC.innerHTML = `<span style="color:#1A73E8; font-weight:bold; font-size:14px;">✅ Tổng cộng: ${currentTongCongValue} (giờ)</span>`;
        } else {
            if(msgTC) msgTC.innerHTML = "";
            currentTongCongValue = "0.00";
        }
    }

    if(tu) tu.addEventListener('change', () => { calc(); checkFormValidity(); });
    if(den) den.addEventListener('change', () => { calc(); checkFormValidity(); });

    const lyDoSelect = document.getElementById('lyDoSelect');
    const lyDoCustom = document.getElementById('lyDoCustom');
    
    if(lyDoSelect) {
        lyDoSelect.addEventListener('change', (e) => {
            if (e.target.value === 'OTHER') {
                if(lyDoCustom) {
                    lyDoCustom.style.display = 'block';
                    lyDoCustom.classList.add('custom-reason-active');
                }
            } else {
                if(lyDoCustom) {
                    lyDoCustom.style.display = 'none';
                    lyDoCustom.classList.remove('custom-reason-active');
                    lyDoCustom.value = '';
                }
            }
            checkFormValidity();
        });
    }

    function checkFormValidity() {
        const emp = window.employeeData && soTheInput ? window.employeeData.find(v => v.soThe === soTheInput.value.trim()) : null;
        const ngay = document.getElementById('ngayTangCa');
        const loai = document.getElementById('loaitangca');

        const ok = (ngay && ngay.value) && emp && (tu && tu.value) && (den && den.value) && (loai && loai.value);
        
        let hasLyDo = false;
        if(lyDoSelect) {
            hasLyDo = lyDoSelect.value === 'OTHER' ? (lyDoCustom && lyDoCustom.value.trim() !== '') : lyDoSelect.value !== '';
        }

        const btnSubmit = document.getElementById('btnSubmit');
        if(btnSubmit) btnSubmit.disabled = !(ok && hasLyDo);
    }

    const ngayTangCa = document.getElementById('ngayTangCa');
    if(ngayTangCa) ngayTangCa.addEventListener('change', checkFormValidity);

    const loaitangca = document.getElementById('loaitangca');
    if(loaitangca) loaitangca.addEventListener('change', checkFormValidity);

    if(lyDoCustom) lyDoCustom.addEventListener('input', checkFormValidity);

    const form = document.getElementById('tangCaForm');
    if(form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const b = document.getElementById('btnSubmit');
            const sp = document.getElementById('spinner');
            const bt = document.getElementById('btnText');
            
            if(b) b.disabled = true;
            if(bt) bt.style.display = 'none';
            if(sp) sp.style.display = 'block';
            
            try {
                // Rút trực tiếp thông tin từ RAM để chống sập khi DOM bị thiếu
                const emp = window.employeeData ? window.employeeData.find(v => v.soThe === (soTheInput ? soTheInput.value.trim() : "")) : null;
                const dParts = ngayTangCa && ngayTangCa.value ? ngayTangCa.value.split('-') : [];
                const editMaPhieu = document.getElementById('editMaPhieu');

                // Toàn bộ Payload được đóng gói an toàn
                const payload = {
                    action: isEditing ? "update" : "submit",
                    maPhieu: isEditing && editMaPhieu ? editMaPhieu.value : "TC-" + Date.now(),
                    idNV: emp ? emp.idNV : "",
                    ngayTangCa: dParts.length === 3 ? `${dParts[2]}/${dParts[1]}/${dParts[0]}` : "",
                    soThe: soTheInput ? soTheInput.value : "",
                    hoTen: emp ? emp.hoTen : "",
                    boPhan: emp ? emp.boPhan : "",
                    tuGio: tu ? tu.value : "",
                    denGio: den ? den.value : "",
                    tongCong: currentTongCongValue, 
                    lyDo: lyDoSelect && lyDoSelect.value === 'OTHER' ? (lyDoCustom ? lyDoCustom.value.trim() : "") : (lyDoSelect ? lyDoSelect.value : ""),
                    loaitangca: loaitangca ? loaitangca.value : "",
                    deviceId: (typeof window.getDeviceId === 'function') ? window.getDeviceId() : "UNKNOWN"
                };

                const r = await fetch(SCRIPT_URL_TANG_CA, { method: 'POST', body: JSON.stringify(payload) });
                const res = await r.json();
                
                if (res.status === "success") {
                    if(typeof window.showToast === 'function') window.showToast(isEditing ? "Cập nhật thành công!" : "Ghi thành công!", true);
                    window.cancelEdit();
                    if(isListVisible && typeof loadList === 'function') loadList();
                } else {
                    if(typeof window.showToast === 'function') window.showToast("Lỗi: " + res.message, false);
                    if(b) b.disabled = false;
                }
            } catch (err) {
                console.error("Lỗi đóng gói hoặc kết nối:", err);
                if(typeof window.showToast === 'function') window.showToast("Lỗi kết nối API!", false);
                if(b) b.disabled = false;
            } finally {
                // Luôn luôn chạy để giải phóng nút bấm
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
            
            if (res.status === "error") {
                if(typeof window.showToast === 'function') window.showToast("Lỗi máy chủ: " + res.message, false);
                return;
            }
            
            if (res.status === "success") {
                const tb = document.getElementById('tableBody');
                if(tb) tb.innerHTML = '';
                
                res.data.forEach(row => {
                    const tr = document.createElement('tr');
                    
                    let actionIcon = row.chk ? `<span style="font-size:16px;">🔒</span>` : `<span style="font-size:16px; cursor:pointer;" onclick="startEdit('${encodeURIComponent(JSON.stringify(row))}')">✏️</span>`;
                    let hTu = row.tuGio ? row.tuGio.toString().substring(0,5) : "--:--";
                    let hDen = row.denGio ? row.denGio.toString().substring(0,5) : "--:--";
                    
                    tr.innerHTML = `<td>${row.ngay}</td><td>${row.soThe}</td><td style="text-align:left; font-weight:500;">${row.hoTen}</td><td>${row.boPhan}</td><td>${hTu}-${hDen}</td><td><span class="status-tag">${row.tong}h</span></td><td style="font-weight:bold; color:#1A73E8">${row.tongNam}h</td><td>${row.lyDo}</td><td>${row.loai}</td><td>${actionIcon}</td>`;
                    
                    if(tb) tb.appendChild(tr);
                });
                
                const dataSection = document.getElementById('dataSection');
                if(dataSection) dataSection.style.display = 'block';
                if(bt) bt.innerText = "ẨN DANH SÁCH";
                isListVisible = true;
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
                const dataSection = document.getElementById('dataSection');
                if(dataSection) dataSection.style.display = 'none';
                
                const btnListText = document.getElementById('btnListText');
                if(btnListText) btnListText.innerText = "XEM DANH SÁCH THÁNG HIỆN TẠI";
                isListVisible = false;
            } else {
                loadList();
            }
        });
    }
});
