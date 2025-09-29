class TodoApp {
    constructor() {
        this.todos = this.loadFromStorage() || [];
        this.filter = "all";
        this.editingId = null;

        this.todoInput = document.getElementById("todoInput");
        this.addBtn = document.getElementById("addBtn");
        this.addBtnMobile = document.querySelector(".todo__form-btn-add-mobile");
        this.todoList = document.getElementById("todoList");
        this.filterBtns = document.querySelectorAll(".filter-btn");
        this.init();
    }

    init() {
        this.bindEvents();
        this.render();
    }

    bindEvents() {
        if (this.addBtn) this.addBtn.addEventListener("click", () => this.addTodo());
        if (this.addBtnMobile) this.addBtnMobile.addEventListener("click", () => this.addTodo());
        this.todoInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") this.addTodo();
        });

        this.filterBtns.forEach((btn) => {
            btn.addEventListener("click", (e) => {
                this.setFilter(e.currentTarget.dataset.filter);
            });
        });
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    addTodo() {
        const text = this.todoInput.value.trim();
        if (!text) {
            this.todoInput.focus();
            return;
        }
        const todo = {
            id: this.generateId(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString(),
        };

        this.todos.unshift(todo);
        this.todoInput.value = "";
        this.saveToStorage();
        this.render();

        this.todoInput.focus();
    }

    deleteTodo(id) {
        if (confirm("Bạn có chắc chắn muốn xóa không?")) {
            this.todos = this.todos.filter((todo) => todo.id !== id);
            this.saveToStorage();
            this.render();
        }
    }

    toggleTodo(id) {
        const todo = this.todos.find((t) => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveToStorage();
            this.render();
        }
    }

    startEdit(id) {
        this.editingId = id;
        this.render();
    }

    saveEdit(id, newText) {
        const text = (newText || "").trim();
        if (!text) return;

        const todo = this.todos.find((t) => t.id === id);
        if (todo) {
            todo.text = text;
            this.editingId = null;
            this.saveToStorage();
            this.render();
        }
    }

    cancelEdit() {
        this.editingId = null;
        this.render();
    }

    setFilter(filter) {
        this.filter = filter;
        this.filterBtns.forEach((btn) => {
            btn.classList.toggle("active", btn.dataset.filter === filter);
        });
        this.render();
    }

    getFilteredTodos() {
        switch (this.filter) {
            case "active":
                return this.todos.filter((todo) => !todo.completed);
            case "completed":
                return this.todos.filter((todo) => todo.completed);
            default:
                return this.todos;
        }
    }

    render() {
        const filteredTodos = this.getFilteredTodos();
        if (filteredTodos.length === 0) {
            this.renderEmptyState();
            return;
        }

        const todoHtml = filteredTodos.map((todo) => this.renderTodoItem(todo)).join("");
        this.todoList.innerHTML = todoHtml;
        // gắn event cho từng todo item
        this.bindTodoEvents();
    }

    renderTodoItem(todo) {
        if (this.editingId === todo.id) {
            return `
        <div class="todo__item">
            <input type="checkbox" class="todo-checkbox" ${todo.completed ? "checked" : ""} disabled>
            <input type="text" class="edit-input" value="${this.escapeHtml(todo.text)}" data-id="${todo.id}" maxlength="200">
            <div class="todo-actions">
                <button class="btn btn-success save-btn" data-id="${todo.id}">💾 Lưu</button>
                <button class="btn btn-warning cancel-btn">❌ Hủy</button>
            </div>
        </div>
    `;
        }
        return `<div class="todo__item ${todo.completed ? "completed" : ""} new-item">
                    <div class="todo-main">
                        <input type="checkbox" class="todo-checkbox" ${todo.completed ? "checked" : ""} data-id="${todo.id}">
                        <span class="todo-text" data-id="${todo.id}">${this.escapeHtml(todo.text)}</span>
                    </div>
                    <div class="todo-actions">
                        <button class="btn btn-warning edit-btn" data-id="${todo.id}" ${todo.completed ? "disabled" : ""}>✏️ Sửa</button>
                        <button class="btn btn-danger delete-btn" data-id="${todo.id}">🗑️ Xóa</button>
                    </div>
                </div>`;
    }

    renderEmptyState() {
        let message = "";
        switch (this.filter) {
            case "active":
                message = "Không có công việc nào chưa hoàn thành! 🎉";
                break;
            case "completed":
                message = "Chưa có công việc nào được hoàn thành 🙄😏";
                break;
            default:
                message = "Chưa có công việc nào. Hãy thêm công việc đầu tiên!";
                break;
        }
        this.todoList.innerHTML = `<div class="empty-state">
                        <div style="font-size: 0.9rem; margin-bottom: 20px;"><h3>${message}</h3></div>
                        
                    </div>`;
    }

    bindTodoEvents() {
        document.querySelectorAll(".todo-checkbox").forEach((checkbox) => {
            checkbox.addEventListener("change", (e) => {
                this.toggleTodo(e.target.dataset.id);
            });
        });

        document.querySelectorAll(".delete-btn").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                this.deleteTodo(e.currentTarget.dataset.id);
            });
        });

        document.querySelectorAll(".edit-btn").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                this.startEdit(e.currentTarget.dataset.id);
            });
        });

        document.querySelectorAll(".save-btn").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                const id = e.currentTarget.dataset.id;
                const input = document.querySelector(`.edit-input[data-id="${id}"]`);
                this.saveEdit(id, input ? input.value : "");
            });
        });

        document.querySelectorAll(".cancel-btn").forEach((btn) => {
            btn.addEventListener("click", () => {
                this.cancelEdit();
            });
        });

        document.querySelectorAll(".edit-input").forEach((input) => {
            input.addEventListener("keypress", (e) => {
                if (e.key === "Enter") {
                    this.saveEdit(input.dataset.id, input.value);
                }
            });

            input.addEventListener("keydown", (e) => {
                if (e.key === "Escape") {
                    this.cancelEdit();
                }
            });

            // Auto focus và select text
            input.focus();
            input.select();
        });
    }

    saveToStorage() {
        try {
            const data = JSON.stringify(this.todos);
            localStorage.setItem("todoApp_todos", data);
        } catch (error) {
            console.error("Không thể lưu dữ liệu vào localStorage:", error);
            try {
                window.todoData = JSON.stringify(this.todos);
            } catch (e) {}
        }
    }

    loadFromStorage() {
        try {
            const data = localStorage.getItem("todoApp_todos");
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error("Không thể tải dữ liệu từ localStorage:", error);
            try {
                const fallbackData = window.todoData;
                return fallbackData ? JSON.parse(fallbackData) : [];
            } catch (fallbackError) {
                console.error("Không thể tải dữ liệu từ fallback:", fallbackError);
                return [];
            }
        }
    }

    escapeHtml(text) {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    new TodoApp();
});
