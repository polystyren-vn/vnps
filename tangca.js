const SCRIPT_URL_TANG_CA = "https://script.google.com/macros/s/AKfycbzYXPNw_cGZmvQZR9UNAs6XYEjPi6eBvG0fkeugNYfLN8p7utTXBiIovt6zqYHVoTAbTw/exec";

let isListVisible = false;

window.clearSoThe = function() {
    const input = document.getElementById('soThe');
    input.value = '';
    input.dispatchEvent(new Event('input'));
};

document.addEventListener("DOMContentLoaded", async () => {
    await window.loadEmployeesData();

    const soTheInput = document.getElementById('soThe'), idNVInput = document.getElementById('idNV');
    const hoTenHidden = document.getElementById('hoTenHidden'), boPhanHidden = document.getElementById('boPhanHidden');
    const msgSoThe = document.getElementById('msg-soThe');
    
    soTheInput.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        const emp = window.employeeData.find(v => v.soThe === val);
        
        idNVInput.value = emp ? emp.idNV : ""; 
        hoTenHidden.value = emp ? emp.hoTen : ""; 
        boPhanHidden.value = emp ? emp.boPhan : "";

        if (val === "") { 
            soTheInput.classList.remove('is-valid', 'is-invalid');
            msgSoThe.innerHTML = "";
        } else if (emp) { 
            soTheInput.classList.remove('is-invalid'); soTheInput.classList.add('is-valid'); 
            msgSoThe.innerHTML = `<span class="success-text">✅ ${emp.hoTen} (${emp.boPhan})</span>`;
        } else { 
            soTheInput.classList.remove('is-valid'); soTheInput.classList.add('is-invalid'); 
            msgSoThe.innerHTML = `<span class="error-text">❌ Số thẻ không tồn tại</span>`;
        }
        checkFormValidity();
    });

    const tu = document.getElementById('tuGio'), den = document.getElementById('denGio'), tc = document.getElementById('tongCong');
    function setRoundHour(e) { if (!e.target.value) { e.target.value = `${String(new Date().getHours()).padStart(2, '0')}:00`; calc(); checkFormValidity(); } }
    tu.addEventListener('click', setRoundHour); den.addEventListener('click', setRoundHour);

    function calc() {
        if (tu.value && den.value) {
            const s = new Date(`1970-01-01T${tu.value}:00`), e = new Date(`1970-01-01T${den.value}:00`);
            if (e < s) e.setDate(e.getDate() + 1); tc.value = ((e - s) / 3600000).toFixed(2);
        }
    }
    tu.addEventListener('change', () => { calc(); checkFormValidity(); }); den.addEventListener('change', () => { calc(); checkFormValidity(); });

    const lyDoSelect = document.getElementById('lyDoSelect'), lyDoCustom = document.getElementById('lyDoCustom');
    lyDoSelect.addEventListener('change', (e) => {
        if (e.target.value === 'OTHER') { lyDoCustom.style.display = 'block'; }
        else { lyDoCustom.style.display = 'none'; lyDoCustom.value = ''; }
        checkFormValidity();
    });

    function checkFormValidity() {
        const hasNgay = document.getElementById('ngayTangCa').value !== '', isValidNV = idNVInput.value !== '', hasTu = tu.value !== '', hasDen = den.value !== '', hasLoaiCa = document.getElementById('loaiCa').value !== '';
        let hasLyDo = lyDoSelect.value === 'OTHER' ? lyDoCustom.value.trim() !== '' : lyDoSelect.value !== '';
        document.getElementById('btnSubmit').disabled = !(hasNgay && isValidNV && hasTu && hasDen && hasLoaiCa && hasLyDo);
    }
    document.getElementById('ngayTangCa').addEventListener('change', checkFormValidity); document.getElementById('loaiCa').addEventListener('change', checkFormValidity); lyDoCustom.addEventListener('input', checkFormValidity);

    document.getElementById('tangCaForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const b = document.getElementById('btnSubmit'), sp = document.getElementById('spinner'), bt = document.getElementById('btnText');
        b.disabled = true; bt.style.display = 'none'; sp.style.display = 'block';
        
        const rawDate = document.getElementById('ngayTangCa').value;
        const dParts = rawDate.split('-');
        const formattedDate = `${dParts[2]}/${dParts[1]}/${dParts[0]}`;

        const payload = {
            action: "submit", maPhieu: "TC-" + Date.now(), idNV: idNVInput.value, ngayTangCa: formattedDate, soThe: soTheInput.value,
            hoTen: hoTenHidden.value, boPhan: boPhanHidden.value, tuGio: tu.value, denGio: den.value, tongCong: tc.value,
            lyDo: lyDoSelect.value === 'OTHER' ? lyDoCustom.value.trim() : lyDoSelect.value, 
            loaiCa: document.getElementById('loaiCa').value,
            deviceId: window.getDeviceId()
        };
        try {
            const r = await fetch(SCRIPT_URL_TANG_CA, { method: 'POST', body: JSON.stringify(payload) });
            const res = await r.json();
            if (res.status === "success") { 
                window.showToast("Ghi thành công!", true); e.target.reset(); lyDoCustom.style.display = 'none'; msgSoThe.innerHTML = ""; soTheInput.classList.remove('is-valid'); checkFormValidity(); 
            } else { window.showToast("Lỗi: " + res.message, false); b.disabled = false; }
        } catch (err) { window.showToast("Lỗi kết nối API!", false); b.disabled = false;}
        finally { bt.style.display = 'block'; sp.style.display = 'none'; }
    });

    document.getElementById('btnViewList').addEventListener('click', async () => {
        const b = document.getElementById('btnViewList'), sp = document.getElementById('spinnerList'), bt = document.getElementById('btnListText'), dsSection = document.getElementById('dataSection');
        if (isListVisible) { dsSection.style.display = 'none'; bt.textContent = 'XEM DANH SÁCH THÁNG HIỆN TẠI'; isListVisible = false; return; }
        b.disabled = true; bt.style.display = 'none'; sp.style.display = 'block';
        try {
            const r = await fetch(SCRIPT_URL_TANG_CA, { method: 'POST', body: JSON.stringify({ action: "getData" }) });
            const res = await r.json();
            if (res.status === "success") {
                const tb = document.getElementById('tableBody'); tb.innerHTML = '';
                const n = new Date(); document.getElementById('listTitle').textContent = `DANH SÁCH TĂNG CA THÁNG ${n.getMonth()+1}/${n.getFullYear()}`;
                res.data.forEach(row => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `<td>${row.ngay}</td><td>${row.soThe}</td><td style="font-weight:500">${row.hoTen}</td><td>${row.boPhan}</td><td>${row.tuGio}-${row.denGio}</td><td><span class="status-tag">${row.tongCong}h</span></td><td>${row.lyDo}</td><td>${row.loaiCa}</td>`;
                    tb.appendChild(tr);
                });
                dsSection.style.display = 'block'; bt.textContent = 'ẨN DANH SÁCH'; isListVisible = true;
                window.scrollTo({ top: dsSection.offsetTop - 20, behavior: 'smooth' });
            }
        } catch (e) { window.showToast("Lỗi tải danh sách!", false); }
        finally { b.disabled = false; bt.style.display = 'block'; sp.style.display = 'none'; }
    });
});
