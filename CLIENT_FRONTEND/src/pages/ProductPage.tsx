import Row from "react-bootstrap/Row";
import { Link, useNavigate, useParams } from "react-router";
import Col from "react-bootstrap/Col";
import ListGroup from "react-bootstrap/ListGroup";
import Rating from "../components/Rating";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import {
  useCreateReviewMutation,
  useGetProductQuery,
} from "../redux-toolkit-config/api-services/productService";
import Loader from "../components/Loader";
import FetchBaseError from "../components/FetchBaseError";
import { Form } from "react-bootstrap";
import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../redux-toolkit-config/hooks";
import { selectTheme } from "../redux-toolkit-config/slices/themeSlice";
import type { IProduct } from "../types/types";
import { addToCart } from "../redux-toolkit-config/slices/cartSlice";
import ProductImageCarousel from "../components/ProductImageCarousel";

/**
 *
 * @returns Page which shows the details of a single product.
 */
function ProductPage() {
  // In Product.tsx: when the user clicks the image or the name of the product,
  // he/she is redirected to this page and the id of the product is appended to the url as parameter.
  // The parameter is called "id" because, in App.tsx, we defined that this route is accessible through: "product/:id".
  const params = useParams();
  const productId = Number(params.id);

  const navigate = useNavigate();

  const { data: product, error, isLoading } = useGetProductQuery(productId);
  const userInfo = useAppSelector((state) => state.auth.user);

  const theme = useAppSelector(selectTheme); // read the theme color from the global state
  const dispatch = useAppDispatch();

  const [quantity, setQuantity] = useState(1);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const [
    createReview,
    { isLoading: createReviewLoading, error: createReviewError },
  ] = useCreateReviewMutation();

  /**
   * When the user clicks the "Add To Cart" button,
   * it triggers this function which redirects the user to the cart page.
   * The URL contains the id of the product, as well as the quantity the user wants to buy.
   *
   * This function also dispatches an action
   * to add the item to the shopping cart and update the global state.
   *
   * @param product all properties of a product
   * @param qty the quantity of a product in the shopping cart
   */
  function handleAddToCart(product: IProduct, qty: number) {
    // do not send the user, rating and the number of reviews to the cart. These are not needed.
    const { user, rating, numReviews, ...cartItemData } = product;

    dispatch(addToCart({ ...cartItemData, qty }));
    navigate(`/cart`);
  }

  /**
   * When the user clicks the "Add Review" button, it triggers this function which:
   * - prevents the default browser behaviour to refresh the page
   * - makes a POST request to add a new review to the database
   *
   * @param e
   */
  async function handleSubmitReview(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await createReview({
      productId,
      rating,
      comment,
    }).unwrap();
  }

  return (
    <div>
      <Link to="/" className={`btn btn-${theme} my-3`}>
        Go Back
      </Link>
      {/* if data is still loading, show loading spinner */}
      {isLoading ? (
        <Loader />
      ) : // if the data is not loading anymore, but an error occured, show the error message from the server
      error ? (
        <FetchBaseError error={error} />
      ) : (
        // if the data is successfully retrieved, show it
        product && (
          // a row which contains three columns
          <>
            <Row>
              {/* First column showing the images of the product. This column is the widest, it takes 6 out of 12 spaces.*/}
              <Col md={6}>
                {/* <Image src={product.cover_url} alt={product?.name} fluid /> */}
                <ProductImageCarousel product={product} />
              </Col>

              {/* Second column showing the name, rating, price and description of the product. */}
              <Col md={3}>
                {/* From the Bootstrap docs: List groups are a flexible and powerful
              component for displaying a series of content. Modify and extend
              them to support just about any content within. 
              `variant="flush"` removes outer borders and rounded corners from the list items. */}
                <ListGroup variant="flush">
                  <ListGroup.Item>
                    <h3>{product?.name}</h3>
                  </ListGroup.Item>

                  <ListGroup.Item>
                    <Rating
                      value={product.rating}
                      text={`${product?.numReviews} reviews`}
                      color={"#f8e825"}
                    />
                  </ListGroup.Item>

                  <ListGroup.Item>Price: ${product.price}</ListGroup.Item>

                  <ListGroup.Item>
                    Description: ${product.description}
                  </ListGroup.Item>
                </ListGroup>
              </Col>

              {/* Third column showing the price of the product, whether it is in stock or not, 
            and some other options to select the quantity of the item for the shopping cart. */}
              <Col md={3}>
                <Card>
                  <ListGroup variant="flush">
                    {/* show the price of the product */}
                    <ListGroup.Item>
                      <Row>
                        <Col>Price: </Col>
                        <Col>
                          <strong>${product.price}</strong>
                        </Col>
                      </Row>
                    </ListGroup.Item>

                    {/* Check if the product is in stock. If yes, allow to select the number of items to add to a shopping cart.  */}
                    {product.countInStock > 0 && (
                      <ListGroup.Item>
                        {/* Create a row inside the third column, which contains another two smaller columns of equal size.*/}
                        <Row>
                          <Col>Quanity</Col>
                          <Col xs="auto" className="my-1">
                            <Form.Control
                              as="select"
                              value={quantity}
                              onChange={(e) =>
                                setQuantity(parseInt(e.target.value))
                              }
                              className={
                                theme === "dark"
                                  ? "bg-dark text-light border-secondary"
                                  : ""
                              }
                            >
                              {/* the destructured aray.keys() creates indexes 0, 1,...,countInStock - 1   */}
                              {/* the option values adds 1 to all of these indexes  */}
                              {/* meaning: It generates a list of selectable quantities from 1 up to the number of items
                            available in stock, so the user can choose how many units to buy. */}
                              {[...Array(product.countInStock).keys()].map(
                                (count) => (
                                  <option value={count + 1} key={count + 1}>
                                    {count + 1}
                                  </option>
                                ),
                              )}
                            </Form.Control>
                          </Col>
                        </Row>
                      </ListGroup.Item>
                    )}

                    {/* Show whether product is in stock or out of stock. */}
                    <ListGroup.Item>
                      <Row>
                        <Col>Status: </Col>
                        <Col>
                          <strong>
                            {product.countInStock > 0
                              ? "In Stock"
                              : "Out of Stock"}
                          </strong>
                        </Col>
                      </Row>
                    </ListGroup.Item>

                    {/* Button to add the product to the shopping cart */}
                    <ListGroup.Item>
                      <Button
                        onClick={() => handleAddToCart(product, quantity)}
                        className="btn-block"
                        variant={theme}
                        disabled={product.countInStock === 0}
                        type="button"
                      >
                        Add to Cart
                      </Button>
                    </ListGroup.Item>
                  </ListGroup>
                </Card>
              </Col>
            </Row>

            {/* Row for adding reviews */}
            <Row className="review">
              <Col md={6}>
                <h2>Reviews</h2>

                {product.reviews.length === 0 && <p>No Reviews</p>}

                <ListGroup variant="flush">
                  {product.reviews.map((review) => (
                    <ListGroup.Item key={review.id}>
                      <strong>{review.name}</strong>
                      <Rating
                        value={review.rating}
                        text={``}
                        color={"#f8e825"}
                      />
                      <p>{review.createdAt.substring(0, 10)}</p>
                      <p>{review.comment}</p>
                    </ListGroup.Item>
                  ))}

                  <ListGroup.Item>
                    <h2>Write a Customer Review</h2>

                    {createReviewLoading && <Loader />}

                    {!userInfo && (
                      <p>
                        Please <Link to="/login">sign in</Link> to write a
                        review
                      </p>
                    )}

                    {userInfo && (
                      <Form onSubmit={handleSubmitReview}>
                        <Form.Group className="my-2" controlId="rating">
                          <Form.Label>Rating</Form.Label>
                          <Form.Control
                            as="select"
                            required
                            value={rating}
                            onChange={(e) => setRating(Number(e.target.value))}
                          >
                            <option value="">Select...</option>
                            <option value="1">1 - Poor</option>
                            <option value="2">2 - Fair</option>
                            <option value="3">3 - Good</option>
                            <option value="4">4 - Very Good</option>
                            <option value="5">5 - Excellent</option>
                          </Form.Control>
                        </Form.Group>

                        <Form.Group className="my-2" controlId="comment">
                          <Form.Label>Comment</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            required
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                          ></Form.Control>
                        </Form.Group>

                        <Button
                          disabled={createReviewLoading}
                          type="submit"
                          variant="primary"
                        >
                          Add Review
                        </Button>

                        {createReviewError && (
                          <FetchBaseError error={createReviewError} />
                        )}
                      </Form>
                    )}
                  </ListGroup.Item>
                </ListGroup>
              </Col>
            </Row>
          </>
        )
      )}
    </div>
  );
}

export default ProductPage;
