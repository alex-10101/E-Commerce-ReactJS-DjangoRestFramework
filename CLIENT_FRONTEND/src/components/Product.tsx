import Card from "react-bootstrap/Card";
import type { IProduct } from "../types/types";
import Rating from "./Rating";
import { Link } from "react-router-dom";

/**
 *
 * @param a single product
 * @returns A card, which shows details of a product.
 */
function Product({ product }: { product: IProduct }) {
  return (
    <Card className="my-3 p-3 rounded">
      {/* go to the product page when the user clicks the image of the product */}
      <Link to={`/product/${product.id}`}>
        <Card.Img src={product.cover_url} />
      </Link>

      <Card.Body>
        {/* go to the product page when the user clicks the name of the product */}
        <Link to={`/product/${product.id}`}>
          <Card.Title as="div">
            <strong>{product.name}</strong>
          </Card.Title>
        </Link>

        {/* wrap the text in a div */}
        <Card.Text as="div">
          <div className="my-3">
            {product.rating} from {product.numReviews}
            <Rating
              value={product.rating}
              text={`${product.numReviews} reviews`}
              color={"#f8e825"}
            />
          </div>
        </Card.Text>

        {/* convert the text to a h3 tag */}
        <Card.Text as="h3">
          <div className="my-3">${product.price}</div>
        </Card.Text>
      </Card.Body>
    </Card>
  );
}

export default Product;
