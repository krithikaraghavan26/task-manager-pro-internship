from flask import Flask, render_template, abort
from config import Config
from extensions import db, login_manager
from routes.auth_routes import auth_bp
from routes.task_routes import task_bp
from models.user import User
from flask_login import login_required, current_user

app = Flask(__name__)
app.config.from_object(Config)

db.init_app(app)
login_manager.init_app(app)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

app.register_blueprint(auth_bp)
app.register_blueprint(task_bp)

@app.route("/")
@login_required
def dashboard():
    return render_template("dashboard.html")

@app.route("/admin")
@login_required
def admin():
    if current_user.role != "admin":
        abort(403)
    return render_template("admin.html")

@app.errorhandler(403)
def forbidden(e):
    return render_template("403.html"), 403

@app.errorhandler(404)
def not_found(e):
    return render_template("404.html"), 404

with app.app_context():
    db.create_all()

if __name__ == "__main__":
    app.run(debug=True)