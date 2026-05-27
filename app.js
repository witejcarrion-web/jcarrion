// CONFIGURACIÓN DE SUPABASE
// REEMPLAZA ESTOS VALORES CON LOS DE TU PANEL DE SUPABASE (Settings -> API)
const SUPABASE_URL = "https://TU_PROYECTO.supabase.co";
const SUPABASE_ANON_KEY = "TU_ANON_KEY_AQUÍ";

const supabase = mentors = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// VARIABLES DE ESTADO LOCAL
let currentUser = null;
let currentTab = 'unassigned'; // 'unassigned', 'my', 'all'

// ELEMENTOS DEL DOM
const loginScreen = document.getElementById('login-screen');
const appScreen = document.getElementById('app-screen');
const loginForm = document.getElementById('login-form');
const ticketsTableBody = document.getElementById('tickets-table-body');
const logoutBtn = document.getElementById('logout-btn');

// INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', async () => {
    // Verificar si ya hay una sesión activa
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        handleAuthSuccess(session.user);
    }

    // Cargar selectores de departamentos dinámicamente
    cargarDepartamentos();
    
    // Escuchar cambios de estado de autenticación
    supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
            handleAuthSuccess(session.user);
        } else {
            handleLogoutSuccess();
        }
    });
});

// MANEJO DE AUTENTICACIÓN
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        alert("Error de autenticación: " + error.message);
    }
});

logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
});

function handleAuthSuccess(user) {
    currentUser = user;
    loginScreen.classList.add('hidden');
    appScreen.classList.remove('hidden');
    document.getElementById('user-display-name').innerText = user.email;
    inicializarDashboard();
}

function handleLogoutSuccess() {
    currentUser = null;
    loginScreen.classList.remove('hidden');
    appScreen.classList.add('hidden');
}

// LÓGICA DEL DASHBOARD DE TICKETS
async function inicializarDashboard() {
    actualizarContadores();
    cargarTickets();
}

async function cargarDepartamentos() {
    const { data, error } = await supabase.from('departamentos').select('*');
    if (!error && data) {
        const filterDept = document.getElementById('filter-dept');
        const modalDept = document.getElementById('ticket-dept');
        
        // Limpiar e insertar
        filterDept.innerHTML = '<option value="">Seleccione Departamento</option>';
        modalDept.innerHTML = '';

        data.forEach(dept => {
            const opt = `<option value="${dept.id}">${dept.nombre}</option>`;
            filterDept.innerHTML += opt;
            modalDept.innerHTML += opt;
        });
    }
}

async function actualizarContadores() {
    // 1. Sin asignar
    const unassigned = await supabase.from('tickets').select('id', { count: 'exact', head: true }).is('asignado_a', null);
    document.getElementById('count-unassigned').innerText = unassigned.count || 0;

    // 2. Mis tickets
    if (currentUser) {
        const my = await supabase.from('tickets').select('id', { count: 'exact', head: true }).eq('asignado_a', currentUser.id);
        document.getElementById('count-my').innerText = my.count || 0;
    }

    // 3. Todos
    const all = await supabase.from('tickets').select('id', { count: 'exact', head: true });
    document.getElementById('count-all').innerText = all.count || 0;
}

