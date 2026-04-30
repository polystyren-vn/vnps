// ================= CONFIG =================
const SCRIPT_URL_TANG_CA = "https://script.google.com/macros/s/AKfycbzYXPNw_cGZmvQZR9UNAs6XYEjPi6eBvG0fkeugNYfLN8p7utTXBiIovt6zqYHVoTAbTw/exec";

let isListVisible = false;
let isEditing = false;
let currentTongCongValue = "0.00";

// ================= UTIL =================
function debounce(fn, delay = 200) {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), delay);
    };
}

// ================= DROPDOWN =================
function setCustomDropdownValue(hiddenId, rawVal) {
    const hiddenInput = document.getElementById(hiddenId);
    if (!hiddenInput) return;

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
        if (customInput) { customInput.style.display = 'none'; customInput.value = ''; }
        displayBox.classList.add('placeholder-active');
        return;
    }

    let isStandard = false, matchedText = '';
    items.forEach(li => {
        if (li.dataset.value.trim() === val && val !== 'OTHER') {
            isStandard = true;
            matchedText = li.textContent.trim();
            li.classList.add('selected');
        }
    });

    displayBox.classList.remove('placeholder-active');

    if (isStandard) {
        hiddenInput.value = val;
        textDisplay.textContent = matchedText;
        textDisplay.style.display = 'block';
        if (customInput) { customInput.style.display = 'none'; customInput.value = ''; }
    } else {
        hiddenInput.value = 'OTHER';
        textDisplay.style.display = 'none';
        if (customInput) {
            customInput.style.display = 'block';
            customInput.value = (val.toUpperCase() === 'OTHER') ? '' : val;
        }
        items.forEach(li => {
            if (li.dataset.value === 'OTHER') li.classList.add('selected');
        });
    }
}

// ================= EDIT =================
function startEdit(dataStr) {
    const data = JSON.parse(decodeURIComponent(dataStr));

    isEditing = true;

    document.getElementById('editMaPhieu').value = data.maPhieu;

    if (data.ngay && data.ngay.includes('/')) {
        const [d, m, y] = data.ngay.split('/');
        document.getElementById('ngayTangCa').value = `${y}-${m}-${d}`;
    }

    const btnAdd = document.getElementById('btnAddEmp');
    if (btnAdd) btnAdd.style.display = 'none';

    document.querySelectorAll('.employee-row:not(:first-child)').forEach(el => el.remove());

    const firstInput = document.querySelector('.soTheInput');
    if (firstInput) firstInput.value = data.soThe;

    document.getElementById('tuGio').value = data.tuGio?.substring(0, 5) || "";
    document.getElementById('denGio').value = data.denGio?.substring(0, 5) || "";

    setCustomDropdownValue('lyDoSelect', data.lyDo);
    setCustomDropdownValue('loaiSelect', data.loai);

    document.getElementById('bsBtnText').innerText = "CẬP NHẬT";
    document.getElementById('btnSubmit').style.background = "#e67e22";

    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (firstInput) firstInput.dispatchEvent(new Event('input', { bubbles: true }));
    document.getElementById('tuGio').dispatchEvent(new Event('change', { bubbles: true }));
}

function cancelEdit() {
    isEditing = false;

    document.getElementById('tangCaForm').reset();
    document.getElementById('editMaPhieu').value = "";

    document.getElementById('bsBtnText').innerText = "XÁC NHẬN GỬI";
    document.getElementById('btnSubmit').style.background = "";

    const btnAdd = document.getElementById('btnAddEmp');
    if (btnAdd) btnAdd.style.display = 'block';

    document.querySelectorAll('.employee-row:not(:first-child)').forEach(el => el.remove());

    document.querySelector('.msg-name').innerHTML = "";
    document.getElementById('msg-tongCong').innerText = "0.00 Giờ";

    setCustomDropdownValue('lyDoSelect', '');
    setCustomDropdownValue('loaiSelect', '');

    document.getElementById('btnSubmit').disabled = true;
}

