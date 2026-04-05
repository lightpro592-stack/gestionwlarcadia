// --- Loader ---
const loader = document.getElementById('loader');
function showLoader() { loader.classList.remove('hidden'); }
function hideLoader() { loader.classList.add('hidden'); }

// URL API Node
const API_URL = 'http://localhost:3001';

// --- Utilisateur connecté ---
let currentUser = null;
function setCurrentUser(user) {
    currentUser = user;
    document.getElementById('connectedUser').textContent = user.login;
}

// =====================
// --- LOGIN ---
// =====================
const loginModal = document.getElementById('loginModal');
const loginPassword = document.getElementById('loginPassword');
const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');
const loginPseudoInput = document.getElementById('loginPseudo');

async function handleLogin() {
    const login = loginPseudoInput.value.trim();
    const password = loginPassword.value;

    if (!login || !password) {
        loginError.textContent = 'Identifiants manquants.';
        loginError.classList.remove('hidden');
        return;
    }

    loginBtn.disabled = true;
    showLoader();

    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login, password })
        });

        const data = await res.json();

        if (data.success) {
            setCurrentUser(data.user);
            loginModal.classList.add('hidden');
            fetchDossiers();
        } else {
            loginError.textContent = 'Identifiants incorrects.';
            loginError.classList.remove('hidden');
        }

    } catch (e) {
        loginError.textContent = 'Erreur serveur.';
        loginError.classList.remove('hidden');
    } finally {
        loginBtn.disabled = false;
        hideLoader();
    }
}

loginBtn.addEventListener('click', handleLogin);
loginPassword.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') handleLogin();
});

loginModal.classList.remove('hidden');

// =====================
// --- DOSSIERS ---
// =====================
let whitelistData = [];

async function fetchDossiers() {
    showLoader();
    try {
        const res = await fetch(`${API_URL}/dossiers`);
        whitelistData = await res.json();
        renderTable(whitelistData);
    } catch(e) {
        console.error('Erreur fetchDossiers', e);
    } finally {
        hideLoader();
    }
}

const tableBody = document.getElementById('whitelistTable');
const searchInput = document.getElementById('searchInput');

function renderTable(data) {
    tableBody.innerHTML = '';
    data.forEach(player => {
        const row = document.createElement('tr');
        row.className = "hover:bg-[#1c2030] text-sm";
        row.innerHTML = `
            <td class="px-6 py-4">${player.discord}</td>
            <td class="px-6 py-4">${player.name}</td>
            <td class="px-6 py-4">${player.secteur}</td>
            <td class="px-6 py-4">${player.papier ? '✔' : '✘'}</td>
            <td class="px-6 py-4">${player.citoyen ? '✔' : '✘'}</td>
            <td class="px-6 py-4">${player.staff}</td>
            <td class="px-6 py-4 text-right">
                <button class="edit-btn" data-discord="${player.discord}">Edit</button>
                <button class="delete-btn" data-discord="${player.discord}">Delete</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = whitelistData.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.discord.includes(term)
    );
    renderTable(filtered);
});

// =====================
// --- MODAL DOSSIER ---
// =====================
const modal = document.getElementById('modalForm');
const closeModalBtn = document.getElementById('closeModal');
const addBtn = document.querySelector('button.bg-purple-600');
const dossierForm = document.getElementById('dossierForm');

const inputDiscord = document.getElementById('inputDiscord');
const inputName = document.getElementById('inputName');
const inputSecteur = document.getElementById('inputSecteur');
const inputDetail = document.getElementById('inputDetail');
const inputPapier = document.getElementById('inputPapier');
const inputCitoyen = document.getElementById('inputCitoyen');
const inputStaff = document.getElementById('inputStaff');

let editMode = false;
let editDiscord = null;

function openModal(edit = false, dossier = null) {
    modal.classList.remove('hidden');
    editMode = edit;

    if (edit && dossier) {
        inputDiscord.value = dossier.discord;
        inputDiscord.disabled = true;
        inputName.value = dossier.name;
        inputSecteur.value = dossier.secteur;
        inputDetail.value = dossier.detail;
        inputPapier.checked = dossier.papier;
        inputCitoyen.checked = dossier.citoyen;
        inputStaff.value = dossier.staff;
        editDiscord = dossier.discord;
    } else {
        dossierForm.reset();
        inputDiscord.disabled = false;
        editDiscord = null;
    }
}

function closeModal() {
    modal.classList.add('hidden');
}

addBtn.addEventListener('click', () => openModal(false));
closeModalBtn.addEventListener('click', closeModal);

dossierForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const dossier = {
        discord: inputDiscord.value,
        name: inputName.value,
        secteur: inputSecteur.value,
        detail: inputDetail.value,
        papier: inputPapier.checked,
        citoyen: inputCitoyen.checked,
        staff: inputStaff.value
    };

    showLoader();

    try {
        if (editMode) {
            await fetch(`${API_URL}/dossiers/${editDiscord}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dossier)
            });
        } else {
            await fetch(`${API_URL}/dossiers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dossier)
            });
        }

        closeModal();
        fetchDossiers();

    } finally {
        hideLoader();
    }
});

tableBody.addEventListener('click', async function(e) {
    const discord = e.target.getAttribute('data-discord');

    if (e.target.classList.contains('edit-btn')) {
        const dossier = whitelistData.find(p => p.discord === discord);
        openModal(true, dossier);
    }

    if (e.target.classList.contains('delete-btn')) {
        if (!confirm('Supprimer ?')) return;

        showLoader();

        try {
            await fetch(`${API_URL}/dossiers/${discord}`, {
                method: 'DELETE'
            });
            fetchDossiers();
        } finally {
            hideLoader();
        }
    }
});