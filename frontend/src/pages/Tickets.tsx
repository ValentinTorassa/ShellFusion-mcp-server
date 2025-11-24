import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { signout } from '../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import { getAllTickets, getTicketById } from '../services/ticketService';
import type { ITicket } from '../services/ticketService';
import styles from './Tickets.module.css';

const Tickets = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const [tickets, setTickets] = useState<ITicket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<ITicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterId, setFilterId] = useState('');
  const [isFiltering, setIsFiltering] = useState(false);

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

  const handleFilterById = async () => {
    if (!filterId.trim()) {
      setFilteredTickets(tickets);
      setIsFiltering(false);
      return;
    }

    try {
      setIsFiltering(true);
      setError(null);
      const ticket = await getTicketById(filterId.trim());
      setFilteredTickets([ticket]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ticket no encontrado');
      setFilteredTickets([]);
    } finally {
      setIsFiltering(false);
    }
  };

  const handleClearFilter = () => {
    setFilterId('');
    setFilteredTickets(tickets);
    setIsFiltering(false);
    setError(null);
  };

  const handleLogout = async () => {
    await dispatch(signout());
    navigate('/');
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
          <h1 className={styles.title}>Tickets</h1>

          {/* Filter Section */}
          <div className={styles.filterSection}>
            <div className={styles.filterInputGroup}>
              <input
                type="text"
                placeholder="Buscar por ID de ticket..."
                value={filterId}
                onChange={(e) => setFilterId(e.target.value)}
                className={styles.filterInput}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleFilterById();
                  }
                }}
              />
              <button
                onClick={handleFilterById}
                className={styles.filterButton}
                disabled={isFiltering}
              >
                {isFiltering ? 'Buscando...' : 'Buscar'}
              </button>
              {filterId && (
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
                        <strong>ID:</strong> {ticket._id}
                      </span>
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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Tickets;

