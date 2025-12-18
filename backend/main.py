from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import json
import os
from datetime import datetime

app = FastAPI(title="Task Board API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class TaskCreate(BaseModel):
    title: str

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    completed: Optional[bool] = None

# Storage
DATA_FILE = "tasks.json"

def read_tasks():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r') as f:
            try:
                return json.load(f)
            except json.JSONDecodeError:
                return []
    return []

def write_tasks(tasks):
    with open(DATA_FILE, 'w') as f:
        json.dump(tasks, f, indent=2)

def get_next_id(tasks):
    if not tasks:
        return 1
    return max(task['id'] for task in tasks) + 1

@app.get("/")
def read_root():
    return {"message": "Task Board API is running"}

@app.get("/api/tasks")
def get_tasks():
    return read_tasks()

@app.post("/api/tasks")
def create_task(task: TaskCreate):
    tasks = read_tasks()
    
    new_task = {
        "id": get_next_id(tasks),
        "title": task.title,
        "completed": False,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }
    
    tasks.append(new_task)
    write_tasks(tasks)
    return new_task

@app.put("/api/tasks/{task_id}")
def update_task(task_id: int, task_update: TaskUpdate):
    tasks = read_tasks()
    
    for task in tasks:
        if task['id'] == task_id:
            if task_update.title is not None:
                task['title'] = task_update.title
            if task_update.completed is not None:
                task['completed'] = task_update.completed
            task['updated_at'] = datetime.now().isoformat()
            write_tasks(tasks)
            return task
    
    raise HTTPException(status_code=404, detail="Task not found")

@app.delete("/api/tasks/{task_id}")
def delete_task(task_id: int):
    tasks = read_tasks()
    
    for i, task in enumerate(tasks):
        if task['id'] == task_id:
            del tasks[i]
            write_tasks(tasks)
            return {"message": "Task deleted successfully"}
    
    raise HTTPException(status_code=404, detail="Task not found")

@app.get("/api/stats")
def get_stats():
    tasks = read_tasks()
    total = len(tasks)
    completed = sum(1 for task in tasks if task['completed'])
    
    return {
        "total": total,
        "completed": completed,
        "progress": (completed / total * 100) if total > 0 else 0
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)