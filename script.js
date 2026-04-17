const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzYXPNw_cGZmvQZR9UNAs6XYEjPi6eBvG0fkeugNYfLN8p7utTXBiIovt6zqYHVoTAbTw/exec";
const JSON_URL = "https://polystyren-vn.github.io/TangCaPS/data/employees.json";

let employeeData = [];

// Bọc toàn bộ code trong sự kiện DOMContentLoaded để đảm bảo HTML tải xong mới chạy JS
document.addEventListener("DOMContentLoaded", () => {
    
    // 1. Hàm hiển thị thông báo
    const toast = document.getElementById('toast');
    function showToast(msg, ok) {
        toast.textContent = msg;
        toast.style.backgroundColor = ok ? '#137333' : '#D93025';
        toast.style.top = '20px';
        setTimeout(() => toast.style.top = '-100px', 3000);
    }

    // 2. Tải danh sách nhân viên từ GitHub
    fetch(JSON_URL)
        .then(response => {
            if (!response.ok) throw new Error("Không tìm thấy file JSON");
            return response.json();
        })
        .then(data => {
            employeeData = data;
        })
        .catch(err => {
            console.error("Lỗi dữ liệu nhân sự:", err);
            // Nếu bạn thấy dòng này trong F12, tức là GitHub Pages của bạn chưa được bật
        });

    // 3. Xử lý tự động điền Tên/Bộ Phận
    const soTheInput = document.getElementById('soThe');
    if (soTheInput) {
        soTheInput.addEventListener('input', (e) => {
            const emp = employeeData.find(nv => nv.soThe === e.target.value.trim());
            document.getElementById('idNV').value = emp ? emp.idNV : "";
            document.getElementById('hoTen').value = emp ? emp.hoTen : "";
            document.getElementById('boPhan').value = emp ? emp.boPhan : "";
        });
    }

    // 4. Xử lý tự động tính giờ
    const tuGioInput = document.getElementById('tuGio');
    const denGioInput = document.getElementById('denGio');
    const tongCongInput = document.getElementById('tongCong');

    function calculateHours() {
        if (tuGioInput.value && denGioInput.value) {
            const start = new Date(`1970-01-01T${tuGioInput.value}:00`);
            let end = new Date(`1970-01-01T${denGioInput.value}:00`);
            if (end < start) end.setDate(end.getDate() + 1); // Xử lý qua đêm
            tongCongInput.value = ((end - start) / 3600000).toFixed(2);
        }
    }

    if (tuGioInput && denGioInput) {
        tuGioInput.addEventListener('change', calculateHours);
        denGioInput.addEventListener('change', calculateHours);
    }

    // 5. Xử lý hiển thị ô Lý do "Khác"
    const lyDoSelect = document.getElementById('lyDoSelect');
    const lyDoCustom = document.getElementById('lyDoCustom');
    if (lyDoSelect) {
        lyDoSelect.addEventListener('change', (e) => {
            if (e.target.value === 'OTHER') {
                lyDoCustom.style.display = 'block';
                lyDoCustom.required = true;
            } else {
                lyDoCustom.style.display = 'none';
                lyDoCustom.required = false;
                lyDoCustom.value = '';
            }
        });
    }

    // 6. Xử lý Gửi Form
    const tangCaForm = document.getElementById('tangCaForm');
    if (tangCaForm) {
        tangCaForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!document.getElementById('idNV').value) {
                showToast("Số thẻ không đúng hoặc không có trong danh sách!", false);
                return;
            }

            const btn = document.getElementById('btnSubmit');
            const btnText = document.getElementById('btnText');
            const spinner = document.getElementById('spinner');
            
            btn.disabled = true;
            btnText.style.display = 'none';
            spinner.style.display = 'block';

            const selectV = lyDoSelect.value;
            const finalLyDo = selectV === 'OTHER' ? lyDoCustom.value : selectV;

            const payload = {
                action: "submit",
                maPhieu: "TC-" + Date.now(),
                idNV: document.getElementById('idNV').value,
                ngayTangCa: document.getElementById('ngayTangCa').value,
                soThe: soTheInput.value,
                hoTen: document.getElementById('hoTen').value,
                boPhan: document.getElementById('boPhan').value,
                tuGio: tuGioInput.value,
                denGio: denGioInput.value,
                tongCong: tongCongInput.value,
                lyDo: finalLyDo,
                loaiCa: document.getElementById('loaiCa').value
            };

            try {
                const response = await fetch(SCRIPT_URL, { 
                    method: 'POST', 
                    body: JSON.stringify(payload) 
                });
                const resData = await response.json();
                
                if (resData.status === "success") {
                    showToast("Ghi dữ liệu thành công!", true);
                    tangCaForm.reset();
                    lyDoCustom.style.display = 'none';
                } else {
                    showToast("Lỗi từ máy chủ: " + resData.message, false);
                }
            } catch (err) {
                showToast("Lỗi kết nối máy chủ API!", false);
            } finally {
                btn.disabled = false;
                btnText.style.display = 'block';
                spinner.style.display = 'none';
            }
        });
    }

    // 7. Xử lý Nút Xem Danh Sách
    const btnViewList = document.getElementById('btnViewList');
    if (btnViewList) {
        btnViewList.addEventListener('click', async () => {
            const btnListText = document.getElementById('btnListText');
            const spinnerList = document.getElementById('spinnerList');

            btnViewList.disabled = true;
            btnListText.style.display = 'none';
            spinnerList.style.display = 'block';

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
                        tr.innerHTML = `<td>${row.ngay}</td><td style="font-weight: 500;">${row.hoTen}</td><td>${row.tuGio} - ${row.denGio}</td><td><span class="status-tag">${row.tongCong}h</span></td>`;
                        tbody.appendChild(tr);
                    });
                    
                    document.getElementById('dataSection').style.display = 'block';
                    window.scrollTo({ top: document.getElementById('dataSection').offsetTop, behavior: 'smooth' });
                } else {
                    showToast("Lỗi tải data: " + resData.message, false);
                }
            } catch (err) {
                showToast("Lỗi CORS: Chưa cấu hình 'Anyone' trên Apps Script!", false);
            } finally {
                btnViewList.disabled = false;
                btnListText.style.display = 'block';
                spinnerList.style.display = 'none';
            }
        });
    }
});
