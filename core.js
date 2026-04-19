// Khởi tạo mảng lưu trữ danh bạ nhân sự toàn cục
window.employeeData = [];

// Hàm hiển thị thông báo (Toast) chuẩn UI
window.showToast = function(message, isSuccess) {
    let toastEl = document.getElementById('toast');
    if (!toastEl) { 
        toastEl = document.createElement('div'); 
        toastEl.id = 'toast'; 
        document.body.appendChild(toastEl); 
    }
    toastEl.textContent = message; 
    toastEl.style.backgroundColor = isSuccess ? '#137333' : '#D93025'; // Xanh lá nếu thành công, Đỏ nếu lỗi
    toastEl.style.top = '20px'; 
    
    // Tự động ẩn sau 3 giây
    setTimeout(() => { toastEl.style.top = '-100px'; }, 3000);
};

// Hàm tải dữ liệu danh bạ nhân viên từ GitHub (JSON)
window.loadEmployeesData = async function() {
    try {
        // Sử dụng cache: "no-store" để ép trình duyệt luôn lấy bản JSON mới nhất từ máy chủ
        const response = await fetch("https://polystyren-vn.github.io/vnps/data/employees.json", { cache: "no-store" });
        if (!response.ok) throw new Error("Network response was not ok");
        window.employeeData = await response.json();
    } catch (error) { 
        window.showToast("Lỗi tải danh bạ nhân viên!", false); 
        console.error("Lỗi fetch JSON:", error);
    }
};

// Hàm lấy ID thiết bị (để nhận diện người dùng trên nhiều thiết bị)
window.getDeviceId = function() {
    let deviceId = localStorage.getItem('vnps_device_id');
    if (!deviceId) { 
        // Tạo một chuỗi ngẫu nhiên 6 ký tự viết hoa nếu chưa có
        deviceId = Math.random().toString(36).substring(2, 8).toUpperCase(); 
        localStorage.setItem('vnps_device_id', deviceId); 
    }
    return deviceId;
};
