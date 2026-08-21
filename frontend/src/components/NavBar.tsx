import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="nav">
      <Link to="/" className="brand">
        Course Training Portal
      </Link>
      <nav>
        <Link to="/">Catalogue</Link>
        {user && <Link to="/my-courses">My courses</Link>}
        {user && <Link to="/notifications">Notifications</Link>}
        {user && <Link to="/certificates">Certificates</Link>}
        {user && ['SYSTEM_ADMIN', 'TRAINING_ADMIN', 'INSTRUCTOR'].includes(user.role) && (
          <Link to="/workspace">
            {user.role === 'SYSTEM_ADMIN'
              ? 'System administration'
              : user.role === 'TRAINING_ADMIN'
                ? 'Training workspace'
                : 'Instructor workspace'}
          </Link>
        )}
        {user ? (
          <button className="nav-signout"
            onClick={() => {
              logout();
              navigate('/');
            }}
          >
            Sign out
          </button>
        ) : (
          <>
            <Link to="/login">Sign in</Link>
            <Link to="/register">Register</Link>
          </>
        )}
        {user && <span className="role-badge">{user.role.replaceAll('_', ' ')}</span>}
      </nav>
    </header>
  );
}
