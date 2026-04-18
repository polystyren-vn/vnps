window.employeeData = [];

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

window.loadEmployeesData = async function() {
    // ĐƯỜNG LINK MỚI DO BẠN CUNG CẤP
    const JSON_URL = "https://polystyren-vn.github.io/vnps/data/employees.json";
    try {
        const response = await fetch(JSON_URL);
        window.employeeData = await response.json();
    } catch (e) {
        window.showToast("Lỗi tải danh bạ nhân sự! Vui lòng tải lại trang.", false);
    }
};
