const SCRIPT_URL_TANG_CA = "https://script.google.com/macros/s/AKfycbzYXPNw_cGZmvQZR9UNAs6XYEjPi6eBvG0fkeugNYfLN8p7utTXBiIovt6zqYHVoTAbTw/exec";
let isListVisible = false, isEditing = false, isDataLoaded = false, currentTongCongValue = "0.00";

window.setCustomDropdownValue = function(hiddenId, rawVal) {
    const hiddenInput = document.getElementById(hiddenId);
    if(!hiddenInput) return;
    const dropdown = hiddenInput.closest('.custom-dropdown');
    const textDisplay = dropdown.querySelector('.dropdown-text');
    const customInput = dropdown.querySelector('.inline-custom-input');
    const displayBox = dropdown.querySelector('.dropdown-display');
    const items = dropdown.querySelectorAll('.options-list li');

    items.forEach(li => li.classList.remove('selected'));
    const val = rawVal ? String(rawVal).trim() : '';

    if (!val) {
        hiddenInput.value = '';
        textDisplay.textContent = hiddenId === 'lyDoSelect' ? 'LÝ DO TĂNG CA' : 'LOẠI TĂNG CA';
        textDisplay.style.display = 'block';
        if(customInput) { customInput.style.display = 'none'; customInput.value = ''; }
        displayBox.classList.add('placeholder-active');
        return;
    }

    let isStandard = false, matchedText = '';
    items.forEach(li => {
        if (li.getAttribute('data-value').trim() === val && val !== 'OTHER') {
            isStandard = true; matchedText = li.textContent.trim(); li.classList.add('selected');
        }
    });

    displayBox.classList.remove('placeholder-active');
    if (isStandard) {
        hiddenInput.value = val; textDisplay.textContent = matchedText; textDisplay.style.display = 'block';
        if(customInput) { customInput.style.display = 'none'; customInput.value = ''; }
    } else {
        hiddenInput.value = 'OTHER'; textDisplay.style.display = 'none';
        if(customInput) { customInput.style.display = 'block'; customInput.value = (val.toUpperCase() === 'OTHER') ? '' : val; }
        items.forEach(li => { if (li.getAttribute('data-value') === 'OTHER') li.classList.add('selected'); });
    }
};

window.startEdit = function(dataStr) {
    const data = JSON.parse(decodeURIComponent(dataStr));
    isEditing = true;
    document.getElementById('editMaPhieu').value = data.maPhieu;
    if (data.ngay && data.ngay.includes('/')) {
        const [d, m, y] = data.ngay.split('/'); document.getElementById('ngayTangCa').value = `${y}-${m}-${d}`;
    }
    const btnAdd = document.getElementById('btnAddEmp'); if (btnAdd) btnAdd.style.display = 'none';
    document.querySelectorAll('.employee-row:not(:first-child)').forEach(el => el.remove());
    const firstInput = document.querySelector('.soTheInput'); if (firstInput) firstInput.value = data.soThe;
    document.getElementById('tuGio').value = data.tuGio ? data.tuGio.toString().substring(0, 5) : "";
    document.getElementById('denGio').value = data.denGio ? data.denGio.toString().substring(0, 5) : "";
    window.setCustomDropdownValue('lyDoSelect', data.lyDo);
    window.setCustomDropdownValue('loaitangca', data.loai);
    document.getElementById('btnText').innerText = "CẬP NHẬT DỮ LIỆU";
    document.getElementById('btnSubmit').style.background = "#e67e22";
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (firstInput) firstInput.dispatchEvent(new Event('input', { bubbles: true }));
    document.getElementById('tuGio').dispatchEvent(new Event('change', { bubbles: true }));
};

window.cancelEdit = function() {
    isEditing = false;
    document.getElementById('tangCaForm').reset();
    document.getElementById('editMaPhieu').value = "";
    document.getElementById('btnText').innerText = "GỬI DỮ LIỆU";
    document.getElementById('btnSubmit').style.background = "";
    const btnAdd = document.getElementById('btnAddEmp'); if (btnAdd) btnAdd.style.display = 'block';
    document.querySelectorAll('.employee-row:not(:first-child)').forEach(el => el.remove());
    const msgSoThe = document.querySelector('.msg-name'); if (msgSoThe) msgSoThe.innerHTML = "";
    document.getElementById('msg-tongCong').innerText = "0.00 (h)";
    window.setCustomDropdownValue('lyDoSelect', ''); 
    window.setCustomDropdownValue('loaitangca', '');
    document.getElementById('btnSubmit').disabled = true;
};

