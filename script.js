document.addEventListener("DOMContentLoaded", function () {
    const darkModeToggle = document.getElementById("darkModeToggle");
    const body = document.body;
    const sectionTitle = document.getElementById("sectionTitle");
    const content = document.querySelector(".content");
    const loginButton = document.getElementById("loginButton");

    // Toggle dark mode
    darkModeToggle.addEventListener("change", function () {
        body.classList.toggle("dark-mode", darkModeToggle.checked);
        localStorage.setItem("darkMode", darkModeToggle.checked);
    });

    // Load the saved dark mode preference
    if (localStorage.getItem("darkMode") === "true") {
        darkModeToggle.checked = true;
        body.classList.add("dark-mode");
    }

    // Section switching
    document.querySelectorAll(".nav-button").forEach(button => {
        button.addEventListener("click", function () {
            const section = this.getAttribute("data-section");
            sectionTitle.textContent = this.textContent;
            content.innerHTML = `Conținut pentru secțiunea ${this.textContent}`;
            if (section === "events") {
                loadEvents();
            } else if (section === "staff") {
                loadStaff();
            }
        });
    });

    // Logare
    loginButton.addEventListener('click', function() {
        const email = prompt('Introduceti email-ul:');
        const password = prompt('Introduceti parola:');
        
        if (email && password) {
            fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            })
            .then(response => {
                if (response.ok) {
                    alert('Logare reușită!');
                    return response.json();
                } else {
                    alert('Email sau parolă incorecte.');
                }
            })
            .then(data => {
                if (data.token) {
                    localStorage.setItem("authToken", data.token);
                }
            })
            .catch(error => alert('Eroare la logare: ' + error));
        } else {
            alert('Te rugăm să completezi toate câmpurile!');
        }
    });

    // Load events
    function loadEvents() {
        content.innerHTML = `
            <h2>Creare Eveniment</h2>
            <form id="eventForm">
                <label for="eventTitle">Titlu Eveniment:</label>
                <input type="text" id="eventTitle" required><br>
                <label for="eventStart">Data Început:</label>
                <input type="date" id="eventStart" required><br>
                <label for="eventEnd">Data Sfârșit:</label>
                <input type="date" id="eventEnd" required><br>
                <button type="submit">Crează Eveniment</button>
            </form>
            <div id="calendar"></div>
        `;
        
        const calendarEl = document.getElementById("calendar");
        const calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            events: [],
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            height: 'auto',
            contentHeight: 'auto',
            aspectRatio: 1.5,
        });
        calendar.render();

        // Re-renderează calendarul la redimensionarea ferestrei
        window.addEventListener('resize', () => {
            calendar.updateSize();
        });

        document.getElementById('eventForm').addEventListener('submit', function(event) {
            event.preventDefault();
            const title = document.getElementById('eventTitle').value;
            const start = document.getElementById('eventStart').value;
            const end = document.getElementById('eventEnd').value;
            fetch('/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem("authToken")}`,
                },
                body: JSON.stringify({ title, start, end }),
            })
            .then(response => response.json())
            .then(data => {
                alert('Eveniment creat!');
                calendar.addEvent({
                    title: title,
                    start: start,
                    end: end,
                    allDay: true
                });
            })
            .catch(error => alert('Eroare la crearea evenimentului: ' + error));
        });
    }

    // Load staff
    function loadStaff() {
        content.innerHTML = `
            <h2>Adăugare Staff</h2>
            <form id="staffForm">
                <label for="staffName">Nume Staff:</label>
                <input type="text" id="staffName" required><br>
                <label for="staffRole">Rol Staff:</label>
                <input type="text" id="staffRole" required><br>
                <button type="submit">Adaugă Staff</button>
            </form>
        `;
        document.getElementById('staffForm').addEventListener('submit', function(event) {
            event.preventDefault();
            const name = document.getElementById('staffName').value;
            const role = document.getElementById('staffRole').value;
            fetch('/staff', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem("authToken")}`,
                },
                body: JSON.stringify({ name, role }),
            })
            .then(response => response.json())
            .then(data => alert('Staff adăugat!'))
            .catch(error => alert('Eroare la adăugarea staff-ului: ' + error));
        });
    }
});