import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import FetchBaseError from "../../components/FetchBaseError";
import Loader from "../../components/Loader";
import {
  useDeleteGalleryImageMutation,
  useGetProductQuery,
  useUpdateProductMutation,
} from "../../redux-toolkit-config/api-services/productService";
import FormContainer from "../../components/FormContainer";
import type { IProductGalleryImage } from "../../types/types";

/**
 *
 * @returns A page, where the admin can edit a product.
 */
function ProductEditPage() {
  const productId = Number(useParams().id);

  const navigate = useNavigate();

  const [validated, setValidated] = useState(false);

  const [productData, setProductData] = useState({
    name: "",
    price: "",
    brand: "",
    category: "",
    countInStock: "",
    description: "",
    coverExisting: "", // existing cover image from the server
    coverNew: null as File | null, // new cover image (optional)
    galleryNew: [] as File[], // new gallery files to add (optional)
  });
  const {
    data: productDetails,
    error: productDetailsError,
    isLoading: productDetailsLoading,
  } = useGetProductQuery(productId);

  const [
    updateProduct,
    { error: updateProductError, isLoading: updateProductLoading },
  ] = useUpdateProductMutation();

  const [
    deleteGalleryImage,
    { error: deleteGalleryImageError, isLoading: deleteGalleryImageLoading },
  ] = useDeleteGalleryImageMutation();

  // The data from useGetProductQuery loads only after the first render.
  // On the initial render, the productDetils is null or undefined.
  // When the data from the server becomes available (or changes), the component re-renders.
  // To fill the values of the input fields with the data from the server,
  // this useEffect is needed.
  useEffect(() => {
    if (productDetails) {
      setProductData((prev) => ({
        ...prev,
        name: productDetails.name,
        price: String(productDetails.price),
        brand: productDetails.brand,
        category: productDetails.category,
        countInStock: String(productDetails.countInStock),
        description: productDetails.description,
        coverExisting: productDetails.cover_url, // or cover_img
        coverNew: null,
        galleryNew: [],
      }));
    }
  }, [productDetails]);

  /**
   * Handles changes in text / number / textarea inputs.
   * Uses the input's `name` attribute to update the corresponding
   * field in `productData` while preserving the rest of the state.
   */
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    setProductData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  /**
   * Handles selection of a new cover image.
   * Stores only a single File (the first selected one) and replaces
   * any previously chosen cover file.
   * The existing cover remains unchanged unless a new file is selected.
   */
  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setProductData((prev) => ({ ...prev, coverNew: file }));
  }

  /**
   * Handles selection of gallery images.
   * Supports multiple selections and appends newly selected files
   * to the existing list instead of replacing it.
   */
  function handleGalleryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;

    setProductData((prev) => ({
      ...prev,
      galleryNew: [...prev.galleryNew, ...files],
    }));
  }
  /**
   * When the admin clicks the Update button to update a product,
   * it triggers this function which:
   *
   * 1) Prevents the default browser behaviour to refresh the page
   * 2) Makes a PUT request to the server to update the product with the given data
   * 3) Redirects the admin to the productlist page
   *
   * @param e
   */
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // client side validation for required fields
    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }

    // custom rule for cover on edit:
    // valid if there is an existing cover OR a new file chosen
    if (!productData.coverExisting && !productData.coverNew) {
      e.stopPropagation();
      setValidated(true);
      return;
    }
    setValidated(true);

    const formData = new FormData();

    formData.append("name", productData.name);
    formData.append("price", productData.price);
    formData.append("brand", productData.brand);
    formData.append("category", productData.category);
    formData.append("countInStock", productData.countInStock);
    formData.append("description", productData.description);

    // replace cover if new one chosen
    if (productData.coverNew) {
      formData.append("cover_img", productData.coverNew);
    }

    // append new gallery images (keep old ones)
    for (const file of productData.galleryNew) {
      formData.append("gallery_images", file);
    }

    await updateProduct({ id: productId, formData }).unwrap();

    if (!updateProductError) {
      navigate("/admin/productlist");
    }
  }

  /**
   * When the admin clicks the Delete button to remove a gallery image,
   * it triggers this function which makes a DELETE request to the server
   * to remove the image.
   * @param img
   */
  async function deleteSingleGalleryImage(img: IProductGalleryImage) {
    if (window.confirm("Delete this gallery image?")) {
      await deleteGalleryImage({
        productId,
        imageId: img.id,
      }).unwrap();
    }
  }

  return (
    <div>
      <Link to="/admin/productlist">Go Back</Link>
      <FormContainer>
        <h1>Edit Product</h1>

        {productDetailsError && <FetchBaseError error={productDetailsError} />}
        {productDetailsLoading && <Loader />}

        {updateProductError && <FetchBaseError error={updateProductError} />}
        {updateProductLoading && <Loader />}

        {deleteGalleryImageError && (
          <FetchBaseError error={deleteGalleryImageError} />
        )}
        {deleteGalleryImageLoading && <Loader />}

        {productDetails && (
          <Form noValidate validated={validated} onSubmit={handleSubmit}>
            <Form.Group controlId="name">
              <Form.Label>Name</Form.Label>
              <Form.Control
                required
                name="name"
                value={productData.name}
                onChange={handleChange}
              />
              <Form.Control.Feedback type="invalid">
                Name is required.
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group controlId="price">
              <Form.Label>Price</Form.Label>
              <Form.Control
                required
                type="number"
                name="price"
                value={productData.price}
                onChange={handleChange}
                min={0}
                step="any"
                inputMode="decimal"
              />
              <Form.Control.Feedback type="invalid">
                Price is required.
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group controlId="cover_img">
              <Form.Label>Cover Image</Form.Label>

              {/* show existing cover name/url */}
              {productData.coverExisting && (
                <div style={{ marginBottom: 8 }}>
                  Current:{" "}
                  {/* Get the path of the image: the string after the last slash. */}
                  <span>{productData.coverExisting.split("/").pop()}</span>
                </div>
              )}

              <Form.Control
                name="cover_img"
                type="file"
                onChange={handleCoverChange}
              />
              <Form.Control.Feedback type="invalid">
                Cover image is required.
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group controlId="gallery_images">
              <Form.Label>Gallery Images</Form.Label>
              <Form.Control
                style={{ color: "transparent" }}
                name="gallery_images"
                type="file"
                multiple
                onChange={handleGalleryChange}
              />
            </Form.Group>

            {/* Existing gallery images from server */}
            {productDetails?.gallery_images?.length > 0 && (
              <>
                <h5 style={{ marginTop: 16 }}>Existing gallery images</h5>
                <ul>
                  {productDetails.gallery_images.map((img) => (
                    <li key={img.id} style={{ marginBottom: 8 }}>
                      {/* Get the path of the image: the string after the last slash. */}
                      {img.image_url.split("/").pop()}
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        style={{ marginLeft: 8 }}
                        onClick={() => deleteSingleGalleryImage(img)}
                      >
                        Delete
                      </Button>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {/* New images to be added */}
            {productData.galleryNew.length > 0 && (
              <>
                <h5 style={{ marginTop: 16 }}>New images to upload</h5>
                <ul>
                  {productData.galleryNew.map((image, id) => (
                    <li key={id}>{image.name}</li>
                  ))}
                </ul>
              </>
            )}

            <Form.Group controlId="brand">
              <Form.Label>Brand</Form.Label>
              <Form.Control
                required
                name="brand"
                value={productData.brand}
                onChange={handleChange}
              />
              <Form.Control.Feedback type="invalid">
                Brand is required.
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group controlId="countInStock">
              <Form.Label>Count In Stock</Form.Label>
              <Form.Control
                required
                type="number"
                name="countInStock"
                value={productData.countInStock}
                onChange={handleChange}
                min={0}
                step="1"
              />
              <Form.Control.Feedback type="invalid">
                Stock is required.
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group controlId="category">
              <Form.Label>Category</Form.Label>
              <Form.Control
                required
                name="category"
                value={productData.category}
                onChange={handleChange}
              />
              <Form.Control.Feedback type="invalid">
                Category is required.
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group controlId="description">
              <Form.Label>Description</Form.Label>
              <Form.Control
                required
                as="textarea"
                name="description"
                value={productData.description}
                onChange={handleChange}
              />
              <Form.Control.Feedback type="invalid">
                Description is required.
              </Form.Control.Feedback>
            </Form.Group>

            <Button type="submit" variant="primary">
              Update
            </Button>
          </Form>
        )}
      </FormContainer>
    </div>
  );
}

export default ProductEditPage;
