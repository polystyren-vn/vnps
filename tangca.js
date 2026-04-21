const SCRIPT_URL_TANG_CA = "https://script.google.com/macros/s/AKfycbzYXPNw_cGZmvQZR9UNAs6XYEjPi6eBvG0fkeugNYfLN8p7utTXBiIovt6zqYHVoTAbTw/exec";

let isId1Ok = false; 
window.tongGioValue = 0; 

window.clearField = (id) => { const i = document.getElementById(id); i.value = ''; i.dispatchEvent(new Event('input')); };

document.addEventListener("DOMContentLoaded", async () => {
    // Tự động gán ngày hôm nay
    document.getElementById('ngayTC').valueAsDate = new Date(); 
    
    await window.loadEmployeesData(); 
    document.getElementById('id1').addEventListener('input', validateLocal);
    
    // Lắng nghe thay đổi giờ để tính tổng và ép đuôi 00
    document.getElementById('tuGio').addEventListener('change', handleTimeChange);
    document.getElementById('denGio').addEventListener('change', handleTimeChange);
    
    document.getElementById('ngayTC').addEventListener('change', updateSaveButtonState);
    document.getElementById('lyDo').addEventListener('change', updateSaveButtonState);
    document.getElementById('loaiTC').addEventListener('change', updateSaveButtonState);
});

function validateLocal() {
    const val1 = document.getElementById('id1').value.trim();
    const msg1 = document.getElementById('msg-id1');

    if (val1 === "") { 
        msg1.innerHTML = ""; isId1Ok = false; document.getElementById('id1').classList.remove('is-valid', 'is-invalid'); 
    } else {
        const emp1 = window.employeeData.find(e => e.soThe === val1);
        if (emp1) { 
            msg1.innerHTML = `<span class="success-text">✅ ${emp1.hoTen} - ${emp1.viTri}</span>`; 
            document.getElementById('id1').className = 'is-valid'; isId1Ok = true; 
            loadHistory(val1); 
        } else { 
            msg1.innerHTML = '<span class="error-text">❌ Không tồn tại</span>'; 
            document.getElementById('id1').className = 'is-invalid'; isId1Ok = false; 
        }
    }
    updateSaveButtonState();
}

// Xử lý ép đuôi 00 phút và tính toán thời gian
function handleTimeChange(event) {
    const input = event.target;
    if (input.value) {
        // Cắt bỏ phần phút cũ, ép cứng về ':00'
        let hour = input.value.split(':')[0];
        input.value = hour + ':00';
    }
    calculateTime();
}

function calculateTime() {
    const t1 = document.getElementById('tuGio').value;
    const t2 = document.getElementById('denGio').value;
    const tongGioText = document.getElementById('tongGioText');
    
    if (t1 && t2) {
        let d1 = new Date("2000-01-01T" + t1);
        let d2 = new Date("2000-01-01T" + t2);
        if (d2 <= d1) d2.setDate(d2.getDate() + 1); // Làm xuyên đêm qua ngày mới
        
        let diffHours = (d2 - d1) / (1000 * 60 * 60);
        window.tongGioValue = parseFloat(diffHours.toFixed(2));
        
        // Hiển thị ra thẻ div text
        tongGioText.innerText = `Tổng Cộng: ${window.tongGioValue} (Giờ)`;
        tongGioText.style.display = 'block';
    } else {
        window.tongGioValue = 0;
        tongGioText.style.display = 'none';
    }
    updateSaveButtonState();
}

// Swap ẩn/hiện Lý Do Khác
window.handleReasonChange = function(select) {
    if (select.value === 'Khác... (Tự nhập)') {
        document.getElementById('reasonDropdownContainer').style.display = 'none';
        document.getElementById('reasonInputContainer').style.display = 'block';
        document.getElementById('lyDoKhac').focus();
    }
    updateSaveButtonState();
};

// Reset về lại Dropdown khi bấm nút [x]
window.resetReason = function() {
    document.getElementById('lyDo').value = '';
    document.getElementById('lyDoKhac').value = '';
    document.getElementById('reasonDropdownContainer').style.display = 'block';
    document.getElementById('reasonInputContainer').style.display = 'none';
    updateSaveButtonState();
};

