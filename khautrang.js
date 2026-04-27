document.addEventListener("DOMContentLoaded", async () => {
    // Tải dữ liệu nhân viên (Dùng chung core.js)
    if(typeof window.loadEmployeesData === 'function') await window.loadEmployeesData();

    const soTheInput = document.getElementById('soThe');
    const msgSoThe = document.getElementById('msg-soThe');
    const quickMenu = document.getElementById('quickSLMenu');

    // 1. Logic check Số thẻ
    soTheInput.addEventListener('input', () => {
        const val = soTheInput.value.trim();
        const emp = window.employeeData ? window.employeeData.find(v => v.soThe === val) : null;
        msgSoThe.classList.remove('name-success', 'name-error');
        if (emp) {
            msgSoThe.innerHTML = `${emp.hoTen} - ${emp.boPhan}`;
            msgSoThe.classList.add('name-success');
            soTheInput.dataset.hoten = emp.hoTen;
            soTheInput.dataset.valid = "true";
        } else {
            msgSoThe.innerHTML = val === "" ? "" : "Số thẻ lạ";
            if (val !== "") msgSoThe.classList.add('name-error');
            soTheInput.dataset.valid = "false";
        }
    });

    // 2. Logic Menu chọn nhanh số lượng
    document.getElementById('btnQuickSL').addEventListener('click', (e) => {
        e.stopPropagation();
        quickMenu.classList.toggle('active');
    });

    window.setSL = (val) => {
        document.getElementById('soLuong').value = val;
        quickMenu.classList.remove('active');
    };

    document.addEventListener('click', () => quickMenu.classList.remove('active'));

    // 3. Gửi dữ liệu
    document.getElementById('khauTrangForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        if(soTheInput.dataset.valid !== "true") return;

        const b = document.getElementById('btnSubmit'), sp = document.getElementById('spinner'), bt = document.getElementById('btnText');
        b.disabled = true; bt.style.display = 'none'; sp.style.display = 'block';

        const payload = {
            action: "submitKhauTrang",
            soThe: soTheInput.value,
            hoTen: soTheInput.dataset.hoten,
            soLuong: document.getElementById('soLuong').value,
            nhanThay: document.getElementById('nhanThay').value,
            deviceId: window.getDeviceId ? window.getDeviceId() : "WEB"
        };

        try {
            const r = await fetch(SCRIPT_URL_TANG_CA, { method: 'POST', body: JSON.stringify(payload) });
            const res = await r.json();
            if (res.status === "success") {
                window.showToast("Đã ghi nhận nhận khẩu trang!", true);
                resetForm();
                loadHistory();
            }
        } catch (err) { window.showToast("Lỗi kết nối!", false); 
        } finally { b.disabled = false; bt.style.display = 'block'; sp.style.display = 'none'; }
    });

    // 4. Load bảng nhật ký
    async function loadHistory() {
        try {
            const r = await fetch(SCRIPT_URL_TANG_CA, { method: 'POST', body: JSON.stringify({ action: "getKhauTrangData" }) });
            const res = await r.json();
            if (res.status === "success") {
                const tb = document.getElementById('tableBody'); tb.innerHTML = '';
                res.data.forEach(row => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `<td>${row.ngayGio}</td><td>${row.soThe}</td><td style="text-align:left;">${row.hoTen}</td><td><b>${row.sl}</b></td><td style="font-size:11px; color:var(--sub-text)">${row.nhanThay}</td>`;
                    tb.appendChild(tr);
                });
            }
        } catch(e) {}
    }

    loadHistory();
    window.resetForm = () => {
        document.getElementById('khauTrangForm').reset();
        msgSoThe.innerHTML = "";
        msgSoThe.classList.remove('name-success', 'name-error');
    };
});
