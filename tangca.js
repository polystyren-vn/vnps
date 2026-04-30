// ==========================================================================
// TEST BƯỚC 1: XỬ LÝ KHỐI EMPLOYEE-BOX VÀ Ô HIỂN THỊ TÊN (MSG-NAME)
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
    
    // 1. CLICK VÀO EMPLOYEE-BOX ĐỂ FOCUS INPUT
    // Lắng nghe sự kiện click trên toàn trang
    document.addEventListener("click", function(e) {
        // Tìm xem người dùng có click trúng khối employee-box nào không
        const box = e.target.closest(".employee-box");
        
        // Nếu trúng box, và chỗ click KHÔNG phải là thẻ input (để tránh focus 2 lần)
        if (box && e.target.tagName !== 'INPUT') {
            const input = box.querySelector(".soTheInput");
            if (input) {
                input.focus();
            }
        }
    });

    // 2. GÕ SỐ THẺ TỰ ĐỘNG HIỆN TÊN (EVENT DELEGATION)
    // Lắng nghe sự kiện gõ phím trên toàn trang
    document.addEventListener("input", function(e) {
        // Chỉ xử lý nếu ô đang gõ có class là "soTheInput"
        if (e.target.classList.contains("soTheInput")) {
            const inputElement = e.target;
            const val = inputElement.value.trim();
            const box = inputElement.closest(".employee-box"); 
            const msgBox = box ? box.querySelector(".msg-name") : null;
            
            if (!msgBox) return; // Tránh lỗi nếu HTML thiếu thẻ msg-name

            // Xóa màu trạng thái cũ
            msgBox.classList.remove("name-success", "name-error");

            // Xử lý khi ô trống
            if (val === "") {
                msgBox.innerHTML = "";
                inputElement.dataset.hoten = "";
                inputElement.dataset.valid = "false";
                return;
            }

            // Dò tìm trong RAM Cache
            let emp = null;
            if (window.employeeData && Array.isArray(window.employeeData)) {
                emp = window.employeeData.find(v => String(v.soThe) === val);
            }

            // Trả kết quả lên giao diện
            if (emp) {
                msgBox.innerHTML = emp.hoTen;
                msgBox.classList.add("name-success");
                inputElement.dataset.hoten = emp.hoTen; // Gắn ngầm data để gửi đi
                inputElement.dataset.valid = "true";
            } else {
                msgBox.innerHTML = "Không tìm thấy";
                msgBox.classList.add("name-error");
                inputElement.dataset.hoten = "";
                inputElement.dataset.valid = "false";
            }
        }
    });

});