async function cargarTickets() {
    ticketsTableBody.innerHTML = '<tr><td colspan="9" class="text-center py-4">Buscando registros...</td></tr>';
    
    let query = supabase.from('tickets').select('*, departamentos(nombre)');

    // Aplicar filtros de pestaña
    if (currentTab === 'unassigned') {
        query = query.is('asignado_a', null);
    } else if (currentTab === 'my') {
        query = query.eq('asignado_a', currentUser.id);
    }

    // Aplicar filtros selectores de la barra superior
    const deptId = document.getElementById('filter-dept').value;
    const priority = document.getElementById('filter-priority').value;

    if (deptId) query = query.eq('departamento_id', deptId);
    if (priority) query = query.eq('prioridad', priority);

    // Ordenar por más recientes por defecto
    query = query.order('fecha_creacion', { ascending: false });

    const { data: tickets, error } = await query;

    if (error) {
        ticketsTableBody.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-red-500">Error: ${error.message}</td></tr>`;
        return;
    }

    if (tickets.length === 0) {
        ticketsTableBody.innerHTML = '<tr><td colspan="9" class="text-center py-10 text-gray-400">No se encontraron tickets en esta sección.</td></tr>';
        return;
    }

    ticketsTableBody.innerHTML = '';
    tickets.forEach(ticket => {
        const colorPrioridad = {
            'Baja': 'bg-gray-100 text-gray-800',
            'Normal': 'bg-blue-100 text-blue-800',
            'Alta': 'bg-orange-100 text-orange-800',
            'Emergencia': 'bg-red-100 text-red-800'
        }[ticket.prioridad] || 'bg-gray-100';

        const colorEstado = ticket.estado === 'Abierto' ? 'text-green-600 font-bold' : 'text-gray-500';

        ticketsTableBody.innerHTML += `
            <tr class="hover:bg-gray-50 transition text-xs">
                <td class="px-6 py-3"><input type="checkbox" class="rounded border-gray-300"></td>
                <td class="px-6 py-3 font-mono text-gray-600">#${ticket.numero}</td>
                <td class="px-6 py-3 text-gray-500">${new Date(ticket.fecha_creacion).toLocaleString('es-ES')}</td>
                <td class="px-6 py-3 font-semibold text-gray-900">${ticket.asunto}</td>
                <td class="px-6 py-3">${ticket.peticionario_nombre}</td>
                <td class="px-6 py-3 ${colorEstado}">${ticket.estado}</td>
                <td class="px-6 py-3"><span class="px-2 py-0.5 rounded text-xs font-semibold ${colorPrioridad}">${ticket.prioridad}</span></td>
                <td class="px-6 py-3 text-gray-600">${ticket.departamentos?.nombre || 'General'}</td>
                <td class="px-6 py-3">
                    ${ticket.asignado_a === null ? 
                        `<button onclick="asignarmeTicket(${ticket.id})" class="text-blue-600 hover:underline font-bold">Asignarme</button>` : 
                        `<span class="text-gray-400">Asignado</span>`
                    }
                </td>
            </tr>
        `;
    });
}

// ACCIONES DE TICKETS
async function asignarmeTicket(ticketId) {
    if (!currentUser) return;
    const { error } = await supabase.from('tickets').update({ asignado_a: currentUser.id, estado: 'En Proceso' }).eq('id', ticketId);
    if (!error) {
        inicializarDashboard();
    } else {
        alert("No se pudo asignar el ticket: " + error.message);
    }
}

// CONTROL DE FILTROS Y PESTAÑAS
document.getElementById('btn-apply-filters').addEventListener('click', cargarTickets);
document.getElementById('btn-reset-filters').addEventListener('click', () => {
    document.getElementById('filter-dept').value = "";
    document.getElementById('filter-priority').value = "";
    cargarTickets();
});

const tabs = [
    { id: 'tab-unassigned', value: 'unassigned' },
    { id: 'tab-my-tickets', value: 'my' },
    { id: 'tab-all-tickets', value: 'all' }
];

tabs.forEach(tab => {
    document.getElementById(tab.id).addEventListener('click', (e) => {
        tabs.forEach(t => document.getElementById(t.id).className = "pb-3 hover:text-gray-700 transition");
        e.target.className = "pb-3 tab-active transition";
        currentTab = tab.value;
        cargarTickets();
    });
});

// MODAL PARA NUEVO TICKET
const newTicketModal = document.getElementById('new-ticket-modal');
document.getElementById('btn-new-ticket').addEventListener('click', () => newTicketModal.classList.remove('hidden'));
document.getElementById('btn-close-modal').addEventListener('click', () => newTicketModal.classList.add('hidden'));

document.getElementById('new-ticket-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const peticionario_nombre = document.getElementById('ticket-client-name').value;
    const peticionario_email = document.getElementById('ticket-client-email').value;
    const asunto = document.getElementById('ticket-subject').value;
    const departamento_id = document.getElementById('ticket-dept').value;
    const prioridad = document.getElementById('ticket-priority').value;

    const { error } = await supabase.from('tickets').insert([{
        peticionario_nombre,
        peticionario_email,
        asunto,
        departamento_id,
        prioridad,
        estado: 'Abierto'
    }]);

    if (!error) {
        newTicketModal.classList.add('hidden');
        document.getElementById('new-ticket-form').reset();
        inicializarDashboard();
    } else {
        alert("Error al guardar ticket: " + error.message);
    }
});
