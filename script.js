const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzYXPNw_cGZmvQZR9UNAs6XYEjPi6eBvG0fkeugNYfLN8p7utTXBiIovt6zqYHVoTAbTw/exec";
const JSON_URL = "https://polystyren-vn.github.io/TangCaPS/data/employees.json";
let employeeData = [];
let isListVisible = false;

document.addEventListener("DOMContentLoaded", () => {
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
    
    // Xử lý kiểm tra số thẻ & Đổi màu viền
    soTheInput.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        const emp = employeeData.find(v => v.soThe === val);
        
        idNVInput.value = emp ? emp.idNV : "";
        hoTenInput.value = emp ? emp.hoTen : "";
        boPhanInput.value = emp ? emp.boPhan : "";

        if (val === "") {
            soTheInput.classList.remove('is-valid', 'is-invalid');
        } else if (emp) {
            soTheInput.classList.remove('is-invalid');
            soTheInput.classList.add('is-valid');
        } else {
            soTheInput.classList.remove('is-valid');
            soTheInput.classList.add('is-invalid');
        }
        checkFormValidity();
    });

    const tu = document.getElementById('tuGio'), den = document.getElementById('denGio'), tc = document.getElementById('tongCong');
    
    // Tự động set giờ hiện tại và phút 00 khi bấm vào
    function setRoundHour(e) {
        if (!e.target.value) {
            const d = new Date();
            const hh = String(d.getHours()).padStart(2, '0');
            e.target.value = `${hh}:00`;
            calc();
            checkFormValidity();
        }
    }
    tu.addEventListener('click', setRoundHour);
    den.addEventListener('click', setRoundHour);

    function calc() {
        if (tu.value && den.value) {
            const s = new Date(`1970-01-01T${tu.value}:00`), e = new Date(`1970-01-01T${den.value}:00`);
            if (e < s) e.setDate(e.getDate() + 1);
            tc.value = ((e - s) / 3600000).toFixed(2);
        }
    }
    tu.addEventListener('change', () => { calc(); checkFormValidity(); }); 
    den.addEventListener('change', () => { calc(); checkFormValidity(); });

    const lyDoSelect = document.getElementById('lyDoSelect');
    const lyDoCustom = document.getElementById('lyDoCustom');

    lyDoSelect.addEventListener('change', (e) => {
        if (e.target.value === 'OTHER') {
            lyDoCustom.style.display = 'block';
            lyDoCustom.classList.add('custom-reason-active');
        } else {
            lyDoCustom.style.display = 'none';
            lyDoCustom.classList.remove('custom-reason-active');
            lyDoCustom.value = '';
        }
        checkFormValidity();
    });

    // Hàm kiểm tra tổng thể để mở khóa Nút Gửi
    function checkFormValidity() {
        const hasNgay = document.getElementById('ngayTangCa').value !== '';
        const isValidNV = idNVInput.value !== '';
        const hasTu = tu.value !== '';
        const hasDen = den.value !== '';
        const hasLoaiCa = document.getElementById('loaiCa').value !== '';
        
        let hasLyDo = false;
        if (lyDoSelect.value === 'OTHER') {
            hasLyDo = lyDoCustom.value.trim() !== '';
        } else {
            hasLyDo = lyDoSelect.value !== '';
        }

        const btnSubmit = document.getElementById('btnSubmit');
        if (hasNgay && isValidNV && hasTu && hasDen && hasLoaiCa && hasLyDo) {
            btnSubmit.disabled = false;
        } else {
            btnSubmit.disabled = true;
        }
    }

    // Lắng nghe các trường còn lại để kích hoạt Validate
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
            lyDo: lv === 'OTHER' ? lyDoCustom.value.trim() : lv, // Lưu chính xác giá trị nhập tay
            loaiCa: document.getElementById('loaiCa').value
        };
        try {
            const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload) });
            const res = await r.json();
            if (res.status === "success") { 
                showToast("Ghi thành công!", true); 
                e.target.reset(); 
                lyDoCustom.style.display = 'none';
                soTheInput.classList.remove('is-valid', 'is-invalid'); // Reset màu viền
                checkFormValidity(); // Khóa lại nút sau khi gửi
            }
            else { showToast("Lỗi: " + res.message, false); b.disabled = false; }
        } catch (err) { showToast("Lỗi kết nối API!", false); b.disabled = false;}
        finally { bt.style.display = 'block'; sp.style.display = 'none'; }
    });

    document.getElementById('btnViewList').addEventListener('click', async () => {
        const b = document.getElementById('btnViewList'), sp = document.getElementById('spinnerList'), bt = document.getElementById('btnListText');
        const dsSection = document.getElementById('dataSection');

        // Logic Ẩn/Hiện danh sách
        if (isListVisible) {
            dsSection.style.display = 'none';
            bt.textContent = 'XEM DANH SÁCH THÁNG HIỆN TẠI';
            isListVisible = false;
            return;
        }

        b.disabled = true; bt.style.display = 'none'; sp.style.display = 'block';
        try {
            const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: "getData" }) });
            const res = await r.json();
            if (res.status === "success") {
                const tb = document.getElementById('tableBody'); tb.innerHTML = '';
                const n = new Date(); document.getElementById('listTitle').textContent = `DANH SÁCH TĂNG CA THÁNG ${n.getMonth()+1}/${n.getFullYear()}`;
                res.data.forEach(row => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `<td>${row.ngay}</td><td>${row.soThe}</td><td style="font-weight:500">${row.hoTen}</td><td>${row.boPhan}</td><td>${row.tuGio}-${row.denGio}</td><td><span class="status-tag">${row.tongCong}h</span></td><td>${row.lyDo}</td><td>${row.loaiCa}</td>`;
                    tb.appendChild(tr);
                });
                dsSection.style.display = 'block';
                bt.textContent = 'ẨN DANH SÁCH'; // Đổi tên nút
                isListVisible = true;
                window.scrollTo({ top: dsSection.offsetTop - 20, behavior: 'smooth' });
            }
        } catch (e) { showToast("Lỗi tải danh sách!", false); }
        finally { b.disabled = false; bt.style.display = 'block'; sp.style.display = 'none'; }
    });
});

