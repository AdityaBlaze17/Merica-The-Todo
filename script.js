const API_URL = 'https://dummyjson.com/todos';
const todoList = document.getElementById('todoList');
const form = document.getElementById('todo-form');
const taskInput = document.getElementById('taskInput');
const taskDate = document.getElementById('taskDate');
const searchInput = document.getElementById('searchInput');
const fromDate = document.getElementById('fromDate');
const toDate = document.getElementById('toDate');
const loading = document.getElementById('loading');
const errorMsg = document.getElementById('errorMsg');

let todos = [];
let currentPage = 1;
const pageSize = 10;

// Fetch Todos from API
async function fetchTodos() {
  loading.style.display = 'block';
  errorMsg.classList.add('d-none');
  try {
    const res = await fetch(`${API_URL}?limit=100`);
    if (!res.ok) throw new Error('Failed to fetch todos.');
    const data = await res.json();

    // Assign a fake "created date" to each todo
    todos = data.todos.map(todo => ({
      ...todo,
      date: new Date().toISOString().split('T')[0],
    }));

    renderTodos();
  } catch (err) {
    showError(err.message);
  } finally {
    loading.style.display = 'none';
  }
}

// Render todos with search, date filter, pagination
function renderTodos() {
  let filtered = [...todos];
  const search = searchInput.value.toLowerCase();
  const from = fromDate.value;
  const to = toDate.value;

  if (search) {
    filtered = filtered.filter(todo => todo.todo.toLowerCase().includes(search));
  }

  if (from) {
    filtered = filtered.filter(todo => todo.date >= from);
  }

  if (to) {
    filtered = filtered.filter(todo => todo.date <= to);
  }

  const start = (currentPage - 1) * pageSize;
  const paginated = filtered.slice(start, start + pageSize);

  todoList.innerHTML = '';
  if (paginated.length === 0) {
    todoList.innerHTML = '<li class="list-group-item text-center">No tasks found.</li>';
    return;
  }

  paginated.forEach(todo => {
    const li = document.createElement('li');
    li.className = 'list-group-item';

    li.innerHTML = `
      <div class="d-flex justify-content-between align-items-center">
        <span>${todo.todo}</span>
        <div>
          <small class="text-muted me-3">${todo.date}</small>
          <button class="btn btn-sm btn-danger" onclick="deleteTodo(${todo.id})">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `;
    todoList.appendChild(li);
  });
}

// Add new todo (POST)
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const newTask = taskInput.value.trim();
  const date = taskDate.value || new Date().toISOString().split('T')[0];

  if (!newTask) return;

  try {
    loading.style.display = 'block';
    errorMsg.classList.add('d-none');

    const res = await fetch(`${API_URL}/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        todo: newTask,
        completed: false,
        userId: 1,
      }),
    });

    if (!res.ok) throw new Error('Failed to add task.');

    const data = await res.json();
    // Assign fake date and random high ID
    const fakeId = Math.floor(Math.random() * 100000 + 1000);
    todos.unshift({ ...data, id: fakeId, date });

    form.reset();
    currentPage = 1;
    renderTodos();
  } catch (err) {
    showError(err.message);
  } finally {
    loading.style.display = 'none';
  }
});

// Delete todo (supports both real and fake todos)
async function deleteTodo(id) {
  const todo = todos.find(t => t.id === id);
  if (!todo) return;

  if (!confirm("Are you sure you want to delete this todo?")) return;

  try {
    loading.style.display = 'block';
    errorMsg.classList.add('d-none');

    // Only send DELETE for real todos (id <= 150)
    if (id <= 150) {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error("API error while deleting");
    }

    // Remove from local array
    todos = todos.filter(t => t.id !== id);
    renderTodos();
  } catch (err) {
    showError("Failed to delete task.");
  } finally {
    loading.style.display = 'none';
  }
}

// Pagination
document.getElementById('prevBtn').addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage--;
    renderTodos();
  }
});

document.getElementById('nextBtn').addEventListener('click', () => {
  const totalPages = Math.ceil(todos.length / pageSize);
  if (currentPage < totalPages) {
    currentPage++;
    renderTodos();
  }
});

// Filters and Search
searchInput.addEventListener('input', () => {
  currentPage = 1;
  renderTodos();
});

fromDate.addEventListener('change', () => {
  currentPage = 1;
  renderTodos();
});

toDate.addEventListener('change', () => {
  currentPage = 1;
  renderTodos();
});

// Show error
function showError(message) {
  errorMsg.textContent = message;
  errorMsg.classList.remove('d-none');
  setTimeout(() => {
    errorMsg.classList.add('d-none');
  }, 4000);
}

// Initial load
fetchTodos();
