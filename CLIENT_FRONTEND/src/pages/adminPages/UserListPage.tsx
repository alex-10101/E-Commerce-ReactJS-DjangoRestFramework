import {
  useDeleteUserAdminMutation,
  useGetUsersQuery,
} from "../../redux-toolkit-config/api-services/authService";
import Loader from "../../components/Loader";
import FetchBaseError from "../../components/FetchBaseError";
import Table from "react-bootstrap/Table";
import { Link } from "react-router-dom";
import { Button } from "react-bootstrap";
import { useAppSelector } from "../../redux-toolkit-config/hooks";
import { selectTheme } from "../../redux-toolkit-config/slices/themeSlice";

/**
 *
 * @returns A page, where the admin can see all users.
 */
function UserListPage() {
  const { data, isLoading, error: getUsersError } = useGetUsersQuery();

  const theme = useAppSelector(selectTheme);

  const [deleteUserAdmin, { error: deleteUserError }] =
    useDeleteUserAdminMutation();

  /**
   * When the admin user clicks the delete button, it triggers this function which
   * makes a DELETE request to the server to delete the user with the given id from the database.
   */
  async function handleDeleteUserAdmin(id: number) {
    if (window.confirm("Are you sure you want to delete this user?")) {
      await deleteUserAdmin(id).unwrap();
    }
  }

  return (
    <div>
      <h1>Users</h1>
      {isLoading ? (
        <Loader />
      ) : getUsersError ? (
        <FetchBaseError error={getUsersError} />
      ) : (
        <Table striped bordered hover responsive className="table-sm">
          <thead>
            <tr>
              <th>ID</th>
              <th>NAME</th>
              <th>EMAIL</th>
              <th>ADMIN</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>
                  {user.is_staff ? (
                    <i className="fas fa-check" style={{ color: "green" }}></i>
                  ) : (
                    <i className="fas fa-check" style={{ color: "red" }}></i>
                  )}
                </td>

                <td>
                  <Link to={`/admin/user/${user.id}/edit`}>
                    <Button variant={theme} className="btn-sm">
                      Edit <i className="fas fa-edit"></i>
                    </Button>
                  </Link>

                  <Button
                    variant={theme}
                    className="btn-sm"
                    onClick={() => handleDeleteUserAdmin(user.id)}
                  >
                    Delete <i className="fas fa-trash"></i>
                  </Button>
                  {deleteUserError && (
                    <FetchBaseError error={deleteUserError} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}

export default UserListPage;
