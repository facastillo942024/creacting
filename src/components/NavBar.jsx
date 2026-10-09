import { Navbar, Nav, Container, Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../auth/useAuth";

export default function NavBar() {
  const { isAuth, rol, user, logout } = useAuth();
  const navigate = useNavigate();

  const salir = () => {
    logout();
    navigate("/login");
  };

  return (
    <Navbar expand="lg" className="bg-body-tertiary" style={{ marginBottom: 20 }}>
      <Container>
        <Navbar.Brand as={Link} to="/">
          <img src="/creactingcinema.png" alt="CreactingCinema" height="36" />
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="main-nav" />
        <Navbar.Collapse id="main-nav">
          <Nav className="me-auto">
            {isAuth && rol === "actor" && (
              <Nav.Link as={Link} to="/perfil">
                Mi perfil
              </Nav.Link>
            )}
            {isAuth && (rol === "director" || rol === "admin") && (
              <Nav.Link as={Link} to="/buscar">
                Buscar talento
              </Nav.Link>
            )}
          </Nav>
          <Nav>
            {isAuth ? (
              <>
                <Navbar.Text style={{ marginRight: 12 }}>
                  {user?.nombre} ({rol})
                </Navbar.Text>
                <Button variant="outline-danger" size="sm" onClick={salir}>
                  Salir
                </Button>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/login">
                  Ingresar
                </Nav.Link>
                <Nav.Link as={Link} to="/registro">
                  Registrarse
                </Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
