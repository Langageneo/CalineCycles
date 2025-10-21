from flask import Flask, render_template, request, redirect>
from flask_sqlalchemy import SQLAlchemy
from flask_mail import Mail, Message
from werkzeug.security import generate_password_hash, check>
import os
import secrets

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
app.config["MAIL_USERNAME"] = "tonemail@gmail.com"  # 🔁 Re>
app.config["MAIL_PASSWORD"] = "ton_mot_de_passe_app"  # 🔁 >

mail = Mail(app)
