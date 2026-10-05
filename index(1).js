// ToDo List API — второе задание.
// Источник данных — сервер. Необходимо указать номер ученика от 1 до 15.

const API_URL = 'http://212.193.11.210:3000';
const STUDENT_ID = '1'; // <-- замените на свой номер ученика (1-15)

const state = {
  todos: [],
  filter: 'all',
  search: '',
  loading: true,
  busy: false,
};

const todoForm = document.querySelector('#todoForm');
const todoInput = document.querySelector('#todoInput');
const addButton = document.querySelector('#addButton');
const searchInput = document.querySelector('#searchInput');
const todoList = document.querySelector('#todoList');
const clearCompletedButton = document.querySelector('#clearCompleted');
const status = document.querySelector('#status');
const totalCount = document.querySelector('#totalCount');
const activeCount = document.querySelector('#activeCount');
const completedCount = document.querySelector('#completedCount');
const filterButtons = [...document.querySelectorAll('.filter')];

function apiHeaders() {
  return {
    'Content-Type': 'application/json',
    'X-Student-Id': STUDENT_ID,
  };
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...apiHeaders(),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const data = await response.json();
      message = data.message || data.error || message;
    } catch {
      // Ответ мог быть не JSON.
    }
    throw new Error(message);
  }

  if (response.status === 204) return null;
  return response.json();
}

// API-функции ничего не рисуют на странице.
async function getTodos() {
  return request(`${API_URL}/todos`);
}

async function createTodo(title) {
  return request(`${API_URL}/todos`, {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
}

async function updateTodo(id, data) {
  return request(`${API_URL}/todos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

async function deleteTodo(id) {
  return request(`${API_URL}/todos/${id}`, {
    method: 'DELETE',
  });
}

function setStatus(message = '', isError = false) {
  status.textContent = message;
  status.classList.toggle('error', isError);
}

function setBusy(value, message = '') {
  state.busy = value;
  addButton.disabled = value;
  clearCompletedButton.disabled = value;
  todoInput.disabled = value;
  setStatus(message);
}

function getVisibleTodos() {
  const normalizedSearch = state.search.trim().toLowerCase();

  return state.todos
    .filter((todo) => {
      if (state.filter === 'active') return !todo.completed;
      if (state.filter === 'completed') return todo.completed;
      return true;
    })
    .filter((todo) => todo.title.toLowerCase().includes(normalizedSearch));
}

function updateCounters() {
  const total = state.todos.length;
  const completed = state.todos.filter((todo) => todo.completed).length;
  const active = total - completed;

  totalCount.textContent = total;
  activeCount.textContent = active;
  completedCount.textContent = completed;
}

function createDeleteHandler(id) {
  // Замыкание запоминает id задачи, к которой относится кнопка.
  return async function handleDelete() {
    await handleDeleteTodo(id);
  };
}

function createToggleHandler(id) {
  // Аналогичное замыкание для checkbox.
  return async function handleToggle(event) {
    await handleToggleTodo(id, event.target.checked);
  };
}

function renderTodos() {
  updateCounters();
  todoList.innerHTML = '';

  if (state.loading) {
    const loading = document.createElement('li');
    loading.className = 'empty';
    loading.textContent = 'Загружаем задачи...';
    todoList.appendChild(loading);
    return;
  }

  const visibleTodos = getVisibleTodos();

  if (visibleTodos.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty';
    empty.textContent = state.todos.length === 0
      ? 'Задач пока нет.'
      : 'По выбранным условиям задачи не найдены.';
    todoList.appendChild(empty);
    return;
  }

  visibleTodos.forEach((todo) => {
    const item = document.createElement('li');
    item.className = 'todo-item';
    if (todo.completed) item.classList.add('completed');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.completed;
    checkbox.disabled = state.busy;
    checkbox.setAttribute('aria-label', `Отметить задачу: ${todo.title}`);
    checkbox.addEventListener('change', createToggleHandler(todo.id));

    const text = document.createElement('span');
    text.className = 'todo-text';
    text.textContent = todo.title;

    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-button';
    deleteButton.type = 'button';
    deleteButton.textContent = 'Удалить';
    deleteButton.disabled = state.busy;
    deleteButton.addEventListener('click', createDeleteHandler(todo.id));

    item.append(checkbox, text, deleteButton);
    todoList.appendChild(item);
  });
}

async function loadTodos() {
  state.loading = true;
  renderTodos();
  setStatus('Загружаем задачи...');

  try {
    state.todos = await getTodos();
    setStatus('');
  } catch (error) {
    state.todos = [];
    setStatus(`Не удалось загрузить задачи: ${error.message}`, true);
  } finally {
    state.loading = false;
    renderTodos();
  }
}

async function handleAddTodo(text) {
  const trimmedText = text.trim();
  if (!trimmedText || state.busy) return;

  setBusy(true, 'Сохраняем...');

  try {
    const createdTodo = await createTodo(trimmedText);
    state.todos.push(createdTodo);
    todoInput.value = '';
    setStatus('Задача сохранена.');
  } catch (error) {
    setStatus(`Не удалось добавить задачу: ${error.message}`, true);
  } finally {
    setBusy(false, '');
    renderTodos();
  }
}

async function handleDeleteTodo(id) {
  if (state.busy) return;

  setBusy(true, 'Удаляем...');

  try {
    await deleteTodo(id);
    state.todos = state.todos.filter((todo) => todo.id !== id);
    setStatus('Задача удалена.');
  } catch (error) {
    setStatus(`Не удалось удалить задачу: ${error.message}`, true);
  } finally {
    setBusy(false, '');
    renderTodos();
  }
}

async function handleToggleTodo(id, completed) {
  if (state.busy) return;

  const previousTodo = state.todos.find((todo) => todo.id === id);
  if (!previousTodo) return;

  setBusy(true, 'Сохраняем...');

  try {
    const updatedTodo = await updateTodo(id, { completed });
    state.todos = state.todos.map((todo) => (todo.id === id ? updatedTodo : todo));
    setStatus('Изменения сохранены.');
  } catch (error) {
    setStatus(`Не удалось обновить задачу: ${error.message}`, true);
  } finally {
    setBusy(false, '');
    renderTodos();
  }
}

async function handleClearCompleted() {
  if (state.busy) return;

  const completedTodos = state.todos.filter((todo) => todo.completed);
  if (completedTodos.length === 0) return;

  setBusy(true, 'Удаляем выполненные...');

  try {
    // У каждой задачи свой запрос DELETE. Интерфейс меняем только после успешных ответов.
    await Promise.all(completedTodos.map((todo) => deleteTodo(todo.id)));
    state.todos = state.todos.filter((todo) => !todo.completed);
    setStatus('Выполненные задачи удалены.');
  } catch (error) {
    setStatus(`Не удалось удалить выполненные задачи: ${error.message}`, true);
    await loadTodos();
  } finally {
    setBusy(false, '');
    renderTodos();
  }
}

todoForm.addEventListener('submit', (event) => {
  event.preventDefault();
  handleAddTodo(todoInput.value);
});

searchInput.addEventListener('input', (event) => {
  state.search = event.target.value;
  renderTodos();
});

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    state.filter = button.dataset.filter;
    filterButtons.forEach((item) => item.classList.toggle('active', item === button));
    renderTodos();
  });
});

clearCompletedButton.addEventListener('click', handleClearCompleted);

renderTodos();
loadTodos();
