const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzYXPNw_cGZmvQZR9UNAs6XYEjPi6eBvG0fkeugNYfLN8p7utTXBiIovt6zqYHVoTAbTw/exec";
const JSON_URL = "https://polystyren-vn.github.io/TangCaPS/data/employees.json";

let employeeData = [];

document.addEventListener("DOMContentLoaded", () => {
    const toast = document.getElementById('toast');
    function showToast(m, o) {
        toast.textContent = m; toast.style.backgroundColor = o ? '#137333' : '#D93025';
        toast.style.top = '20px'; setTimeout(() => toast.style.top = '-100px', 3000);
    }

    fetch(JSON_URL).then(r => r.json()).then(d => employeeData = d).catch(e => console.log("JSON Error"));

    document.getElementById('soThe').addEventListener('input', (e) => {
        const emp = employeeData.find(v => v.soThe === e.target.value.trim());
        document.getElementById('idNV').value = emp ? emp.idNV : "";
        document.getElementById('hoTen').value = emp ? emp.hoTen : "";
        document.getElementById('boPhan').value = emp ? emp.boPhan : "";
    });

    const tu = document.getElementById('tuGio'), den = document.getElementById('denGio'), tc = document.getElementById('tongCong');
    function calc() {
        if (tu.value && den.value) {
            const s = new Date(`1970-01-01T${tu.value}:00`), e = new Date(`1970-01-01T${den.value}:00`);
            if (e < s) e.setDate(e.getDate() + 1);
            tc.value = ((e - s) / 3600000).toFixed(2);
        }
    }
    tu.addEventListener('change', calc); den.addEventListener('change', calc);

    document.getElementById('lyDoSelect').addEventListener('change', (e) => {
        const c = document.getElementById('lyDoCustom');
        c.style.display = e.target.value === 'OTHER' ? 'block' : 'none';
        c.required = e.target.value === 'OTHER';
    });

    document.getElementById('tangCaForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!document.getElementById('idNV').value) { showToast("Số thẻ không tồn tại!", false); return; }
        const b = document.getElementById('btnSubmit'), sp = document.getElementById('spinner'), bt = document.getElementById('btnText');
        b.disabled = true; bt.style.display = 'none'; sp.style.display = 'block';
        const lv = document.getElementById('lyDoSelect').value;
        const payload = {
            action: "submit", maPhieu: "TC-" + Date.now(), idNV: document.getElementById('idNV').value,
            ngayTangCa: document.getElementById('ngayTangCa').value, soThe: document.getElementById('soThe').value,
            hoTen: document.getElementById('hoTen').value, boPhan: document.getElementById('boPhan').value,
            tuGio: tu.value, denGio: den.value, tongCong: tc.value,
            lyDo: lv === 'OTHER' ? document.getElementById('lyDoCustom').value : lv,
            loaiCa: document.getElementById('loaiCa').value
        };
        try {
            const r = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload) });
            const res = await r.json();
            if (res.status === "success") { showToast("Ghi thành công!", true); e.target.reset(); document.getElementById('lyDoCustom').style.display = 'none'; }
            else { showToast("Lỗi: " + res.message, false); }
        } catch (err) { showToast("Lỗi kết nối CORS!", false); }
        finally { b.disabled = false; bt.style.display = 'block'; sp.style.display = 'none'; }
    });

    document.getElementById('btnViewList').addEventListener('click', async () => {
        const b = document.getElementById('btnViewList'), sp = document.getElementById('spinnerList'), bt = document.getElementById('btnListText');
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
                document.getElementById('dataSection').style.display = 'block';
                window.scrollTo({ top: document.getElementById('dataSection').offsetTop, behavior: 'smooth' });
            }
        } catch (e) { showToast("Lỗi tải danh sách!", false); }
        finally { b.disabled = false; bt.style.display = 'block'; sp.style.display = 'none'; }
    });
});
