const SCRIPT_URL_TANG_CA = "https://script.google.com/macros/s/AKfycbzYXPNw_cGZmvQZR9UNAs6XYEjPi6eBvG0fkeugNYfLN8p7utTXBiIovt6zqYHVoTAbTw/exec";
const SCRIPT_URL_DOI_CA = "https://script.google.com/macros/s/AKfycbx_jVG3kSre3zfwGlTysgIoN11CNGM_G4bAQYt26T0cB1VYB3r6USMQygLxALIQleJe/exec";
const JSON_URL = "https://polystyren-vn.github.io/TangCaPS/data/employees.json";

let employeeData = [];
let isListVisible = false;

document.addEventListener("DOMContentLoaded", () => {
    
    const navBtns = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            navBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.getAttribute('data-target')).classList.add('active');
            window.scrollTo(0, 0);
        });
    });

    const toast = document.getElementById('toast');
    function showToast(m, o) {
        toast.textContent = m; toast.style.backgroundColor = o ? '#137333' : '#D93025';
        toast.style.top = '20px'; setTimeout(() => toast.style.top = '-100px', 3000);
    }

    fetch(JSON_URL).then(r => r.json()).then(d => employeeData = d).catch(e => console.log("JSON Error"));

    const soTheInput = document.getElementById('soThe');
    const idNVInput = document.getElementById('idNV');
    const hoTenInput = document.getElementById('hoTen');
    const boPhanInput = document.getElementById('boPhan');
    
    soTheInput.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        const emp = employeeData.find(v => v.soThe === val);
        idNVInput.value = emp ? emp.idNV : "";
        hoTenInput.value = emp ? emp.hoTen : "";
        boPhanInput.value = emp ? emp.boPhan : "";
        if (val === "") soTheInput.classList.remove('is-valid', 'is-invalid');
        else if (emp) { soTheInput.classList.remove('is-invalid'); soTheInput.classList.add('is-valid'); }
        else { soTheInput.classList.remove('is-valid'); soTheInput.classList.add('is-invalid'); }
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

    function calc() {
        if (tu.value && den.value) {
            const s = new Date(`1970-01-01T${tu.value}:00`), e = new Date(`1970-01-01T${den.value}:00`);
            if (e < s) e.setDate(e.getDate() + 1);
            tc.value = ((e - s) / 3600000).toFixed(2);
        }
    }
    tu.addEventListener('change', () => { calc(); checkFormValidity(); }); 
    den.addEventListener('change', () => { calc(); checkFormValidity(); });

    const lyDoSelect = document.getElementById('lyDoSelect'), lyDoCustom = document.getElementById('lyDoCustom');
    lyDoSelect.addEventListener('change', (e) => {
        if (e.target.value === 'OTHER') { lyDoCustom.style.display = 'block'; lyDoCustom.classList.add('custom-reason-active'); }
        else { lyDoCustom.style.display = 'none'; lyDoCustom.classList.remove('custom-reason-active'); lyDoCustom.value = ''; }
        checkFormValidity();
    });

    function checkFormValidity() {
        const hasNgay = document.getElementById('ngayTangCa').value !== '';
        const isValidNV = idNVInput.value !== '';
        const hasTu = tu.value !== '';
        const hasDen = den.value !== '';
        const hasLoaiCa = document.getElementById('loaiCa').value !== '';
        const hasLyDo = lyDoSelect.value === 'OTHER' ? lyDoCustom.value.trim() !== '' : lyDoSelect.value !== '';
        document.getElementById('btnSubmit').disabled = !(hasNgay && isValidNV && hasTu && hasDen && hasLoaiCa && hasLyDo);
    }

    document.getElementById('ngayTangCa').addEventListener('change', checkFormValidity);
    document.getElementById('loaiCa').addEventListener('change', checkFormValidity);
    lyDoCustom.addEventListener('input', checkFormValidity);

    document.getElementById('tangCaForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const b = document.getElementById('btnSubmit'), sp = document.getElementById('spinner'), bt = document.getElementById('btnText');
        b.disabled = true; bt.style.display = 'none'; sp.style.display = 'block';
        const lv = lyDoSelect.value;
        const payload = {
            action: "submit", maPhieu: "TC-" + Date.now(), idNV: idNVInput.value,
            ngayTangCa: document.getElementById('ngayTangCa').value, soThe: soTheInput.value,
            hoTen: hoTenInput.value, boPhan: boPhanInput.value,
            tuGio: tu.value, denGio: den.value, tongCong: tc.value,
            lyDo: lv === 'OTHER' ? lyDoCustom.value.trim() : lv, loaiCa: document.getElementById('loaiCa').value
        };
        try {
            const r = await fetch(SCRIPT_URL_TANG_CA, { method: 'POST', body: JSON.stringify(payload) });
            const res = await r.json();
            if (res.status === "success") { 
                showToast("Ghi thành công!", true); e.target.reset(); 
                lyDoCustom.style.display = 'none'; soTheInput.classList.remove('is-valid', 'is-invalid'); checkFormValidity(); 
            } else { showToast("Lỗi: " + res.message, false); b.disabled = false; }
        } catch (err) { showToast("Lỗi kết nối API!", false); b.disabled = false;}
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
        } catch (e) { showToast("Lỗi tải danh sách!", false); }
        finally { b.disabled = false; bt.style.display = 'block'; sp.style.display = 'none'; }
    });

    const id1 = document.getElementById('idNV1'), id2 = document.getElementById('idNV2'), i1 = document.getElementById('infoNV1'), i2 = document.getElementById('infoNV2'), nDC = document.getElementById('ngayDoiCa'), btnDoiCa = document.getElementById('btnSubmitDoiCa');

    function drawGrid() {
        const cont = document.getElementById('gridContainer'), dVal = nDC.value, v2 = id2.value.trim();
        if (!dVal) { cont.innerHTML = ""; return; }
        const isSwap = v2 !== "";
        let html = '<div class="table-responsive"><table class="data-table"><thead><tr><th>Ngày</th><th>Thao tác</th></tr></thead><tbody>';
        const start = new Date(dVal);
        for (let i = 0; i < 7; i++) {
            const d = new Date(start); d.setDate(d.getDate() + i);
            const dStr = d.toLocaleDateString('vi-VN'), iso = d.toISOString().split('T')[0];
            html += `<tr class="${isSwap ? 'highlight' : ''}"><td>${dStr}</td><td>`;
            if (isSwap) html += `<label style="display:flex; align-items:center; gap:8px;"><input type="checkbox" name="swapDays" value="${iso}"> Chọn đổi ngày này</label>`;
            else html += `<select class="shift-select" data-date="${iso}"><option value="">Giữ nguyên</option><option value="A">Ca A</option><option value="B">Ca B</option><option value="C">Ca C</option><option value="D">Ca D</option><option value="N">Ca N</option></select>`;
            html += `</td></tr>`;
        }
        html += '</tbody></table></div>';
        cont.innerHTML = html;
    }

    function valDoiCa() {
        let ok = true, e1 = null, e2 = null;
        const v1 = id1.value.trim();
        if (v1) {
            e1 = employeeData.find(v => v.soThe === v1);
            if (e1) { i1.textContent = `✅ ${e1.hoTen} - ${e1.boPhan}`; i1.style.color = 'var(--success)'; id1.classList.remove('is-invalid'); id1.classList.add('is-valid'); }
            else { i1.textContent = `❌ Số thẻ không tồn tại`; i1.style.color = 'var(--error)'; id1.classList.remove('is-valid'); id1.classList.add('is-invalid'); ok = false; }
        } else { i1.textContent = ''; id1.classList.remove('is-valid', 'is-invalid'); ok = false; }

        const v2 = id2.value.trim();
        if (v2) {
            e2 = employeeData.find(v => v.soThe === v2);
            if (e2) {
                if (e1 && e1.boPhan !== e2.boPhan) { i2.textContent = `❌ Khác bộ phận với NV1`; i2.style.color = 'var(--error)'; id2.classList.remove('is-valid'); id2.classList.add('is-invalid'); ok = false; }
                else { i2.textContent = `✅ ${e2.hoTen} - ${e2.boPhan}`; i2.style.color = 'var(--success)'; id2.classList.remove('is-invalid'); id2.classList.add('is-valid'); }
            } else { i2.textContent = `❌ Số thẻ không tồn tại`; i2.style.color = 'var(--error)'; id2.classList.remove('is-valid'); id2.classList.add('is-invalid'); ok = false; }
        } else { i2.textContent = ''; id2.classList.remove('is-valid', 'is-invalid'); }

        if (!nDC.value) ok = false;
        btnDoiCa.disabled = !ok;
        if (ok) drawGrid(); else document.getElementById('gridContainer').innerHTML = "";
    }

    id1.addEventListener('input', valDoiCa); id2.addEventListener('input', valDoiCa); nDC.addEventListener('change', valDoiCa);

    document.getElementById('doiCaForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        btnDoiCa.disabled = true; document.getElementById('btnTextDoiCa').style.display = 'none'; document.getElementById('spinnerDoiCa').style.display = 'block';
        
        let cStr = "";
        if (id2.value.trim() !== "") {
            const ds = Array.from(document.querySelectorAll('input[name="swapDays"]:checked')).map(c => c.value);
            if(ds.length === 0) { showToast("Vui lòng tích chọn ngày đổi!", false); btnDoiCa.disabled = false; document.getElementById('btnTextDoiCa').style.display = 'block'; document.getElementById('spinnerDoiCa').style.display = 'none'; return; }
            cStr = `Đổi ca với ${id2.value} các ngày: ${ds.join(', ')}`;
        } else {
            let ups = [];
            document.querySelectorAll('.shift-select').forEach(s => { if (s.value) ups.push(`${s.getAttribute('data-date')}: ${s.value}`); });
            if(ups.length === 0) { showToast("Vui lòng chọn ít nhất 1 ca!", false); btnDoiCa.disabled = false; document.getElementById('btnTextDoiCa').style.display = 'block'; document.getElementById('spinnerDoiCa').style.display = 'none'; return; }
            cStr = `Cập nhật ca: ${ups.join(' | ')}`;
        }

        const payload = {
            action: "update",
            payload: { id1: id1.value, id2: id2.value, name1: i1.textContent.replace('✅ ', '').split(' - ')[0], date: nDC.value, content: cStr }
        };

        try {
            const r = await fetch(SCRIPT_URL_DOI_CA, { method: 'POST', body: JSON.stringify(payload) });
            const res = await r.json();
            if (res.status === "success") { showToast("Cập nhật ca thành công!", true); e.target.reset(); document.getElementById('gridContainer').innerHTML = ""; valDoiCa(); }
            else { showToast("Lỗi: " + res.message, false); }
        } catch (err) { showToast("Lỗi kết nối API Đổi Ca!", false); }
        finally { btnDoiCa.disabled = false; document.getElementById('btnTextDoiCa').style.display = 'block'; document.getElementById('spinnerDoiCa').style.display = 'none'; }
    });
});
