const SCRIPT_URL_TANG_CA = "https://script.google.com/macros/s/AKfycbzYXPNw_cGZmvQZR9UNAs6XYEjPi6eBvG0fkeugNYfLN8p7utTXBiIovt6zqYHVoTAbTw/exec";

let isListVisible = false, isEditing = false;

window.clearSoThe = () => { const i = document.getElementById('soThe'); i.value = ''; i.dispatchEvent(new Event('input')); };

// CHỨC NĂNG MỚI: Reset UI Lý do (Khi ấn nút X ở ô Custom)
window.resetReason = () => {
    const sel = document.getElementById('lyDoSelect');
    sel.value = '';
    document.getElementById('lyDoCustom').value = '';
    document.getElementById('reasonDropdownContainer').style.display = 'block';
    document.getElementById('reasonInputContainer').style.display = 'none';
    document.getElementById('lyDoCustom').classList.remove('custom-reason-active');
    sel.dispatchEvent(new Event('change')); // Kích hoạt update nút Save
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
    
    const selectLyDo = document.getElementById('lyDoSelect');
    const options = Array.from(selectLyDo.options).map(opt => opt.value);
    
    // CẬP NHẬT 2: Phục hồi UI khi bấm Edit
    if(options.includes(data.lyDo) && data.lyDo !== 'OTHER') {
        selectLyDo.value = data.lyDo;
        document.getElementById('reasonDropdownContainer').style.display = 'block';
        document.getElementById('reasonInputContainer').style.display = 'none';
    } else {
        selectLyDo.value = "OTHER";
        document.getElementById('reasonDropdownContainer').style.display = 'none';
        document.getElementById('reasonInputContainer').style.display = 'block';
        document.getElementById('lyDoCustom').value = data.lyDo;
    }
    document.getElementById('loaiCa').value = data.loai;
    
    document.getElementById('btnText').innerText = "CẬP NHẬT DỮ LIỆU";
    document.getElementById('btnSubmit').style.background = "#e67e22";
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    document.getElementById('soThe').dispatchEvent(new Event('input', { bubbles: true }));
    document.getElementById('tuGio').dispatchEvent(new Event('change', { bubbles: true }));
};

window.cancelEdit = function() {
    isEditing = false; 
    document.getElementById('tangCaForm').reset();
    document.getElementById('editMaPhieu').value = "";
    document.getElementById('btnText').innerText = "GỬI DỮ LIỆU";
    document.getElementById('btnSubmit').style.background = ""; 
    
    // CẬP NHẬT 1 & 2: Reset UI
    window.resetReason();
    document.getElementById('tongGioText').style.display = 'none';
    
    document.getElementById('msg-soThe').innerHTML = "";
    document.getElementById('soThe').classList.remove('is-valid', 'is-invalid');
    
    document.getElementById('btnSubmit').disabled = true; 
};