document.addEventListener("DOMContentLoaded", async () => {
    if(typeof window.loadEmployeesData === 'function') await window.loadEmployeesData();
    const container = document.getElementById('employeeInputsContainer');
    if (container) {
        container.addEventListener('input', (e) => {
            if (!e.target.classList.contains('soTheInput')) return;
            const val = e.target.value.trim(), msgBox = e.target.nextElementSibling;
            const emp = window.employeeData ? window.employeeData.find(v => v.soThe === val) : null;
            if (msgBox) msgBox.classList.remove('name-success', 'name-error');
            if (emp) {
                if (msgBox) { msgBox.innerHTML = `${emp.hoTen} - ${emp.boPhan}`; msgBox.classList.add('name-success'); }
                e.target.dataset.hoten = emp.hoTen; e.target.dataset.valid = "true";
            } else { if (msgBox) { msgBox.innerHTML = val === "" ? "" : "Số thẻ không đúng"; if (val !== "") msgBox.classList.add('name-error'); } e.target.dataset.valid = "false"; }
            checkFormValidity();
        });
    }

    const tu = document.getElementById('tuGio'), den = document.getElementById('denGio');
    function calc() {
        if (tu.value && den.value) {
            let s = new Date(`1970-01-01T${tu.value}:00`), e = new Date(`1970-01-01T${den.value}:00`);
            if (e < s) e.setDate(e.getDate() + 1);
            currentTongCongValue = ((e - s) / 3600000).toFixed(2);
            document.getElementById('msg-tongCong').innerText = `${currentTongCongValue} (h)`;
        } else { document.getElementById('msg-tongCong').innerText = "0.00 (h)"; currentTongCongValue = "0.00"; }
    }
    tu.addEventListener('change', () => { calc(); checkFormValidity(); });
    den.addEventListener('change', () => { calc(); checkFormValidity(); });

    window.checkFormValidity = function() {
        const hasAtLeastOne = Array.from(document.querySelectorAll('.soTheInput')).some(inp => inp.dataset.valid === "true");
        const ok = document.getElementById('ngayTangCa').value && hasAtLeastOne && tu.value && den.value && document.getElementById('loaitangca').value !== '';
        const lyDoSelectVal = document.getElementById('lyDoSelect').value;
        const lyDoCustomVal = document.getElementById('lyDoCustom') ? document.getElementById('lyDoCustom').value.trim() : "";
        let hasLyDo = lyDoSelectVal === 'OTHER' ? lyDoCustomVal !== '' : lyDoSelectVal !== '';
        document.getElementById('btnSubmit').disabled = !(ok && hasLyDo);
    };

    document.getElementById('lyDoCustom').addEventListener('input', checkFormValidity);
    document.getElementById('ngayTangCa').addEventListener('change', checkFormValidity);

    document.getElementById('tangCaForm').addEventListener('submit', async (e) => {
        e.preventDefault(); const b = document.getElementById('btnSubmit'), sp = document.getElementById('spinner'), bt = document.getElementById('btnText');
        b.disabled = true; bt.style.display = 'none'; sp.style.display = 'block';
        const employeesArray = [];
        document.querySelectorAll('.soTheInput').forEach(inp => { if(inp.dataset.valid === "true") employeesArray.push({ soThe: inp.value, hoTen: inp.dataset.hoten }); });
        const dParts = document.getElementById('ngayTangCa').value.split('-');
        const finalLyDo = document.getElementById('lyDoSelect').value === 'OTHER' ? document.getElementById('lyDoCustom').value.trim() : document.getElementById('lyDoSelect').value;
        const payload = { action: isEditing ? "update" : "submit", maPhieu: isEditing ? document.getElementById('editMaPhieu').value : "TC-" + Date.now(), employees: employeesArray, ngayTangCa: `${dParts[2]}/${dParts[1]}/${dParts[0]}`, tuGio: tu.value, denGio: den.value, tongCong: currentTongCongValue, lyDo: finalLyDo, loaitangca: document.getElementById('loaitangca').value };
        try {
            const r = await fetch(SCRIPT_URL_TANG_CA, { method: 'POST', body: JSON.stringify(payload) });
            const res = await r.json();
            if (res.status === "success") { window.showToast("Thành công!", true); window.cancelEdit(); if(isListVisible) loadList(); }
            else { window.showToast("Lỗi!", false); b.disabled = false; }
        } catch (err) { b.disabled = false; } finally { bt.style.display = 'block'; sp.style.display = 'none'; }
    });

    const dropdowns = document.querySelectorAll('.custom-dropdown');
    dropdowns.forEach(dropdown => {
        const display = dropdown.querySelector('.dropdown-display'), hiddenInput = dropdown.querySelector('input[type="hidden"]'), customInput = dropdown.querySelector('.inline-custom-input');
        display.addEventListener('click', (e) => {
            if (e.target === customInput) return; e.stopPropagation();
            document.querySelectorAll('.custom-dropdown.open').forEach(d => { if (d !== dropdown) d.classList.remove('open'); });
            dropdown.classList.toggle('open');
        });
        dropdown.querySelectorAll('.options-list li').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation(); const value = item.getAttribute('data-value');
                window.setCustomDropdownValue(hiddenInput.id, value);
                dropdown.classList.remove('open');
                if (value === 'OTHER' && customInput) customInput.focus();
                checkFormValidity();
            });
        });
    });
    document.addEventListener('click', () => document.querySelectorAll('.custom-dropdown.open').forEach(d => d.classList.remove('open')));
});
