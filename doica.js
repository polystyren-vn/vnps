
const SCRIPT_URL_DOI_CA = "https://script.google.com/macros/s/AKfycbzYXPNw_cGZmvQZR9UNAs6XYEjPi6eBvG0fkeugNYfLN8p7utTXBiIovt6zqYHVoTAbTw/exec"; 
 
let currentViTri = ""; let isId1Ok = false, isId2Ok = true; window.shiftDict = {}; 

window.clearField = (id) => { const i = document.getElementById(id); i.value = ''; i.dispatchEvent(new Event('input')); };

document.addEventListener("DOMContentLoaded", async () => {
    await window.loadEmployeesData(); 
    document.getElementById('id1').addEventListener('input', validateLocal);
    document.getElementById('id2').addEventListener('input', validateLocal);
    document.getElementById('startDate').addEventListener('change', updateGridState);
    renderEmptyGrid(); renderMonthlyTable(); 
});

function validateLocal() {
    const val1 = document.getElementById('id1').value.trim(), val2 = document.getElementById('id2').value.trim();
    const msg1 = document.getElementById('msg-id1'), msg2 = document.getElementById('msg-id2');

    if (val1 === "") { msg1.innerHTML = ""; isId1Ok = false; document.getElementById('id1').classList.remove('is-valid', 'is-invalid'); } 
    else {
        const emp1 = window.employeeData.find(e => e.soThe === val1);
        if (emp1) { currentViTri = emp1.viTri; msg1.innerHTML = `<span class="success-text">✅ ${emp1.hoTen} (${emp1.viTri})</span>`; document.getElementById('id1').className = 'is-valid'; isId1Ok = true; }
        else { msg1.innerHTML = '<span class="error-text">❌ Không tồn tại</span>'; document.getElementById('id1').className = 'is-invalid'; isId1Ok = false; }
    }
    // (Logic validate ID2 tương tự bản trước, có chặn khác Vị trí)
    updateGridState();
}

function renderEmptyGrid() {
    const tbody = document.getElementById('grid-body'); let html = '';
    for(let i=0; i<7; i++) html += `<div class="day-row"><div class="col-date empty-cell">-</div><div class="col-nv1 empty-cell">-</div><div class="col-nv2 empty-cell">-</div></div>`;
    tbody.innerHTML = html;
}

function updateGridState() {
    const startD = document.getElementById('startDate').value, id1 = document.getElementById('id1').value.trim(), id2 = document.getElementById('id2').value.trim(), tbody = document.getElementById('grid-body');
    document.getElementById('gh-nv1').innerText = (isId1Ok && id1) ? id1 : "NV1";
    document.getElementById('gh-nv2').innerText = (isId2Ok && id2) ? id2 : (isId1Ok && id1 ? "CA MỚI" : "NV2");
    if (!startD) { renderEmptyGrid(); document.getElementById('btnSave').style.display = 'none'; document.getElementById('btnCancel').style.display = 'none'; return; }

    let html = '';
    for (let i = 0; i < 7; i++) {
        let d = new Date(startD); d.setDate(d.getDate() + i);
        let dStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        let s1Html = isId1Ok ? `<span class="badge">${(window.shiftDict[id1] && window.shiftDict[id1][dStr]) || "N/A"}</span>` : `<div class="empty-cell">-</div>`;
        let s2Html = (isId1Ok && id2 !== "") ? `<span class="badge">${(window.shiftDict[id2] && window.shiftDict[id2][dStr]) || "N/A"}</span>` : (isId1Ok ? `<select class="new-shift">...</select>` : `<div class="empty-cell">-</div>`);
        html += `<div class="day-row ${d.getDay()===0?'sunday':''}" data-date="${dStr}"><div class="col-date">${d.getDate()}/${d.getMonth()+1}</div><div class="col-nv1">${s1Html}</div><div class="col-nv2">${s2Html}</div></div>`;
    }
    tbody.innerHTML = html;
    document.getElementById('btnSave').style.display = isId1Ok ? 'flex' : 'none';
    document.getElementById('btnCancel').style.display = isId1Ok ? 'flex' : 'none';
}

function toggleMonthly() {
    const view = document.getElementById('monthlyView'), btn = document.getElementById('btnToggleMonthly');
    const isHidden = view.style.display === 'none';
    view.style.display = isHidden ? 'block' : 'none';
    btn.innerText = isHidden ? 'ẨN LỊCH THÁNG' : 'XEM LỊCH THÁNG';
}

function resetForm() {
    document.getElementById('id1').value = ''; document.getElementById('id2').value = ''; 
    isId1Ok = false; validateLocal(); renderEmptyGrid();
}

async function renderMonthlyTable() {
    const r = await fetch(SCRIPT_URL_DOI_CA, { method: 'POST', body: JSON.stringify({ action: "getMonthlyReport" }) });
    const res = await r.json();
    if (res.status === "success") {
        window.shiftDict = res.data.shiftDict || {};
        document.getElementById('monthlyTitle').innerText = "LỊCH THÁNG " + res.data.monthYear;
        let html = "";
        res.data.tableData.forEach((row, rIdx) => {
            const nhom = row[row.length - 1];
            html += `<tr class="${nhom==='GROUP'?'row-goc':''}">`;
            for (let cIdx = 0; cIdx < row.length - 1; cIdx++) {
                let cell = row[cIdx], className = (rIdx===0) ? "sticky-header" : (cIdx===0 ? "sticky-col" : "");
                if (nhom==='GROUP' && cIdx===0) className += " team-label";
                if (nhom==='QL' && cIdx>0) className += " normal-weight"; // Bỏ đậm cho QL
                if (nhom==='T' && cIdx>0 && cell!=="") className += " cell-changed";
                html += `<td class="${className}">${cell}</td>`;
            }
            html += "</tr>";
        });
        document.getElementById('monthlyTable').innerHTML = html;
    }
}
