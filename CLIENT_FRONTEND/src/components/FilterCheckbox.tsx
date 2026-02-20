import Form from "react-bootstrap/Form";
import { useLocation, useSearchParams } from "react-router-dom";
import { useGetProductFilterOptionsQuery } from "../redux-toolkit-config/api-services/productService";
import Loader from "./Loader";
import FetchBaseError from "./FetchBaseError";

/**
 *
 * @param filter
 * @returns Component which displays a checkbox which a user can use to filter his/her cars / car notes.
 */
function FilterCheckbox({ filter }: { filter: string }) {
  const { data, isLoading, error } = useGetProductFilterOptionsQuery();

  // use the `useSearchParams` hook to update query parameters in the URL.
  const [_queryParameters, setQueryParameters] = useSearchParams();

  const location = useLocation();
  // console.log(useLocation()); // Object { pathname: "/", search: "?brand=Lamborghini-Toyota-Skoda-Dacia-Volkswagen-Hyundai", hash: "", state: null, key: "urh76la5" }

  /**
   * Run this function, When the user uses the form (checkboxes) to filter the products based on category and brand.
   *
   * This function adds query parameters to the URL when the user checks the checkbox,
   * or removes query parameters from the URL when the user unchecks the checkbox.
   *
   * If a user checks multiple brands, the brands (the values of the checkboxes) are concatenated with a '-'.
   * If a user checks multiple categories, the categories (the values of the checkboxes) are joined/concatenated with a '-'.
   *
   * If multiple checkboxes are checked and a user unchecks a checkbox, the value of the checkbox is removed from the URL.
   * If a single checkbox is checked and a user unchecks it, the query parameter is removed from the URL.
   *
   * `{ replace: true }`: when the user clicks the `back` button in the browser, it is redirected directly to the previous page,
   * it does not go through every URL change made.
   *
   * @param e
   */
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQueryParameters(
      (currentQueryParameters) => {
        if (e.target.checked) {
          if (currentQueryParameters.has(e.target.name)) {
            const currentParameter = currentQueryParameters.get(e.target.name);
            currentQueryParameters.set(
              e.target.name,
              currentParameter + "-" + e.target.value,
            );
          } else {
            currentQueryParameters.set(e.target.name, e.target.value);
          }
        } else {
          const currentParameter = currentQueryParameters.get(e.target.name);
          const currentParameterValues = currentParameter?.split("-");
          if (currentParameterValues?.length === 1) {
            currentQueryParameters.delete(e.target.name);
          } else {
            const newParameterValues = currentParameterValues?.filter(
              (value) => value !== e.target.value,
            );
            currentQueryParameters.set(
              e.target.name,
              newParameterValues?.join("-")!,
            );
          }
        }
        return currentQueryParameters;
      },
      // { replace: true }
    );
  }

  /**
   *
   * @returns the name value of a checkbox (here either `brand` or `motor`)
   */
  function getCheckboxName() {
    const categoryFilters = data?.categories;
    if (categoryFilters?.includes(filter)) {
      return "category";
    }
    return "brand";
  }

  /**
   * PROBLEM:
   *
   * The user is on the homepage. At first, there are no query params in the url.
   * After checking a checkbox (value is appended to the URL, checkbox is checked) and then
   * going back through the browser (checkbox value is removed from the URL),
   * the checkbox with that particular value remains checked
   * (even though the checkbox value is not in the url anymore).
   *
   * SOLUTION:
   *
   * Whenever the url changes, check if the filter is included in the url.
   * If yes, the checkbox is checked.
   * If no, the checkbox is unchecked.
   *
   * Some filters like `Aston Martin` are appended to the url as `Aston+Martin` ---> join each non empty string in the filter  with a '+'
   * (It seems that the query parameter value sent to the server does not include the '+' --> no need to join the strings with a `+` there)
   */
  function urlIncludesFilter() {
    if (filter.includes(" ")) {
      let newFilterValue = filter.split(" ")[0];
      for (let i = 1; i < filter.split(" ").length; i++) {
        newFilterValue = newFilterValue + "+" + filter.split(" ")[i];
      }
      return location.search.includes(newFilterValue);
    }
    return location.search.includes(filter);
  }

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    return <FetchBaseError error={error} />;
  }

  return (
    <Form.Check
      type="checkbox"
      id={filter}
      label={filter}
      name={getCheckboxName()}
      value={filter}
      checked={urlIncludesFilter()}
      onChange={handleChange}
    />
  );
}

export default FilterCheckbox;
