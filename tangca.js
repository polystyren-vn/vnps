const SCRIPT_URL_TANG_CA = "https://script.google.com/macros/s/AKfycbzYXPNw_cGZmvQZR9UNAs6XYEjPi6eBvG0fkeugNYfLN8p7utTXBiIovt6zqYHVoTAbTw/exec";


let isId1Ok = false; 
window.tongGioValue = 0; // Biến ảo lưu giữ số giờ để Submit

window.clearField = (id) => { const i = document.getElementById(id); i.value = ''; i.dispatchEvent(new Event('input')); };

document.addEventListener("DOMContentLoaded", async () => {
    document.getElementById('ngayTC').valueAsDate = new Date(); // Mặc định gán ngày hôm nay
    
    await window.loadEmployeesData(); 
    document.getElementById('id1').addEventListener('input', validateLocal);
    document.getElementById('tuGio').addEventListener('change', calculateTime);
    document.getElementById('denGio').addEventListener('change', calculateTime);
    document.getElementById('ngayTC').addEventListener('change', updateSaveButtonState);
    document.getElementById('lyDo').addEventListener('change', updateSaveButtonState);
});

function validateLocal() {
    const val1 = document.getElementById('id1').value.trim();
    const msg1 = document.getElementById('msg-id1');

    if (val1 === "") { 
        msg1.innerHTML = ""; isId1Ok = false; document.getElementById('id1').classList.remove('is-valid', 'is-invalid'); 
    } else {
        const emp1 = window.employeeData.find(e => e.soThe === val1);
        if (emp1) { 
            msg1.innerHTML = `<span class="success-text">✅ ${emp1.hoTen} (${emp1.viTri})</span>`; 
            document.getElementById('id1').className = 'is-valid'; isId1Ok = true; 
            loadHistory(val1); 
        } else { 
            msg1.innerHTML = '<span class="error-text">❌ Không tồn tại</span>'; 
            document.getElementById('id1').className = 'is-invalid'; isId1Ok = false; 
        }
    }
    updateSaveButtonState();
}

function calculateTime() {
    const t1 = document.getElementById('tuGio').value;
    const t2 = document.getElementById('denGio').value;
    const tongGioText = document.getElementById('tongGioText');
    
    if (t1 && t2) {
        let d1 = new Date("2000-01-01T" + t1);
        let d2 = new Date("2000-01-01T" + t2);
        if (d2 <= d1) d2.setDate(d2.getDate() + 1); // Xử lý làm xuyên đêm
        
        let diffHours = (d2 - d1) / (1000 * 60 * 60);
        window.tongGioValue = parseFloat(diffHours.toFixed(2));
        
        tongGioText.innerText = `Tổng cộng: ${window.tongGioValue} (Giờ)`;
        tongGioText.style.display = 'block';
    } else {
        window.tongGioValue = 0;
        tongGioText.style.display = 'none';
    }
    updateSaveButtonState();
}

// Lắng nghe sự kiện chọn "Khác..."
window.handleReasonChange = function(select) {
    if (select.value === 'Khác...') {
        document.getElementById('reasonDropdownContainer').style.display = 'none';
        document.getElementById('reasonInputContainer').style.display = 'block';
        document.getElementById('lyDoKhac').focus(); // Tự động nháy con trỏ
    }
    updateSaveButtonState();
};

// Lắng nghe sự kiện bấm nút [X] để quay xe về Dropdown
window.resetReason = function() {
    document.getElementById('lyDo').value = '';
    document.getElementById('lyDoKhac').value = '';
    document.getElementById('reasonDropdownContainer').style.display = 'block';
    document.getElementById('reasonInputContainer').style.display = 'none';
    updateSaveButtonState();
};

