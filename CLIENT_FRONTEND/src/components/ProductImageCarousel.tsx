import Carousel from "react-bootstrap/Carousel";
import Image from "react-bootstrap/Image";
import type { IProduct } from "../types/types";
import { useState } from "react";
import Modal from "react-bootstrap/Modal";

/**
 *
 * @param param0
 * @returns Carousel component, which is used to show all images of a product on the Product page.
 */
function ProductImageCarousel({ product }: { product: IProduct }) {
  // Use gallery_images if it exists; otherwise fall back to an empty array (nullish coalescing)
  // From w3schools.com: The ?? operator returns the right operand when the left operand is nullish (null or undefined),
  // otherwise it returns the left operand.
  const gallery = product.gallery_images ?? [];

  // only use gallery images; use cover_url ONLY if there are no gallery images
  const slides =
    gallery.length > 0
      ? gallery.map((img) => ({
          key: img.id,
          src: img.image_url,
          alt: img.alt_text || product.name || "Product image",
        }))
      : product.cover_url
        ? [
            {
              key: product.id,
              src: product.cover_url,
              alt: product.name || "Product image",
            },
          ]
        : [];

  const [show, setShow] = useState(false);
  const [index, setIndex] = useState(0);

  /**
   * Open a modal which shows a carousel with the product images,
   * when the user clicks on the regular-sized image.
   * @param i
   */
  function openModal(i: number) {
    setIndex(i);
    setShow(true);
  }

  /**
   * Closes the modal.
   */
  function closeModal() {
    setShow(false);
  }

  if (slides.length === 0) {
    return null;
  }

  return (
    <>
      {/* Normal carousel */}
      <Carousel
        className="product-carousel" // custom styles inside index.css to handle controls on images with white backgrounds
        indicators={false} // remove indicators
        controls={slides.length > 1} // show controls only if there is at least two images in the slide
        //   interval={null} // if commented out, images slide automatically
      >
        {slides.map((slide, i) => (
          <Carousel.Item key={slide.key}>
            <Image
              src={slide.src}
              alt={slide.alt}
              fluid
              role="button"
              style={{ cursor: "zoom-in" }}
              onClick={() => openModal(i)}
            />
          </Carousel.Item>
        ))}
      </Carousel>

      {/* Modal with its own carousel */}
      <Modal
        show={show}
        onHide={closeModal}
        fullscreen
        size="xl"
        // contentClassName="bg-transparent border-0"
      >
        <Modal.Header closeButton />

        <Modal.Body className="p-0">
          <Carousel
            className="product-carousel"
            indicators={false}
            controls={slides.length > 1}
            activeIndex={index}
            onSelect={(i) => setIndex(i)}
            interval={null}
          >
            {slides.map((slide) => (
              <Carousel.Item key={`modal-${slide.key}`}>
                <Image
                  src={slide.src}
                  alt={slide.alt}
                  fluid
                  role="button"
                  style={{
                    maxHeight: "80vh",
                    width: "100%",
                    objectFit: "contain",
                    cursor: "zoom-out",
                  }}
                  onClick={closeModal}
                />
              </Carousel.Item>
            ))}
          </Carousel>
        </Modal.Body>
      </Modal>
    </>
  );
}

export default ProductImageCarousel;
