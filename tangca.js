const SCRIPT_URL_TANG_CA = "https://script.google.com/macros/s/AKfycbzYXPNw_cGZmvQZR9UNAs6XYEjPi6eBvG0fkeugNYfLN8p7utTXBiIovt6zqYHVoTAbTw/exec";

let isListVisible = false, isEditing = false, longPressTimer;

window.clearSoThe = () => { const i = document.getElementById('soThe'); i.value = ''; i.dispatchEvent(new Event('input')); };

function setupLongPress(row, rowData) {
    row.addEventListener('touchstart', () => {
        longPressTimer = setTimeout(() => {
            if (rowData.chk === true || rowData.chk === "TRUE") { window.showToast("Dòng đã khóa, không thể sửa!", false); } 
            else { startEdit(rowData); }
        }, 800);
    });
    row.addEventListener('touchend', () => clearTimeout(longPressTimer));
}

function startEdit(data) {
    isEditing = true;
    document.getElementById('editMaPhieu').value = data.maPhieu;
    const [d, m, y] = data.ngay.split('/');
    document.getElementById('ngayTangCa').value = `${y}-${m}-${d}`;
    document.getElementById('soThe').value = data.soThe;
    document.getElementById('tuGio').value = data.tuGio;
    document.getElementById('denGio').value = data.denGio;
    document.getElementById('btnText').innerText = "CẬP NHẬT DỮ LIỆU";
    document.getElementById('btnSubmit').style.background = "#e67e22";
    document.getElementById('btnCancel').style.display = "block";
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.getElementById('soThe').dispatchEvent(new Event('input'));
}

function cancelEdit() {
    isEditing = false; document.getElementById('tangCaForm').reset();
    document.getElementById('btnText').innerText = "GỬI DỮ LIỆU";
    document.getElementById('btnSubmit').style.background = "";
    document.getElementById('btnCancel').style.display = "none";
}

document.addEventListener("DOMContentLoaded", async () => {
    await window.loadEmployeesData();
    const soTheInput = document.getElementById('soThe'), idNVInput = document.getElementById('idNV'), msgSoThe = document.getElementById('msg-soThe');
    
    soTheInput.addEventListener('input', () => {
        const val = soTheInput.value.trim();
        const emp = window.employeeData.find(v => v.soThe === val);
        idNVInput.value = emp ? emp.idNV : ""; 
        document.getElementById('hoTenHidden').value = emp ? emp.hoTen : "";
        document.getElementById('boPhanHidden').value = emp ? emp.boPhan : "";
        if (val === "") { soTheInput.className = ''; msgSoThe.innerHTML = ""; }
        else if (emp) { soTheInput.className = 'is-valid'; msgSoThe.innerHTML = `<span class="success-text">✅ ${emp.hoTen} (${emp.boPhan})</span>`; }
        else { soTheInput.className = 'is-invalid'; msgSoThe.innerHTML = `<span class="error-text">❌ Số thẻ không tồn tại</span>`; }
        checkFormValidity();
    });

    function calc() {
        const tu = document.getElementById('tuGio').value, den = document.getElementById('denGio').value;
        if (tu && den) {
            let s = new Date(`1970-01-01T${tu}:00`), e = new Date(`1970-01-01T${den}:00`);
            if (e < s) e.setDate(e.getDate() + 1);
            document.getElementById('tongCong').value = ((e - s) / 3600000).toFixed(2);
        }
    }
    document.getElementById('tuGio').addEventListener('change', () => { calc(); checkFormValidity(); });
    document.getElementById('denGio').addEventListener('change', () => { calc(); checkFormValidity(); });

    function checkFormValidity() {
        const ok = document.getElementById('ngayTangCa').value && idNVInput.value && document.getElementById('tuGio').value && document.getElementById('denGio').value;
        document.getElementById('btnSubmit').disabled = !ok;
    }

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
            boPhan: document.getElementById('boPhanHidden').value, tuGio: document.getElementById('tuGio').value,
            denGio: document.getElementById('denGio').value, tongCong: document.getElementById('tongCong').value,
            lyDo: document.getElementById('lyDoSelect').value, loaiCa: document.getElementById('loaiCa').value,
            deviceId: window.getDeviceId()
        };
        try {
            const r = await fetch(SCRIPT_URL_TANG_CA, { method: 'POST', body: JSON.stringify(payload) });
            const res = await r.json();
            if (res.status === "success") { window.showToast("Thành công!", true); cancelEdit(); if(isListVisible) loadList(); }
            else { window.showToast(res.message, false); b.disabled = false; }
        } catch (err) { window.showToast("Lỗi kết nối!", false); b.disabled = false; }
        finally { bt.style.display = 'block'; sp.style.display = 'none'; }
    });

    async function loadList() {
        const r = await fetch(SCRIPT_URL_TANG_CA, { method: 'POST', body: JSON.stringify({ action: "getData" }) });
        const res = await r.json();
        if (res.status === "success") {
            const tb = document.getElementById('tableBody'); tb.innerHTML = '';
            res.data.forEach(row => {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td>${row.ngay}</td><td style="text-align:left">${row.hoTen}</td><td>${row.tuGio}-${row.denGio}</td><td>${row.tong}h</td><td style="font-weight:bold; color:#1A73E8">${row.tongNam}h</td><td>${row.chk ? '✅' : '⬜'}</td>`;
                setupLongPress(tr, row); tb.appendChild(tr);
            });
            document.getElementById('dataSection').style.display = 'block';
        }
    }
    document.getElementById('btnViewList').addEventListener('click', () => { if(isListVisible) { document.getElementById('dataSection').style.display='none'; isListVisible=false; } else { loadList(); isListVisible=true; } });
});