document.addEventListener("DOMContentLoaded", async () => {
    await window.loadEmployeesData();
    const soTheInput = document.getElementById('soThe'), idNVInput = document.getElementById('idNV'), msgSoThe = document.getElementById('msg-soThe');
    
    soTheInput.addEventListener('input', () => {
        const val = soTheInput.value.trim();
        const emp = window.employeeData.find(v => v.soThe === val);
        idNVInput.value = emp ? emp.idNV : ""; 
        document.getElementById('hoTenHidden').value = emp ? emp.hoTen : "";
        document.getElementById('boPhanHidden').value = emp ? emp.boPhan : "";
        if (val === "") { soTheInput.classList.remove('is-valid', 'is-invalid'); msgSoThe.innerHTML = ""; }
        else if (emp) { soTheInput.classList.remove('is-invalid'); soTheInput.classList.add('is-valid'); msgSoThe.innerHTML = `<span class="success-text">✅ ${emp.hoTen} - ${emp.boPhan}</span>`; }
        else { soTheInput.classList.remove('is-valid'); soTheInput.classList.add('is-invalid'); msgSoThe.innerHTML = `<span class="error-text">❌ Số thẻ không tồn tại</span>`; }
        checkFormValidity();
    });

    const tu = document.getElementById('tuGio'), den = document.getElementById('denGio'), tc = document.getElementById('tongCong');
    function setRoundHour(e) { 
        if (!e.target.value) { 
            const d = new Date(); 
            e.target.value = `${String(d.getHours()).padStart(2, '0')}:00`; 
            calc(); checkFormValidity(); 
        } 
    }
    tu.addEventListener('click', setRoundHour); den.addEventListener('click', setRoundHour);

    // CẬP NHẬT 1: Tính giờ và xuất ra Text
    function calc() {
        if (tu.value && den.value) {
            let s = new Date(`1970-01-01T${tu.value}:00`), e = new Date(`1970-01-01T${den.value}:00`);
            if (e < s) e.setDate(e.getDate() + 1);
            tc.value = ((e - s) / 3600000).toFixed(2);
            document.getElementById('tongGioText').innerText = `Tổng Cộng: ${tc.value} (Giờ)`;
            document.getElementById('tongGioText').style.display = 'block';
        } else {
            tc.value = "";
            document.getElementById('tongGioText').style.display = 'none';
        }
    }
    tu.addEventListener('change', () => { calc(); checkFormValidity(); });
    den.addEventListener('change', () => { calc(); checkFormValidity(); });

    // CẬP NHẬT 2: Thay đổi UI khi chọn OTHER
    const lyDoSelect = document.getElementById('lyDoSelect'), lyDoCustom = document.getElementById('lyDoCustom');
    lyDoSelect.addEventListener('change', (e) => {
        if (e.target.value === 'OTHER') { 
            document.getElementById('reasonDropdownContainer').style.display = 'none';
            document.getElementById('reasonInputContainer').style.display = 'block';
            lyDoCustom.classList.add('custom-reason-active'); 
            lyDoCustom.focus();
        }
        else { 
            document.getElementById('reasonDropdownContainer').style.display = 'block';
            document.getElementById('reasonInputContainer').style.display = 'none';
            lyDoCustom.classList.remove('custom-reason-active'); 
            lyDoCustom.value = ''; 
        }
        checkFormValidity();
    });

    function checkFormValidity() {
        const ok = document.getElementById('ngayTangCa').value && idNVInput.value && tu.value && den.value && document.getElementById('loaiCa').value;
        let hasLyDo = lyDoSelect.value === 'OTHER' ? lyDoCustom.value.trim() !== '' : lyDoSelect.value !== '';
        document.getElementById('btnSubmit').disabled = !(ok && hasLyDo);
    }
    document.getElementById('ngayTangCa').addEventListener('change', checkFormValidity); document.getElementById('loaiCa').addEventListener('change', checkFormValidity); lyDoCustom.addEventListener('input', checkFormValidity);

    document.getElementById('tangCaForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const b = document.getElementById('btnSubmit'), sp = document.getElementById('spinner'), bt = document.getElementById('btnText');
        b.disabled = true; bt.style.display = 'none'; sp.style.display = 'block';
        const dParts = document.getElementById('ngayTangCa').value.split('-');
        const payload = {
            action: isEditing ? "update" : "submit",
            maPhieu: isEditing ? document.getElementById('editMaPhieu').value : "TC-" + Date.now(),
            idNV: idNVInput.value, ngayTangCa: `${dParts[2]}/${dParts[1]}/${dParts[0]}`,
            soThe: soTheInput.value, hoTen: document.getElementById('hoTenHidden').value,
            boPhan: document.getElementById('boPhanHidden').value, tuGio: tu.value,
            denGio: den.value, tongCong: tc.value,
            lyDo: lyDoSelect.value === 'OTHER' ? lyDoCustom.value.trim() : lyDoSelect.value, 
            loaiCa: document.getElementById('loaiCa').value,
            deviceId: window.getDeviceId()
        };
        try {
            const r = await fetch(SCRIPT_URL_TANG_CA, { method: 'POST', body: JSON.stringify(payload) });
            const res = await r.json();
            if (res.status === "success") { 
                window.showToast(isEditing ? "Cập nhật thành công!" : "Ghi thành công!", true); 
                window.cancelEdit(); 
                if(isListVisible) loadList(); 
            }
            else { window.showToast("Lỗi: " + res.message, false); b.disabled = false; }
        } catch (err) { window.showToast("Lỗi kết nối API!", false); b.disabled = false; }
        finally { bt.style.display = 'block'; sp.style.display = 'none'; }
    });

    async function loadList() {
        const b = document.getElementById('btnViewList'), sp = document.getElementById('spinnerList'), bt = document.getElementById('btnListText');
        b.disabled = true; bt.style.display = 'none'; sp.style.display = 'block';
        try {
            const r = await fetch(SCRIPT_URL_TANG_CA, { method: 'POST', body: JSON.stringify({ action: "getData" }) });
            const res = await r.json();
            
            if (res.status === "error") {
                window.showToast("Lỗi máy chủ: " + res.message, false);
                return;
            }
            
            if (res.status === "success") {
                const tb = document.getElementById('tableBody'); tb.innerHTML = '';
                res.data.forEach(row => {
                    const tr = document.createElement('tr');
                    
                    let actionIcon = row.chk ? `<span style="font-size:16px;">🔒</span>` : `<span style="font-size:16px; cursor:pointer;" onclick="startEdit('${encodeURIComponent(JSON.stringify(row))}')">✏️</span>`;
                    
                    let hTu = row.tuGio ? row.tuGio.toString().substring(0,5) : "--:--";
                    let hDen = row.denGio ? row.denGio.toString().substring(0,5) : "--:--";
                    
                    tr.innerHTML = `<td>${row.ngay}</td><td>${row.soThe}</td><td style="text-align:left; font-weight:500;">${row.hoTen}</td><td>${row.boPhan}</td><td>${hTu}-${hDen}</td><td><span class="status-tag">${row.tong}h</span></td><td style="font-weight:bold; color:#1A73E8">${row.tongNam}h</td><td>${row.lyDo}</td><td>${row.loai}</td><td>${actionIcon}</td>`;
                    tb.appendChild(tr);
                });
                document.getElementById('dataSection').style.display = 'block';
                bt.innerText = "ẨN DANH SÁCH";
                isListVisible = true;
            }
        } catch(e) { 
            window.showToast("Lỗi tải danh sách (Network/Code)!", false); 
            console.error(e);
        }
        finally { b.disabled = false; bt.style.display = 'block'; sp.style.display = 'none'; }
    }

    document.getElementById('btnViewList').addEventListener('click', () => { 
        if(isListVisible) { 
            document.getElementById('dataSection').style.display='none'; 
            document.getElementById('btnListText').innerText = "XEM DANH SÁCH THÁNG HIỆN TẠI";
            isListVisible = false; 
        } else { 
            loadList(); 
        } 
    });
});
