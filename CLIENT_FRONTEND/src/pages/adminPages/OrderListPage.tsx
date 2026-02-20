import Button from "react-bootstrap/Button";
import Table from "react-bootstrap/Table";
import Loader from "../../components/Loader";
import { Link } from "react-router-dom";
import FetchBaseError from "../../components/FetchBaseError";
import { useAppSelector } from "../../redux-toolkit-config/hooks";
import { selectTheme } from "../../redux-toolkit-config/slices/themeSlice";
import { useGetOrdersQuery } from "../../redux-toolkit-config/api-services/orderService";

/**
 *
 * @returns A page, where the admin can view all the orders.
 */
function OrderListPage() {
  const theme = useAppSelector(selectTheme);

  const { data: orders, isLoading, error } = useGetOrdersQuery();

  return (
    <>
      <h1>Orders</h1>
      {isLoading ? (
        <Loader />
      ) : error ? (
        <FetchBaseError error={error} />
      ) : (
        <Table striped bordered hover responsive className="table-sm">
          <thead>
            <tr>
              <th>ID</th>
              <th>USER</th>
              <th>DATE</th>
              <th>TOTAL</th>
              <th>PAID</th>
              <th>DELIVERED</th>
            </tr>
          </thead>
          <tbody>
            {orders &&
              orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.user.username}</td>
                  <td>{order.createdAt.substring(0, 10)}</td>
                  <td>${order.totalPrice}</td>
                  <td>
                    {order.isPaid ? (
                      order.paidAt.substring(0, 10)
                    ) : (
                      <i className="fas fa-check" style={{ color: "red" }} />
                    )}
                  </td>
                  <td>
                    {order.isDelivered ? (
                      order.delveredAt.substring(0, 10)
                    ) : (
                      <i className="fas fa-check" style={{ color: "red" }} />
                    )}
                  </td>
                  <td>
                    <Link to={`/order/${order.id}`}>
                      <Button variant={theme} className="btn-sm">
                        Details
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
          </tbody>
        </Table>
      )}
    </>
  );
}

export default OrderListPage;
