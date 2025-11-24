import { useForm } from 'react-hook-form';
import { joiResolver } from '@hookform/resolvers/joi';
import { createTicketSchema, updateTicketSchema } from '../utils/validationSchemas';
import type { ITicket } from '../services/ticketService';
import styles from './TicketForm.module.css';

interface TicketFormData {
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  tags?: string;
}

interface TicketFormProps {
  ticket?: ITicket | null;
  onSubmit: (data: TicketFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const TicketForm = ({ ticket, onSubmit, onCancel, loading = false }: TicketFormProps) => {
  const isEditing = !!ticket;
  const schema = isEditing ? updateTicketSchema : createTicketSchema;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TicketFormData>({
    resolver: joiResolver(schema),
    defaultValues: ticket
      ? {
          title: ticket.title,
          description: ticket.description,
          status: ticket.status,
          priority: ticket.priority,
          tags: ticket.tags?.join(', ') || '',
        }
      : {
          status: 'open',
          priority: 'medium',
          tags: '',
        },
  });

  const handleFormSubmit = async (data: TicketFormData) => {
    const tagsArray = data.tags
      ? data.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0)
      : [];

    const submitData: TicketFormData = {
      ...data,
      tags: tagsArray.length > 0 ? tagsArray.join(', ') : undefined,
      assignedTo: undefined, // Siempre undefined, no se permite asignar desde el formulario
    };

    await onSubmit(submitData);
  };

  return (
    <div className={styles.formOverlay} onClick={onCancel}>
      <div className={styles.formContent} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.formTitle}>
          {isEditing ? 'Editar Ticket' : 'Nuevo Ticket'}
        </h2>

        <form onSubmit={handleSubmit(handleFormSubmit)} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="title" className={styles.label}>
              Título *
            </label>
            <input
              id="title"
              type="text"
              {...register('title')}
              className={`${styles.input} ${errors.title ? styles.inputError : ''}`}
              placeholder="Ingrese el título del ticket"
              disabled={loading}
            />
            {errors.title && (
              <span className={styles.errorText}>{errors.title.message}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description" className={styles.label}>
              Descripción *
            </label>
            <textarea
              id="description"
              {...register('description')}
              className={`${styles.textarea} ${errors.description ? styles.inputError : ''}`}
              placeholder="Ingrese la descripción del ticket"
              rows={5}
              disabled={loading}
            />
            {errors.description && (
              <span className={styles.errorText}>{errors.description.message}</span>
            )}
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="status" className={styles.label}>
                Estado
              </label>
              <select
                id="status"
                {...register('status')}
                className={`${styles.select} ${errors.status ? styles.inputError : ''}`}
                disabled={loading}
              >
                <option value="open">Abierto</option>
                <option value="in_progress">En Progreso</option>
                <option value="resolved">Resuelto</option>
                <option value="closed">Cerrado</option>
              </select>
              {errors.status && (
                <span className={styles.errorText}>{errors.status.message}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="priority" className={styles.label}>
                Prioridad
              </label>
              <select
                id="priority"
                {...register('priority')}
                className={`${styles.select} ${errors.priority ? styles.inputError : ''}`}
                disabled={loading}
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
              {errors.priority && (
                <span className={styles.errorText}>{errors.priority.message}</span>
              )}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="tags" className={styles.label}>
              Etiquetas (separadas por comas)
            </label>
            <input
              id="tags"
              type="text"
              {...register('tags')}
              className={`${styles.input} ${errors.tags ? styles.inputError : ''}`}
              placeholder="tag1, tag2, tag3 (máximo 10)"
              disabled={loading}
            />
            {errors.tags && (
              <span className={styles.errorText}>{errors.tags.message}</span>
            )}
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              onClick={onCancel}
              className={styles.cancelButton}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TicketForm;