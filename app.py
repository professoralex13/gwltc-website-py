'''flask root script for gwltc website'''
import sqlite3
from dotenv import load_dotenv
from flask import Flask, render_template, g,\
    request, redirect, session, jsonify
from werkzeug.security import check_password_hash, generate_password_hash
from datetime import datetime, timedelta
import os

app = Flask(__name__)

load_dotenv()
app.secret_key = os.environ.get('SECRET_KEY')

EMAIL_KEY = 'email'
'''Key for setting/getting the email in the session'''
PASSWORD_KEY = 'password'
'''Key for setting/getting the password in the session'''


def get_db():
    '''
    Gets the current database connection from the global context.
    Or makes a connection if none already exists
    '''
    if 'db' not in g:
        g.db = sqlite3.connect('database.db')
    return g.db


@app.route('/')
def home():
    return render_template('index.html')


@app.route('/signup')
def signup():
    return render_template('signup.html',
                           error=request.args.get('error'))


@app.route('/login')
def login():
    return render_template('login.html', error=request.args.get('error'))


@app.route('/api/login', methods=['POST'])
def api_login():
    '''
    Receives users login input and checks validity of information.
    Then logs the user in by storing the information to the session
    so it can be used later

        Parameters:
            form data:
                email (str): Email of account user wants to log into
                password (str): Password of account user wants to log into
    '''
    cursor = get_db().cursor()
    cursor.execute('SELECT password_hash FROM User WHERE email = ?',
                   (request.form[EMAIL_KEY],))
    user_info = cursor.fetchone()

    password = request.form['password']

    # Checks that a user was found with the given email
    # Then checks that the stored password hash matches the input password
    if user_info is not None and check_password_hash(user_info[0], password):
        session[EMAIL_KEY] = request.form[EMAIL_KEY]
        session[PASSWORD_KEY] = password
        return redirect('/')

    return redirect('/login?error=Incorrect Login Details')


@app.route('/api/signup', methods=['POST'])
def api_signup():
    '''
    Receives users signup input and checks that
    the given email hasnt been used before.

    It then stores the information to the database
    And stores the neccesary information to the session for later use

        Parameters:
            form data:
                first_name (str): New user's first name
                last_name (str): New user's last name
                password (str): New user's chosen password
                email (str): New user's email
                phone (str): New user's British format mobile number

    '''
    email = request.form[EMAIL_KEY]
    cursor = get_db().cursor()
    cursor.execute('SELECT * FROM User WHERE email = ?', (email,))
    if cursor.fetchone() is not None:
        return redirect('/signup?error=Account with that email already exists')

    password = request.form['password']

    cursor.execute('''INSERT INTO User (first_name, last_name, phone_number, email, password_hash)
        VALUES(?, ?, ?, ?, ?)''',
                   (
                       request.form['first_name'],
                       request.form['last_name'],
                       request.form['phone'],
                       email,
                       generate_password_hash(password)
                   ))
    get_db().commit()

    session[EMAIL_KEY] = email
    session[PASSWORD_KEY] = password
    return redirect('/')


@app.route('/logout')
def api_logout():
    '''
    Logs out current user by removing any stored email
    or password from the session
    '''
    session.pop(EMAIL_KEY, default=None)
    session.pop(PASSWORD_KEY, default=None)
    return redirect('/')


@app.route('/api/bookings/<int:unix_date>')
def booking_list(unix_date: int):
    '''
    API route for fetching the list of bookings on a given date

        Parameters:
            unix_date (int): Given date to fetch bookings for
            represented by the number of days since 1/1/1970

        Returns:
            bookings ({
                id: int,
                startTime: int,
                endTime: int,
                isCurrentUser: int/bool
                }[]): Array of JSON objects containing info about bookings
    '''
    cursor = get_db().cursor()
    # Must have two different queries depending on whether user is logged in.
    # So it can check if the logged in user is the same as the bookings user,
    # otherwise it is not the current user
    if session.get(EMAIL_KEY) is not None:
        cursor.execute(
            '''SELECT start_time, end_time, CASE WHEN user_id
                IN (SELECT id FROM User WHERE User.email = ?)
                THEN TRUE ELSE FALSE END as is_current_user,
                Booking.id FROM Booking WHERE date = ? ORDER BY start_time''',
            (session[EMAIL_KEY], unix_date))
        return jsonify([{
            'id': x[3],
            'startTime': x[0],
            'endTime': x[1],
            'isCurrentUser': x[2]} for x in cursor.fetchall()])
    else:
        cursor.execute('''SELECT start_time, end_time, id
                       FROM Booking WHERE date= ? ORDER BY start_time''',
                       (unix_date,))
        return jsonify([{
            'id': x[2],
            'startTime': x[0],
            'endTime': x[1],
            'isCurrentUser': 0} for x in cursor.fetchall()])


