import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Product from "../components/Product";
import { useGetAllProductsQuery } from "../redux-toolkit-config/api-services/productService";
import FetchBaseError from "../components/FetchBaseError";
import Loader from "../components/Loader";
import { useLocation } from "react-router-dom";
import { useState } from "react";
import Pagination from "react-bootstrap/Pagination";

/**
 *
 * @returns A page which shows product cards.
 */
function HomePage() {
  const location = useLocation();
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

  return (
    <div>
      <h1>Latest Products</h1>
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

      {isLoading ? (
        <h2>
          <Loader />.
        </h2>
      ) : error ? (
        <FetchBaseError error={error} />
      ) : (
        data && (
          <>
            <Row>
              {data.products.map((product) => (
                // Bootstrap Grid System has 12 spaces on the width in total.
                // Make the page responsive by specifying the width of each column: a single column
                // - takes all 12 spaces (full width of the screen) if the screen is small -> 1 column per row on small screens.
                // - takes all 6 spaces (half width of the screen) if the screen is medium -> 2 columns per row on medium screens.
                // - takes all 4 spaces (1/3 width of the screen) if the screen is large -> 3 columns per row on large screens.
                // - takes all 3 spaces (1/4 quarter width of the screen) if the screen is extra large -> 4 columns per row on XL screens.
                <Col key={product.id} sm={12} md={6} lg={4} xl={3}>
                  <Product product={product} />
                </Col>
              ))}
            </Row>
          </>
        )
      )}
    </div>
  );
}

export default HomePage;