// ================= INIT =================
document.addEventListener("DOMContentLoaded", async () => {

    const DOM = {
        tu: document.getElementById('tuGio'),
        den: document.getElementById('denGio'),
        msgTong: document.getElementById('msg-tongCong'),
        form: document.getElementById('tangCaForm'),
        btnSubmit: document.getElementById('btnSubmit')
    };

    // ===== EMPLOYEE INPUT =====
    const container = document.getElementById('employeeInputsContainer');

    container.addEventListener('input', debounce((e) => {
        if (!e.target.classList.contains('soTheInput')) return;

        const val = e.target.value.trim();
        const msgBox = e.target.nextElementSibling;

        const emp = window.employeeData?.find(v => v.soThe === val);

        if (msgBox) msgBox.classList.remove('name-success', 'name-error');

        if (emp) {
            msgBox.innerHTML = `${emp.hoTen} - ${emp.boPhan}`;
            msgBox.classList.add('name-success');
            e.target.dataset.hoten = emp.hoTen;
            e.target.dataset.valid = "true";
        } else {
            msgBox.innerHTML = val === "" ? "" : "Số thẻ không đúng";
            if (val !== "") msgBox.classList.add('name-error');
            e.target.dataset.valid = "false";
        }

        checkFormValidity();
    }, 150));

    // ===== TIME CALC =====
    function calc() {
        if (DOM.tu.value && DOM.den.value) {
            let s = new Date(`1970-01-01T${DOM.tu.value}:00`);
            let e = new Date(`1970-01-01T${DOM.den.value}:00`);

            if (e < s) e.setDate(e.getDate() + 1);

            currentTongCongValue = ((e - s) / 3600000).toFixed(2);
            DOM.msgTong.innerText = `${currentTongCongValue} Giờ`;
        } else {
            DOM.msgTong.innerText = "0.00 Giờ";
            currentTongCongValue = "0.00";
        }
    }

    DOM.tu.addEventListener('change', () => { calc(); checkFormValidity(); });
    DOM.den.addEventListener('change', () => { calc(); checkFormValidity(); });

    // ===== VALIDATION =====
    function checkFormValidity() {
        const hasValidEmp = Array.from(document.querySelectorAll('.soTheInput'))
            .some(inp => inp.dataset.valid === "true");

        const ok =
            document.getElementById('ngayTangCa').value &&
            hasValidEmp &&
            DOM.tu.value &&
            DOM.den.value &&
            document.getElementById('loaiSelect').value !== '';

        const lyDoVal = document.getElementById('lyDoSelect').value;
        const lyDoCustom = document.querySelector('.inline-custom-input')?.value.trim();

        const hasLyDo = lyDoVal === 'OTHER' ? lyDoCustom !== '' : lyDoVal !== '';

        DOM.btnSubmit.disabled = !(ok && hasLyDo);
    }

    document.getElementById('ngayTangCa').addEventListener('change', checkFormValidity);
    document.querySelector('.inline-custom-input')?.addEventListener('input', checkFormValidity);

    // ===== SUBMIT =====
    DOM.form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const btn = DOM.btnSubmit;
        const spinner = document.getElementById('bsSpinner');
        const text = document.getElementById('bsBtnText');

        btn.disabled = true;
        text.style.display = 'none';
        spinner.style.display = 'block';

        const employees = [];
        document.querySelectorAll('.soTheInput').forEach(inp => {
            if (inp.dataset.valid === "true") {
                employees.push({ soThe: inp.value, hoTen: inp.dataset.hoten });
            }
        });

        const d = document.getElementById('ngayTangCa').value.split('-');

        const payload = {
            action: isEditing ? "update" : "submit",
            maPhieu: isEditing ? document.getElementById('editMaPhieu').value : "TC-" + Date.now(),
            employees,
            ngayTangCa: `${d[2]}/${d[1]}/${d[0]}`,
            tuGio: DOM.tu.value,
            denGio: DOM.den.value,
            tongCong: currentTongCongValue,
            lyDo: document.getElementById('lyDoSelect').value,
            loaitangca: document.getElementById('loaiSelect').value
        };

        try {
            const res = await fetch(SCRIPT_URL_TANG_CA, {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            const json = await res.json();

            if (json.status === "success") {
                window.showToast?.("Thành công!", true);
                cancelEdit();
            } else {
                window.showToast?.("Lỗi!", false);
                btn.disabled = false;
            }

        } catch (err) {
            btn.disabled = false;
        } finally {
            text.style.display = 'block';
            spinner.style.display = 'none';
        }
    });

    // ===== DROPDOWN =====
    document.querySelectorAll('.custom-dropdown').forEach(dropdown => {
        const display = dropdown.querySelector('.dropdown-display');
        const hiddenInput = dropdown.querySelector('input[type="hidden"]');
        const customInput = dropdown.querySelector('.inline-custom-input');

        display.addEventListener('click', (e) => {
            if (e.target === customInput) return;
            e.stopPropagation();

            document.querySelectorAll('.custom-dropdown.open')
                .forEach(d => d.classList.remove('open'));

            dropdown.classList.toggle('open');
        });

        dropdown.querySelectorAll('li').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();

                const value = item.dataset.value;
                setCustomDropdownValue(hiddenInput.id, value);

                dropdown.classList.remove('open');

                if (value === 'OTHER') customInput?.focus();

                checkFormValidity();
            });
        });
    });

    document.addEventListener('click', () => {
        document.querySelectorAll('.custom-dropdown.open')
            .forEach(d => d.classList.remove('open'));
    });

    // ===== GLOBAL EVENTS (REPLACE INLINE) =====
    document.getElementById("btnCancel")?.addEventListener("click", cancelEdit);

    document.addEventListener("click", function (e) {
        const box = e.target.closest(".employee-box");
        if (box) box.querySelector("input")?.focus();
    });

    document.addEventListener("click", function (e) {
        const btn = e.target.closest(".btn-edit");
        if (btn) startEdit(btn.dataset.json);
    });
});