@app.route('/api/create-booking/<int:unix_date>', methods=["POST"])
def create_booking(unix_date: int):
    '''
    Creates a booking in the database for the current user on a given date

        Parameters:
            unix_date (int): Given date to create a booking for,
            represented by the number of days since 1/1/1970

            form data:
                start_time (int): Start Time of the booking
                stored in minutes since midnight
                end_time (int): End Time of the booking
                stored in minutes since midnight
    '''
    cursor = get_db().cursor()

    if session.get(EMAIL_KEY) is None:
        raise Exception("Cannot create booking without being logged in")

    cursor.execute('SELECT id, password_hash FROM User WHERE email = ?',
                   (session.get(EMAIL_KEY),))

    info = cursor.fetchone()
    if not check_password_hash(info[1], session[PASSWORD_KEY]):
        raise Exception("Session email and password do not match")
    user_id = info[0]

    get_db().cursor().execute('''INSERT INTO Booking(user_id, date, start_time, end_time)
        VALUES(?, ?, ?, ?)''', (
        user_id,
        unix_date,
        request.form['start_time'],
        request.form['end_time'],
    ))
    get_db().commit()

    return ('', 204)


@app.route('/api/delete-booking/<int:id>', methods=["POST"])
def delete_booking(id):
    '''
    Deletes a booking in the database with a given id.
    After checking that the currently logged in user
    is the associated user with the given Booking id

        Parameters:
            id (int): ID of the booking, assigned by the database
    '''
    if session.get(EMAIL_KEY) is None:
        raise Exception("Cannot delete booking when not logged on")

    cursor = get_db().cursor()
    cursor.execute('''SELECT Booking.user_id as booking_user_id, User.id as user_id
    FROM Booking INNER JOIN User WHERE Booking.id = ? AND User.email = ?''',
                   (id, session.get(EMAIL_KEY)))

    info = cursor.fetchone()
    if info[0] != info[1]:
        raise Exception("You are not authorized to delete this booking")
    cursor.execute('DELETE FROM Booking WHERE id = ?', (id,))

    get_db().commit()
    return redirect('/')


@app.route('/my-bookings')
def my_bookings():
    '''
    Returns a page with the list of bookings
    created by the currently logged in user

    If there is no logged in user the server will raise an Exception
    '''
    if session.get(EMAIL_KEY) is None:
        return redirect('/')
    cursor = get_db().cursor()
    cursor.execute(
        'SELECT id, password_hash FROM User WHERE email = ?',
        (session.get(EMAIL_KEY),))
    info = cursor.fetchone()
    if not check_password_hash(info[1], session.get(PASSWORD_KEY)):
        raise Exception("Incorrect login details")

    cursor.execute(
        'SELECT start_time, end_time, date, id FROM Booking WHERE user_id = ?',
        (info[0],))
    bookings = cursor.fetchall()
    return render_template('my_bookings.html', bookings=[(
        x[0],
        x[1],
        (datetime(year=1970, month=1, day=1).date(
        ) + timedelta(days=x[2] - 1)).isoformat(),
        x[3]) for x in bookings
    ])


@app.errorhandler(404)
def page_not_found(e):
    '''
    When the user attempts to go to a url that cannot be matched by the server
    This function will run and show a 404 page
    '''
    return render_template('404.html'), 404


@app.errorhandler(500)
def internal_server_error(e):
    '''
    If the server raises an Exception,
    this function will run and show an error 500 page
    '''
    return render_template('500.html', error=e), 500


@app.teardown_appcontext
def teardown_db(_):
    '''
    Runs when the server is shut down,
    currently only handles disconecting from the database
    '''
    get_db().close()


if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)
