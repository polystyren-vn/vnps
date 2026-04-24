const SCRIPT_URL_DOI_CA = "https://script.google.com/macros/s/AKfycbzYXPNw_cGZmvQZR9UNAs6XYEjPi6eBvG0fkeugNYfLN8p7utTXBiIovt6zqYHVoTAbTw/exec"; 

// TRẠNG THÁI HỆ THỐNG
let currentViTri = ""; 
let isId1Ok = false, isId2Ok = true; 
let isMonthlyVisible = false;
let isMonthlyDataLoaded = false; // V2.6 RAM Cache
window.shiftDict = {}; 

document.addEventListener("DOMContentLoaded", async () => {
    await window.loadEmployeesData(); 
    
    // Gán sự kiện cho Số thẻ
    document.getElementById('id1').addEventListener('input', validateLocal);
    document.getElementById('id2').addEventListener('input', validateLocal);
    document.getElementById('startDate').addEventListener('change', updateGridState);
    
    // Sự kiện hoán đổi Lý do
    setupReasonLogic();

    // Nút xem lịch tháng thông minh (RAM Cache)
    document.getElementById('btnToggleMonthly').addEventListener('click', toggleMonthly);

    renderEmptyGrid(); 
});

// LOGIC XÁC THỰC SỐ THẺ & ĐỔI MÀU (Chuẩn V2.5)
function validateLocal() {
    const val1 = document.getElementById('id1').value.trim();
    const val2 = document.getElementById('id2').value.trim();
    const msg1 = document.getElementById('msg-id1');
    const msg2 = document.getElementById('msg-id2');

    // Reset màu
    msg1.classList.remove('name-success', 'name-error');
    msg2.classList.remove('name-success', 'name-error');

    // Kiểm tra NV1
    if (val1 === "") {
        msg1.innerHTML = ""; isId1Ok = false;
    } else {
        const emp1 = window.employeeData.find(e => e.soThe === val1);
        if (emp1) {
            currentViTri = emp1.viTri;
            msg1.innerHTML = `${emp1.hoTen} - ${emp1.boPhan}`;
            msg1.classList.add('name-success');
            isId1Ok = true;
        } else {
            msg1.innerHTML = "Số thẻ không đúng";
            msg1.classList.add('name-error');
            isId1Ok = false;
        }
    }

    // Kiểm tra NV2
    if (val2 === "") {
        msg2.innerHTML = ""; isId2Ok = true;
    } else {
        if (val1 === val2) {
            msg2.innerHTML = "Trùng số thẻ NV1";
            msg2.classList.add('name-error');
            isId2Ok = false;
        } else {
            const emp2 = window.employeeData.find(e => e.soThe === val2);
            if (emp2) {
                if (emp2.viTri !== currentViTri) {
                    msg2.innerHTML = `Sai vị trí (${emp2.viTri})`;
                    msg2.classList.add('name-error');
                    isId2Ok = false;
                } else {
                    msg2.innerHTML = `${emp2.hoTen} - ${emp2.boPhan}`;
                    msg2.classList.add('name-success');
                    isId2Ok = true;
                }
            } else {
                msg2.innerHTML = "Số thẻ không đúng";
                msg2.classList.add('name-error');
                isId2Ok = false;
            }
        }
    }
    updateGridState();
}

// LOGIC RAM CACHE CHO LỊCH THÁNG
async function toggleMonthly() {
    const section = document.getElementById('monthlyView');
    const btnText = document.getElementById('btnMonthlyText');
    const spinner = document.getElementById('spinner-monthly');

    if (isMonthlyVisible) {
        section.style.display = 'none';
        btnText.innerText = "XEM LỊCH THÁNG";
        isMonthlyVisible = false;
    } else {
        if (isMonthlyDataLoaded) {
            section.style.display = 'block';
            btnText.innerText = "ẨN LỊCH THÁNG";
            isMonthlyVisible = true;
        } else {
            // Tải từ server
            btnText.style.display = 'none';
            spinner.style.display = 'block';
            await renderMonthlyTable();
            spinner.style.display = 'none';
            btnText.style.display = 'block';
            btnText.innerText = "ẨN LỊCH THÁNG";
            isMonthlyVisible = true;
        }
    }
}

async function renderMonthlyTable() {
    try {
        const r = await fetch(SCRIPT_URL_DOI_CA, { method: 'POST', body: JSON.stringify({ action: "getMonthlyReport" }) });
        const res = await r.json();
        if (res.status === "success" && res.data) {
            window.shiftDict = res.data.shiftDict || {};
            document.getElementById('monthlyTitle').innerText = "LỊCH THÁNG " + res.data.monthYear;
            
            let html = "";
            res.data.tableData.forEach((row, rIdx) => {
                const nhom = row[row.length - 1];
                html += `<tr class="${nhom==='GROUP'?'row-goc':''}">`;
                for (let cIdx = 0; cIdx < row.length - 1; cIdx++) {
                    let cell = row[cIdx], className = (rIdx===0) ? "sticky-header" : (cIdx===0 ? "sticky-col" : "");
                    if (nhom==='T' && cIdx>0 && cell!=="") className += " cell-changed";
                    html += `<td class="${className}">${cell}</td>`;
                }
                html += "</tr>";
            });
            document.getElementById('monthlyTable').innerHTML = html;
            isMonthlyDataLoaded = true;
            document.getElementById('monthlyView').style.display = 'block';
        }
    } catch (e) {
        window.showToast("Lỗi tải lịch tháng!", false);
    }
}

// LOGIC LÝ DO (Hoán đổi Select/Input)
function setupReasonLogic() {
    const select = document.getElementById('lyDoSelect');
    const custom = document.getElementById('lyDoCustom');
    const sPart = document.getElementById('reason-select-part');
    const cPart = document.getElementById('reason-custom-part');
    const btnBack = document.getElementById('btnBackToSelect');

    select.addEventListener('change', () => {
        if (select.value === 'OTHER') {
            sPart.style.display = 'none';
            cPart.style.display = 'flex';
            custom.focus();
        }
        checkSubmitValid();
    });

    btnBack.addEventListener('click', () => {
        select.value = '';
        custom.value = '';
        sPart.style.display = 'flex';
        cPart.style.display = 'none';
        checkSubmitValid();
    });
    
    custom.addEventListener('input', checkSubmitValid);
    document.getElementById('startDate').addEventListener('change', checkSubmitValid);
}

function checkSubmitValid() {
    const dateOk = document.getElementById('startDate').value !== "";
    const reasonOk = (document.getElementById('lyDoSelect').value === 'OTHER') ? 
                     document.getElementById('lyDoCustom').value.trim() !== "" : 
                     document.getElementById('lyDoSelect').value !== "";
    
    document.getElementById('btnSave').disabled = !(isId1Ok && isId2Ok && dateOk && reasonOk);
}

// CÁC HÀM CŨ (GIỮ NGUYÊN LOGIC NGHIỆP VỤ)
function renderEmptyGrid() { /* ... Giữ nguyên từ doica.js cũ ... */ }
function updateGridState() { /* ... Giữ nguyên nhưng bổ sung checkSubmitValid() ở cuối ... */ }
async function submitData() {
    // ... Thêm hiệu ứng spinner và reset cờ isMonthlyDataLoaded = false khi thành công ...
}
