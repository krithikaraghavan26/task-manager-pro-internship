from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from datetime import date
from extensions import db
from models.task import Task
from models.user import User

task_bp = Blueprint("tasks", __name__)

# ---- GET TASKS ----
@task_bp.route("/api/tasks")
@login_required
def get_tasks():
    tasks = Task.query.filter_by(user_id=current_user.id).order_by(Task.created_at.desc()).all()
    return jsonify([
        {
            "id": t.id,
            "title": t.title,
            "priority": t.priority,
            "status": t.status,
            "created_at": t.created_at.isoformat()
        } for t in tasks
    ])

# ---- ADD TASK ----
@task_bp.route("/api/tasks", methods=["POST"])
@login_required
def add_task():
    data = request.json or {}
    title = data.get("title", "").strip()
    if not title:
        return jsonify({"error": "Task title is required"}), 400

    task = Task(
        title=title,
        priority=data.get("priority", "Medium"),
        status="Todo",
        user_id=current_user.id
    )
    db.session.add(task)
    db.session.commit()
    return jsonify({"message": "Task added"}), 201

# ---- UPDATE TASK ----
@task_bp.route("/api/tasks/<int:id>", methods=["PUT"])
@login_required
def update_task(id):
    task = Task.query.filter_by(id=id, user_id=current_user.id).first_or_404()
    data = request.json or {}

    new_title = data.get("title", task.title).strip()
    if not new_title:
        return jsonify({"error": "Title cannot be empty"}), 400

    task.title = new_title
    task.priority = data.get("priority", task.priority)
    task.status = data.get("status", task.status)

    db.session.commit()
    return jsonify({"message": "Task updated"})

# ---- DELETE TASK ----
@task_bp.route("/api/tasks/<int:id>", methods=["DELETE"])
@login_required
def delete_task(id):
    task = Task.query.filter_by(id=id, user_id=current_user.id).first_or_404()
    db.session.delete(task)
    db.session.commit()
    return jsonify({"message": "Task deleted"})

# ---- STATS (Today / Pending / Done) ----
@task_bp.route("/api/stats")
@login_required
def stats():
    tasks = Task.query.filter_by(user_id=current_user.id).all()
    today = date.today()

    return jsonify({
        "today": len([t for t in tasks if t.created_at.date() == today]),
        "pending": len([t for t in tasks if t.status != "Done"]),
        "done": len([t for t in tasks if t.status == "Done"])
    })

# ---- CHART DATA (Todo / In-Progress / Done) ----
@task_bp.route("/api/chart-data")
@login_required
def chart_data():
    tasks = Task.query.filter_by(user_id=current_user.id).all()

    todo = len([t for t in tasks if t.status == "Todo"])
    in_progress = len([t for t in tasks if t.status == "In-Progress"])
    done = len([t for t in tasks if t.status == "Done"])

    return jsonify({
        "todo": todo,
        "in_progress": in_progress,
        "done": done
    })
@task_bp.route("/api/admin/tasks")
@login_required
def admin_all_tasks():
    if current_user.role != "admin":
        return jsonify({"error": "Forbidden"}), 403

    tasks = Task.query.all()

    return jsonify([
        {
            "username": User.query.get(t.user_id).username if t.user_id else "-",
            "title": t.title,
            "priority": t.priority,
            "status": t.status
        } for t in tasks
    ])
@task_bp.route("/api/admin/stats")
@login_required
def admin_stats():
    if current_user.role != "admin":
        return jsonify({"error": "Forbidden"}), 403

    tasks = Task.query.all()
    users = db.session.query(Task.user_id).distinct().count()

    return jsonify({
        "total": len(tasks),
        "done": len([t for t in tasks if t.status == "Done"]),
        "pending": len([t for t in tasks if t.status != "Done"]),
        "users": users
    })
@task_bp.route("/api/admin/chart-data")
@login_required
def admin_chart_data():
    if current_user.role != "admin":
        return jsonify({"error": "Forbidden"}), 403

    tasks = Task.query.all()

    return jsonify({
        "todo": len([t for t in tasks if t.status == "Todo"]),
        "in_progress": len([t for t in tasks if t.status == "In-Progress"]),
        "done": len([t for t in tasks if t.status == "Done"])
    })