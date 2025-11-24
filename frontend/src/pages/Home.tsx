import { Link } from 'react-router-dom';
import styles from './Home.module.css';
import logoImage from '../images/logo.png';

const Home = () => {
  return (
    <div className={styles.homeContainer}>
      <div className={styles.contentWrapper}>
        {/* Logo/Título */}
        <div className={styles.header}>
          <div className={styles.logoContainer}>
            <img 
              src={logoImage} 
              alt="ShellFusion Logo" 
              className={styles.logo}
            />
          </div>
          <h1 className={styles.title}>
            ShellFusion
          </h1>
          <p className={styles.subtitle}>
            Sistema de gestión de Tickets
          </p>
        </div>

        {/* Mensaje de bienvenida */}
        <div className={styles.welcomeCard}>
          <h2 className={styles.welcomeTitle}>
            ¡Bienvenido a ShellFusion!
          </h2>
          <p className={styles.welcomeText}>
            Gestiona tus tickets y proyectos de manera eficiente
          </p>

          {/* Botones */}
          <div className={styles.buttonsContainer}>
            <Link
              to="/login"
              className={`${styles.button} ${styles.buttonLogin}`}
            >
              Iniciar Sesión
            </Link>
            <Link
              to="/signup"
              className={`${styles.button} ${styles.buttonSignup}`}
            >
              Registrarse
            </Link>
          </div>
        </div>

        {/* Información sobre Claude/MCP */}
        <div className={styles.claudeInfo}>
          <div className={styles.claudeIcon}>🤖</div>
          <h3 className={styles.claudeTitle}>
            Conéctalo con Claude para más eficiencia
          </h3>
          <p className={styles.claudeText}>
            Utiliza nuestro servidor MCP para gestionar tus tickets directamente desde Claude Desktop. 
            Crea, modifica y elimina tickets con comandos de voz o texto de manera intuitiva.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;

