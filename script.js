const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzYXPNw_cGZmvQZR9UNAs6XYEjPi6eBvG0fkeugNYfLN8p7utTXBiIovt6zqYHVoTAbTw/exec";
const JSON_URL = "https://polystyren-vn.github.io/TangCaPS/data/employees.json";

let employeeData = [];

async function loadEmployees() {
    try {
        const response = await fetch(JSON_URL);
        employeeData = await response.json();
    } catch (e) {
        console.error("Không thể tải danh sách nhân viên");
    }
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

document.getElementById('soThe').addEventListener('input', (e) => {
    lookupEmployee(e.target.value);
});

document.getElementById('tuGio').addEventListener('change', calculateHours);
document.getElementById('denGio').addEventListener('change', calculateHours);

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
    if (!document.getElementById('idNV').value) {
        showToast("Số thẻ không tồn tại!", false);
        return;
    }
    const btn = document.getElementById('btnSubmit');
    btn.disabled = true;
    document.getElementById('btnText').style.display = 'none';
    document.getElementById('spinner').style.display = 'block';

    const payload = {
        maPhieu: "TC-" + Date.now(),
        idNV: document.getElementById('idNV').value,
        ngayTangCa: document.getElementById('ngayTangCa').value,
        soThe: document.getElementById('soThe').value,
        hoTen: document.getElementById('hoTen').value,
        boPhan: document.getElementById('boPhan').value,
        tuGio: document.getElementById('tuGio').value,
        denGio: document.getElementById('denGio').value,
        tongCong: document.getElementById('tongCong').value,
        lyDo: document.getElementById('lyDo').value,
        loaiCa: document.getElementById('loaiCa').value
    };

    try {
        await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload) });
        showToast("Gửi thành công!", true);
        e.target.reset();
    } catch (err) {
        showToast("Lỗi kết nối!", false);
    } finally {
        btn.disabled = false;
        document.getElementById('btnText').style.display = 'block';
        document.getElementById('spinner').style.display = 'none';
    }
});

loadEmployees();
