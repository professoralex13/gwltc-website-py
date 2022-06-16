from flask import Flask, render_template, g, request, redirect, session
import sqlite3

app = Flask(__name__)

app.secret_key = b'\x07d\xbd\xf5\xab\x9au~\xe1\xba6\x80\xf6\xac\x12\xc2'

EMAIL_KEY = 'email'
PASSWORD_KEY = 'password'


def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect('database.db')
    return g.db


@app.route('/')
def home():
    return render_template('index.html')


@app.route('/signup')
def signup():
    return render_template('signup.html', error=request.args.get('error'))


@app.route('/login')
def login():
    return render_template('login.html', error=request.args.get('error'))


@app.route('/api/login', methods=['POST'])
def api_login():
    cursor = get_db().cursor()
    cursor.execute('SELECT password_hash FROM User WHERE email = ?', (request.form[EMAIL_KEY],))
    user_info = cursor.fetchone()

    password = request.form['password']  # Hash this

    if user_info is None or user_info[0] != password:
        return redirect('/login?error=Incorrect Login Details')
    else:
        session[EMAIL_KEY] = request.form[EMAIL_KEY]
        session[PASSWORD_KEY] = user_info[0]
        return redirect('/')


@app.route('/api/signup', methods=['POST'])
def api_signup():
    email = request.form[EMAIL_KEY]
    cursor = get_db().cursor()

    cursor.execute('SELECT * FROM User WHERE email = ?', (email,))
    if cursor.fetchone() is not None:
        return redirect('/signup?error=Account with that email already exists')

    password = request.form['password']  # Hash this

    cursor.execute('''INSERT INTO User (first_name, last_name, phone_number, email, password_hash)
        VALUES(?, ?, ?, ?, ?)''',
                   (
                       request.form['first_name'],
                       request.form['last_name'],
                       request.form['phone'],
                       email,
                       password))
    get_db().commit()
    session[EMAIL_KEY] = email
    session[PASSWORD_KEY] = password
    return redirect('/')


@app.route('/logout')
def api_logout():
    session.pop(EMAIL_KEY, default=None)
    session.pop(PASSWORD_KEY, default=None)
    return redirect('/')


@app.teardown_appcontext
def teardown_db(_):
    get_db().close()


if __name__ == '__main__':
    app.run(debug=True)
