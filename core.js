window.employeeData = [];
window.showToast = function(m, o) {
    let t = document.getElementById('toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
    t.textContent = m; t.style.backgroundColor = o ? '#137333' : '#D93025';
    t.style.top = '20px'; setTimeout(() => t.style.top = '-100px', 3000);
};
window.loadEmployeesData = async function() {
    try {
        const r = await fetch("https://polystyren-vn.github.io/vnps/data/employees.json");
        window.employeeData = await r.json();
    } catch (e) { window.showToast("Lỗi tải danh bạ!", false); }
};
window.getDeviceId = function() {
    let id = localStorage.getItem('vnps_device_id');
    if (!id) { id = Math.random().toString(36).substring(2, 8).toUpperCase(); localStorage.setItem('vnps_device_id', id); }
    return id;
};
