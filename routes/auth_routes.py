from flask import Blueprint, render_template, request, redirect, flash
from flask_login import login_user, logout_user
from models.user import User
from extensions import db
from werkzeug.security import generate_password_hash, check_password_hash

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        user = User.query.filter_by(username=request.form["username"]).first()
        if user and check_password_hash(user.password, request.form["password"]):
            login_user(user)
            flash("Login successful", "success")
            return redirect("/")
        flash("Invalid username or password", "error")
    return render_template("login.html")

@auth_bp.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        hashed_password = generate_password_hash(request.form["password"])
        # ✅ FIRST USER = ADMIN
        if User.query.count() == 0:
            role = "admin"
        else:
            role = "user"
        user = User(
            username=request.form["username"],
            password=hashed_password,
            role=role
        )
        db.session.add(user)
        db.session.commit()
        flash("Account created successfully", "success")
        return redirect("/login")
    return render_template("register.html")

@auth_bp.route("/logout")
def logout():
    logout_user()
    flash("Logged out", "success")
    return redirect("/login")
