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
// ==========================================================================
// TỰ ĐỘNG HIGHLIGHT THANH MENU ĐÁY (ZALO STYLE)
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    // 1. Lấy tên file của trang hiện tại (VD: "tangca.html")
    let currentPath = window.location.pathname.split("/").pop();
    
    // Nếu là trang gốc không có đuôi html, mặc định gán là index.html
    if (currentPath === "" || currentPath === "/") currentPath = "index.html"; 

    // 2. Quét tất cả các thẻ <a> trong thanh nav
    const navLinks = document.querySelectorAll(".zalo-nav .nav-item");
    
    navLinks.forEach(link => {
        // Lấy tên link của thẻ a
        const linkPath = link.getAttribute("href");
        
        // 3. Nếu link khớp với trang đang mở -> Gắn class "active" để thắp sáng icon màu Xanh
        if (linkPath === currentPath) {
            link.classList.add("active");
        }
    });
});