// Quản lý trạng thái Nút bấm (Disabled/Enabled)
function updateSaveButtonState() {
    const btnSave = document.getElementById('btnSave');
    const btnCancel = document.getElementById('btnCancel');
    const ngayTC = document.getElementById('ngayTC').value;
    const t1 = document.getElementById('tuGio').value;
    const t2 = document.getElementById('denGio').value;
    const id1 = document.getElementById('id1').value.trim();
    const ddVal = document.getElementById('lyDo').value;
    const otherVal = document.getElementById('lyDoKhac').value.trim();
    const loaiTC = document.getElementById('loaiTC').value; // Trường Loại Tăng Ca

    // Nút Hủy
    let hasInput = (ngayTC || id1 || t1 || t2 || ddVal || otherVal || loaiTC);
    btnCancel.disabled = !hasInput;

    // Logic kiểm tra Lý do hợp lệ
    let lyDoOk = (ddVal === 'Khác... (Tự nhập)') ? (otherVal !== "") : (ddVal !== "");

    // Khóa/Mở nút XÁC NHẬN dựa trên ĐỦ TẤT CẢ các trường
    if (isId1Ok && ngayTC !== "" && t1 !== "" && t2 !== "" && window.tongGioValue > 0 && lyDoOk && loaiTC !== "") {
        btnSave.disabled = false;
    } else {
        btnSave.disabled = true;
    }
}

window.resetForm = function() {
    document.getElementById('id1').value = ''; 
    document.getElementById('tuGio').value = ''; 
    document.getElementById('denGio').value = '';
    document.getElementById('loaiTC').value = ''; 
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
    
    // Lấy lý do cuối cùng (Dropdown hoặc Ô nhập)
    let lyDoFinal = document.getElementById('lyDo').value;
    if (lyDoFinal === 'Khác... (Tự nhập)') lyDoFinal = document.getElementById('lyDoKhac').value.trim();

    const payload = { 
        action: "registerTangCa", 
        ngayTC: document.getElementById('ngayTC').value,
        maNV: document.getElementById('id1').value,
        tuGio: document.getElementById('tuGio').value,
        denGio: document.getElementById('denGio').value,
        tongGio: window.tongGioValue,
        lyDo: lyDoFinal,
        loaiTC: document.getElementById('loaiTC').value
    };

    try {
        const r = await fetch(SCRIPT_URL_TANG_CA, { method: 'POST', body: JSON.stringify(payload) });
        const res = await r.json();
        if (res.status === "success") { 
            window.showToast("Đăng ký tăng ca thành công!", true); 
            loadHistory(payload.maNV); 
            
            // Xóa giờ + lý do, giữ lại mã thẻ NV
            document.getElementById('tuGio').value = ''; 
            document.getElementById('denGio').value = ''; 
            resetReason(); 
            calculateTime();
        } else { 
            window.showToast(res.message, false); 
            btn.disabled = false;
        }
    } catch (e) { 
        window.showToast("Lỗi mạng!", false); 
        btn.disabled = false;
    } finally { 
        txt.style.display = 'block'; sp.style.display = 'none'; 
    }
};

window.toggleViewList = function() {
    const view = document.getElementById('listView'), btn = document.getElementById('btnViewList');
    const isHidden = view.style.display === 'none';
    view.style.display = isHidden ? 'block' : 'none';
    btn.innerText = isHidden ? 'ẨN DANH SÁCH' : 'XEM DANH SÁCH THÁNG HIỆN TẠI';
};

async function loadHistory(maNV) {
    try {
        const r = await fetch(SCRIPT_URL_TANG_CA + "?action=getTangCaHistory&maNV=" + maNV);
        const res = await r.json();
        if (res.status === "success") {
            let html = '';
            res.data.forEach(row => {
                let statusColor = row.trangThai === "Duyệt" ? "var(--success)" : (row.trangThai === "Chờ" ? "#f39c12" : "var(--error)");
                html += `<tr><td>${row.ngay}</td><td>${row.tu}</td><td>${row.den}</td><td>${row.tong}</td><td>${row.lydo}</td><td>${row.loai}</td><td><span class="status-tag" style="color: ${statusColor}; background: ${statusColor}20;">${row.trangThai}</span></td></tr>`;
            });
            document.getElementById('tableBody').innerHTML = html || '<tr><td colspan="7" class="empty-cell">Chưa có dữ liệu</td></tr>';
        }
    } catch(e) {}
}
