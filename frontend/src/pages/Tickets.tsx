import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { signout } from '../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import { getAllTickets, createTicket, updateTicket, deleteTicket } from '../services/ticketService';
import type { ITicket } from '../services/ticketService';
import TicketForm from '../components/TicketForm';
import ConfirmModal from '../components/ConfirmModal.tsx'; 
import styles from './Tickets.module.css';

const Tickets = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const [tickets, setTickets] = useState<ITicket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<ITicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterTitle, setFilterTitle] = useState('');
  const [isFiltering, setIsFiltering] = useState(false);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [editingTicket, setEditingTicket] = useState<ITicket | null>(null);
  const [deletingTicket, setDeletingTicket] = useState<ITicket | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllTickets();
      setTickets(data);
      setFilteredTickets(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar los tickets');
      setTickets([]);
      setFilteredTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterByTitle = () => {
    if (!filterTitle.trim()) {
      setFilteredTickets(tickets);
      setIsFiltering(false);
      return;
    }

    setIsFiltering(true);
    setError(null);

    const searchTerm = filterTitle.trim().toLowerCase();
    const filtered = tickets.filter(ticket =>
      ticket.title.toLowerCase().includes(searchTerm)
    );

    if (filtered.length === 0) {
      setError('No se encontraron tickets con ese título');
    }

    setFilteredTickets(filtered);
    setIsFiltering(false);
  };

  const handleClearFilter = () => {
    setFilterTitle('');
    setFilteredTickets(tickets);
    setIsFiltering(false);
    setError(null);
  };

  const handleLogout = async () => {
    await dispatch(signout());
    navigate('/');
  };

  const handleCreateTicket = () => {
    setEditingTicket(null);
    setShowTicketForm(true);
    setError(null);
  };

  const handleEditTicket = (ticket: ITicket) => {
    setEditingTicket(ticket);
    setShowTicketForm(true);
    setError(null);
  };

  const handleDeleteClick = (ticket: ITicket) => {
    setDeletingTicket(ticket);
    setError(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingTicket) return;

    try {
      setFormLoading(true);
      setError(null);
      await deleteTicket(deletingTicket._id);
      setDeletingTicket(null);
      await loadTickets();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar el ticket');
    } finally {
      setFormLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setDeletingTicket(null);
  };

  const handleFormSubmit = async (data: {
    title: string;
    description: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    assignedTo?: string;
    tags?: string;
  }) => {
    try {
      setFormLoading(true);
      setError(null);

      const tagsArray = data.tags
        ? data.tags
            .split(',')
            .map((tag) => tag.trim())
            .filter((tag) => tag.length > 0)
        : [];

      if (editingTicket) {
        // Update ticket
        const updateData: any = {
          title: data.title,
          description: data.description,
          status: data.status,
          priority: data.priority,
        };

        if (tagsArray.length > 0) {
          updateData.tags = tagsArray;
        } else {
          updateData.tags = [];
        }

        if (data.assignedTo && data.assignedTo.trim() !== '') {
          updateData.assignedTo = data.assignedTo.trim();
        } else {
          updateData.assignedTo = null;
        }

        await updateTicket(editingTicket._id, updateData);
      } else {
        // Create ticket
        if (!user?.userId) {
          setError('No se pudo obtener el ID del usuario');
          return;
        }

        const createData = {
          title: data.title,
          description: data.description,
          status: data.status,
          priority: data.priority,
          createdBy: user.userId,
          assignedTo: data.assignedTo && data.assignedTo.trim() !== '' ? data.assignedTo.trim() : null,
          tags: tagsArray,
        };

        await createTicket(createData);
      }

      setShowTicketForm(false);
      setEditingTicket(null);
      await loadTickets();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.response?.data?.details?.join(', ') || 'Error al guardar el ticket';
      setError(errorMessage);
    } finally {
      setFormLoading(false);
    }
  };

  const handleCancelForm = () => {
    setShowTicketForm(false);
    setEditingTicket(null);
    setError(null);
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      open: 'Abierto',
      in_progress: 'En Progreso',
      resolved: 'Resuelto',
      closed: 'Cerrado',
    };
    return labels[status] || status;
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      low: 'Baja',
      medium: 'Media',
      high: 'Alta',
      urgent: 'Urgente',
    };
    return labels[priority] || priority;
  };

  const getPriorityClass = (priority: string) => {
    const classes: Record<string, string> = {
      low: styles.priorityLow,
      medium: styles.priorityMedium,
      high: styles.priorityHigh,
      urgent: styles.priorityUrgent,
    };
    return classes[priority] || '';
  };

  const getStatusClass = (status: string) => {
    const classes: Record<string, string> = {
      open: styles.statusopen,
      in_progress: styles.statusin_progress,
      resolved: styles.statusresolved,
      closed: styles.statusclosed,
    };
    return classes[status] || '';
  };

  return (
    <div className={styles.ticketsContainer}>
      {/* Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.navbarContent}>
          <h2 className={styles.navbarGreeting}>
            Hola {user?.email || 'Usuario'}
          </h2>
          <button onClick={handleLogout} className={styles.logoutButton}>
            Cerrar Sesión
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className={styles.contentWrapper}>
        <div className={styles.ticketsCard}>
          <div className={styles.titleSection}>
            <h1 className={styles.title}>Tickets</h1>
            <button
              onClick={handleCreateTicket}
              className={styles.addButton}
              disabled={loading}
            >
              + Nuevo Ticket
            </button>
          </div>

          {/* Filter Section */}
          <div className={styles.filterSection}>
            <div className={styles.filterInputGroup}>
              <input
                type="text"
                placeholder="Buscar por título..."
                value={filterTitle}
                onChange={(e) => setFilterTitle(e.target.value)}
                className={styles.filterInput}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleFilterByTitle();
                  }
                }}
              />
              <button
                onClick={handleFilterByTitle}
                className={styles.filterButton}
                disabled={isFiltering}
              >
                {isFiltering ? 'Buscando...' : 'Buscar'}
              </button>
              {filterTitle && (
                <button
                  onClick={handleClearFilter}
                  className={styles.clearButton}
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className={styles.loadingMessage}>
              Cargando tickets...
            </div>
          )}

          {/* Tickets List */}
          {!loading && !error && filteredTickets.length === 0 && (
            <div className={styles.emptyMessage}>
              Aun no se cargaron tickets
            </div>
          )}

          {!loading && filteredTickets.length > 0 && (
            <div className={styles.ticketsList}>
              {filteredTickets.map((ticket) => (
                <div key={ticket._id} className={styles.ticketCard}>
                  <div className={styles.ticketHeader}>
                    <h3 className={styles.ticketTitle}>{ticket.title}</h3>
                    <div className={styles.ticketMeta}>
                      <span className={`${styles.statusBadge} ${getStatusClass(ticket.status)}`}>
                        {getStatusLabel(ticket.status)}
                      </span>
                      <span className={`${styles.priorityBadge} ${getPriorityClass(ticket.priority)}`}>
                        {getPriorityLabel(ticket.priority)}
                      </span>
                    </div>
                  </div>
                  <p className={styles.ticketDescription}>{ticket.description}</p>
                  <div className={styles.ticketFooter}>
                    <div className={styles.ticketInfo}>
                      <span className={styles.ticketInfoItem}>
                        <strong>Creado por:</strong> {ticket.createdBy?.email || 'N/A'}
                      </span>
                      {ticket.assignedTo && (
                        <span className={styles.ticketInfoItem}>
                          <strong>Asignado a:</strong> {ticket.assignedTo.email}
                        </span>
                      )}
                      {ticket.createdAt && (
                        <span className={styles.ticketInfoItem}>
                          <strong>Fecha:</strong> {new Date(ticket.createdAt).toLocaleDateString('es-ES')}
                        </span>
                      )}
                    </div>
                    {ticket.tags && ticket.tags.length > 0 && (
                      <div className={styles.tagsContainer}>
                        {ticket.tags.map((tag, index) => (
                          <span key={index} className={styles.tag}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className={styles.ticketActions}>
                    <button
                      onClick={() => handleEditTicket(ticket)}
                      className={styles.editButton}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteClick(ticket)}
                      className={styles.deleteButton}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ticket Form Modal */}
      {showTicketForm && (
        <TicketForm
          ticket={editingTicket}
          onSubmit={handleFormSubmit}
          onCancel={handleCancelForm}
          loading={formLoading}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingTicket && (
        <ConfirmModal
          isOpen={!!deletingTicket}
          title="Confirmar Eliminación"
          message={`¿Esta seguro de que desea eliminar el ticket "${deletingTicket.title}"? Esta acción no se puede deshacer.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
    </div>
  );
};

export default Tickets;
