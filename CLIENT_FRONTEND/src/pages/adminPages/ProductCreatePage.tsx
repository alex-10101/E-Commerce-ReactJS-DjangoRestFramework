import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import FetchBaseError from "../../components/FetchBaseError";
import Loader from "../../components/Loader";
import FormContainer from "../../components/FormContainer";
import { useCreateProductMutation } from "../../redux-toolkit-config/api-services/productService";

/**
 *
 * @returns A page, where the admin can add a new product.
 */
function ProductCreatePage() {
  const navigate = useNavigate();
  const [validated, setValidated] = useState(false);

  const [productData, setProductData] = useState({
    name: "",
    price: "",
    brand: "",
    category: "",
    countInStock: "",
    description: "",
    cover_img: null as File | null,
    gallery_images: [] as File[],
  });
  const [
    createProduct,
    { error: createProductError, isLoading: createProductLoading },
  ] = useCreateProductMutation();

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    setProductData({
      ...productData,
      [e.target.name]: e.target.value,
    });
  }

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setProductData({
        ...productData,
        cover_img: e.target.files[0],
      });
    }
  }

  function handleGalleryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) {
      return;
    }

    setProductData((previouaProductData) => ({
      ...previouaProductData,
      gallery_images: [...previouaProductData.gallery_images, ...files], // append new file
    }));

    // allows selecting the same file again later (otherwise onChange may not fire)
    e.target.value = "";
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // client side validation for making fields required
    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.preventDefault();
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

    if (productData.cover_img) {
      formData.append("cover_img", productData.cover_img);
    }

    const gallery_images = productData.gallery_images;

    if (gallery_images.length > 0) {
      for (const file of gallery_images) {
        formData.append("gallery_images", file);
      }
    }

    await createProduct(formData).unwrap();
    navigate("/admin/productlist");
  }

  return (
    <div>
      <Link to="/admin/productlist">Go Back</Link>
      <FormContainer>
        <h1>Create Product</h1>

        {createProductError && <FetchBaseError error={createProductError} />}
        {createProductLoading && <Loader />}

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
              Please provide a name.
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
              Please provide a valid price.
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group controlId="cover_img">
            <Form.Label>Cover Image</Form.Label>
            <Form.Control
              required
              name="cover_img"
              type="file"
              onChange={handleCoverChange}
            />
            <Form.Control.Feedback type="invalid">
              Please choose a cover image.
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group controlId="gallery_images">
            <Form.Label>Gallery Images</Form.Label>
            <Form.Control
              style={{ color: "transparent" }} // hide the "No files selected text."
              name="gallery_images"
              type="file"
              multiple
              //   accept="image/*"
              onChange={handleGalleryChange}
            />
          </Form.Group>

          {/* show the name of the files the admin wants to upload */}
          <ul>
            {productData.gallery_images.map((image, id) => (
              <li key={id}>{image.name}</li>
            ))}
          </ul>

          <Form.Group controlId="brand">
            <Form.Label>Brand</Form.Label>
            <Form.Control
              required
              name="brand"
              value={productData.brand}
              onChange={handleChange}
            />
            <Form.Control.Feedback type="invalid">
              Please provide a brand.
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
              Please provide a valid stock count.
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
              Please provide a category.
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
              Please provide a description.
            </Form.Control.Feedback>
          </Form.Group>

          <Button type="submit">Create</Button>
        </Form>
      </FormContainer>
    </div>
  );
}

export default ProductCreatePage;
