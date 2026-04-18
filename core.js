window.employeeData = [];

// Hàm hiện thông báo Toast chuẩn VNPS
window.showToast = function(m, o) {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = m; 
    toast.style.backgroundColor = o ? '#137333' : '#D93025';
    toast.style.top = '20px'; 
    setTimeout(() => toast.style.top = '-100px', 3000);
};

// Hàm tải dữ liệu nhân sự JSON siêu tốc
window.loadEmployeesData = async function() {
    const JSON_URL = "https://polystyren-vn.github.io/vnps/data/employees.json";
    try {
        const response = await fetch(JSON_URL);
        window.employeeData = await response.json();
    } catch (e) {
        window.showToast("Lỗi kết nối dữ liệu nhân sự!", false);
    }
};

// Hàm tạo/lấy ID thiết bị định danh ngầm (6 ký tự mã hóa)
window.getDeviceId = function() {
    let id = localStorage.getItem('vnps_device_id');
    if (!id) {
        id = Math.random().toString(36).substring(2, 8).toUpperCase();
        localStorage.setItem('vnps_device_id', id);
    }
    return id;
};
