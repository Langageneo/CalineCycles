from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_mail import Mail, Message
from werkzeug.security import generate_password_hash, check_password_hash
import os
import secrets
from datetime import datetime

# --- Configuration de l'application ---
app = Flask(__name__)
app.secret_key = "caline_secret_key_" + secrets.token_hex(8)

# --- Configuration de la base de données ---
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///users.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db = SQLAlchemy(app)

# --- Configuration de l'envoi des emails ---
app.config["MAIL_SERVER"] = "smtp.gmail.com"
app.config["MAIL_PORT"] = 587
app.config["MAIL_USE_TLS"] = True
app.config["MAIL_USERNAME"] = "tonemail@gmail.com"
app.config["MAIL_PASSWORD"] = "ton_mot_de_passe_app"
mail = Mail(app)

# --- Modèles ---
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    birth_date = db.Column(db.String(20), nullable=False)
    classe = db.Column(db.String(50), nullable=False)
    journals = db.relationship('Journal', backref='user', lazy=True)
    cycles = db.relationship('Cycle', backref='user', lazy=True)

class Journal(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    date_created = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))

class Cycle(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime)
    status = db.Column(db.String(20), default="DÉMARRÉ")
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))

# --- Routes ---
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/register', methods=['POST'])
def register():
    email = request.form['email']
    password = generate_password_hash(request.form['password'])
    birth_date = request.form['birth_date']
    classe = request.form['classe']
    if User.query.filter_by(email=email).first():
        return "Email déjà utilisé"
    user = User(email=email, password=password, birth_date=birth_date, classe=classe)
    db.session.add(user)
    db.session.commit()
    session['user_id'] = user.id
    return redirect(url_for('index'))

@app.route('/login', methods=['POST'])
def login():
    email = request.form['email']
    password = request.form['password']
    user = User.query.filter_by(email=email).first()
    if user and check_password_hash(user.password, password):
        session['user_id'] = user.id
        return redirect(url_for('index'))
    return "Email ou mot de passe incorrect"

@app.route('/logout')
def logout():
    session.pop('user_id', None)
    return redirect(url_for('index'))

@app.route('/new_entry', methods=['POST'])
def new_entry():
    if 'user_id' not in session:
        return redirect(url_for('index'))
    content = request.form['content']
    journal = Journal(content=content, user_id=session['user_id'])
    db.session.add(journal)
    db.session.commit()
    return redirect(url_for('index'))

@app.route('/start_cycle', methods=['POST'])
def start_cycle():
    if 'user_id' not in session:
        return redirect(url_for('index'))
    cycle = Cycle(start_time=datetime.utcnow(), status="DÉMARRÉ", user_id=session['user_id'])
    db.session.add(cycle)
    db.session.commit()
    return jsonify({"message": "Cycle démarré", "cycle_id": cycle.id})

@app.route('/end_cycle/<int:cycle_id>', methods=['POST'])
def end_cycle(cycle_id):
    cycle = Cycle.query.get(cycle_id)
    if cycle and cycle.user_id == session['user_id']:
        cycle.end_time = datetime.utcnow()
        cycle.status = "TERMINÉ"
        db.session.commit()
        return jsonify({"message": "Cycle terminé"})
    return jsonify({"message": "Cycle non trouvé"})

@app.route('/forgot_password', methods=['POST'])
def forgot_password():
    email = request.form['email']
    user = User.query.filter_by(email=email).first()
    if user:
        token = secrets.token_hex(16)
        msg = Message("Réinitialisation de mot de passe",
                      sender="tonemail@gmail.com",
                      recipients=[email])
        msg.body = f"Voici votre lien de réinitialisation: http://localhost:5000/reset/{token}"
        mail.send(msg)
        return "Email envoyé"
    return "Email non trouvé"

# --- API pour interface JS ---
@app.route('/api/journals')
def api_journals():
    if 'user_id' not in session:
        return jsonify([])
    journals = Journal.query.filter_by(user_id=session['user_id']).all()
    return jsonify([{"content": j.content, "date": j.date_created.strftime("%Y-%m-%d %H:%M")} for j in journals])

@app.route('/api/cycles')
def api_cycles():
    if 'user_id' not in session:
        return jsonify([])
    cycles = Cycle.query.filter_by(user_id=session['user_id']).all()
    return jsonify([{"start": c.start_time.strftime("%Y-%m-%d %H:%M"),
                     "end": c.end_time.strftime("%Y-%m-%d %H:%M") if c.end_time else None,
                     "status": c.status} for c in cycles])

# --- Lancement ---
if __name__ == "__main__":
    if not os.path.exists('users.db'):
        db.create_all()
    app.run(host="0.0.0.0", port=5000, debug=True)
