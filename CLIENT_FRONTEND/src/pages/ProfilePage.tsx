import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Button from "react-bootstrap/Button";
import Loader from "../components/Loader";
import FetchBaseError from "../components/FetchBaseError";
import Table from "react-bootstrap/Table";
import { Link } from "react-router-dom";
import { useGetMyOrdersQuery } from "../redux-toolkit-config/api-services/orderService";

/**
 *
 * @returns A page which shows the orders of the user.
 */
function ProfilePage() {
  const {
    data: orders,
    error: getOrdersError,
    isLoading: ordersAreLoading,
  } = useGetMyOrdersQuery();

  return (
    <Row>
      {/* Column showing the orders of the user in a table.*/}
      <Col md={12}>
        <h2>My Orders</h2>
        {ordersAreLoading ? (
          <Loader />
        ) : getOrdersError ? (
          <FetchBaseError error={getOrdersError} />
        ) : (
          <Table striped>
            <thead>
              <tr>
                <td>ID</td>
                <td>Date</td>
                <td>Total</td>
                <td>Paid</td>
                <td>Delivered</td>
              </tr>
            </thead>

            <tbody>
              {orders &&
                orders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{order.createdAt.substring(0, 10)}</td>
                    <td>${order.totalPrice}</td>
                    <td>
                      {order.isPaid ? (
                        order.paidAt
                      ) : (
                        <i
                          className="fas fa-times"
                          style={{ color: "red" }}
                        ></i>
                      )}
                    </td>
                    <td>
                      <Link to={`/order/${order.id}`}>
                        <Button className="btn-sm">Details</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
            </tbody>
          </Table>
        )}
      </Col>
    </Row>
  );
}

export default ProfilePage;
