const SCRIPT_URL_TANG_CA = "https://script.google.com/macros/s/AKfycbzYXPNw_cGZmvQZR9UNAs6XYEjPi6eBvG0fkeugNYfLN8p7utTXBiIovt6zqYHVoTAbTw/exec";
const SCRIPT_URL_DOI_CA = "https://script.google.com/macros/s/AKfycbx_jVG3kSre3zfwGlTysgIoN11CNGM_G4bAQYt26T0cB1VYB3r6USMQygLxALIQleJe/exec";
const JSON_URL = "https://polystyren-vn.github.io/TangCaPS/data/employees.json";


let employeeData = [];
let isListVisible = false;

document.addEventListener("DOMContentLoaded", () => {
    
    // --- CHUNG: MENU & TOAST ---
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

    // TẢI CHUNG DANH BẠ NHÂN SỰ
    fetch(JSON_URL).then(r => r.json()).then(d => employeeData = d).catch(e => console.log("JSON Error"));


    // ==========================================
    // MODULE 1: LOGIC TAB TĂNG CA (Giữ nguyên)
    // ==========================================
    const soTheInput = document.getElementById('soThe'), idNVInput = document.getElementById('idNV'), hoTenInput = document.getElementById('hoTen'), boPhanInput = document.getElementById('boPhan');
    soTheInput.addEventListener('input', (e) => {
        const val = e.target.value.trim(); const emp = employeeData.find(v => v.soThe === val);
        idNVInput.value = emp ? emp.idNV : ""; hoTenInput.value = emp ? emp.hoTen : ""; boPhanInput.value = emp ? emp.boPhan : "";
        if (val === "") soTheInput.classList.remove('is-valid', 'is-invalid');
        else if (emp) { soTheInput.classList.remove('is-invalid'); soTheInput.classList.add('is-valid'); }
        else { soTheInput.classList.remove('is-valid'); soTheInput.classList.add('is-invalid'); }
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
        if (e.target.value === 'OTHER') { lyDoCustom.style.display = 'block'; lyDoCustom.classList.add('custom-reason-active'); }
        else { lyDoCustom.style.display = 'none'; lyDoCustom.classList.remove('custom-reason-active'); lyDoCustom.value = ''; }
        checkFormValidity();
    });

    function checkFormValidity() {
        const hasNgay = document.getElementById('ngayTangCa').value !== ''; const isValidNV = idNVInput.value !== '';
        const hasTu = tu.value !== ''; const hasDen = den.value !== ''; const hasLoaiCa = document.getElementById('loaiCa').value !== '';
        const hasLyDo = lyDoSelect.value === 'OTHER' ? lyDoCustom.value.trim() !== '' : lyDoSelect.value !== '';
        document.getElementById('btnSubmit').disabled = !(hasNgay && isValidNV && hasTu && hasDen && hasLoaiCa && hasLyDo);
    }
    document.getElementById('ngayTangCa').addEventListener('change', checkFormValidity); document.getElementById('loaiCa').addEventListener('change', checkFormValidity); lyDoCustom.addEventListener('input', checkFormValidity);

    document.getElementById('tangCaForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const b = document.getElementById('btnSubmit'), sp = document.getElementById('spinner'), bt = document.getElementById('btnText');
        b.disabled = true; bt.style.display = 'none'; sp.style.display = 'block';
        const lv = lyDoSelect.value;
        const payload = {
            action: "submit", maPhieu: "TC-" + Date.now(), idNV: idNVInput.value, ngayTangCa: document.getElementById('ngayTangCa').value, soThe: soTheInput.value,
            hoTen: hoTenInput.value, boPhan: boPhanInput.value, tuGio: tu.value, denGio: den.value, tongCong: tc.value,
            lyDo: lv === 'OTHER' ? lyDoCustom.value.trim() : lv, loaiCa: document.getElementById('loaiCa').value
        };
        try {
            const r = await fetch(SCRIPT_URL_TANG_CA, { method: 'POST', body: JSON.stringify(payload) });
            const res = await r.json();
            if (res.status === "success") { showToast("Ghi thành công!", true); e.target.reset(); lyDoCustom.style.display = 'none'; soTheInput.classList.remove('is-valid', 'is-invalid'); checkFormValidity(); }
            else { showToast("Lỗi: " + res.message, false); b.disabled = false; }
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


    // ==========================================
    // MODULE 2: LOGIC TAB ĐỔI CA (Tích hợp Auto-load Grid 7 ngày)
    // ==========================================
    
    // Tự động set Ngày bắt đầu là ngày hôm nay
    const startDateInput = document.getElementById('startDate');
    const today = new Date();
    startDateInput.value = today.toISOString().split('T')[0];

    const id1 = document.getElementById('id1'), id2 = document.getElementById('id2');
    const msg1 = document.getElementById('msg-id1'), msg2 = document.getElementById('msg-id2');
    const grid7 = document.getElementById('grid7'), btnSaveDoiCa = document.getElementById('btnSaveDoiCa');
    
    let isId1Ok = false, isId2Ok = true;

    // Lộ ra hàm clearField cho thẻ HTML gọi vào
    window.clearField = function(id) {
        document.getElementById(id).value = "";
        validateLocalDoiCa();
    };

    function validateLocalDoiCa() {
        const val1 = id1.value.trim(); const val2 = id2.value.trim();
        const emp1 = employeeData.find(v => v.soThe === val1);
        const emp2 = employeeData.find(v => v.soThe === val2);

        // Check NV 1
        if (val1 === "") { msg1.innerHTML = ""; isId1Ok = false; id1.classList.remove('is-valid', 'is-invalid');} 
        else if (emp1) {
            msg1.innerHTML = `<span class="success-text">✅ ${emp1.hoTen} (${emp1.boPhan})</span>`;
            isId1Ok = true; id1.classList.remove('is-invalid'); id1.classList.add('is-valid');
        } else {
            msg1.innerHTML = '<span class="error-text">❌ Số thẻ không tồn tại</span>';
            isId1Ok = false; id1.classList.remove('is-valid'); id1.classList.add('is-invalid');
        }

        // Check NV 2
        if (val2 === "") { msg2.innerHTML = ""; isId2Ok = true; id2.classList.remove('is-valid', 'is-invalid');} 
        else if (emp2) {
            if (val2 === val1) {
                msg2.innerHTML = '<span class="error-text">❌ Trùng số thẻ NV1</span>'; isId2Ok = false; id2.classList.add('is-invalid');
            } else if (isId1Ok && emp1.boPhan !== emp2.boPhan) {
                msg2.innerHTML = `<span class="error-text">❌ Khác bộ phận (${emp2.boPhan})</span>`; isId2Ok = false; id2.classList.add('is-invalid');
            } else {
                msg2.innerHTML = `<span class="success-text">✅ ${emp2.hoTen} (${emp2.boPhan})</span>`; isId2Ok = true; id2.classList.remove('is-invalid'); id2.classList.add('is-valid');
            }
        } else {
            msg2.innerHTML = '<span class="error-text">❌ Số thẻ không tồn tại</span>'; isId2Ok = false; id2.classList.remove('is-valid'); id2.classList.add('is-invalid');
        }

        // Nếu thông tin đúng hết, TỰ ĐỘNG GỌI BẢNG LỊCH 7 NGÀY
        if (isId1Ok && isId2Ok && startDateInput.value !== "") {
            autoLoadSchedule();
        } else {
            grid7.style.display = 'none';
            btnSaveDoiCa.style.display = 'none';
        }
    }

    id1.addEventListener('input', validateLocalDoiCa);
    id2.addEventListener('input', validateLocalDoiCa);
    startDateInput.addEventListener('change', validateLocalDoiCa);

    async function autoLoadSchedule() {
        grid7.style.display = 'block';
        grid7.innerHTML = `<div style="text-align:center; padding: 20px;"><div class="spinner spinner-blue" style="display:inline-block; border-top-color:transparent;"></div><br><small style="color:var(--text-sub)">Đang tải lịch từ hệ thống...</small></div>`;
        btnSaveDoiCa.style.display = 'none';

        try {
            const r = await fetch(SCRIPT_URL_DOI_CA, { 
                method: 'POST', 
                body: JSON.stringify({ action: "getSchedule", id1: id1.value.trim(), id2: id2.value.trim(), startDate: startDateInput.value }) 
            });
            const res = await r.json();
            if (res.status === "success") {
                renderGrid(res.data, id2.value.trim());
            } else {
                grid7.innerHTML = `<div style="text-align:center; padding: 20px; color: var(--error);">${res.message}</div>`;
            }
        } catch (err) {
            grid7.innerHTML = `<div style="text-align:center; padding: 20px; color: var(--error);">Lỗi kết nối máy chủ!</div>`;
        }
    }

    function renderGrid(data, i2) {
        const isSwap = i2 !== "";
        let html = `<div class="grid-header"><div>NGÀY</div><div>${id1.value}</div><div>${isSwap ? i2 : 'CA MỚI'}</div></div>`;
        
        data.forEach(day => {
            let ds = day.date.split('-').reverse().slice(0, 2).join('/');
            let rHtml = `<div class="day-row ${day.isSun ? 'sunday' : ''}" data-date="${day.date}">
                <div class="col-date">${ds}</div>
                <div class="col-nv1"><span class="badge">${day.s1}</span></div>
                <div class="col-nv2">`;
            
            if (isSwap) {
                rHtml += `<span class="badge">${day.s2}</span></div></div>`;
            } else {
                rHtml += `<select class="new-shift"><option value="">--</option><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option><option value="N">N</option></select></div></div>`;
            }
            html += rHtml;
        });

        grid7.innerHTML = html;
        btnSaveDoiCa.style.display = 'flex';
        document.getElementById('btnSaveTextDoiCa').innerText = isSwap ? "XÁC NHẬN ĐỔI CA" : "XÁC NHẬN CẬP NHẬT";
        
        // Gắn sự kiện click (cho đổi ca) và change (cho select)
        const rows = grid7.querySelectorAll('.day-row');
        rows.forEach(row => {
            if (isSwap) {
                row.style.cursor = "pointer";
                row.onclick = function() { this.classList.toggle('row-selected'); updateSaveBtnDoiCa(); };
            } else {
                const select = row.querySelector('.new-shift');
                select.onchange = function() { 
                    if(this.value !== "") row.classList.add('row-selected'); 
                    else row.classList.remove('row-selected');
                    updateSaveBtnDoiCa(); 
                };
            }
        });
        updateSaveBtnDoiCa();
    }

    function updateSaveBtnDoiCa() {
        const selectedRows = grid7.querySelectorAll('.day-row.row-selected');
        btnSaveDoiCa.disabled = selectedRows.length === 0;
    }

    window.submitDoiCa = async function() {
        const selectedRows = grid7.querySelectorAll('.day-row.row-selected');
        const selectedDays = [];
        const isSwap = id2.value.trim() !== "";

        selectedRows.forEach(row => {
            selectedDays.push({ 
                date: row.getAttribute('data-date'), 
                newShift: isSwap ? null : row.querySelector('.new-shift').value 
            });
        });

        const emp1 = employeeData.find(v => v.soThe === id1.value.trim());
        const emp2 = isSwap ? employeeData.find(v => v.soThe === id2.value.trim()) : null;

        const payload = {
            action: "update",
            payload: { 
                id1: id1.value.trim(), 
                id2: id2.value.trim(), 
                name1: emp1.hoTen, 
                name2: emp2 ? emp2.hoTen : null,
                selectedDays: selectedDays 
            }
        };

        btnSaveDoiCa.disabled = true; document.getElementById('btnSaveTextDoiCa').style.display = 'none'; document.getElementById('spinnerSaveDoiCa').style.display = 'block';
        try {
            const r = await fetch(SCRIPT_URL_DOI_CA, { method: 'POST', body: JSON.stringify(payload) });
            const res = await r.json();
            if (res.status === "success") { 
                showToast("Đổi ca thành công!", true); 
                clearField('id1'); clearField('id2'); grid7.style.display = 'none'; btnSaveDoiCa.style.display = 'none';
            } else { showToast("Lỗi: " + res.message, false); btnSaveDoiCa.disabled = false;}
        } catch (err) { showToast("Lỗi kết nối API Đổi ca!", false); btnSaveDoiCa.disabled = false;}
        finally { document.getElementById('btnSaveTextDoiCa').style.display = 'block'; document.getElementById('spinnerSaveDoiCa').style.display = 'none'; }
    };
});
