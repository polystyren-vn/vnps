const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzYXPNw_cGZmvQZR9UNAs6XYEjPi6eBvG0fkeugNYfLN8p7utTXBiIovt6zqYHVoTAbTw/exec";
const JSON_URL = "https://polystyrenvt.github.io/TangCaPS/data/employees.json";

let employeeData = [];

async function loadEmployees() {
    try {
        const response = await fetch(JSON_URL);
        employeeData = await response.json();
    } catch (e) { }
}

function lookupEmployee(soThe) {
    const emp = employeeData.find(e => e.soThe === soThe);
    if (emp) {
        document.getElementById('idNV').value = emp.idNV;
        document.getElementById('hoTen').value = emp.hoTen;
        document.getElementById('boPhan').value = emp.boPhan;
    } else {
        document.getElementById('idNV').value = "";
        document.getElementById('hoTen').value = "";
        document.getElementById('boPhan').value = "";
    }
}

document.getElementById('soThe').addEventListener('input', (e) => lookupEmployee(e.target.value));
document.getElementById('tuGio').addEventListener('change', calculateHours);
document.getElementById('denGio').addEventListener('change', calculateHours);
document.getElementById('lyDoSelect').addEventListener('change', function(e) {
    const custom = document.getElementById('lyDoCustom');
    if (e.target.value === 'OTHER') { custom.style.display = 'block'; custom.required = true; }
    else { custom.style.display = 'none'; custom.required = false; custom.value = ''; }
});

function calculateHours() {
    const tu = document.getElementById('tuGio').value;
    const den = document.getElementById('denGio').value;
    if (tu && den) {
        const start = new Date(`1970-01-01T${tu}:00`);
        let end = new Date(`1970-01-01T${den}:00`);
        if (end < start) end.setDate(end.getDate() + 1);
        document.getElementById('tongCong').value = ((end - start) / 3600000).toFixed(2);
    }
}

function showToast(msg, ok) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.style.backgroundColor = ok ? '#137333' : '#D93025';
    t.style.top = '20px';
    setTimeout(() => t.style.top = '-100px', 3000);
}

document.getElementById('tangCaForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!document.getElementById('idNV').value) { showToast("Số thẻ không tồn tại!", false); return; }
    const selectV = document.getElementById('lyDoSelect').value;
    const finalLyDo = selectV === 'OTHER' ? document.getElementById('lyDoCustom').value : selectV;
    const btn = document.getElementById('btnSubmit');
    btn.disabled = true;
    document.getElementById('btnText').style.display = 'none';
    document.getElementById('spinner').style.display = 'block';

    const payload = {
        action: "submit",
        maPhieu: "TC-" + Date.now(),
        idNV: document.getElementById('idNV').value,
        ngayTangCa: document.getElementById('ngayTangCa').value,
        soThe: document.getElementById('soThe').value,
        hoTen: document.getElementById('hoTen').value,
        boPhan: document.getElementById('boPhan').value,
        tuGio: document.getElementById('tuGio').value,
        denGio: document.getElementById('denGio').value,
        tongCong: document.getElementById('tongCong').value,
        lyDo: finalLyDo,
        loaiCa: document.getElementById('loaiCa').value
    };

    try {
        const response = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload) });
        const resData = await response.json();
        if(resData.status === "success") {
            showToast("Ghi thành công!", true);
            e.target.reset();
            document.getElementById('lyDoCustom').style.display = 'none';
        } else {
            showToast("Lỗi: " + resData.message, false);
        }
    } catch (err) { showToast("Lỗi kết nối máy chủ API!", false); }
    finally { btn.disabled = false; document.getElementById('btnText').style.display = 'block'; document.getElementById('spinner').style.display = 'none'; }
});

document.getElementById('btnViewList').addEventListener('click', async () => {
    const btn = document.getElementById('btnViewList');
    btn.disabled = true;
    document.getElementById('btnListText').style.display = 'none';
    document.getElementById('spinnerList').style.display = 'block';

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action: "getData" })
        });
        const resData = await response.json();
        
        if (resData.status === "success") {
            const tbody = document.getElementById('tableBody');
            tbody.innerHTML = '';
            
            const now = new Date();
            document.getElementById('listTitle').textContent = `DANH SÁCH TĂNG CA THÁNG ${now.getMonth() + 1}/${now.getFullYear()}`;

            resData.data.forEach(row => {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td>${row.ngay}</td><td>${row.hoTen}</td><td>${row.tuGio}-${row.denGio}</td><td><span class="status-tag">${row.tongCong}h</span></td>`;
                tbody.appendChild(tr);
            });
            document.getElementById('dataSection').style.display = 'block';
            window.scrollTo({ top: document.getElementById('dataSection').offsetTop, behavior: 'smooth' });
        } else {
            showToast("Lỗi từ server: " + resData.message, false);
        }
    } catch (err) { showToast("Lỗi CORS hoặc URL không đúng!", false); }
    finally { btn.disabled = false; document.getElementById('btnListText').style.display = 'block'; document.getElementById('spinnerList').style.display = 'none'; }
});

loadEmployees();
