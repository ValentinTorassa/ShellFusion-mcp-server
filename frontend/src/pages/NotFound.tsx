import { Link } from 'react-router-dom';
import styles from './NotFound.module.css';

const NotFound = () => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>404</h1>
        <h2 className={styles.subtitle}>¡Ups! Página no encontrada</h2>
        <p className={styles.message}>
          Lo sentimos, la página que estás buscando no existe o ha sido movida.
        </p>
        <Link to="/" className={styles.homeButton}>
          Volver al inicio
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
