/** 
 * Script for handling front end logic for calender and booking modal 
 * Some pretty messy stuff in here, shame I cant use React...
 */

const [body] = document.getElementsByClassName('calendar-body');

const monthDropdown = document.getElementById('month-dropdown');
const yearDropdown = document.getElementById('year-dropdown');

const dayTemplate = body.children[0];

const dropdownTemplate = monthDropdown.children[0];
monthDropdown.removeChild(dropdownTemplate);

body.removeChild(dayTemplate);

/**
 * Clears all children of specified element
 * @param {Element} element 
 */
function clearChildren(element) {
    let child = element.lastElementChild;
    while (child) {
        element.removeChild(child);
        child = element.lastElementChild;
    }
}

const months = [
    'JANUARY',
    'FEBRUARY',
    'MARCH',
    'APRIL',
    'MAY',
    'JUNE',
    'JULY',
    'AUGUST',
    'SEPTEMBER',
    'OCTOBER',
    'NOVEMBER',
    'DECEMBER'
]

for (let i = 0; i < months.length; i++) {
    const newMonth = dropdownTemplate.cloneNode();
    newMonth.innerText = months[i];
    newMonth.value = i;
    monthDropdown.appendChild(newMonth);
}

const today = new Date();

let currentMonth = today.getMonth();
monthDropdown.value = currentMonth;
let currentYear = today.getFullYear();
yearDropdown.value = currentYear;

for (let i = currentYear; i < currentYear + 2; i++) {
    const newYear = dropdownTemplate.cloneNode();
    newYear.innerText = i;
    newYear.value = i;
    yearDropdown.appendChild(newYear);
}

/**
 * @param {number} year 
 * @param {number} month 
 */
const dayOffset = (year, month) => { return new Date(year, month, 0).getDay(); }

/**
 * @param {Date} day 
 * @param {boolean} long 
 */
function formatDate(day, long) {
    return `${months[day.getMonth()].substring(0, long ? 10 : 3)} ${day.getDate()}`;
}

/**
 * Changes calender html to show dates for a specified month and year
 * @param {number} month 
 * @param {number} year 
 */
function updateCalendar(month, year) {
    currentMonth = Number.parseInt(month);
    currentYear = Number.parseInt(year);
    let child = body.lastElementChild;
    while (child) {
        body.removeChild(child);
        child = body.lastElementChild;
    }

    const offset = dayOffset(currentYear, currentMonth);
    for (let y = 0; y < 6; y++) {
        for (let x = 0; x < 7; x++) {
            const day = dayTemplate.cloneNode(true);
            const date = new Date(currentYear, currentMonth, x + 1 + y * 7 - offset);
            day.children[0].innerText = formatDate(date);
            if (date.getMonth() !== currentMonth) {
                day.classList.add('different-month');
            }
            if (date.getMonth() < 4 || date.getMonth() > 8) {
                day.classList.add('closed');
            } else {
                day.addEventListener('click', () => {
                    openBookingModal(date);
                });
            }

            body.appendChild(day);
        }
    }
}

updateCalendar(currentMonth, currentYear);

monthDropdown.addEventListener('change', (e) => {
    updateCalendar(e.target.value, currentYear);
});

yearDropdown.addEventListener('change', (e) => {
    updateCalendar(currentMonth, e.target.value);
});

// ----------------- Booking Modal Code -------------------

const modal = document.getElementById('booking-modal');

const modalBookingTemplate = modal.children[0].children[1].children[0];
modal.children[0].children[1].removeChild(modalBookingTemplate);

const startTimeDropdown = document.getElementById('start-time-dropdown');
const endTimeDropdown = document.getElementById('end-time-dropdown');

const newBookingForm = document.getElementById('new-booking');

const timeSlotFull = document.getElementById('time-slot-full');

/**
 * Converts minutes since midnight to a Date type
 * @param {number} unixTime 
 */
function unixTimeToDate(unixTime) {
    return new Date(0, 0, 0, 0, unixTime);
}

/**
 * Converts a Date type to minutes since midnight
 * @param {Date} date
 */
function dateToUnixTime(date) {
    return date.getHours() * 60 + date.getMinutes();
}

const unixBase = new Date(1970, 0, 0);

/**
 * Modifies New Booking dropdowns html to only allow unbooked slots.
 * 
 * Also modify end time dropdown to only allow times after selected startTime, and only until 2 hours after selected startTime
 * @param {import("./types").Booking[]} bookings
 */