function updateSaveButtonState() {
    const btnSave = document.getElementById('btnSave'), btnCancel = document.getElementById('btnCancel');
    const ngayTC = document.getElementById('ngayTC').value;
    const t1 = document.getElementById('tuGio').value;
    const t2 = document.getElementById('denGio').value;
    const id1 = document.getElementById('id1').value.trim();
    const ddVal = document.getElementById('lyDo').value;
    const otherVal = document.getElementById('lyDoKhac').value.trim();

    // Nút Hủy sáng lên nếu có bất kỳ tương tác nào
    let hasInput = (ngayTC || id1 || t1 || t2 || ddVal || otherVal);
    btnCancel.disabled = !hasInput;

    // Logic kiểm tra Lý do hợp lệ tùy theo trạng thái ô
    let lyDoOk = (ddVal === 'Khác...') ? (otherVal !== "") : (ddVal !== "");

    // Khóa nút XÁC NHẬN nếu thiếu điều kiện
    if (isId1Ok && ngayTC !== "" && window.tongGioValue > 0 && lyDoOk) {
        btnSave.disabled = false;
    } else {
        btnSave.disabled = true;
    }
}

window.resetForm = function() {
    document.getElementById('id1').value = ''; 
    document.getElementById('tuGio').value = ''; 
    document.getElementById('denGio').value = '';
    document.getElementById('msg-id1').innerHTML = ''; 
    document.getElementById('id1').classList.remove('is-valid', 'is-invalid');
    document.getElementById('tongGioText').style.display = 'none';
    window.tongGioValue = 0;
    resetReason();
    isId1Ok = false;
    document.getElementById('tableBody').innerHTML = ''; 
    updateSaveButtonState();
};

window.submitData = async function() {
    const btn = document.getElementById('btnSave'), sp = document.getElementById('spinner-save'), txt = document.getElementById('btnSaveText');
    btn.disabled = true; txt.style.display = 'none'; sp.style.display = 'block';
    
    // Thu thập đúng lý do cuối cùng
    let lyDoFinal = document.getElementById('lyDo').value;
    if (lyDoFinal === 'Khác...') lyDoFinal = document.getElementById('lyDoKhac').value.trim();

    const payload = { 
        action: "registerTangCa", 
        ngayTC: document.getElementById('ngayTC').value,
        maNV: document.getElementById('id1').value,
        tuGio: document.getElementById('tuGio').value,
        denGio: document.getElementById('denGio').value,
        tongGio: window.tongGioValue,
        lyDo: lyDoFinal
    };

    try {
        const r = await fetch(SCRIPT_URL_TANG_CA, { method: 'POST', body: JSON.stringify(payload) });
        const res = await r.json();
        if (res.status === "success") { 
            window.showToast("Đăng ký tăng ca thành công!", true); 
            loadHistory(payload.maNV); 
            // Reset các trường phụ, giữ nguyên Ngày và Mã NV để tiện nhập tiếp
            document.getElementById('tuGio').value = ''; 
            document.getElementById('denGio').value = ''; 
            resetReason(); 
            calculateTime();
        } else { window.showToast(res.message, false); btn.disabled = false;}
    } catch (e) { window.showToast("Lỗi mạng!", false); btn.disabled = false;}
    finally { txt.style.display = 'block'; sp.style.display = 'none'; }
};

window.toggleViewList = function() {
    const view = document.getElementById('listView'), btn = document.getElementById('btnViewList');
    const isHidden = view.style.display === 'none';
    view.style.display = isHidden ? 'block' : 'none';
    btn.innerText = isHidden ? 'ẨN DANH SÁCH' : 'XEM DANH SÁCH ĐÃ ĐĂNG KÝ';
};

async function loadHistory(maNV) {
    try {
        const r = await fetch(SCRIPT_URL_TANG_CA + "?action=getTangCaHistory&maNV=" + maNV);
        const res = await r.json();
        if (res.status === "success") {
            let html = '';
            res.data.forEach(row => {
                let statusColor = row.trangThai === "Duyệt" ? "var(--success)" : (row.trangThai === "Chờ" ? "#f39c12" : "var(--error)");
                html += `<tr><td>${row.ngay}</td><td>${row.tu}</td><td>${row.den}</td><td>${row.tong}</td><td>${row.lydo}</td><td><span class="status-tag" style="color: ${statusColor}; background: ${statusColor}20;">${row.trangThai}</span></td></tr>`;
            });
            document.getElementById('tableBody').innerHTML = html || '<tr><td colspan="6" class="empty-cell">Chưa có dữ liệu</td></tr>';
        }
    } catch(e) {}
}
