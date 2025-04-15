import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navigation = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.clear();
    logout();
    navigate('/login');
  };

  const handleBrandClick = () => {
    if (user) {
      navigate('/home');
    } else {
      navigate('/login');
    }
  };

  const role = localStorage.getItem("role");
  const dashboardPath = role === "ADMIN" ? "/admin/dashboard" : "/user/dashboard";
  
  // Check if current path matches the dashboard path
  const isDashboardActive = location.pathname === dashboardPath;
  const isProfileActive = location.pathname === '/profile';

  return (
    <Navbar 
      expand="lg" 
      className="navbar-custom shadow-lg sticky-top navbar-dark bg-gradient-primary"
      variant="dark"
    >
      <Container>
        <Navbar.Brand 
          onClick={handleBrandClick} 
          className="brand-text fw-bold d-flex align-items-center py-2"
        >
          <div className="brand-icon-wrapper me-2">
            <i className="bi bi-search-heart-fill cursor"></i>
          </div>
          <div style={{cursor:"pointer"}}
          >Lost & Found</div>
        </Navbar.Brand>

        <Navbar.Toggle 
          aria-controls="basic-navbar-nav" 
          className="border-0 shadow-none custom-toggler"
        />
        
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {user && (
              <>
                <Nav.Link 
                  as={Link}   
                  to={dashboardPath}
                  className={`nav-link-custom mx-2 d-flex align-items-center ${isDashboardActive ? 'active fw-bold' : ''}`}
                  style={{
                    backgroundColor: isDashboardActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                    borderRadius: '8px',
                    padding: '8px 16px'
                  }}
                >
                  <div className="nav-icon-wrapper me-2">
                    <i className="bi bi-grid-fill"></i>
                  </div>
                  Dashboard
                </Nav.Link>

                <Nav.Link 
                  as={Link} 
                  to="/profile"
                  className={`nav-link-custom mx-2 d-flex align-items-center ${isProfileActive ? 'active fw-bold' : ''}`}
                  style={{
                    backgroundColor: isProfileActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                    borderRadius: '8px',
                    padding: '8px 16px'
                  }}
                >
                  <div className="nav-icon-wrapper me-2">
                    <i className="bi bi-person-circle"></i>
                  </div>
                  Profile
                </Nav.Link>
              </>
            )}
          </Nav>
          
          <Nav className="d-flex align-items-center gap-3">
            {user ? (
              <Button 
                variant="outline-primary" 
                onClick={handleLogout}
                className="rounded-pill px-4 nav-btn-custom"
              >
                <i className="bi bi-box-arrow-right me-2"></i>
                Logout
              </Button>
            ) : (
              <>
                <Nav.Link 
                  as={Link} 
                  to="/login"
                  className="nav-link-custom mx-2"
                >
                  <i className="bi bi-box-arrow-in-right me-2"></i>
                  Login
                </Nav.Link>
                <Nav.Link 
                  as={Link} 
                  to="/register"
                  className="nav-btn-register rounded-pill px-4 ms-2"
                >
                  <i className="bi bi-person-plus-fill me-2"></i>
                  Register
                </Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Navigation;
