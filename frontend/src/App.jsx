import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
    const [tasks, setTasks] = useState([]);
    const [newTask, setNewTask] = useState('');
    const [stats, setStats] = useState({
        total: 0,
        completed: 0,
        progress: 0
    });
    const [loading, setLoading] = useState(false);
    const [currentDate, setCurrentDate] = useState('');
    const [error, setError] = useState('');
    const [connectionError, setConnectionError] = useState(false);

    // API Configuration
    const API_BASE_URL = 'http://localhost:8000/api';

    // Initialize
    useEffect(() => {
        updateDate();
        checkBackendConnection();
    }, []);

    // Check backend connection
    const checkBackendConnection = async () => {
        try {
            const response = await fetch(API_BASE_URL);
            if (response.ok) {
                setConnectionError(false);
                loadTasks();
                loadStats();
            }
        } catch (err) {
            setConnectionError(true);
            setError('Backend server is not running. Please start the backend server.');
        }
    };

    // Update current date
    const updateDate = () => {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        setCurrentDate(now.toLocaleDateString('en-US', options));
    };

    // Format date for display
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Load tasks from API
    const loadTasks = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/tasks`);
            if (!response.ok) throw new Error('Failed to load tasks');
            
            const data = await response.json();
            // Sort by most recently updated
            const sortedTasks = data.sort((a, b) => 
                new Date(b.updated_at) - new Date(a.updated_at)
            );
            setTasks(sortedTasks);
        } catch (error) {
            console.error('Error loading tasks:', error);
        }
    };

    // Load statistics
    const loadStats = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/stats`);
            if (!response.ok) throw new Error('Failed to load stats');
            
            const data = await response.json();
            setStats(data);
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    // Add new task
    const addTask = async (e) => {
        e.preventDefault();
        if (!newTask.trim()) {
            setError('Please enter a task title');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const response = await fetch(`${API_BASE_URL}/tasks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ title: newTask.trim() })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to add task');
            }

            setNewTask('');
            await loadTasks();
            await loadStats();
            
        } catch (error) {
            console.error('Error adding task:', error);
            setError(error.message || 'Failed to add task');
        } finally {
            setLoading(false);
        }
    };

    // Add task on Enter key
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            addTask(e);
        }
    };

    // Toggle task completion
    const toggleTask = async (taskId, currentStatus) => {
        try {
            const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ completed: !currentStatus })
            });

            if (response.ok) {
                await loadTasks();
                await loadStats();
            }
        } catch (error) {
            console.error('Error toggling task:', error);
            setError('Error updating task');
        }
    };

    // Delete task
    const deleteTask = async (taskId) => {
        if (!window.confirm('Are you sure you want to delete this task?')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await loadTasks();
                await loadStats();
            }
        } catch (error) {
            console.error('Error deleting task:', error);
            setError('Error deleting task');
        }
    };

    // Calculate progress circle stroke
    const getProgressCircleStyle = () => {
        const circumference = 2 * Math.PI * 54;
        const offset = circumference - (stats.progress / 100 * circumference);
        return {
            strokeDasharray: circumference,
            strokeDashoffset: offset
        };
    };

    // Retry connection
    const retryConnection = () => {
        setError('');
        checkBackendConnection();
    };

    return (
        <div className="container">
            {/* Header */}
            <header className="header">
                <h1><i className="fas fa-tasks"></i> Task Board</h1>
                <p className="subtitle">Organize your tasks with simplicity</p>
            </header>

            {/* Connection Error Banner */}
            {connectionError && (
                <div className="connection-error">
                    <div className="error-content">
                        <i className="fas fa-exclamation-triangle"></i>
                        <div>
                            <strong>Backend server is not running</strong>
                            <p>Please start the backend server on port 8000</p>
                            <button onClick={retryConnection} className="retry-btn">
                                <i className="fas fa-redo"></i> Retry Connection
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && !connectionError && (
                <div className="error-message">
                    <i className="fas fa-exclamation-circle"></i>
                    <span>{error}</span>
                    <button onClick={() => setError('')} className="close-error">
                        <i className="fas fa-times"></i>
                    </button>
                </div>
            )}

            <div className="main-layout">
                {/* Left Column - Add Task & Stats */}
                <div className="left-column">
                    {/* Add Task Card */}
                    <div className="card">
                        <h2><i className="fas fa-plus"></i> Add New Task</h2>
                        <form onSubmit={addTask} className="form-group">
                            <input
                                type="text"
                                value={newTask}
                                onChange={(e) => setNewTask(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="What needs to be done?"
                                className="task-input"
                                disabled={loading || connectionError}
                            />
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading || connectionError || !newTask.trim()}
                            >
                                <i className="fas fa-plus"></i> 
                                {loading ? ' Adding...' : ' Add Task'}
                            </button>
                        </form>
                    </div>

                    {/* Stats Card */}
                    <div className="card">
                        <h2><i className="fas fa-chart-line"></i> Progress</h2>
                        <div className="progress-container">
                            <div className="progress-circle">
                                <svg width="120" height="120" viewBox="0 0 120 120">
                                    <circle cx="60" cy="60" r="54" fill="none" stroke="#e0e0e0" strokeWidth="8"/>
                                    <circle
                                        cx="60"
                                        cy="60"
                                        r="54"
                                        fill="none"
                                        stroke="#4a6cf7"
                                        strokeWidth="8"
                                        strokeLinecap="round"
                                        transform="rotate(-90 60 60)"
                                        style={getProgressCircleStyle()}
                                    />
                                </svg>
                                <div className="progress-text">
                                    <span>{Math.round(stats.progress)}%</span>
                                    <small>Complete</small>
                                </div>
                            </div>
                            
                            <div className="stats-grid">
                                <div className="stat-item">
                                    <span className="stat-label">Total Tasks</span>
                                    <span className="stat-value">{stats.total}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Completed</span>
                                    <span className="stat-value">{stats.completed}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Pending</span>
                                    <span className="stat-value">{stats.total - stats.completed}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Task List */}
                <div className="right-column">
                    <div className="card">
                        <div className="card-header">
                            <h2><i className="fas fa-list-check"></i> Your Tasks</h2>
                            <div className="date-display">
                                <i className="fas fa-calendar"></i>
                                <span>{currentDate}</span>
                            </div>
                        </div>
                        
                        <div className="task-list">
                            {connectionError ? (
                                <div className="empty-state">
                                    <i className="fas fa-server"></i>
                                    <p>Waiting for backend connection...</p>
                                    <button onClick={retryConnection} className="btn-secondary">
                                        <i className="fas fa-redo"></i> Retry
                                    </button>
                                </div>
                            ) : tasks.length === 0 ? (
                                <div className="empty-state">
                                    <i className="fas fa-clipboard-list"></i>
                                    <p>No tasks yet. Add your first task!</p>
                                </div>
                            ) : (
                                tasks.map((task) => (
                                    <div
                                        key={task.id}
                                        className={`task-item ${task.completed ? 'completed' : ''}`}
                                    >
                                        <div className="task-content">
                                            <button
                                                className={`task-checkbox ${task.completed ? 'completed' : ''}`}
                                                onClick={() => toggleTask(task.id, task.completed)}
                                                disabled={connectionError}
                                            >
                                                <i className="fas fa-check"></i>
                                            </button>
                                            <div className="task-details">
                                                <span className="task-title">{task.title}</span>
                                                <div className="task-meta">
                                                    <span className="task-date">
                                                        <i className="fas fa-clock"></i>
                                                        <span className="created-date">
                                                            Created: {formatDate(task.created_at)}
                                                        </span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            className="task-delete"
                                            onClick={() => deleteTask(task.id)}
                                            disabled={connectionError}
                                            title="Delete task"
                                        >
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="footer">
                <p>Built with FastAPI & React</p>
                <p>
                    <span>{stats.total}</span> tasks • 
                    <span> {stats.completed}</span> completed
                </p>
            </footer>
        </div>
    );
}

export default App;