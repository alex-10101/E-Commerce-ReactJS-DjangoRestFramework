import Button from "react-bootstrap/Button";
import { Link, useLocation } from "react-router-dom";
import FetchBaseError from "../../components/FetchBaseError";
import Loader from "../../components/Loader";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import {
  useDeleteProductMutation,
  useGetAllProductsQuery,
} from "../../redux-toolkit-config/api-services/productService";
import Table from "react-bootstrap/Table";
import { useAppSelector } from "../../redux-toolkit-config/hooks";
import { selectTheme } from "../../redux-toolkit-config/slices/themeSlice";
import Pagination from "react-bootstrap/Pagination";
import { useState } from "react";

/**
 *
 * @returns A page, where the admin can view, add or delete products.
 */
function ProductListPage() {
  const location = useLocation();
  const theme = useAppSelector(selectTheme);
  const [page, setPage] = useState(1);

  // If the url does not contain any query param, append the page param to RTK Query like this: ?page={...}
  // If the url does already contain query params, append the page param to RTK Query like this: &page={...}
  // let queryString = location.search;
  // if (queryString) {
  //   queryString += `&page=${page}`;
  // } else {
  //   queryString += `?page=${page}`;
  // }
  const queryString = `${location.search}${location.search ? "&" : "?"}page=${page}`;
  const { data, isLoading, error } = useGetAllProductsQuery(queryString);

  const [
    deleteProduct,
    { isLoading: loadingDeleteProduct, error: errorDeleteProduct },
  ] = useDeleteProductMutation();

  /**
   * When the admin clicks the Delete button to delete a product,
   * it triggers this functions which sends a DELETE request to the server
   * to remove the product from the database.
   * @param id
   */
  async function handleDeleteProduct(id: number) {
    if (window.confirm("Are you sure you want to delete the product?")) {
      await deleteProduct(id).unwrap();
    }
  }

  return (
    <div>
      <Row className="align-items-center">
        <Col>
          <h1>Products</h1>
          {data && (
            // React-Bootstrap pagination component
            <Pagination>
              {/* Make a list of buttons, from 0, to the [(total nr. of pages returned by the server) - 1] */}
              {[...Array(data.pages).keys()].map((x) => {
                // Add 1 to the page numbers, so the buttons start with 1
                const p = x + 1;
                return (
                  <Pagination.Item
                    key={p}
                    active={p === page}
                    // Set the page number to the number of the button clicked.
                    // This will cause RTK Query to fetch that particular page.
                    onClick={() => {
                      setPage(p);
                    }}
                  >
                    {p}
                  </Pagination.Item>
                );
              })}
            </Pagination>
          )}
        </Col>
        <Col className="text-end">
          <Link to="/admin/createProduct">
            <Button className="my-3" variant={theme}>
              Create Product <i className="fas fa-plus"></i>
            </Button>
          </Link>
        </Col>
      </Row>
      {errorDeleteProduct && <FetchBaseError error={errorDeleteProduct} />}
      {loadingDeleteProduct && <Loader />}
      {isLoading ? (
        <Loader />
      ) : error ? (
        <FetchBaseError error={error} />
      ) : (
        data && (
          <>
            <Table striped bordered hover responsive className="table-sm">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>NAME</th>
                  <th>PRICE</th>
                  <th>CATEGORY</th>
                  <th>BRAND</th>
                  <th>STOCK</th>
                </tr>
              </thead>
              <tbody>
                {data.products.map((product) => (
                  <tr key={product.id}>
                    <td>{product.id}</td>
                    <td>{product.name}</td>
                    <td>${product.price}</td>
                    <td>{product.category}</td>
                    <td>{product.brand}</td>
                    <td>{product.countInStock}</td>
                    <td>
                      <Link to={`/admin/product/${product.id}/edit`}>
                        <Button variant="light" className="btn-sm mx-2">
                          Edit <i className="fas fa-edit" />
                        </Button>
                      </Link>
                      <Button
                        variant="danger"
                        className="btn-sm"
                        onClick={() => handleDeleteProduct(product.id)}
                      >
                        Delete <i className="fas fa-trash" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </>
        )
      )}
    </div>
  );
}

export default ProductListPage;
