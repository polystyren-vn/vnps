const SCRIPT_URL_TANG_CA = "https://script.google.com/macros/s/AKfycbzYXPNw_cGZmvQZR9UNAs6XYEjPi6eBvG0fkeugNYfLN8p7utTXBiIovt6zqYHVoTAbTw/exec";

let isListVisible = false, isEditing = false;
// Cờ RAM Cache (Nâng cấp V2.6)
let isDataLoaded = false; 
let currentTongCongValue = "0.00"; 

window.clearSoThe = () => {
    const i = document.getElementById('soThe');
    if(i) { i.value = ''; i.dispatchEvent(new Event('input')); }
};

window.startEdit = function(dataStr) {
    const data = JSON.parse(decodeURIComponent(dataStr));
    isEditing = true;
    document.getElementById('editMaPhieu').value = data.maPhieu;
    
    if (data.ngay && data.ngay.includes('/')) {
        const [d, m, y] = data.ngay.split('/');
        document.getElementById('ngayTangCa').value = `${y}-${m}-${d}`;
    }
    
    document.getElementById('soThe').value = data.soThe;
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
    document.getElementById('soThe').dispatchEvent(new Event('input', { bubbles: true }));
    document.getElementById('tuGio').dispatchEvent(new Event('change', { bubbles: true }));
};

window.cancelEdit = function() {
    isEditing = false;
    document.getElementById('tangCaForm').reset();
    document.getElementById('editMaPhieu').value = "";
    document.getElementById('btnText').innerText = "GỬI DỮ LIỆU";
    document.getElementById('btnSubmit').style.background = "";
    
    // Reset màu sắc và text ô số thẻ
    const msgSoThe = document.getElementById('msg-soThe');
    msgSoThe.innerHTML = "";
    msgSoThe.classList.remove('name-success', 'name-error');
    
    document.getElementById('msg-tongCong').innerText = "TC: 0.00 (h)";
    
    document.getElementById('reason-select-part').style.display = 'flex';
    document.getElementById('reason-custom-part').style.display = 'none';
    
    document.getElementById('btnSubmit').disabled = true;
};

document.addEventListener("DOMContentLoaded", async () => {
    if(typeof window.loadEmployeesData === 'function') await window.loadEmployeesData();
    
    const soTheInput = document.getElementById('soThe');
    const msgSoThe = document.getElementById('msg-soThe');

    // 1. TÍNH NĂNG ĐỔI MÀU & TEXT BÁO LỖI (Phục hồi chuẩn V2.5)
    soTheInput.addEventListener('input', () => {
        const val = soTheInput.value.trim();
        const emp = window.employeeData ? window.employeeData.find(v => v.soThe === val) : null;
        
        msgSoThe.classList.remove('name-success', 'name-error');

        if (emp) {
            msgSoThe.innerHTML = `${emp.hoTen} - ${emp.boPhan}`;
            msgSoThe.classList.add('name-success'); // Xanh lá
            document.getElementById('hoTenHidden').value = emp.hoTen;
            document.getElementById('boPhanHidden').value = emp.boPhan;
            document.getElementById('idNV').value = emp.idNV;
        } else {
            msgSoThe.innerHTML = val === "" ? "" : "Số thẻ không đúng";
            
            if (val !== "") {
                msgSoThe.classList.add('name-error'); // Đỏ
            }
            
            document.getElementById('hoTenHidden').value = "";
            document.getElementById('boPhanHidden').value = "";
            document.getElementById('idNV').value = "";
        }
        checkFormValidity();
    });

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
            checkFormValidity();
        }
    }

    tu.addEventListener('focus', suggestDefaultTime);
    den.addEventListener('focus', suggestDefaultTime);
    tu.addEventListener('change', () => { calc(); checkFormValidity(); });
    den.addEventListener('change', () => { calc(); checkFormValidity(); });

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
        checkFormValidity();
    });

    btnBack.addEventListener('click', () => {
        lyDoSelect.value = '';
        lyDoCustom.value = '';
        selectPart.style.display = 'flex';
        customPart.style.display = 'none';
        checkFormValidity();
    });

    function checkFormValidity() {
        const ok = document.getElementById('ngayTangCa').value && document.getElementById('idNV').value &&
                   tu.value && den.value && document.getElementById('loaitangca').value;
        let hasLyDo = lyDoSelect.value === 'OTHER' ? lyDoCustom.value.trim() !== '' : lyDoSelect.value !== '';
        document.getElementById('btnSubmit').disabled = !(ok && hasLyDo);
    }

    document.getElementById('ngayTangCa').addEventListener('change', checkFormValidity);
    document.getElementById('loaitangca').addEventListener('change', checkFormValidity);
    lyDoCustom.addEventListener('input', checkFormValidity);

    document.getElementById('tangCaForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const b = document.getElementById('btnSubmit');
        const sp = document.getElementById('spinner');
        const bt = document.getElementById('btnText');
        b.disabled = true; bt.style.display = 'none'; sp.style.display = 'block';
        
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