function updateBookingDropdowns(bookings) {
    const selectedStartTime = Number.parseInt(startTimeDropdown.value) || 660;

    clearChildren(startTimeDropdown);
    clearChildren(endTimeDropdown);

    let available = false;

    for (let i = 0; i < 18; i++) {
        const startTime = new Date(0, 0, 0, Math.floor(i / 2) + 11, i % 2 === 0 ? 0 : 30);
        const endTime = new Date(0, 0, 0, Math.floor((i + 1) / 2) + 11, (i + 1) % 2 === 0 ? 0 : 30);

        available = (available || (bookings.findIndex((booking) => booking.startTime <= dateToUnixTime(startTime) && dateToUnixTime(startTime) < booking.endTime)) < 0);

        const startTimeElement = dropdownTemplate.cloneNode();
        const endTimeElement = dropdownTemplate.cloneNode();

        if (bookings.findIndex((booking) => (
            dateToUnixTime(startTime) < booking.endTime && dateToUnixTime(startTime) >= booking.startTime
        )) > -1) {
            startTimeElement.setAttribute('disabled', true);
        }

        if (dateToUnixTime(endTime) > selectedStartTime + 120 || dateToUnixTime(endTime) <= selectedStartTime ||
            bookings.findIndex((booking) => (
                dateToUnixTime(endTime) > booking.startTime && selectedStartTime < booking.startTime
            )) > -1) {
            endTimeElement.setAttribute('disabled', true);
        }

        startTimeElement.setAttribute('value', startTime.getHours() * 60 + startTime.getMinutes());
        endTimeElement.setAttribute('value', endTime.getHours() * 60 + endTime.getMinutes());

        startTimeElement.innerText = `${startTime.getHours()}:${startTime.getMinutes().toString().padEnd(2, '0')}`;
        endTimeElement.innerText = `${endTime.getHours()}:${endTime.getMinutes().toString().padEnd(2, '0')}`;

        startTimeDropdown.appendChild(startTimeElement);
        endTimeDropdown.appendChild(endTimeElement);
    }
    return available;
}

/**
 * Opens the bookings modal for a given day.
 * 
 * Fetches and generates cards to show bookings already made for that day.
 * 
 * Sets up log for form for submission of new booking 
 * @param {Date} day 
 */
async function openBookingModal(day) {
    modal.children[0].children[0].innerText = formatDate(day, true);
    const timeDiff = day.getTime() - unixBase.getTime();
    const daysSince = Math.round(timeDiff / (1000 * 3600 * 24));
    const bookings = await (await fetch(`/api/bookings/${daysSince}`)).json();

    clearChildren(modal.children[0].children[1]);

    bookings.forEach((booking) => {
        const bookingCard = modalBookingTemplate.cloneNode(true);
        const startTimeLabel = `${Math.floor(booking.startTime / 60)}:${(booking.startTime % 60).toString().padEnd(2, '0')}`;
        const endTimeLabel = `${Math.floor(booking.endTime / 60)}:${(booking.endTime % 60).toString().padEnd(2, '0')}`;
        bookingCard.children[0].innerText = `${startTimeLabel} - ${endTimeLabel}`
        if (!booking.isCurrentUser) {
            bookingCard.children[1].style.display = 'none';
            bookingCard.style.backgroundColor = 'gray';
        } else {
            bookingCard.children[1].addEventListener('click', async () => {
                if (window.confirm(`Are you sure you would like to delete your booking from ${bookingCard.children[0].innerText} `)) {
                    await fetch(`/api/delete-booking/${booking.id} `, { method: 'POST' });
                    openBookingModal(day);
                }
            });
        }
        modal.children[0].children[1].appendChild(bookingCard);
    });

    newBookingForm.setAttribute('action', `/api/create-booking/${daysSince} `);

    startTimeDropdown.onchange = (e) => {
        const value = e.target.value;
        updateBookingDropdowns(bookings);
        startTimeDropdown.value = value;
    };

    // Must be done twice so default selections can be updated based on disabled selections
    updateBookingDropdowns(bookings);
    if (updateBookingDropdowns(bookings)) {
        newBookingForm.style.display = 'flex';
        timeSlotFull.style.display = 'none';
        timeSlotFull.style.position = 'absolute';
    } else {
        newBookingForm.style.display = 'none';
        timeSlotFull.style.display = 'block';
        timeSlotFull.style.position = 'static';
    }

    newBookingForm.onsubmit = (e) => {
        const data = new FormData(e.target);
        const startTime = unixTimeToDate(data.get('start_time'));
        const startTimeString = `${startTime.getHours().toString().padEnd(2, '0')}:${startTime.getMinutes().toString().padEnd(2, '0')} `;
        const endTime = unixTimeToDate(data.get('end_time'));
        const endTimeString = `${endTime.getHours().toString().padEnd(2, '0')}:${endTime.getMinutes().toString().padEnd(2, '0')} `;
        if (confirm(`Are you sure you want to make a booking on ${day.toDateString()} from ${startTimeString} to ${endTimeString} `)) {
            fetch(e.target.action, { method: 'POST', body: new FormData(e.target) }).then(() => {
                openBookingModal(day)
                alert('Succesfully Booked!')
            });
        }
        return false;
    };

    modal.style.display = 'block';
}

/**
 * I hope your not having to read this comment to figure out what this does
 */
function closeBookingModal() {
    modal.style.display = 'none';
}