const SCRIPT_URL_DOI_CA = "https://script.google.com/macros/s/AKfycbzYXPNw_cGZmvQZR9UNAs6XYEjPi6eBvG0fkeugNYfLN8p7utTXBiIovt6zqYHVoTAbTw/exec"; 

let currentViTri = ""; 
let isId1Ok = false, isId2Ok = true; 
let isMonthlyVisible = false, isMonthlyDataLoaded = false;
window.shiftDict = {}; 

const VN_DAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

document.addEventListener("DOMContentLoaded", async () => {
    await window.loadEmployeesData(); 
    document.getElementById('id1').addEventListener('input', validateLocal);
    document.getElementById('id2').addEventListener('input', validateLocal);
    document.getElementById('startDate').addEventListener('change', updateGridState);
    renderEmptyGrid(); 
    // Tải sẵn dữ liệu tháng vào RAM (0 độ trễ)
    silentLoadMonthly();
});

function validateLocal() {
    const val1 = document.getElementById('id1').value.trim();
    const val2 = document.getElementById('id2').value.trim();
    const msg1 = document.getElementById('msg-id1');
    const msg2 = document.getElementById('msg-id2');

    msg1.classList.remove('name-success', 'name-error');
    msg2.classList.remove('name-success', 'name-error');

    if (val1 === "") {
        msg1.innerHTML = ""; isId1Ok = false;
    } else {
        const emp1 = window.employeeData.find(e => e.soThe === val1);
        if (emp1) {
            currentViTri = emp1.viTri;
            msg1.innerHTML = `| ${emp1.hoTen} - ${emp1.viTri}`; // Hiển thị theo format yêu cầu
            msg1.classList.add('name-success');
            isId1Ok = true;
        } else {
            msg1.innerHTML = "Số thẻ không đúng";
            msg1.classList.add('name-error');
            isId1Ok = false;
        }
    }

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
                    msg2.innerHTML = `| ${emp2.hoTen} - ${emp2.viTri}`;
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

function updateGridState() {
    const startStr = document.getElementById('startDate').value;
    const id1 = document.getElementById('id1').value.trim();
    const id2 = document.getElementById('id2').value.trim();
    const gridBody = document.getElementById('gridBody');
    
    if (!startStr) { renderEmptyGrid(); return; }

    const startDate = new Date(startStr);
    gridBody.innerHTML = "";
    
    document.getElementById('header-nv1').innerText = id1 || "NV1";
    document.getElementById('header-nv2').innerText = id2 || "NV2";

    for (let i = 0; i < 7; i++) {
        let d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        let dStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        let displayDate = `${VN_DAYS[d.getDay()]}-${d.getDate()}/${d.getMonth()+1}`; // Định dạng T7-29/4

        let s1 = (window.shiftDict[id1] && window.shiftDict[id1][dStr]) || "-";
        let s2 = (window.shiftDict[id2] && window.shiftDict[id2][dStr]) || "-";

        let tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight:bold;">${displayDate}</td>
            <td><select class="grid-select" data-date="${dStr}" data-nv="1">${createOptions(s1)}</select></td>
            <td><select class="grid-select" data-date="${dStr}" data-nv="2" ${id2?'':'disabled'}>${createOptions(s2)}</select></td>
        `;
        gridBody.appendChild(tr);
    }
    document.getElementById('btnSave').disabled = !isId1Ok || !isId2Ok;
}

function createOptions(selected) {
    const shifts = ["A", "B", "C", "D", "N"];
    return shifts.map(s => `<option value="${s}" ${s===selected.replace('.','')?'selected':''}>${s}</option>`).join('');
}

async function submitData() {
    const b = document.getElementById('btnSave');
    const bt = document.getElementById('btnSaveText');
    const sp = document.getElementById('spinner-save');
    
    b.disabled = true; bt.style.display = 'none'; sp.style.display = 'block';

    const selects = document.querySelectorAll('.grid-select');
    let updates = [];
    selects.forEach(sel => {
        if (!sel.disabled) {
            updates.push({
                date: sel.getAttribute('data-date'),
                nv: sel.getAttribute('data-nv') === "1" ? document.getElementById('id1').value : document.getElementById('id2').value,
                shift: sel.value
            });
        }
    });

    try {
        const r = await fetch(SCRIPT_URL_DOI_CA, {
            method: 'POST',
            body: JSON.stringify({ action: "updateShifts", updates: updates, deviceId: window.getDeviceId() })
        });
        const res = await r.json();
        if (res.status === "success") {
            window.showToast("Đổi ca thành công!", true);
            isMonthlyDataLoaded = false; // Xóa cache RAM để nạp lại
            resetForm();
        }
    } catch (e) {
        window.showToast("Lỗi kết nối!", false);
    } finally {
        b.disabled = false; bt.style.display = 'block'; sp.style.display = 'none';
    }
}

async function silentLoadMonthly() {
    const r = await fetch(SCRIPT_URL_DOI_CA, { method: 'POST', body: JSON.stringify({ action: "getMonthlyReport" }) });
    const res = await r.json();
    if (res.status === "success") {
        window.shiftDict = res.data.shiftDict;
        isMonthlyDataLoaded = true;
    }
}

async function toggleMonthly() {
    const section = document.getElementById('monthlyView');
    const btnText = document.getElementById('btnMonthlyText');
    if (isMonthlyVisible) {
        section.style.display = 'none';
        btnText.innerText = "XEM LỊCH THÁNG";
        isMonthlyVisible = false;
    } else {
        if (!isMonthlyDataLoaded) {
            btnText.style.display = 'none';
            document.getElementById('spinner-monthly').style.display = 'block';
            await silentLoadMonthly();
            document.getElementById('spinner-monthly').style.display = 'none';
            btnText.style.display = 'block';
        }
        renderMonthlyUI();
        section.style.display = 'block';
        btnText.innerText = "ẨN LỊCH THÁNG";
        isMonthlyVisible = true;
    }
}

function renderMonthlyUI() {
    // Logic render tableData vào #monthlyTable (giống bản 2.5 của bạn)
}

function resetForm() {
    document.getElementById('doiCaForm').reset();
    document.getElementById('msg-id1').innerHTML = "";
    document.getElementById('msg-id2').innerHTML = "";
    renderEmptyGrid();
}

function renderEmptyGrid() {
    const gb = document.getElementById('gridBody');
    gb.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:20px; color:#9aa0a6;">Vui lòng chọn ngày và nhập số thẻ...</td></tr>';
}
