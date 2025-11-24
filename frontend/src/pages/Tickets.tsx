import { useAppDispatch, useAppSelector } from '../store/hooks';
import { signout } from '../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import styles from './Tickets.module.css';

const Tickets = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = async () => {
    await dispatch(signout());
    navigate('/');
  };

  return (
    <div className={styles.ticketsContainer}>
      <div className={styles.ticketsCard}>
        <h1 className={styles.title}>Bienvenidos</h1>
        {user && (
          <p className={styles.userInfo}>Usuario: {user.email}</p>
        )}
        <button onClick={handleLogout} className={styles.logoutButton}>
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
};

export default Tickets;

