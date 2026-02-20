import Col from "react-bootstrap/esm/Col";
import Container from "react-bootstrap/esm/Container";
import Row from "react-bootstrap/esm/Row";

/**
 *
 * @param children - React nodes (child components of this component) to render/display inside the container.
 * @returns A component which centers its child components horizontally and constrains width for form layouts:
 * - Full width on small screens (12 / 12 spaces)
 * - Centered, half-width column on medium screens and up (6 / 12 spaces)
 */
function FormContainer({ children }: { children: React.ReactNode }) {
  return (
    <Container>
      <Row className="justify-content-md-center">
        <Col xs={12} md={6}>
          {children}
        </Col>
      </Row>
    </Container>
  );
}

export default FormContainer;
