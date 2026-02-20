import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import FilterCheckbox from "./FilterCheckbox";
import { useGetProductFilterOptionsQuery } from "../redux-toolkit-config/api-services/productService";
import Loader from "./Loader";
import FetchBaseError from "./FetchBaseError";

/**
 *
 * @returns A form which contains all the checkboxes. The checkboxes are used to filter the products.
 */
function FilterCheckboxes() {
  const { data, isLoading, error } = useGetProductFilterOptionsQuery();

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    return <FetchBaseError error={error} />;
  }

  return (
    <Form>
      <fieldset>
        <Form.Group as={Row}>
          <Form.Label as="legend" column sm={2}>
            Brand
          </Form.Label>
          <Col sm={10} className="mt-2">
            {data &&
              data.brands.map((brand) => (
                <FilterCheckbox key={brand} filter={brand} />
              ))}
          </Col>

          <Form.Label as="legend" column sm={2}>
            Category{" "}
          </Form.Label>
          <Col sm={10} className="mt-2">
            {data &&
              data.categories.map((category) => (
                <FilterCheckbox key={category} filter={category} />
              ))}
          </Col>
        </Form.Group>
      </fieldset>
    </Form>
  );
}

export default FilterCheckboxes;
