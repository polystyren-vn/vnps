// ==========================================================================
// VNPS SUPER APP - CORE.JS (PHIÊN BẢN LOCAL/TREBEDIT)
// ==========================================================================

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

// Hàm tải dữ liệu danh bạ nhân viên từ file JSON
window.loadEmployeesData = async function() {
    try {
        // [CẬP NHẬT] Đổi đường dẫn thành tương đối để đọc file JSON trong cùng thư mục (TrebEdit)
        const response = await fetch("employees.json", { cache: "no-store" });
        
        if (!response.ok) throw new Error("Network response was not ok");
        
        window.employeeData = await response.json();
        
        // Log ra Console để xác nhận đã tải thành công
        console.log("✅ Core.js: Đã tải thành công " + window.employeeData.length + " nhân viên từ employees.json");
        
    } catch (error) { 
        window.showToast("Lỗi tải danh bạ nhân viên!", false); 
        console.error("❌ Lỗi fetch JSON (Kiểm tra lại xem employees.json đã nằm cùng thư mục chưa):", error);
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
// HÀM QUẢN LÝ TRẠNG THÁI CHỜ - ĐỒNG HỒ CÁT TOÀN CỤC (VNPS V4.0)
// ==========================================================================
window.startLoadingState = function(mainBtnId, otherBtnIds = []) {
    const mainBtn = document.getElementById(mainBtnId);
    if (!mainBtn) return null;

    const originalText = mainBtn.innerHTML;
    mainBtn.disabled = true;

    // Lọc và khóa các nút phụ (nếu tồn tại trên DOM)
    const otherBtns = otherBtnIds.map(id => document.getElementById(id)).filter(btn => btn !== null);
    otherBtns.forEach(btn => btn.disabled = true);

    let seconds = 0;
    const render = () => {
        mainBtn.innerHTML = `<div class="btn-loading-content"><img src="icons/hourglass_empty.svg" class="hourglass-icon" alt="loading">ĐANG XỬ LÝ... ${seconds}s</div>`;
    };

    render();
    const timerInterval = setInterval(() => {
        seconds++;
        render();
    }, 1000);

    // Trả về hàm dọn dẹp
    return function stopLoadingState() {
        clearInterval(timerInterval);
        mainBtn.innerHTML = originalText;
        mainBtn.disabled = false;
        otherBtns.forEach(btn => btn.disabled = false);
    };
};

// ==========================================================================
// HÀM HIỂN THỊ SKELETON LOADING CHO BẢNG DỮ LIỆU (BẢN V4.8 - SMART HEADER)
// ==========================================================================
window.showTableSkeleton = function(targetId, columnsCount = 5, rowsCount = 3, hasFakeHeader = false) {
    const target = document.getElementById(targetId);
    if (!target) return null;

    // 1. Tự động tìm và làm mờ Tiêu đề thật (Cho Tăng Ca, Khẩu Trang)
    const table = target.tagName === 'TABLE' ? target : target.closest('table');
    const thead = table ? table.querySelector('thead') : null;
    if (thead) {
        thead.style.opacity = '0.4';
        thead.style.transition = 'opacity 0.3s ease';
        thead.style.pointerEvents = 'none'; // Khóa chống click lúc đang mờ
    }

    let html = '';

    // 2. Vẽ Tiêu đề giả mờ ảo (Dành riêng cho Đổi Ca)
    if (hasFakeHeader) {
        html += '<tr class="skeleton-header-row">';
        for (let j = 0; j < columnsCount; j++) {
            // Ô góc thụt vào, các ô ngày tháng dài ra
            html += `<th><div class="skeleton-box" style="width: ${j === 0 ? '40%' : '70%'}; height: 16px;"></div></th>`;
        }
        html += '</tr>';
    }

    // 3. Vẽ Dữ liệu giả
    for (let i = 0; i < rowsCount; i++) {
        html += '<tr class="skeleton-row">';
        for (let j = 0; j < columnsCount; j++) {
            const w = (j === 0) ? '30%' : (Math.floor(Math.random() * 50) + 30) + '%';
            html += `<td><div class="skeleton-box" style="width: ${w};"></div></td>`;
        }
        html += '</tr>';
    }
    target.innerHTML = html;

    // 4. Trả về hàm dọn dẹp để gọi khi API xong
    return function hideSkeleton() {
        if (thead) {
            thead.style.opacity = '1'; // Phục hồi độ sáng cho Header thật
            thead.style.pointerEvents = 'auto';
        }
    };
};

// ==========================================================================
// TỰ ĐỘNG HIGHLIGHT THANH MENU ĐÁY (ZALO STYLE)
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
  if (typeof window.loadEmployeesData === 'function') {
        window.loadEmployeesData();
    }
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
