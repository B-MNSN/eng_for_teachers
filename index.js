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

        console.log(sheetData)
        if (foundUser) {
            sessionStorage.setItem('username', foundUser.username);
            sessionStorage.setItem('name', foundUser.name);
            window.open('./index.html', '_self');
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
                    passHTML += `<td>
                        <span class="task-item passed-task">
                                <i class="fas fa-check"></i>
                                ${formattedValue}
                        </span>
                    </td>`;
                } else {
                    passHTML += `<td class="empty-message">No data</td>`; // หากไม่มีข้อมูล
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
                        notPassHTML += `<td>
                            <span class="task-item failed-task">
                                <i class="fas fa-times"></i>
                                ${formattedValue}
                            </span>
                        </td>`;
                    } else {
                        notPassHTML += `<td class="empty-message">No data</td>`; // หากไม่มีข้อมูล
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

const loginButton = document.querySelectorAll('.loginButton');
const logoutSection = document.querySelectorAll('.logoutSection');
const usernameDisplay = document.querySelectorAll('.usernameDisplay');
const logoutButton = document.querySelectorAll('.logoutButton');
const storedUsername = sessionStorage.getItem('username');

if (storedUsername) {
    // ถ้ามี username ใน sessionStorage (ล็อกอินแล้ว)
    loginButton.forEach(btn => {
        btn.style.display = 'none'; // ซ่อนปุ่มล็อกอิน
    })
    logoutSection.forEach(btn => {
        btn.style.display = 'block'; // แสดงส่วนล็อกเอาท์
    })

    if (usernameDisplay) {
        usernameDisplay.forEach(item => {
            item.innerText = storedUsername; // แสดงชื่อผู้ใช้
        })
    }
} else {
    // ถ้าไม่มี username ใน sessionStorage (ยังไม่ได้ล็อกอิน)
    loginButton.forEach(btn => {
        btn.style.display = 'block';
    })
    logoutSection.forEach(btn => {
        btn.style.display = 'none';
    })
}

// จัดการการคลิกปุ่มล็อกเอาท์
if (logoutButton) {
    logoutButton.forEach(btn => {
        btn.addEventListener('click', () => {
            // เคลียร์ sessionStorage
            sessionStorage.removeItem('username');
            sessionStorage.removeItem('name');
    
            // รีเฟรชหน้าเว็บ (หรือเปลี่ยนเส้นทางไปที่หน้าล็อกอิน)
            window.location.href = './login.html';
        });
    })
}



// Mobile menu functionality
const mobileMenuBtn = document.getElementById('mobile-menu');
const mobileMenuCloseBtn = document.getElementById('mobileMenuClose');
const mobileMenu = document.getElementById('mobileMenu');
const menuBackdrop = document.getElementById('menuBackdrop');
const body = document.body;

// Toggle mobile menu
function toggleMenu() {
    mobileMenuBtn.classList.toggle('active');
    mobileMenu.classList.toggle('active');
    menuBackdrop.classList.toggle('active');
    body.classList.toggle('menu-open');
}

if (mobileMenuCloseBtn) {
    mobileMenuCloseBtn.addEventListener('click', toggleMenu);

}
// Toggle mobile menu
if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', toggleMenu);
}

// Close menu when clicking on backdrop
if (menuBackdrop) {
    menuBackdrop.addEventListener('click', toggleMenu);
}

// Mobile dropdown functionality
const mobileUserMenu = document.getElementById('mobileUserMenu');
const mobileDropdown = document.getElementById('mobileDropdown');
const mobileDropdownIcon = mobileUserMenu.querySelector('.fa-chevron-down');

if (mobileUserMenu) {
    mobileUserMenu.addEventListener('click', function() {
        mobileDropdown.classList.toggle('active');
        mobileDropdownIcon.classList.toggle('fa-chevron-down');
        mobileDropdownIcon.classList.toggle('fa-chevron-up');
    });
}

// Desktop dropdown functionality
const desktopUserMenu = document.getElementById('desktopUserMenu');
const desktopDropdown = document.getElementById('desktopDropdown');

if (desktopUserMenu) {
    desktopUserMenu.addEventListener('click', function() {
        desktopDropdown.classList.toggle('active');
    });
    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
        if (!desktopUserMenu.contains(event.target) && !desktopDropdown.contains(event.target)) {
            desktopDropdown.classList.remove('active');
        }
    });
}

// Close mobile menu when clicking on a menu item
const mobileMenuItems = document.querySelectorAll('.mobile-menu-item:not(#mobileUserMenu), .mobile-dropdown-item');
if (mobileMenuItems) {
    mobileMenuItems.forEach(item => {
        item.addEventListener('click', function() {
            item.addEventListener('click', toggleMenu);
        });
    });
}
