const fetchSheetData = async () => {
    try {
        // loading.value = true;
        // Replace with your Google Sheet ID
        const sheetId = '1R_Pp0Kb3ApNFVilFTy1POJ1DZY1eL142LtB9g8063R0';
        // Use published sheet endpoint for simplicity (no auth needed)
        const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`;

        const response = await fetch(url);
        const text = await response.text();

        // Parse the text response (it returns a weird format with a prefix)
        // The response typically starts with "google.visualization.Query.setResponse("
        const jsonStart = text.indexOf('{');
        const jsonEnd = text.lastIndexOf('}') + 1;
        const jsonData = JSON.parse(text.substring(jsonStart, jsonEnd));

        // Process the data into a usable format
        // Generate column names - if label is empty, use "Column X" format
        const columns = jsonData.table.cols.map((col, idx) =>
            col.label || `Column ${idx + 1}`
        );

        sheetData = jsonData.table.rows.map(row => {
            const rowData = {};
            columns.forEach((col, index) => {
                rowData[col] = row.c[index] ? row.c[index].v : null;
            });
            return rowData;
        });

        return sheetData;

    } catch (err) {
        console.error('Error fetching sheet data:', err);
        error.value = 'Failed to load data from Google Sheet';
        loading.value = false;
    }
};


async function checkLogin() {
    const user = document.getElementById('signin_username');
    const pass = document.getElementById('signin_pass');
    const validateText = document.getElementById("validateText");
    const messages = {
        emptyUserPass: "กรุณากรอกชื่อผู้ใช้ และรหัสผ่าน",
        emptyUser: "กรุณากรอกชื่อผู้ใช้",
        emptyPass: "กรุณากรอกรหัสผ่าน",
        invalid: "ชื่อผู้ใช้ หรือรหัสผ่านไม่ถูกต้อง"
    };
    
    if (!user.value && !pass.value) {
        validateText.textContent = messages.emptyUserPass;
    } else if (!user.value) {
        validateText.textContent = messages.emptyUser;
    } else if (!pass.value) {
        validateText.textContent = messages.emptyPass;
    } else {

        const sheetData = await fetchSheetData();
        const foundUser = sheetData.find(row => row.username === user.value && row.password == pass.value);

        if (foundUser) {
            sessionStorage.setItem('username', foundUser.username);
            sessionStorage.setItem('name', foundUser.name);
            window.open('/index.html', '_self');
            validateText.classList.remove('show');
            return;
        } else {
            validateText.textContent = messages.invalid;
        }
    }
    validateText.classList.add('show');
}

const boxInfo = document.getElementById('boxInfo');
const boxPass = document.getElementById('boxPass');
const boxNotPass = document.getElementById('boxNotPass');

if(boxInfo) {
    showTableData();
}

async function showTableData() {
    const storedUsername = sessionStorage.getItem('username');
    const storedName = sessionStorage.getItem('name');
    if (storedUsername && storedName) {
       boxInfo.innerHTML = `<strong>${storedName}</strong>`;
       const sheetData = await fetchSheetData();
       const userData = sheetData.find(row => row.username === storedUsername);
        if (userData) {
            // console.log(userData)
            // แสดงข้อมูล pass1-pass5 ใน boxPass
            let passHTML = '<tr>';
            for (let i = 1; i < 5; i++) {
                const passKey = `pass${i}`;
                if (userData[passKey]) {
                    // แทนที่ , ด้วย ,<br>
                    const formattedValue = userData[passKey].replace(/,/g, ',<br>');
                    passHTML += `<td>${formattedValue}</td>`;
                } else {
                    passHTML += `<td>No data</td>`; // หากไม่มีข้อมูล
                }
            }
            passHTML += '</tr>';
            boxPass.innerHTML = passHTML;

            // แสดงข้อมูล notPass1-notPass5 ใน boxNotPass
            if (boxNotPass) {
                let notPassHTML = '<tr>';
                for (let i = 1; i < 5; i++) {
                    const notPassKey = `not_pass${i}`;
                    if (userData[notPassKey]) {
                        // แทนที่ , ด้วย ,<br>
                        const formattedValue = userData[notPassKey].replace(/,/g, ',<br>');
                        notPassHTML += `<td>${formattedValue}</td>`;
                    } else {
                        notPassHTML += `<td>No data</td>`; // หากไม่มีข้อมูล
                    }
                }
                notPassHTML += '</tr>';
                boxNotPass.innerHTML = notPassHTML;
            }
        } else {
            console.log('User data not found in sheet');
        }
    }

}

const loginButton = document.getElementById('loginButton');
const logoutSection = document.getElementById('logoutSection');
const usernameDisplay = document.getElementById('usernameDisplay');
const logoutButton = document.getElementById('logoutButton');
const storedUsername = sessionStorage.getItem('username');

if (storedUsername) {
    // ถ้ามี username ใน sessionStorage (ล็อกอินแล้ว)
    loginButton.style.display = 'none'; // ซ่อนปุ่มล็อกอิน
    logoutSection.style.display = 'block'; // แสดงส่วนล็อกเอาท์
    usernameDisplay.innerText = storedUsername; // แสดงชื่อผู้ใช้
} else {
    // ถ้าไม่มี username ใน sessionStorage (ยังไม่ได้ล็อกอิน)
    loginButton.style.display = 'block'; // แสดงปุ่มล็อกอิน
    logoutSection.style.display = 'none'; // ซ่อนส่วนล็อกเอาท์
}

// จัดการการคลิกปุ่มล็อกเอาท์
if (logoutButton) {
    logoutButton.addEventListener('click', () => {
        // เคลียร์ sessionStorage
        sessionStorage.removeItem('username');
        sessionStorage.removeItem('name');

        // รีเฟรชหน้าเว็บ (หรือเปลี่ยนเส้นทางไปที่หน้าล็อกอิน)
        window.location.href = '/login.html';
    });
}